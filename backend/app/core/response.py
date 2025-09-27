"""
レスポンス標準化
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid
import logging

from app.schemas.common import (
    BaseResponse, 
    ErrorResponse, 
    PaginatedResponse, 
    PaginationMeta,
    ValidationErrorResponse,
    ValidationErrorDetail
)
from app.core.exceptions import RunMasterException, ValidationError

logger = logging.getLogger(__name__)

def generate_request_id() -> str:
    """リクエストIDを生成"""
    return str(uuid.uuid4())

def create_success_response(
    data: Any = None,
    message: str = "Success",
    request_id: Optional[str] = None
) -> BaseResponse:
    """成功レスポンスを作成"""
    return BaseResponse(
        success=True,
        message=message,
        data=data,
        request_id=request_id or generate_request_id()
    )

def create_error_response(
    error: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> ErrorResponse:
    """エラーレスポンスを作成"""
    return ErrorResponse(
        error=error,
        message=message,
        details=details,
        request_id=request_id or generate_request_id()
    )

def create_paginated_response(
    data: List[Any],
    page: int,
    limit: int,
    total: int,
    message: str = "Success",
    request_id: Optional[str] = None
) -> PaginatedResponse:
    """ページネーション付きレスポンスを作成"""
    total_pages = (total + limit - 1) // limit
    
    pagination = PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )
    
    return PaginatedResponse(
        success=True,
        message=message,
        data=data,
        pagination=pagination,
        request_id=request_id or generate_request_id()
    )

def create_validation_error_response(
    errors: List[Dict[str, Any]],
    request_id: Optional[str] = None
) -> ValidationErrorResponse:
    """バリデーションエラーレスポンスを作成"""
    error_details = []
    for error in errors:
        error_details.append(ValidationErrorDetail(
            field=error.get('field', 'unknown'),
            message=error.get('message', 'Validation error'),
            value=error.get('value')
        ))
    
    return ValidationErrorResponse(
        details=error_details,
        request_id=request_id or generate_request_id()
    )

def handle_exception_response(
    exc: Exception,
    request_id: Optional[str] = None
) -> ErrorResponse:
    """例外からエラーレスポンスを作成"""
    if isinstance(exc, RunMasterException):
        return ErrorResponse(
            error=exc.error_type,
            message=exc.message,
            details=exc.details,
            request_id=request_id or generate_request_id()
        )
    
    if isinstance(exc, ValidationError):
        return ErrorResponse(
            error="validation_error",
            message=exc.message,
            details=exc.details,
            request_id=request_id or generate_request_id()
        )
    
    # その他の例外
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return ErrorResponse(
        error="internal_server_error",
        message="内部サーバーエラーが発生しました",
        request_id=request_id or generate_request_id()
    )

def add_request_id_middleware(request: Request, call_next):
    """リクエストIDを追加するミドルウェア"""
    request_id = generate_request_id()
    request.state.request_id = request_id
    
    response = call_next(request)
    
    # レスポンスヘッダーにリクエストIDを追加
    if hasattr(response, 'headers'):
        response.headers['X-Request-ID'] = request_id
    
    return response

def standardize_response_middleware(request: Request, call_next):
    """レスポンスを標準化するミドルウェア"""
    try:
        response = call_next(request)
        
        # JSONResponseの場合は標準形式に変換
        if isinstance(response, JSONResponse):
            body = response.body.decode('utf-8')
            try:
                import json
                data = json.loads(body)
                
                # 既に標準形式でない場合は変換
                if not isinstance(data, dict) or 'success' not in data:
                    request_id = getattr(request.state, 'request_id', None)
                    standardized_data = create_success_response(
                        data=data,
                        request_id=request_id
                    )
                    response.body = standardized_data.json().encode('utf-8')
                    
            except (json.JSONDecodeError, AttributeError):
                pass
        
        return response
        
    except Exception as e:
        request_id = getattr(request.state, 'request_id', None)
        error_response = handle_exception_response(e, request_id)
        
        return JSONResponse(
            status_code=500,
            content=error_response.dict()
        )

def get_request_id(request: Request) -> str:
    """リクエストIDを取得"""
    return getattr(request.state, 'request_id', generate_request_id())

def log_api_call(request: Request, response: Response, duration: float):
    """API呼び出しをログに記録"""
    request_id = get_request_id(request)
    
    log_data = {
        "request_id": request_id,
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "duration_ms": round(duration * 1000, 2),
        "user_agent": request.headers.get("user-agent", ""),
        "client_ip": request.client.host if request.client else "unknown"
    }
    
    if response.status_code >= 400:
        logger.warning(f"API Error: {log_data}")
    else:
        logger.info(f"API Call: {log_data}")

# デコレータ用のヘルパー関数
def success_response(message: str = "Success"):
    """成功レスポンス用のデコレータ"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                request_id = None
                
                # リクエストオブジェクトからrequest_idを取得
                for arg in args:
                    if hasattr(arg, 'state') and hasattr(arg.state, 'request_id'):
                        request_id = arg.state.request_id
                        break
                
                return create_success_response(
                    data=result,
                    message=message,
                    request_id=request_id
                )
            except Exception as e:
                request_id = None
                for arg in args:
                    if hasattr(arg, 'state') and hasattr(arg.state, 'request_id'):
                        request_id = arg.state.request_id
                        break
                
                error_response = handle_exception_response(e, request_id)
                return JSONResponse(
                    status_code=500,
                    content=error_response.dict()
                )
        return wrapper
    return decorator

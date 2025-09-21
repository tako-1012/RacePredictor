"""
共通スキーマ
"""

from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class BaseResponse(BaseModel, Generic[T]):
    """標準APIレスポンス"""
    success: bool = True
    message: str = "Success"
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    success: bool = False
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class PaginationMeta(BaseModel):
    """ページネーションメタデータ"""
    page: int = Field(ge=1, description="現在のページ番号")
    limit: int = Field(ge=1, le=100, description="1ページあたりの件数")
    total: int = Field(ge=0, description="総件数")
    total_pages: int = Field(ge=0, description="総ページ数")
    has_next: bool = Field(description="次のページが存在するか")
    has_prev: bool = Field(description="前のページが存在するか")

class PaginatedResponse(BaseModel, Generic[T]):
    """ページネーション付きレスポンス"""
    success: bool = True
    message: str = "Success"
    data: List[T]
    pagination: PaginationMeta
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class HealthCheckResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str
    version: str
    timestamp: datetime
    environment: str
    services: Dict[str, str]
    metrics: Optional[Dict[str, Any]] = None

class ValidationErrorDetail(BaseModel):
    """バリデーションエラー詳細"""
    field: str
    message: str
    value: Any

class ValidationErrorResponse(BaseModel):
    """バリデーションエラーレスポンス"""
    success: bool = False
    error: str = "validation_error"
    message: str = "入力データに問題があります"
    details: List[ValidationErrorDetail]
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class RateLimitResponse(BaseModel):
    """レート制限レスポンス"""
    success: bool = False
    error: str = "rate_limit_exceeded"
    message: str = "リクエスト制限に達しました"
    retry_after: int = Field(description="再試行までの秒数")
    remaining_requests: int = Field(description="残りリクエスト数")
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class FileUploadResponse(BaseModel):
    """ファイルアップロードレスポンス"""
    success: bool = True
    message: str = "ファイルが正常にアップロードされました"
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

class BulkOperationResponse(BaseModel):
    """一括操作レスポンス"""
    success: bool = True
    message: str = "一括操作が完了しました"
    data: Dict[str, Any] = Field(description="成功・失敗件数などの統計情報")
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None

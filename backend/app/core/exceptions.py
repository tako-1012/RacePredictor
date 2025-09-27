"""
カスタム例外クラス
"""

from typing import Optional, Dict, Any


class RunMasterException(Exception):
    """RunMasterアプリケーションの基底例外クラス"""
    
    def __init__(
        self,
        message: str,
        error_type: str = "runmaster_error",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(RunMasterException):
    """バリデーションエラー"""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type="validation_error",
            status_code=422,
            details=details or {"field": field} if field else {}
        )


class AuthenticationError(RunMasterException):
    """認証エラー"""
    
    def __init__(self, message: str = "認証に失敗しました"):
        super().__init__(
            message=message,
            error_type="authentication_error",
            status_code=401
        )


class AuthorizationError(RunMasterException):
    """認可エラー"""
    
    def __init__(self, message: str = "アクセス権限がありません"):
        super().__init__(
            message=message,
            error_type="authorization_error",
            status_code=403
        )


class DatabaseError(RunMasterException):
    """データベースエラー"""
    
    def __init__(self, message: str = "データベースエラーが発生しました", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type="database_error",
            status_code=500,
            details=details
        )


class NotFoundError(RunMasterException):
    """リソースが見つからないエラー"""
    
    def __init__(self, resource: str = "リソース", resource_id: Optional[str] = None):
        message = f"{resource}が見つかりません"
        if resource_id:
            message += f" (ID: {resource_id})"
        
        super().__init__(
            message=message,
            error_type="not_found_error",
            status_code=404,
            details={"resource": resource, "resource_id": resource_id}
        )


class CSVImportError(RunMasterException):
    """CSVインポートエラー"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type="csv_import_error",
            status_code=422,
            details=details
        )


class PredictionError(RunMasterException):
    """予測エラー"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_type="prediction_error",
            status_code=422,
            details=details
        )


class RateLimitError(RunMasterException):
    """レート制限エラー"""
    
    def __init__(self, message: str = "リクエスト制限に達しました"):
        super().__init__(
            message=message,
            error_type="rate_limit_error",
            status_code=429
        )

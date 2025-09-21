from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # アプリケーション基本設定
    app_name: str = "RacePredictor"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"
    
    # データベース設定
    database_url: str = "sqlite:///./test.db"
    max_connections: int = 100
    pool_timeout: int = 30
    
    # セキュリティ設定
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS設定
    cors_origins: str = "http://localhost:3000,http://localhost:8000"
    
    # ログ設定
    log_level: str = "INFO"
    log_format: str = "json"
    
    # ファイルアップロード設定
    csv_upload_max_size: int = 10485760  # 10MB
    allowed_encodings: str = "utf-8,shift-jis,cp932,euc-jp"
    
    # パフォーマンス設定
    workers: int = 4
    timeout: int = 30
    
    # バックアップ設定
    backup_retention_days: int = 30
    
    # 監視設定
    health_check_interval: int = 30
    metrics_enabled: bool = True
    
    # レート制限設定
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # Redis設定（キャッシュ用）
    redis_url: Optional[str] = None
    
    # メール設定
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    
    # 外部API設定
    external_api_timeout: int = 30
    external_api_retries: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = False


# 環境変数から設定を読み込み
settings = Settings()

# 本番環境の設定調整
if settings.environment == "production":
    settings.debug = False
    settings.log_level = "WARNING"
    
    # 本番環境では必須の設定をチェック
    required_prod_settings = [
        "secret_key",
        "database_url"
    ]
    
    for setting in required_prod_settings:
        if not getattr(settings, setting) or getattr(settings, setting) == "your-secret-key-here-change-in-production":
            raise ValueError(f"Production environment requires {setting} to be set")
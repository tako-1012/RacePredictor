from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from sqlalchemy.orm import Session
import logging
import time
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.logging_config import setup_logging
from app.core.middleware import rate_limit_middleware, SecurityHeadersMiddleware
from app.core.response import add_request_id_middleware, standardize_response_middleware, log_api_call
from app.api import auth, workouts, workout_types, predictions, races, race_types, dashboard
from app.core.exceptions import RacePredictorException, ValidationError, DatabaseError

# ログ設定
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時
    logger.info("Starting RacePredictor API")
    
    # テーブル作成
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    
    yield
    
    # シャットダウン時
    logger.info("Shutting down RacePredictor API")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Running performance prediction API",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# セキュリティミドルウェア
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
    )

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if hasattr(settings, 'cors_origins') else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# セキュリティヘッダーミドルウェア
app.middleware("http")(SecurityHeadersMiddleware.add_security_headers)

# レート制限ミドルウェア（本番環境のみ）
if not settings.debug:
    app.middleware("http")(rate_limit_middleware)


# リクエストIDミドルウェア
app.middleware("http")(add_request_id_middleware)

# レスポンス標準化ミドルウェア
app.middleware("http")(standardize_response_middleware)

# リクエストログミドルウェア
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # 処理時間を計算
    process_time = time.time() - start_time
    
    # 詳細なログを記録
    log_api_call(request, response, process_time)
    
    return response


# グローバル例外ハンドラー
@app.exception_handler(RacePredictorException)
async def race_predictor_exception_handler(request: Request, exc: RacePredictorException):
    logger.error(f"RacePredictor error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_type,
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "内部サーバーエラーが発生しました"
        }
    )


# ルーター登録
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(workout_types.router, prefix="/api/workout-types", tags=["workout-types"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(races.router, prefix="/api/races", tags=["races"])
app.include_router(race_types.router, prefix="/api/race-types", tags=["race-types"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "RacePredictor API", "version": settings.app_version}


@app.get("/health")
async def health_check():
    """基本的なヘルスチェック"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "timestamp": datetime.now().isoformat(),
        "environment": settings.environment
    }


@app.get("/health/detailed")
async def detailed_health_check():
    """詳細なヘルスチェック（データベース接続含む）"""
    from app.core.database import check_db_connection, get_db_stats
    
    # データベース接続チェック
    db_healthy = check_db_connection()
    db_status = "healthy" if db_healthy else "unhealthy"
    
    # データベース統計情報
    db_stats = get_db_stats() if db_healthy else {}
    
    # 全体のステータス
    overall_status = "healthy" if db_healthy else "unhealthy"
    
    return {
        "status": overall_status,
        "version": settings.app_version,
        "timestamp": datetime.now().isoformat(),
        "environment": settings.environment,
        "database": {
            "status": db_status,
            "stats": db_stats
        },
        "services": {
            "api": "healthy",
            "database": db_status,
            "authentication": "healthy",
            "logging": "healthy"
        },
        "metrics": {
            "uptime": "N/A",  # 実装予定
            "memory_usage": "N/A",  # 実装予定
            "cpu_usage": "N/A"  # 実装予定
        }
    }
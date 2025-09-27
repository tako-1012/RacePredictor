from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
import logging
from contextlib import contextmanager
from typing import Generator

from app.core.config import settings
from app.core.exceptions import DatabaseError

# すべてのモデルをインポートしてテーブル作成を確実にする

logger = logging.getLogger(__name__)

# データベースエンジン設定
engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=settings.max_connections,
    max_overflow=20,
    pool_timeout=settings.pool_timeout,
    pool_recycle=3600,  # 1時間でコネクションをリサイクル
    pool_pre_ping=True,  # コネクションの有効性を事前チェック
    echo=settings.debug,  # デバッグ時のみSQLログを出力
)

# セッションファクトリー
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """SQLite用の設定（本番ではPostgreSQLを使用）"""
    if "sqlite" in settings.database_url:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    """データベースセッションを取得（依存性注入用）"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        logger.error(f"Database error type: {type(e).__name__}")
        import traceback
        logger.error(f"Database error traceback: {traceback.format_exc()}")
        db.rollback()
        raise DatabaseError(f"データベースエラー: {str(e)}")
    except Exception as e:
        # HTTPExceptionとNotFoundErrorは再発生させる
        from fastapi import HTTPException
        from app.core.exceptions import NotFoundError
        if isinstance(e, (HTTPException, NotFoundError)):
            raise e
        logger.error(f"Unexpected database error: {str(e)}")
        logger.error(f"Unexpected error type: {type(e).__name__}")
        import traceback
        logger.error(f"Unexpected error traceback: {traceback.format_exc()}")
        db.rollback()
        raise DatabaseError("予期しないデータベースエラーが発生しました")
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """データベースセッションをコンテキストマネージャーとして取得"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise DatabaseError(f"データベースエラー: {str(e)}")
    except Exception as e:
        # HTTPExceptionとNotFoundErrorは再発生させる
        from fastapi import HTTPException
        from app.core.exceptions import NotFoundError
        if isinstance(e, (HTTPException, NotFoundError)):
            raise e
        logger.error(f"Unexpected database error: {str(e)}")
        db.rollback()
        raise DatabaseError("予期しないデータベースエラーが発生しました")
    finally:
        db.close()


def check_db_connection() -> bool:
    """データベース接続をチェック"""
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False


def get_db_stats() -> dict:
    """データベース接続プールの統計情報を取得"""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }
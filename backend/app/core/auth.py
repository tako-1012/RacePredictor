from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> str:
    """JWTトークンから現在のユーザーIDを取得（文字列として返す）"""
    user_id_str = verify_token(credentials.credentials)
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 文字列UUIDの形式チェック
    try:
        UUID(user_id_str)  # 形式チェックのみ
        return user_id_str
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> str:
    """管理者権限を要求する依存関数"""
    # ユーザー情報を取得
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 管理者権限チェック（簡単な実装：emailがadminで始まる場合）
    if not user.email.startswith("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user
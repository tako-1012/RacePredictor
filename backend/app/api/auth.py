from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, verify_token, get_current_user_from_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, TokenRefresh, UserResponse
import re

router = APIRouter()


def validate_password(password: str) -> bool:
    """パスワードのバリデーション（8文字以上）"""
    if len(password) < 8:
        return False
    return True


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """ユーザー登録"""
    try:
        # パスワードバリデーション
        if not validate_password(user_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="パスワードは8文字以上で入力してください"
            )

        # メールアドレス重複チェック
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に登録されています"
            )

        # パスワードハッシュ化
        hashed_password = get_password_hash(user_data.password)

        # ユーザー作成
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            birth_date=user_data.birth_date,
            gender=user_data.gender,
            user_type=user_data.user_type
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # トークン生成
        access_token = create_access_token(str(db_user.id))
        refresh_token = create_refresh_token(str(db_user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.from_orm(db_user)
        )

    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に登録されています"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="データの整合性エラーが発生しました"
            )
    except HTTPException:
        # HTTPExceptionは再発生させる
        raise
    except ValueError as e:
        # Pydanticバリデーションエラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        import traceback
        print(f"User creation error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー作成に失敗しました: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """ユーザーログイン"""
    try:
        # ユーザー検索
        user = db.query(User).filter(User.email == login_data.email).first()

        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="メールアドレスまたはパスワードが正しくありません"
            )

        # トークン生成
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.from_orm(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ログインに失敗しました"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: TokenRefresh, db: Session = Depends(get_db)):
    """トークンリフレッシュ"""
    try:
        # リフレッシュトークン検証
        user_id = verify_token(refresh_data.refresh_token)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="リフレッシュトークンが無効です"
            )

        # ユーザー存在確認
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ユーザーが見つかりません"
            )

        # 新しいアクセストークン生成
        access_token = create_access_token(str(user.id))

        return TokenResponse(
            access_token=access_token
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="トークンの更新に失敗しました"
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user_from_token)):
    """ユーザーログアウト"""
    # JWTトークンはステートレスなので、クライアント側で削除
    return {"message": "ログアウトしました"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_user_from_token)):
    """現在のユーザー情報を取得"""
    return UserResponse.from_orm(current_user)
from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import enum


class UserTypeEnum(str, enum.Enum):
    athlete = "athlete"
    serious_runner = "serious_runner"
    casual_runner = "casual_runner"


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="ユーザー名")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="氏名")
    birth_date: Optional[date] = Field(None, description="生年月日")
    gender: Optional[GenderEnum] = Field(None, description="性別")
    user_type: Optional[UserTypeEnum] = Field(UserTypeEnum.casual_runner, description="ユーザータイプ")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100, description="パスワード")
    confirm_password: str = Field(..., min_length=8, max_length=100, description="パスワード確認")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="メールアドレス")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="ユーザー名")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="氏名")
    birth_date: Optional[date] = Field(None, description="生年月日")
    gender: Optional[GenderEnum] = Field(None, description="性別")
    user_type: Optional[UserTypeEnum] = Field(None, description="ユーザータイプ")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserResponse(UserBase):
    id: str = Field(..., description="ユーザーID")
    is_active: bool = Field(..., description="アクティブフラグ")
    is_verified: bool = Field(..., description="認証済みフラグ")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")
    password: str = Field(..., min_length=8, max_length=100, description="パスワード")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="アクセストークン")
    token_type: str = Field("bearer", description="トークンタイプ")
    expires_in: int = Field(..., description="有効期限（秒）")
    refresh_token: Optional[str] = Field(None, description="リフレッシュトークン")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class TokenRefresh(BaseModel):
    refresh_token: str = Field(..., description="リフレッシュトークン")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class EmailChangeRequest(BaseModel):
    new_email: EmailStr = Field(..., description="新しいメールアドレス")
    password: str = Field(..., min_length=8, max_length=100, description="現在のパスワード")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=100, description="現在のパスワード")
    new_password: str = Field(..., min_length=8, max_length=100, description="新しいパスワード")
    confirm_password: str = Field(..., min_length=8, max_length=100, description="新しいパスワード確認")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="氏名")
    birth_date: Optional[date] = Field(None, description="生年月日")
    gender: Optional[GenderEnum] = Field(None, description="性別")
    height_cm: Optional[float] = Field(None, ge=50, le=300, description="身長（cm）")
    weight_kg: Optional[float] = Field(None, ge=20, le=300, description="体重（kg）")
    running_experience_years: Optional[int] = Field(None, ge=0, le=100, description="ランニング経験年数")
    preferred_distance: Optional[str] = Field(None, description="好みの距離")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserStatsResponse(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    premium_users: int
    new_users_this_month: int
    user_growth_rate: float

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
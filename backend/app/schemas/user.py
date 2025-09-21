from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, datetime, timedelta
from uuid import UUID
from app.models.user import UserTypeEnum, GenderEnum


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    user_type: Optional[UserTypeEnum] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v):
        if v is not None:
            today = date.today()
            min_age_date = today - timedelta(days=365 * 10)  # 最低10歳
            max_age_date = today - timedelta(days=365 * 150)  # 最大150歳

            if v > min_age_date:
                raise ValueError('年齢は10歳以上である必要があります')
            if v < max_age_date:
                raise ValueError('生年月日が古すぎます')

        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    user_type: Optional[UserTypeEnum] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str
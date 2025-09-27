from __future__ import annotations

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID


class UserProfileBase(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=150, description="年齢")
    birth_date: Optional[date] = Field(None, description="生年月日")
    gender: Optional[str] = Field(None, description="性別")
    height_cm: Optional[float] = Field(None, ge=50, le=300, description="身長（cm）")
    weight_kg: Optional[float] = Field(None, ge=20, le=300, description="体重（kg）")
    resting_hr: Optional[int] = Field(None, ge=30, le=120, description="安静時心拍数")
    max_hr: Optional[int] = Field(None, ge=120, le=220, description="最大心拍数")
    vo2_max: Optional[float] = Field(None, ge=20, le=80, description="VO2Max")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False

    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v and v > date.today():
            raise ValueError('生年月日は未来の日付にできません')
        if v and v.year < date.today().year - 120:
            raise ValueError('120歳を超える年齢は入力できません')
        return v


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=150)
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=20, le=300)
    resting_hr: Optional[int] = Field(None, ge=30, le=120)
    max_hr: Optional[int] = Field(None, ge=120, le=220)
    vo2_max: Optional[float] = Field(None, ge=20, le=80)

    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v and v > date.today():
            raise ValueError('生年月日は未来の日付にできません')
        if v and v.year < date.today().year - 120:
            raise ValueError('120歳を超える年齢は入力できません')
        return v


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    bmi: Optional[float] = Field(None, description="BMI")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserProfileWithBMI(UserProfileResponse):
    bmi_category: Optional[str] = Field(None, description="BMIカテゴリ")
    ideal_weight_range: Optional[str] = Field(None, description="理想体重範囲")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False

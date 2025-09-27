from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserProfileBase(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100, description="氏名")
    age: Optional[int] = Field(None, ge=1, le=150, description="年齢")
    gender: Optional[str] = Field(None, description="性別")
    height_cm: Optional[float] = Field(None, ge=50, le=300, description="身長（cm）")
    weight_kg: Optional[float] = Field(None, ge=20, le=300, description="体重（kg）")
    running_experience_years: Optional[int] = Field(None, ge=0, le=100, description="ランニング経験年数")
    preferred_distance: Optional[str] = Field(None, description="好みの距離")
    training_goals: Optional[str] = Field(None, max_length=500, description="トレーニング目標")
    injury_history: Optional[str] = Field(None, max_length=1000, description="怪我の履歴")
    medical_conditions: Optional[str] = Field(None, max_length=1000, description="医療状態")
    emergency_contact: Optional[str] = Field(None, max_length=200, description="緊急連絡先")
    blood_type: Optional[str] = Field(None, max_length=10, description="血液型")
    allergies: Optional[str] = Field(None, max_length=500, description="アレルギー")
    medications: Optional[str] = Field(None, max_length=500, description="服用薬")
    fitness_level: Optional[str] = Field(None, description="フィットネスレベル")
    availability_days: Optional[str] = Field(None, max_length=100, description="トレーニング可能日")
    preferred_training_time: Optional[str] = Field(None, max_length=50, description="好みのトレーニング時間")
    motivation_factors: Optional[str] = Field(None, max_length=500, description="モチベーション要因")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=20, le=300)
    running_experience_years: Optional[int] = Field(None, ge=0, le=100)
    preferred_distance: Optional[str] = None
    training_goals: Optional[str] = Field(None, max_length=500)
    injury_history: Optional[str] = Field(None, max_length=1000)
    medical_conditions: Optional[str] = Field(None, max_length=1000)
    emergency_contact: Optional[str] = Field(None, max_length=200)
    blood_type: Optional[str] = Field(None, max_length=10)
    allergies: Optional[str] = Field(None, max_length=500)
    medications: Optional[str] = Field(None, max_length=500)
    fitness_level: Optional[str] = None
    availability_days: Optional[str] = Field(None, max_length=100)
    preferred_training_time: Optional[str] = Field(None, max_length=50)
    motivation_factors: Optional[str] = Field(None, max_length=500)


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class UserProfileWithBMI(UserProfileResponse):
    bmi: Optional[float] = Field(None, description="BMI")
    bmi_category: Optional[str] = Field(None, description="BMIカテゴリ")
    ideal_weight_range: Optional[str] = Field(None, description="理想体重範囲")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
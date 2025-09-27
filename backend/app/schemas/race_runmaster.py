from __future__ import annotations

from pydantic import BaseModel, field_validator, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class RaceCreate(BaseModel):
    race_name: str = Field(..., min_length=1, max_length=100)
    race_date: date = Field(...)
    race_type: str = Field(...)
    distance_meters: int = Field(..., gt=0, le=200000)
    time_seconds: float = Field(..., gt=0)
    pace_seconds: Optional[float] = Field(None)
    place: Optional[int] = Field(None, gt=0)
    total_participants: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    
    @field_validator('race_type')
    @classmethod
    def validate_race_type(cls, v):
        allowed_types = ['track', 'road', 'relay']
        if v not in allowed_types:
            raise ValueError(f'レース種目は{allowed_types}から選択してください')
        return v
    
    @field_validator('race_name')
    @classmethod
    def validate_race_name(cls, v):
        if not v or not v.strip():
            raise ValueError('レース名は必須です')
        return v.strip()
    
    @field_validator('time_seconds')
    @classmethod
    def validate_time(cls, v):
        if v <= 0:
            raise ValueError('タイムは正の数値で入力してください')
        if v > 86400:  # 24時間制限
            raise ValueError('タイムは24時間以内で入力してください')
        return round(v, 2)  # 小数第二位まで
    
    @field_validator('distance_meters')
    @classmethod
    def validate_distance(cls, v):
        if v <= 0:
            raise ValueError('距離は正の数値で入力してください')
        if v > 200000:  # 200km上限
            raise ValueError('200km以下で入力してください')
        return v
    
    @field_validator('place')
    @classmethod
    def validate_place(cls, v):
        if v is not None and v <= 0:
            raise ValueError('順位は正の整数で入力してください')
        return v
    
    @field_validator('total_participants')
    @classmethod
    def validate_total_participants(cls, v):
        if v is not None and v <= 0:
            raise ValueError('参加者数は正の整数で入力してください')
        return v

class RaceResponse(RaceCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RaceUpdate(BaseModel):
    race_name: Optional[str] = Field(None, min_length=1, max_length=100)
    race_date: Optional[date] = Field(None)
    race_type: Optional[str] = Field(None)
    distance_meters: Optional[int] = Field(None, gt=0, le=200000)
    time_seconds: Optional[float] = Field(None, gt=0)
    pace_seconds: Optional[float] = Field(None)
    place: Optional[int] = Field(None, gt=0)
    total_participants: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    
    @field_validator('race_type')
    @classmethod
    def validate_race_type(cls, v):
        if v is not None:
            allowed_types = ['track', 'road', 'relay']
            if v not in allowed_types:
                raise ValueError(f'レース種目は{allowed_types}から選択してください')
        return v
    
    @field_validator('race_name')
    @classmethod
    def validate_race_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('レース名は必須です')
        return v.strip() if v else v
    
    @field_validator('time_seconds')
    @classmethod
    def validate_time(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError('タイムは正の数値で入力してください')
            if v > 86400:  # 24時間制限
                raise ValueError('タイムは24時間以内で入力してください')
            return round(v, 2)
        return v
    
    @field_validator('distance_meters')
    @classmethod
    def validate_distance(cls, v):
        if v is not None:
            if v <= 0:
                raise ValueError('距離は正の数値で入力してください')
            if v > 200000:  # 200km上限
                raise ValueError('200km以下で入力してください')
        return v
    
    @field_validator('place')
    @classmethod
    def validate_place(cls, v):
        if v is not None and v <= 0:
            raise ValueError('順位は正の整数で入力してください')
        return v
    
    @field_validator('total_participants')
    @classmethod
    def validate_total_participants(cls, v):
        if v is not None and v <= 0:
            raise ValueError('参加者数は正の整数で入力してください')
        return v
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class PersonalBestBase(BaseModel):
    race_type: str = Field(..., description="レース種目")
    distance: str = Field(..., description="距離")
    custom_distance_m: Optional[int] = Field(None, description="カスタム距離（メートル）")
    time_seconds: int = Field(..., ge=1, description="ベストタイム（秒）")
    achieved_date: date = Field(..., description="達成日")
    race_name: Optional[str] = Field(None, max_length=255, description="レース名")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PersonalBestCreate(PersonalBestBase):
    pass


class PersonalBestUpdate(BaseModel):
    race_type: Optional[str] = None
    distance: Optional[str] = None
    custom_distance_m: Optional[int] = None
    time_seconds: Optional[int] = Field(None, ge=1)
    achieved_date: Optional[date] = None
    race_name: Optional[str] = Field(None, max_length=255)


class PersonalBestResponse(PersonalBestBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PersonalBestWithPace(PersonalBestResponse):
    pace_per_km_seconds: Optional[int] = Field(None, description="ペース（秒/km）")
    pace_per_km_formatted: Optional[str] = Field(None, description="フォーマット済みペース")
    time_formatted: Optional[str] = Field(None, description="フォーマット済みタイム")
    age_at_time: Optional[int] = Field(None, description="達成時の年齢")
    years_since_achievement: Optional[float] = Field(None, description="達成からの年数")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PersonalBestListResponse(BaseModel):
    items: List[PersonalBestResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PersonalBestStatsResponse(BaseModel):
    total_personal_bests: int
    personal_bests_this_year: int
    personal_bests_this_month: int
    most_recent_personal_best: Optional[str] = None
    oldest_personal_best: Optional[str] = None
    improvement_trend: Optional[str] = None
    average_improvement: Optional[float] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
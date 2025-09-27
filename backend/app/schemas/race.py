from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


class RaceTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="レース種目名")
    default_distance_meters: int = Field(..., ge=1, le=1000000, description="デフォルト距離（メートル）")
    category: str = Field(..., description="カテゴリ")
    is_customizable: bool = Field(True, description="カスタマイズ可能フラグ")
    min_distance_meters: int = Field(50, ge=1, description="最小距離（メートル）")
    max_distance_meters: int = Field(100000, ge=1, description="最大距離（メートル）")
    description: Optional[str] = Field(None, max_length=500, description="説明")
    is_default: bool = Field(False, description="デフォルトフラグ")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceTypeCreate(RaceTypeBase):
    pass


class RaceTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    default_distance_meters: Optional[int] = Field(None, ge=1, le=1000000)
    category: Optional[str] = None
    is_customizable: Optional[bool] = None
    min_distance_meters: Optional[int] = Field(None, ge=1)
    max_distance_meters: Optional[int] = Field(None, ge=1)
    description: Optional[str] = Field(None, max_length=500)
    is_default: Optional[bool] = None


class RaceTypeResponse(RaceTypeBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    usage_count: Optional[int] = 0

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceResultBase(BaseModel):
    race_name: str = Field(..., min_length=1, max_length=200, description="レース名")
    race_type_id: Optional[str] = Field(None, description="レース種目ID")
    race_date: date = Field(..., description="レース日")
    time_seconds: float = Field(..., ge=1, description="完走時間（秒）")
    distance_meters: int = Field(..., ge=1, description="距離（メートル）")
    pace_seconds: Optional[float] = Field(None, ge=60, le=3600, description="ペース（秒/km）")
    place: Optional[int] = Field(None, ge=1, description="順位")
    total_participants: Optional[int] = Field(None, ge=1, description="総参加者数")
    notes: Optional[str] = Field(None, max_length=2000, description="メモ")
    race_type: Optional[str] = Field(None, max_length=10, description="レースタイプ")
    custom_distance_m: Optional[int] = Field(None, description="カスタム距離（メートル）")
    is_relay: Optional[bool] = Field(False, description="駅伝フラグ")
    relay_segment: Optional[int] = Field(None, description="駅伝区間")
    team_name: Optional[str] = Field(None, max_length=100, description="チーム名")
    relay_time: Optional[str] = Field(None, max_length=20, description="駅伝タイム")
    segment_place: Optional[int] = Field(None, description="区間順位")
    segment_total_participants: Optional[int] = Field(None, description="区間総参加者数")
    splits: Optional[List[float]] = Field(None, description="スプリットタイム")
    weather: Optional[str] = Field(None, max_length=50, description="天候")
    course_type: Optional[str] = Field(None, max_length=50, description="コースタイプ")
    strategy_notes: Optional[str] = Field(None, max_length=1000, description="戦略メモ")
    prediction_id: Optional[str] = Field(None, description="予測ID")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceResultCreate(RaceResultBase):
    pass


class RaceResultUpdate(BaseModel):
    race_name: Optional[str] = Field(None, min_length=1, max_length=200)
    race_type_id: Optional[str] = None
    race_date: Optional[date] = None
    time_seconds: Optional[float] = Field(None, ge=1)
    distance_meters: Optional[int] = Field(None, ge=1)
    pace_seconds: Optional[float] = Field(None, ge=60, le=3600)
    place: Optional[int] = Field(None, ge=1)
    total_participants: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = Field(None, max_length=2000)
    race_type: Optional[str] = Field(None, max_length=10)
    custom_distance_m: Optional[int] = None
    is_relay: Optional[bool] = None
    relay_segment: Optional[int] = None
    team_name: Optional[str] = Field(None, max_length=100)
    relay_time: Optional[str] = Field(None, max_length=20)
    segment_place: Optional[int] = None
    segment_total_participants: Optional[int] = None
    splits: Optional[List[float]] = None
    weather: Optional[str] = Field(None, max_length=50)
    course_type: Optional[str] = Field(None, max_length=50)
    strategy_notes: Optional[str] = Field(None, max_length=1000)
    prediction_id: Optional[str] = None


class RaceResultResponse(RaceResultBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceResultListResponse(BaseModel):
    items: List[RaceResultResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceTypeListResponse(BaseModel):
    items: List[RaceTypeResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceStatsResponse(BaseModel):
    total_races: int
    total_distance_km: float
    personal_bests_count: int
    average_finish_time_seconds: Optional[float] = None
    fastest_finish_time_seconds: Optional[int] = None
    slowest_finish_time_seconds: Optional[int] = None
    races_this_year: int
    races_this_month: int
    most_common_race_type: Optional[str] = None
    improvement_trend: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class RaceTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="レース種目名")
    distance_km: float = Field(..., gt=0, le=1000, description="距離（km）")
    description: Optional[str] = Field(None, max_length=500, description="説明")
    category: Optional[str] = Field(None, description="カテゴリ")
    is_default: Optional[bool] = Field(False, description="デフォルトフラグ")
    world_record_seconds: Optional[int] = Field(None, ge=1, description="世界記録（秒）")
    typical_finish_time_range: Optional[Dict[str, int]] = Field(None, description="典型的な完走時間範囲")
    difficulty_level: Optional[str] = Field(None, description="難易度レベル")
    training_requirements: Optional[str] = Field(None, max_length=1000, description="トレーニング要件")
    equipment_needed: Optional[str] = Field(None, max_length=500, description="必要な装備")
    common_injuries: Optional[str] = Field(None, max_length=500, description="よくある怪我")
    tips: Optional[str] = Field(None, max_length=1000, description="コツ・アドバイス")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceTypeCreate(RaceTypeBase):
    pass


class RaceTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    distance_km: Optional[float] = Field(None, gt=0, le=1000)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    is_default: Optional[bool] = None
    world_record_seconds: Optional[int] = Field(None, ge=1)
    typical_finish_time_range: Optional[Dict[str, int]] = None
    difficulty_level: Optional[str] = None
    training_requirements: Optional[str] = Field(None, max_length=1000)
    equipment_needed: Optional[str] = Field(None, max_length=500)
    common_injuries: Optional[str] = Field(None, max_length=500)
    tips: Optional[str] = Field(None, max_length=1000)


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


class RaceTypeStatsResponse(BaseModel):
    total_race_types: int
    default_race_types: int
    custom_race_types: int
    most_popular_race_type: Optional[str] = None
    average_distance_km: Optional[float] = None
    race_types_created_this_month: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
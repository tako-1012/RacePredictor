from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class RaceResultBase(BaseModel):
    race_date: date
    race_name: str = Field(..., min_length=1, max_length=100)
    race_type_id: UUID
    distance_meters: int = Field(..., ge=50, le=100000)
    time_seconds: float = Field(..., gt=0)
    pace_seconds: float = Field(..., gt=0)
    place: Optional[int] = Field(None, gt=0)
    total_participants: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    
    # 駅伝専用フィールド
    is_relay: bool = False
    relay_segment: Optional[int] = Field(None, ge=1, le=10)
    team_name: Optional[str] = Field(None, max_length=100)
    relay_time: Optional[str] = Field(None, max_length=20)
    segment_place: Optional[int] = Field(None, gt=0)
    segment_total_participants: Optional[int] = Field(None, gt=0)
    
    # 詳細情報
    splits: Optional[List[float]] = None
    weather: Optional[str] = Field(None, max_length=50)
    course_type: Optional[str] = Field(None, max_length=50)
    strategy_notes: Optional[str] = Field(None, max_length=1000)


class RaceResultCreate(RaceResultBase):
    prediction_id: Optional[UUID] = None


class RaceResultUpdate(BaseModel):
    race_date: Optional[date] = None
    race_name: Optional[str] = Field(None, min_length=1, max_length=100)
    race_type_id: Optional[UUID] = None
    distance_meters: Optional[int] = Field(None, ge=50, le=100000)
    time_seconds: Optional[float] = Field(None, gt=0)
    pace_seconds: Optional[float] = Field(None, gt=0)
    place: Optional[int] = Field(None, gt=0)
    total_participants: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=1000)
    
    # 駅伝専用フィールド
    is_relay: Optional[bool] = None
    relay_segment: Optional[int] = Field(None, ge=1, le=10)
    team_name: Optional[str] = Field(None, max_length=100)
    relay_time: Optional[str] = Field(None, max_length=20)
    segment_place: Optional[int] = Field(None, gt=0)
    segment_total_participants: Optional[int] = Field(None, gt=0)
    
    # 詳細情報
    splits: Optional[List[float]] = None
    weather: Optional[str] = Field(None, max_length=50)
    course_type: Optional[str] = Field(None, max_length=50)
    strategy_notes: Optional[str] = Field(None, max_length=1000)
    
    prediction_id: Optional[UUID] = None


class RaceResultResponse(RaceResultBase):
    id: UUID
    user_id: UUID
    prediction_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
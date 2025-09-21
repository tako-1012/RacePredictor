from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from app.schemas.prediction import TargetEventEnum


class RaceResultBase(BaseModel):
    race_date: date
    event: TargetEventEnum
    time_seconds: float = Field(..., gt=0)
    place: Optional[int] = Field(None, gt=0)


class RaceResultCreate(RaceResultBase):
    prediction_id: Optional[UUID] = None


class RaceResultUpdate(BaseModel):
    race_date: Optional[date] = None
    event: Optional[TargetEventEnum] = None
    time_seconds: Optional[float] = Field(None, gt=0)
    place: Optional[int] = Field(None, gt=0)
    prediction_id: Optional[UUID] = None


class RaceResultResponse(RaceResultBase):
    id: UUID
    user_id: UUID
    prediction_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
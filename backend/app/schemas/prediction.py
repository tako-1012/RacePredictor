from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from enum import Enum


class TargetEventEnum(str, Enum):
    event_800m = "800m"
    event_1500m = "1500m"
    event_3000m = "3000m"
    event_5000m = "5000m"
    event_10000m = "10000m"
    event_5km = "5km"
    event_10km = "10km"
    event_half = "half"
    event_full = "full"


class PredictionBase(BaseModel):
    target_event: TargetEventEnum


class PredictionCreate(PredictionBase):
    pass


class PredictionResponse(PredictionBase):
    id: UUID
    user_id: UUID
    prediction_date: date
    predicted_time_seconds: float
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    model_version: str
    base_workouts: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionResult(BaseModel):
    predicted_time_seconds: float
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    base_info: Dict[str, Any]
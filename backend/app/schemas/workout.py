from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class WorkoutTypeBase(BaseModel):
    name: str = Field(..., max_length=100)
    category: Optional[str] = Field(None, max_length=50)


class WorkoutTypeCreate(WorkoutTypeBase):
    pass


class WorkoutTypeResponse(WorkoutTypeBase):
    id: UUID
    is_default: bool
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    date: date
    workout_type_id: UUID
    distance_meters: Optional[int] = Field(None, ge=1, le=100000)
    times_seconds: Optional[List[float]] = Field(None)
    repetitions: Optional[int] = Field(None, ge=1, le=100)
    rest_type: Optional[str] = Field(None, max_length=50)
    rest_duration: Optional[int] = Field(None, ge=0)
    intensity: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class WorkoutCreate(WorkoutBase):
    pass


class WorkoutUpdate(BaseModel):
    date: Optional[date] = None
    workout_type_id: Optional[UUID] = None
    distance_meters: Optional[int] = Field(None, ge=1, le=100000)
    times_seconds: Optional[List[float]] = None
    repetitions: Optional[int] = Field(None, ge=1, le=100)
    rest_type: Optional[str] = Field(None, max_length=50)
    rest_duration: Optional[int] = Field(None, ge=0)
    intensity: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class WorkoutResponse(WorkoutBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    workout_type: WorkoutTypeResponse

    class Config:
        from_attributes = True
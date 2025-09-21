from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RaceTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., regex="^(track|road|relay)$")
    default_distance_meters: int = Field(..., ge=50, le=100000)
    is_customizable: bool = True
    min_distance_meters: int = Field(default=50, ge=50, le=100000)
    max_distance_meters: int = Field(default=100000, ge=50, le=100000)
    description: Optional[str] = Field(None, max_length=500)


class RaceTypeCreate(RaceTypeBase):
    pass


class RaceTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, regex="^(track|road|relay)$")
    default_distance_meters: Optional[int] = Field(None, ge=50, le=100000)
    is_customizable: Optional[bool] = None
    min_distance_meters: Optional[int] = Field(None, ge=50, le=100000)
    max_distance_meters: Optional[int] = Field(None, ge=50, le=100000)
    description: Optional[str] = Field(None, max_length=500)


class RaceTypeResponse(RaceTypeBase):
    id: str
    is_default: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

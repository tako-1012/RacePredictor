from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


class WorkoutTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="ワークアウトタイプ名")
    category: Optional[str] = Field(None, description="カテゴリ")
    is_default: Optional[bool] = Field(False, description="デフォルトフラグ")

    class Config:
        from_attributes = True


class WorkoutTypeCreate(WorkoutTypeBase):
    pass


class WorkoutTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    is_default: Optional[bool] = None


class WorkoutTypeResponse(WorkoutTypeBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    workout_type_id: str = Field(..., description="ワークアウトタイプID")
    target_distance_meters: Optional[int] = Field(None, ge=0, description="目標距離（メートル）")
    actual_distance_meters: Optional[int] = Field(None, ge=0, description="実際の距離（メートル）")
    target_times_seconds: Optional[List[int]] = Field(None, description="目標時間（秒）")
    actual_times_seconds: Optional[List[int]] = Field(None, description="実際の時間（秒）")
    completed: Optional[bool] = Field(False, description="完了フラグ")
    completion_rate: Optional[float] = Field(None, ge=0, le=100, description="完了率（0-100）")
    repetitions: Optional[int] = Field(None, ge=1, description="繰り返し回数")
    rest_type: Optional[str] = Field(None, description="休息タイプ")
    rest_duration: Optional[int] = Field(None, ge=0, description="休息時間（秒）")
    intensity: Optional[int] = Field(None, ge=1, le=10, description="強度（1-10）")
    notes: Optional[str] = Field(None, max_length=2000, description="メモ")

    class Config:
        from_attributes = True


class WorkoutCreate(WorkoutBase):
    workout_date: date = Field(..., description="ワークアウト日")

    class Config:
        from_attributes = True


class WorkoutUpdate(BaseModel):
    workout_type_id: Optional[str] = None
    target_distance_meters: Optional[int] = Field(None, ge=0)
    actual_distance_meters: Optional[int] = Field(None, ge=0)
    target_times_seconds: Optional[List[int]] = None
    actual_times_seconds: Optional[List[int]] = None
    completed: Optional[bool] = None
    completion_rate: Optional[float] = Field(None, ge=0, le=100)
    repetitions: Optional[int] = Field(None, ge=1)
    rest_type: Optional[str] = None
    rest_duration: Optional[int] = Field(None, ge=0)
    intensity: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=2000)
    workout_date: Optional[date] = None


class WorkoutResponse(WorkoutBase):
    id: str
    user_id: str
    workout_date: date
    created_at: datetime
    workout_type_name: Optional[str] = Field(None, description="ワークアウトタイプ名")
    workout_type: Optional[str] = Field(None, description="ワークアウトタイプ（互換性用）")
    date_iso: Optional[str] = Field(None, description="日付（ISO形式）")
    distance_meters: Optional[int] = Field(None, description="距離（メートル）")
    times_seconds: Optional[List[int]] = Field(None, description="時間（秒）")
    duration_seconds: Optional[int] = Field(None, description="総時間（秒）")
    target_distance_meters: Optional[int] = Field(None, description="目標距離（メートル）")
    target_times_seconds: Optional[List[int]] = Field(None, description="目標時間（秒）")
    actual_distance_meters: Optional[int] = Field(None, description="実際の距離（メートル）")
    actual_times_seconds: Optional[List[int]] = Field(None, description="実際の時間（秒）")
    completed: Optional[bool] = Field(None, description="完了フラグ")
    completion_rate: Optional[int] = Field(None, description="完了率")
    session_data: Optional[List[dict]] = Field(None, description="セッションデータ")
    distances_km: Optional[List[float]] = Field(None, description="距離（キロメートル）")
    total_distance: Optional[float] = Field(None, description="総距離（キロメートル）")

    class Config:
        from_attributes = True


class WorkoutListResponse(BaseModel):
    items: List[WorkoutResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True


class WorkoutStatsResponse(BaseModel):
    total_workouts: int
    total_distance_km: float
    total_duration_minutes: int
    total_calories_burned: int
    average_pace_per_km_seconds: Optional[float] = None
    average_duration_minutes: Optional[float] = None
    workouts_this_month: int
    workouts_this_week: int
    longest_distance_km: Optional[float] = None
    fastest_pace_per_km_seconds: Optional[int] = None

    class Config:
        from_attributes = True


class WorkoutTypeListResponse(BaseModel):
    items: List[WorkoutTypeResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
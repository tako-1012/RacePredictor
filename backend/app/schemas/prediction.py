from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
import enum


class TargetEventEnum(str, enum.Enum):
    marathon = "marathon"
    half_marathon = "half_marathon"
    ten_k = "10k"
    five_k = "5k"
    other = "other"


class PredictionBase(BaseModel):
    race_type_id: UUID = Field(..., description="レース種目ID")
    target_date: date = Field(..., description="目標日")
    current_pace_per_km_seconds: Optional[int] = Field(None, ge=60, le=3600, description="現在のペース（秒/km）")
    training_volume_km_per_week: Optional[float] = Field(None, ge=0, le=500, description="週間トレーニング量（km）")
    recent_performance_seconds: Optional[int] = Field(None, ge=1, description="最近のパフォーマンス（秒）")
    training_intensity: Optional[str] = Field(None, description="トレーニング強度")
    recovery_time_days: Optional[int] = Field(None, ge=0, le=30, description="回復時間（日）")
    weather_forecast: Optional[str] = Field(None, description="天気予報")
    course_difficulty: Optional[str] = Field(None, description="コース難易度")
    personal_motivation: Optional[int] = Field(None, ge=1, le=10, description="個人のモチベーション（1-10）")
    health_condition: Optional[str] = Field(None, description="健康状態")
    sleep_quality: Optional[int] = Field(None, ge=1, le=10, description="睡眠の質（1-10）")
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="ストレスレベル（1-10）")
    nutrition_status: Optional[str] = Field(None, description="栄養状態")
    hydration_level: Optional[int] = Field(None, ge=1, le=10, description="水分補給レベル（1-10）")
    equipment_condition: Optional[str] = Field(None, description="装備の状態")
    previous_race_experience: Optional[int] = Field(None, ge=0, description="過去のレース経験数")
    altitude_training: Optional[bool] = Field(False, description="高地トレーニング経験")
    tapering_period_days: Optional[int] = Field(None, ge=0, le=30, description="テーパリング期間（日）")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PredictionCreate(PredictionBase):
    pass


class PredictionUpdate(BaseModel):
    race_type_id: Optional[UUID] = None
    target_date: Optional[date] = None
    current_pace_per_km_seconds: Optional[int] = Field(None, ge=60, le=3600)
    training_volume_km_per_week: Optional[float] = Field(None, ge=0, le=500)
    recent_performance_seconds: Optional[int] = Field(None, ge=1)
    training_intensity: Optional[str] = None
    recovery_time_days: Optional[int] = Field(None, ge=0, le=30)
    weather_forecast: Optional[str] = None
    course_difficulty: Optional[str] = None
    personal_motivation: Optional[int] = Field(None, ge=1, le=10)
    health_condition: Optional[str] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    nutrition_status: Optional[str] = None
    hydration_level: Optional[int] = Field(None, ge=1, le=10)
    equipment_condition: Optional[str] = None
    previous_race_experience: Optional[int] = Field(None, ge=0)
    altitude_training: Optional[bool] = None
    tapering_period_days: Optional[int] = Field(None, ge=0, le=30)


class PredictionResponse(PredictionBase):
    id: str
    user_id: str
    prediction_date: date
    predicted_time_seconds: float = Field(..., description="予測タイム（秒）")
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="信頼度（0-1）")
    model_version: str = Field(..., description="モデルバージョン")
    base_workouts: Optional[Dict[str, Any]] = Field(None, description="ベースワークアウト")
    created_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PredictionListResponse(BaseModel):
    items: List[PredictionResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PredictionStatsResponse(BaseModel):
    total_predictions: int
    average_confidence: float
    predictions_this_month: int
    most_predicted_race_type: Optional[str] = None
    accuracy_rate: Optional[float] = None
    improvement_trend: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class PredictionResult(BaseModel):
    id: str
    user_id: str
    race_type_id: UUID
    predicted_time_seconds: float
    actual_time_seconds: Optional[float] = None
    confidence_level: float
    accuracy_percentage: Optional[float] = None
    prediction_date: date
    actual_date: Optional[date] = None
    model_version: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
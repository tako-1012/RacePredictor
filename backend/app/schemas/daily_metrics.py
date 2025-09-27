from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class DailyMetricsBase(BaseModel):
    date: date
    weight_kg: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    sleep_duration_hours: Optional[float] = None
    sleep_quality_score: Optional[int] = Field(None, ge=1, le=10)
    bedtime: Optional[str] = None
    wake_time: Optional[str] = None
    fatigue_level: Optional[int] = Field(None, ge=1, le=10)
    motivation_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    training_readiness: Optional[int] = Field(None, ge=1, le=10)
    recovery_status: Optional[str] = None
    resting_heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    notes: Optional[str] = None
    mood_tags: Optional[List[str]] = None
    is_estimated: Optional[bool] = False
    data_source: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class DailyMetricsCreate(DailyMetricsBase):
    pass


class DailyMetricsUpdate(BaseModel):
    weight_kg: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    sleep_duration_hours: Optional[float] = None
    sleep_quality_score: Optional[int] = Field(None, ge=1, le=10)
    bedtime: Optional[str] = None
    wake_time: Optional[str] = None
    fatigue_level: Optional[int] = Field(None, ge=1, le=10)
    motivation_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    training_readiness: Optional[int] = Field(None, ge=1, le=10)
    recovery_status: Optional[str] = None
    resting_heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    notes: Optional[str] = None
    mood_tags: Optional[List[str]] = None
    is_estimated: Optional[bool] = None
    data_source: Optional[str] = None


class DailyMetricsResponse(DailyMetricsBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class WeeklyMetricsSummaryBase(BaseModel):
    week_start_date: date
    week_end_date: date
    avg_weight: Optional[float] = None
    avg_body_fat_percentage: Optional[float] = None
    avg_muscle_mass_kg: Optional[float] = None
    avg_sleep_hours: Optional[float] = None
    avg_sleep_quality: Optional[float] = None
    avg_fatigue_level: Optional[float] = None
    avg_motivation_level: Optional[float] = None
    avg_stress_level: Optional[float] = None
    avg_energy_level: Optional[float] = None
    avg_training_readiness: Optional[float] = None
    avg_resting_heart_rate: Optional[float] = None
    total_entries: int = 0

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class WeeklyMetricsSummaryResponse(WeeklyMetricsSummaryBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class MonthlyMetricsSummaryBase(BaseModel):
    year: int
    month: int
    avg_weight: Optional[float] = None
    avg_body_fat_percentage: Optional[float] = None
    avg_muscle_mass_kg: Optional[float] = None
    avg_sleep_hours: Optional[float] = None
    avg_sleep_quality: Optional[float] = None
    avg_fatigue_level: Optional[float] = None
    avg_motivation_level: Optional[float] = None
    avg_stress_level: Optional[float] = None
    avg_energy_level: Optional[float] = None
    avg_training_readiness: Optional[float] = None
    avg_resting_heart_rate: Optional[float] = None
    total_entries: int = 0

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class MonthlyMetricsSummaryResponse(MonthlyMetricsSummaryBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class DailyMetricsListResponse(BaseModel):
    items: List[DailyMetricsResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class MetricsTrendResponse(BaseModel):
    metric_name: str
    trend_data: List[Dict[str, Any]]
    trend_direction: str
    change_percentage: float
    period: str
    confidence: Optional[float] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class HealthInsightsResponse(BaseModel):
    insight_type: str
    message: str
    severity: str
    recommendations: List[str]
    confidence: Optional[float] = None
    related_metrics: Optional[List[str]] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class MetricsComparisonResponse(BaseModel):
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    changes: Dict[str, float]
    period_type: str

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
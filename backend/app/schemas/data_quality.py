from __future__ import annotations

from pydantic import BaseModel
from typing import List, Optional, Tuple, Any
from datetime import datetime
from enum import Enum

class DataQualityLevel(str, Enum):
    """データ品質レベル"""
    EXCELLENT = "excellent"
    GOOD = "good"
    WARNING = "warning"
    ERROR = "error"

class DataQualityIssueResponse(BaseModel):
    """データ品質問題レスポンス"""
    id: str
    level: DataQualityLevel
    title: str
    description: str
    suggestion: str
    field: Optional[str] = None
    value: Optional[Any] = None
    expected_range: Optional[Tuple[float, float]] = None

class DataQualityReportResponse(BaseModel):
    """データ品質レポートレスポンス"""
    overall_score: float
    level: DataQualityLevel
    issues: List[DataQualityIssueResponse]
    total_records: int
    valid_records: int
    generated_at: str

class DataQualityStatsResponse(BaseModel):
    """データ品質統計レスポンス"""
    total_records: int
    valid_records: int
    warning_records: int
    error_records: int
    overall_score: float
    weekly_trend: List[dict]
    common_issues: List[dict]

class DuplicateRecord(BaseModel):
    """重複記録"""
    id: str
    date: str
    distance_km: float
    time_minutes: float
    pace_per_km: float
    workout_name: Optional[str] = None
    similarity_score: float

class DuplicateGroup(BaseModel):
    """重複グループ"""
    id: str
    records: List[DuplicateRecord]
    similarity_type: str  # 'exact', 'similar', 'potential'
    suggested_action: str  # 'merge', 'keep_all', 'delete_duplicates'

class DuplicateDetectionRequest(BaseModel):
    """重複検出リクエスト"""
    date_range: Optional[Tuple[str, str]] = None
    similarity_threshold: float = 0.8
    include_potential: bool = True

class DuplicateDetectionResponse(BaseModel):
    """重複検出レスポンス"""
    duplicate_groups: List[DuplicateGroup]
    total_duplicates: int
    total_groups: int
    scan_completed_at: str

class DataQualityConfig(BaseModel):
    """データ品質設定"""
    pace_limits: Tuple[float, float] = (2.0, 15.0)
    distance_limits: Tuple[float, float] = (0.1, 100.0)
    time_limits: Tuple[float, float] = (1.0, 600.0)
    heart_rate_limits: Tuple[int, int] = (40, 220)
    similarity_threshold: float = 0.8
    auto_validation: bool = True
    notification_enabled: bool = True

class DataQualityMetrics(BaseModel):
    """データ品質メトリクス"""
    date: str
    total_records: int
    valid_records: int
    warning_records: int
    error_records: int
    quality_score: float
    common_issues: List[str]
    improvement_suggestions: List[str]

class DataQualityTrend(BaseModel):
    """データ品質トレンド"""
    period: str  # 'daily', 'weekly', 'monthly'
    start_date: str
    end_date: str
    metrics: List[DataQualityMetrics]
    overall_trend: str  # 'improving', 'stable', 'declining'
    trend_score: float

class DataQualityAlert(BaseModel):
    """データ品質アラート"""
    id: str
    level: DataQualityLevel
    title: str
    message: str
    created_at: str
    resolved_at: Optional[str] = None
    is_resolved: bool = False
    action_required: bool = True
    suggested_actions: List[str] = []

class DataQualitySummary(BaseModel):
    """データ品質サマリー"""
    current_score: float
    level: DataQualityLevel
    total_records: int
    valid_records: int
    warning_records: int
    error_records: int
    recent_trend: str
    improvement_rate: float
    next_review_date: str
    recommendations: List[str]

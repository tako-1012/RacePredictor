from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class IntervalAnalysisRequest(BaseModel):
    """インターバル分析リクエスト"""
    workout_import_data_id: str
    lap_times: List[float] = Field(..., min_items=1, description="ラップタイムの配列（秒）")
    lap_distances: List[float] = Field(..., min_items=1, description="ラップ距離の配列（メートル）")


class IntervalAnalysisResponse(BaseModel):
    """インターバル分析レスポンス"""
    analysis_id: str
    total_laps: int
    average_lap_time: float
    average_lap_distance: float
    has_anomaly: bool
    anomaly_type: Optional[str]
    anomaly_lap_index: Optional[int]
    anomaly_severity: Optional[str]
    lap_times: List[float]
    lap_distances: List[float]
    lap_paces: List[float]
    suggested_corrections: List[Dict[str, Any]]
    pattern_validation: Dict[str, Any]
    analysis_metadata: Dict[str, Any]


class CorrectionApplyRequest(BaseModel):
    """修正適用リクエスト"""
    workout_import_data_id: str
    correction_type: str = Field(..., description="修正タイプ（例: 'remove_last_lap'）")


class CorrectionApplyResponse(BaseModel):
    """修正適用レスポンス"""
    workout_import_data_id: str
    correction_applied: bool
    correction_type: str
    original_lap_count: int
    corrected_lap_count: int
    corrected_times: List[float]
    corrected_distances: List[float]
    modifications: Dict[str, Any]


class WorkoutImportDataResponse(BaseModel):
    """ワークアウトインポートデータレスポンス"""
    id: str
    user_id: str
    workout_id: Optional[str]
    raw_data: Dict[str, Any]
    processed_data: Optional[Dict[str, Any]]
    user_choice: str
    modifications: Optional[Dict[str, Any]]
    anomaly_detection: Optional[Dict[str, Any]]
    import_source: Optional[str]
    import_timestamp: datetime
    last_modified: datetime

    class Config:
        from_attributes = True


class IntervalComparisonRequest(BaseModel):
    """インターバル比較リクエスト"""
    workout_import_data_id: str


class IntervalComparisonResponse(BaseModel):
    """インターバル比較レスポンス"""
    workout_import_data_id: str
    original_data: Dict[str, Any]
    corrected_data: Dict[str, Any]
    differences: Dict[str, Any]
    recommendation: str
    confidence_score: float


class BatchAnalysisRequest(BaseModel):
    """バッチ分析リクエスト"""
    workout_import_data_ids: List[str] = Field(..., min_items=1)


class BatchAnalysisResponse(BaseModel):
    """バッチ分析レスポンス"""
    total_analyzed: int
    anomalies_found: int
    results: List[Dict[str, Any]]
    summary: Dict[str, Any]

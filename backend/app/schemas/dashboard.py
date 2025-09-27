from __future__ import annotations

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# ダッシュボード用のPydanticスキーマ（SQLAlchemyモデルから完全に分離）

class WorkoutStatsSchema(BaseModel):
    """ワークアウト統計情報スキーマ"""
    id: str
    date: str  # ISO形式の文字列
    workout_type_name: str
    distance_km: float
    time_minutes: float
    pace_per_km: Optional[str] = None

class RaceStatsSchema(BaseModel):
    """レース統計情報スキーマ"""
    id: str
    race_name: str
    date: str  # ISO形式の文字列
    distance_meters: int
    time_seconds: Optional[int] = None
    pace_per_km: Optional[str] = None

class StatsCard(BaseModel):
    """統計カードスキーマ"""
    title: str
    value: str
    unit: str
    icon: str

class ChartData(BaseModel):
    """チャートデータスキーマ"""
    labels: List[str]
    values: List[float]

class WeeklyData(BaseModel):
    """週間データスキーマ"""
    distance_km: float
    workout_count: int
    time_minutes: float

class DashboardStatsResponse(BaseModel):
    """ダッシュボード統計レスポンススキーマ"""
    stats_cards: List[StatsCard]
    weekly_chart: ChartData
    monthly_chart: Optional[ChartData] = None
    recent_workouts: List[WorkoutStatsSchema]
    weekly_data: Optional[WeeklyData] = None
    monthly_data: Optional[WeeklyData] = None  # 同じスキーマを使用

# 後方互換性のためのエイリアス
WorkoutSummary = WorkoutStatsSchema
DashboardResponse = DashboardStatsResponse
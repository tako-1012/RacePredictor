from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# シンプルなスキーマ定義（SQLAlchemyモデルに依存しない）
class WorkoutSummary(BaseModel):
    id: str
    date: str  # ISO形式の文字列
    workout_type_name: str
    distance_km: float
    time_minutes: float
    pace_per_km: Optional[str] = None

class StatsCard(BaseModel):
    title: str
    value: str
    unit: str
    icon: str

class ChartData(BaseModel):
    labels: List[str]
    values: List[float]

class DashboardResponse(BaseModel):
    stats_cards: List[StatsCard]
    weekly_chart: ChartData
    recent_workouts: List[WorkoutSummary]
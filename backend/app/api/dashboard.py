from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.models.workout import Workout, WorkoutType
from app.core.security import get_current_user_from_token
from app.schemas.dashboard import (
    DashboardResponse, 
    WorkoutSummary, 
    StatsCard, 
    ChartData
)

logger = logging.getLogger(__name__)

router = APIRouter()

def format_time(seconds: Optional[int]) -> str:
    """秒数を MM:SS 形式に変換"""
    if not seconds or seconds <= 0:
        return "0:00"
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes}:{secs:02d}"

def calculate_pace(distance_meters: Optional[int], time_seconds: Optional[int]) -> str:
    """ペース（分/km）を計算"""
    if not distance_meters or not time_seconds or distance_meters == 0:
        return "--:--"
    pace_seconds = (time_seconds / distance_meters) * 1000
    return format_time(int(pace_seconds))

def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """安全な除算（ゼロ除算を防ぐ）"""
    if denominator == 0 or denominator is None:
        return default
    return numerator / denominator

def safe_sum(values: List[Optional[float]], default: float = 0.0) -> float:
    """安全な合計計算（None値を除外）"""
    if not values:
        return default
    valid_values = [v for v in values if v is not None]
    return sum(valid_values) if valid_values else default

@router.get("/stats", response_model=DashboardResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """ダッシュボード統計情報を取得"""
    
    try:
        logger.info(f"🔍 ダッシュボード統計取得開始: user_id={current_user.id}")
        
        # 1. 統計カードデータ
        total_workouts = db.query(func.count(Workout.id)).filter(
            Workout.user_id == current_user.id
        ).scalar() or 0
        
        total_distance_meters = db.query(func.sum(Workout.distance_meters)).filter(
            Workout.user_id == current_user.id
        ).scalar() or 0
        
        # 総時間の計算（より安全に）
        workouts_with_time = db.query(Workout.times_seconds).filter(
            Workout.user_id == current_user.id,
            Workout.times_seconds.isnot(None)
        ).all()

        total_time_seconds = 0
        for workout_times in workouts_with_time:
            if workout_times.times_seconds:
                if isinstance(workout_times.times_seconds, list):
                    total_time_seconds += safe_sum(workout_times.times_seconds)
                else:
                    total_time_seconds += workout_times.times_seconds or 0

        # 今週の距離
        start_of_week = datetime.now() - timedelta(days=datetime.now().weekday())
        this_week_distance_meters = db.query(func.sum(Workout.distance_meters)).filter(
            Workout.user_id == current_user.id,
            Workout.date >= start_of_week.date()
        ).scalar() or 0
        
        # 統計カードの生成（デフォルト値を確実に設定）
        stats_cards = [
            StatsCard(
                title="総練習回数",
                value=str(total_workouts),
                unit="回",
                icon="activity"
            ),
            StatsCard(
                title="総走行距離",
                value=f"{safe_divide(total_distance_meters, 1000, 0.0):.1f}",
                unit="km",
                icon="map-pin"
            ),
            StatsCard(
                title="総練習時間",
                value=str(int(safe_divide(total_time_seconds, 3600, 0))),
                unit="時間",
                icon="clock"
            ),
            StatsCard(
                title="今週の距離",
                value=f"{safe_divide(this_week_distance_meters, 1000, 0.0):.1f}",
                unit="km",
                icon="calendar"
            )
        ]
        
        # 2. 週間チャートデータ
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=6)
        
        daily_workouts = db.query(
            Workout.date,
            func.sum(Workout.distance_meters).label('distance')
        ).filter(
            Workout.user_id == current_user.id,
            Workout.date >= start_date,
            Workout.date <= end_date
        ).group_by(Workout.date).all()
        
        # 安全な距離計算
        date_map = {}
        for w in daily_workouts:
            distance_km = safe_divide(w.distance or 0, 1000, 0.0)
            date_map[w.date] = distance_km
        
        labels = []
        values = []
        for i in range(7):
            date = start_date + timedelta(days=i)
            labels.append(date.strftime("%m/%d"))
            values.append(date_map.get(date, 0.0))
        
        weekly_chart = ChartData(labels=labels, values=values)
    
        # 3. 最近の練習
        logger.info("📊 最近の練習記録取得開始")
        
        # WorkoutTypeテーブルが存在するかチェック
        try:
            recent_workouts_db = db.query(
                Workout, WorkoutType.name
            ).join(
                WorkoutType, Workout.workout_type_id == WorkoutType.id
            ).filter(
                Workout.user_id == current_user.id
            ).order_by(
                Workout.date.desc()
            ).limit(5).all()
        except Exception as join_error:
            logger.warning(f"⚠️ WorkoutType JOIN エラー: {join_error}")
            # JOINが失敗した場合はWorkoutのみを取得
            recent_workouts_db = db.query(Workout).filter(
                Workout.user_id == current_user.id
            ).order_by(
                Workout.date.desc()
            ).limit(5).all()
            # type_nameをNoneに設定
            recent_workouts_db = [(workout, None) for workout in recent_workouts_db]
        
        recent_workouts = []
        for workout, type_name in recent_workouts_db:
            # times_secondsが配列の場合は合計を使用
            time_seconds = 0
            if workout.times_seconds:
                if isinstance(workout.times_seconds, list):
                    time_seconds = safe_sum(workout.times_seconds)
                else:
                    time_seconds = workout.times_seconds or 0
            
            # 安全な距離と時間の計算
            distance_km = safe_divide(workout.distance_meters or 0, 1000, 0.0)
            time_minutes = safe_divide(time_seconds, 60, 0.0)
            
            recent_workouts.append(WorkoutSummary(
                id=str(workout.id),
                date=workout.date.isoformat(),
                workout_type_name=type_name or "不明",
                distance_km=distance_km,
                time_minutes=time_minutes,
                pace_per_km=calculate_pace(workout.distance_meters, time_seconds)
            ))
    
        logger.info("✅ ダッシュボード統計取得成功")
        return DashboardResponse(
            stats_cards=stats_cards,
            weekly_chart=weekly_chart,
            recent_workouts=recent_workouts
        )
    
    except Exception as e:
        logger.error(f"❌ ダッシュボード統計取得エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        # エラー時でもデフォルトデータを返す
        default_stats = [
            StatsCard(title="総練習回数", value="0", unit="回", icon="activity"),
            StatsCard(title="総走行距離", value="0.0", unit="km", icon="map-pin"),
            StatsCard(title="総練習時間", value="0", unit="時間", icon="clock"),
            StatsCard(title="今週の距離", value="0.0", unit="km", icon="calendar")
        ]
        
        default_chart = ChartData(
            labels=["月", "火", "水", "木", "金", "土", "日"],
            values=[0, 0, 0, 0, 0, 0, 0]
        )
        
        return DashboardResponse(
            stats_cards=default_stats,
            weekly_chart=default_chart,
            recent_workouts=[]
        )
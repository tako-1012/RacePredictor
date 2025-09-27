from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.models.workout import Workout, WorkoutType
from app.models.user import User
from app.core.security import get_current_user_from_token
from app.schemas.dashboard import (
    DashboardStatsResponse, 
    WorkoutStatsSchema, 
    StatsCard, 
    ChartData,
    WeeklyData
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

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_from_token)
):
    """ダッシュボード統計情報を取得"""
    
    try:
        logger.info(f"🔍 ダッシュボード統計取得開始: user_id={current_user_id}")
        
        # 1. 統計カードデータ
        total_workouts = db.query(func.count(Workout.id)).filter(
            Workout.user_id == current_user_id
        ).scalar() or 0
        
        total_distance_meters = db.query(func.sum(Workout.actual_distance_meters)).filter(
            Workout.user_id == current_user_id,
            Workout.actual_distance_meters.isnot(None)
        ).scalar() or 0
        
        # 総時間の計算（より安全に）
        workouts_with_time = db.query(Workout.actual_times_seconds).filter(
            Workout.user_id == current_user_id,
            Workout.actual_times_seconds.isnot(None)
        ).all()

        total_time_seconds = 0
        for workout_times in workouts_with_time:
            if workout_times.actual_times_seconds:
                if isinstance(workout_times.actual_times_seconds, list):
                    total_time_seconds += safe_sum(workout_times.actual_times_seconds)
                else:
                    total_time_seconds += workout_times.actual_times_seconds or 0

        # 今週のデータ（月曜日開始）
        today = datetime.now()
        # 月曜日を週の開始とする（月曜日=0, 日曜日=6）
        days_since_monday = today.weekday()
        start_of_week = today - timedelta(days=days_since_monday)
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 今週の距離
        this_week_distance_meters = db.query(func.sum(Workout.actual_distance_meters)).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_week.date(),
            Workout.actual_distance_meters.isnot(None)
        ).scalar() or 0
        
        # 今週の練習回数
        this_week_workout_count = db.query(func.count(Workout.id)).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_week.date()
        ).scalar() or 0
        
        # 今週の練習時間
        this_week_workouts_with_time = db.query(Workout.actual_times_seconds).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_week.date(),
            Workout.actual_times_seconds.isnot(None)
        ).all()
        
        this_week_time_seconds = 0
        for workout_times in this_week_workouts_with_time:
            if workout_times.actual_times_seconds:
                if isinstance(workout_times.actual_times_seconds, list):
                    this_week_time_seconds += safe_sum(workout_times.actual_times_seconds)
                else:
                    this_week_time_seconds += workout_times.actual_times_seconds or 0
        
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
        
        # 2. 週間チャートデータ（月曜日開始）
        today = datetime.now()
        days_since_monday = today.weekday()
        start_of_week = today - timedelta(days=days_since_monday)
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # 週の終わり（日曜日）
        end_of_week = start_of_week + timedelta(days=6)
        
        # 実際の距離データを取得
        daily_workouts = db.query(
            Workout.date,
            func.sum(Workout.actual_distance_meters).label('distance')
        ).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_week.date(),
            Workout.date <= end_of_week.date()
        ).group_by(Workout.date).all()
        
        # 実際の距離データがない場合は目標距離を使用
        if not daily_workouts:
            daily_workouts = db.query(
                Workout.date,
                func.sum(Workout.target_distance_meters).label('distance')
            ).filter(
                Workout.user_id == current_user_id,
                Workout.date >= start_of_week.date(),
                Workout.date <= end_of_week.date(),
                Workout.target_distance_meters.isnot(None)
            ).group_by(Workout.date).all()
        
        # 安全な距離計算
        date_map = {}
        for w in daily_workouts:
            distance_km = safe_divide(w.distance or 0, 1000, 0.0)
            date_map[w.date] = distance_km
        
        labels = []
        values = []
        for i in range(7):
            date = start_of_week.date() + timedelta(days=i)
            labels.append(date.strftime("%m/%d"))
            values.append(date_map.get(date, 0.0))
        
        weekly_chart = ChartData(labels=labels, values=values)
        
        # 3. 月間チャートデータ（今月のみ）
        today = datetime.now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # 月間の実際の距離データを取得
        monthly_workouts = db.query(
            Workout.date,
            func.sum(Workout.actual_distance_meters).label('distance')
        ).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_month.date(),
            Workout.date <= end_of_month.date()
        ).group_by(Workout.date).all()
        
        # 実際の距離データがない場合は目標距離を使用
        if not monthly_workouts:
            monthly_workouts = db.query(
                Workout.date,
                func.sum(Workout.target_distance_meters).label('distance')
            ).filter(
                Workout.user_id == current_user_id,
                Workout.date >= start_of_month.date(),
                Workout.date <= end_of_month.date(),
                Workout.target_distance_meters.isnot(None)
            ).group_by(Workout.date).all()
        
        # 月間データのマッピング
        monthly_date_map = {}
        for w in monthly_workouts:
            distance_km = safe_divide(w.distance or 0, 1000, 0.0)
            monthly_date_map[w.date] = distance_km
        
        # 今月の日数分のデータを生成
        days_in_month = end_of_month.day
        monthly_labels = []
        monthly_values = []
        for day in range(1, days_in_month + 1):
            date = start_of_month.replace(day=day).date()
            monthly_labels.append(str(day))
            monthly_values.append(monthly_date_map.get(date, 0.0))
        
        monthly_chart = ChartData(labels=monthly_labels, values=monthly_values)
        
        # 月間データの統計
        monthly_distance_meters = db.query(func.sum(Workout.actual_distance_meters)).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_month.date(),
            Workout.date <= end_of_month.date(),
            Workout.actual_distance_meters.isnot(None)
        ).scalar() or 0
        
        monthly_workout_count = db.query(func.count(Workout.id)).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_month.date(),
            Workout.date <= end_of_month.date()
        ).scalar() or 0
        
        # 月間の練習時間
        monthly_workouts_with_time = db.query(Workout.actual_times_seconds).filter(
            Workout.user_id == current_user_id,
            Workout.date >= start_of_month.date(),
            Workout.date <= end_of_month.date(),
            Workout.actual_times_seconds.isnot(None)
        ).all()
        
        monthly_time_seconds = 0
        for workout_times in monthly_workouts_with_time:
            if workout_times.actual_times_seconds:
                if isinstance(workout_times.actual_times_seconds, list):
                    monthly_time_seconds += safe_sum(workout_times.actual_times_seconds)
                else:
                    monthly_time_seconds += workout_times.actual_times_seconds or 0
        
        # 月間データの作成
        monthly_data = WeeklyData(  # 同じスキーマを使用
            distance_km=safe_divide(monthly_distance_meters, 1000, 0.0),
            workout_count=monthly_workout_count,
            time_minutes=safe_divide(monthly_time_seconds, 60, 0.0)
        )
    
        # 4. 最近の練習
        logger.info("📊 最近の練習記録取得開始")
        
        # 種別情報も含めてクエリ
        recent_workouts_db = db.query(Workout, WorkoutType.name).join(WorkoutType).filter(
            Workout.user_id == current_user_id
        ).order_by(
            Workout.date.desc()
        ).limit(5).all()
        
        recent_workouts = []
        for workout, type_name in recent_workouts_db:
            # times_secondsが配列の場合は合計を使用
            time_seconds = 0
            actual_times = workout.actual_times_seconds or workout.target_times_seconds
            if actual_times:
                if isinstance(actual_times, list):
                    time_seconds = safe_sum(actual_times)
                else:
                    time_seconds = actual_times or 0
            
            # 安全な距離と時間の計算
            actual_distance = workout.actual_distance_meters or workout.target_distance_meters
            distance_km = safe_divide(actual_distance or 0, 1000, 0.0)
            time_minutes = safe_divide(time_seconds, 60, 0.0)
            
            recent_workouts.append(WorkoutStatsSchema(
                id=str(workout.id),
                date=workout.date.isoformat(),
                workout_type_name=type_name or "不明",
                distance_km=distance_km,
                time_minutes=time_minutes,
                pace_per_km=calculate_pace(workout.distance_meters, time_seconds)
            ))
    
        # 週間データの作成
        weekly_data = WeeklyData(
            distance_km=safe_divide(this_week_distance_meters, 1000, 0.0),
            workout_count=this_week_workout_count,
            time_minutes=safe_divide(this_week_time_seconds, 60, 0.0)
        )
        
        logger.info("✅ ダッシュボード統計取得成功")
        return DashboardStatsResponse(
            stats_cards=stats_cards,
            weekly_chart=weekly_chart,
            monthly_chart=monthly_chart,
            recent_workouts=recent_workouts,
            weekly_data=weekly_data,
            monthly_data=monthly_data
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
        
        default_weekly_data = WeeklyData(
            distance_km=0.0,
            workout_count=0,
            time_minutes=0.0
        )
        
        default_monthly_data = WeeklyData(  # 同じスキーマを使用
            distance_km=0.0,
            workout_count=0,
            time_minutes=0.0
        )
        
        return DashboardStatsResponse(
            stats_cards=default_stats,
            weekly_chart=default_chart,
            monthly_chart=default_chart,
            recent_workouts=[],
            weekly_data=default_weekly_data,
            monthly_data=default_monthly_data
        )

@router.get("/ai-stats")
async def get_ai_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_from_token)
):
    """AI機能用の統計情報を取得"""
    
    try:
        logger.info(f"🔍 AI統計取得開始: user_id={current_user_id}")
        
        # 全ユーザー数
        total_users = db.query(func.count(User.id)).filter(
            User.is_active == True
        ).scalar() or 0
        
        # 現在のユーザーの練習記録数
        total_workouts = db.query(func.count(Workout.id)).filter(
            Workout.user_id == current_user_id
        ).scalar() or 0
        
        # データ蓄積期間を計算（最初の練習記録から現在まで）
        earliest_workout = db.query(func.min(Workout.date)).filter(
            Workout.user_id == current_user_id
        ).scalar()
        
        data_collection_days = 0
        if earliest_workout:
            today = datetime.now().date()
            data_collection_days = (today - earliest_workout).days
        
        logger.info(f"✅ AI統計取得成功: users={total_users}, workouts={total_workouts}, days={data_collection_days}")
        
        return {
            "total_users": total_users,
            "total_workouts": total_workouts,
            "data_collection_days": max(data_collection_days, 0)
        }
        
    except Exception as e:
        logger.error(f"❌ AI統計取得エラー: {e}")
        return {
            "total_users": 0,
            "total_workouts": 0,
            "data_collection_days": 0
        }
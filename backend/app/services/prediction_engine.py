from typing import Dict, List, Optional, Tuple, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.workout import Workout, WorkoutType
from app.schemas.prediction import TargetEventEnum


class PredictionEngine:
    """統計的回帰モデルによる予測エンジン"""

    # 種目間変換係数
    EVENT_COEFFICIENTS = {
        ("1500m", "800m"): 0.47,
        ("800m", "1500m"): 2.13,
        ("5000m", "1500m"): 0.28,
        ("1500m", "5000m"): 3.57,
        ("5000m", "10000m"): 2.1,
        ("10000m", "5000m"): 0.48,
        ("5km", "10000m"): 1.05,
        ("10000m", "5km"): 0.95,
        ("10km", "5km"): 0.48,
        ("5km", "10km"): 2.08,
        ("10km", "half"): 2.2,
        ("half", "10km"): 0.45,
        ("half", "full"): 2.1,
        ("full", "half"): 0.48,
        ("3000m", "1500m"): 0.48,
        ("1500m", "3000m"): 2.08,
        ("5000m", "3000m"): 0.58,
        ("3000m", "5000m"): 1.72,
    }

    def __init__(self, db: Session):
        self.db = db

    def predict_time(self, user_id: str, target_event: TargetEventEnum) -> Tuple[float, float, Dict[str, Any]]:
        """
        ユーザーの過去4週間の練習データから目標種目のタイムを予測

        Returns:
            Tuple[predicted_time_seconds, confidence_level, base_info]
        """
        # 1. 最近4週間の練習データ取得
        recent_date = date.today() - timedelta(days=28)
        workouts = self._get_recent_workouts(user_id, recent_date)

        if not workouts:
            raise ValueError("予測に十分な練習データがありません")

        # 2. 基礎情報計算
        weekly_mileage = self._calculate_weekly_mileage(workouts)
        speed_pace = self._calculate_average_speed_pace(workouts)
        workout_count = len(workouts)

        # 3. 基準タイム推定
        base_time = self._estimate_base_time(weekly_mileage, speed_pace, target_event)

        # 4. 信頼度計算
        confidence = self._calculate_confidence(workout_count, weekly_mileage)

        # 5. 基本情報
        base_info = {
            "weekly_mileage_km": round(weekly_mileage / 1000, 2),
            "speed_pace_per_km": round(speed_pace, 2) if speed_pace else None,
            "workout_count": workout_count,
            "analysis_period_days": 28
        }

        return base_time, confidence, base_info

    def _get_recent_workouts(self, user_id: str, since_date: date) -> List[Workout]:
        """最近の練習データを取得"""
        return (
            self.db.query(Workout)
            .join(WorkoutType)
            .filter(
                Workout.user_id == user_id,
                Workout.date >= since_date
            )
            .order_by(Workout.date.desc())
            .all()
        )

    def _calculate_weekly_mileage(self, workouts: List[Workout]) -> float:
        """週間走行距離を計算（メートル）"""
        total_distance = sum(
            workout.distance_meters or 0
            for workout in workouts
        )
        weeks = 4
        return total_distance / weeks

    def _calculate_average_speed_pace(self, workouts: List[Workout]) -> Optional[float]:
        """スピード練習の平均ペースを計算（秒/km）"""
        speed_workouts = [
            workout for workout in workouts
            if workout.workout_type.category in ["interval", "tempo", "race"]
            and workout.times_seconds
            and workout.distance_meters
        ]

        if not speed_workouts:
            return None

        total_pace = 0
        count = 0

        for workout in speed_workouts:
            if workout.times_seconds and workout.distance_meters:
                # 平均タイムを計算
                avg_time = sum(workout.times_seconds) / len(workout.times_seconds)
                # ペース（秒/km）に変換
                pace_per_km = (avg_time / workout.distance_meters) * 1000
                total_pace += pace_per_km
                count += 1

        return total_pace / count if count > 0 else None

    def _estimate_base_time(self, weekly_mileage: float, speed_pace: Optional[float], target_event: TargetEventEnum) -> float:
        """基準タイム推定"""
        # 種目距離マッピング（メートル）
        event_distances = {
            TargetEventEnum.event_800m: 800,
            TargetEventEnum.event_1500m: 1500,
            TargetEventEnum.event_3000m: 3000,
            TargetEventEnum.event_5000m: 5000,
            TargetEventEnum.event_10000m: 10000,
            TargetEventEnum.event_5km: 5000,
            TargetEventEnum.event_10km: 10000,
            TargetEventEnum.event_half: 21097.5,
            TargetEventEnum.event_full: 42195,
        }

        distance = event_distances[target_event]

        # スピード練習データがある場合は、それをベースに予測
        if speed_pace:
            # スピード練習のペースを調整して予測
            if distance <= 5000:  # 短距離〜中距離
                adjusted_pace = speed_pace * 1.05  # 5%遅く
            elif distance <= 21097.5:  # 中距離〜ハーフ
                adjusted_pace = speed_pace * 1.15  # 15%遅く
            else:  # フルマラソン
                adjusted_pace = speed_pace * 1.25  # 25%遅く

            return (adjusted_pace * distance) / 1000

        # スピード練習データがない場合は、走行距離から推定
        else:
            # 週間走行距離から基本ペースを推定（非常に簡易的）
            weekly_km = weekly_mileage / 1000

            if weekly_km < 20:
                base_pace = 360  # 6分/km
            elif weekly_km < 40:
                base_pace = 300  # 5分/km
            elif weekly_km < 60:
                base_pace = 270  # 4分30秒/km
            else:
                base_pace = 240  # 4分/km

            # 種目距離に応じてペース調整
            if distance <= 1500:
                race_pace = base_pace * 0.75
            elif distance <= 5000:
                race_pace = base_pace * 0.85
            elif distance <= 21097.5:
                race_pace = base_pace * 0.95
            else:
                race_pace = base_pace * 1.05

            return (race_pace * distance) / 1000

    def _calculate_confidence(self, workout_count: int, weekly_mileage: float) -> float:
        """信頼度を計算"""
        # 基本信頼度
        confidence = 0.5

        # 練習データ数による調整
        if workout_count >= 20:
            confidence += 0.3
        elif workout_count >= 10:
            confidence += 0.2
        elif workout_count >= 5:
            confidence += 0.1

        # 週間走行距離による調整
        weekly_km = weekly_mileage / 1000
        if weekly_km >= 50:
            confidence += 0.2
        elif weekly_km >= 30:
            confidence += 0.1
        elif weekly_km >= 20:
            confidence += 0.05

        return min(confidence, 1.0)

    def get_event_conversion_coefficient(self, from_event: str, to_event: str) -> Optional[float]:
        """種目間変換係数を取得"""
        return self.EVENT_COEFFICIENTS.get((from_event, to_event))
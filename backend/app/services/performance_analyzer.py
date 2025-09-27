"""
パフォーマンス分析サービス
ユーザーのパフォーマンスデータを分析し、トレンドや改善点を特定
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import logging

from app.models.user import User
from app.models.workout import Workout
from app.models.race import Race
from app.models.ai import PredictionResult

logger = logging.getLogger(__name__)


class PerformanceAnalyzer:
    """パフォーマンス分析クラス"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_user_performance(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """
        ユーザーのパフォーマンス分析を実行
        
        Args:
            user_id: ユーザーID
            period_days: 分析期間（日数）
            
        Returns:
            分析結果の辞書
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=period_days)
            
            # ワークアウトデータの分析
            workout_analysis = self._analyze_workouts(user_id, cutoff_date)
            
            # レースデータの分析
            race_analysis = self._analyze_races(user_id, cutoff_date)
            
            # 予測精度の分析
            prediction_analysis = self._analyze_predictions(user_id, cutoff_date)
            
            # 総合的なパフォーマンス指標の計算
            overall_metrics = self._calculate_overall_metrics(
                workout_analysis, race_analysis, prediction_analysis
            )
            
            return {
                "user_id": user_id,
                "analysis_period_days": period_days,
                "analysis_date": datetime.utcnow().isoformat(),
                "workout_analysis": workout_analysis,
                "race_analysis": race_analysis,
                "prediction_analysis": prediction_analysis,
                "overall_metrics": overall_metrics,
                "recommendations": self._generate_recommendations(overall_metrics)
            }
            
        except Exception as e:
            logger.error(f"Performance analysis failed for user {user_id}: {str(e)}")
            raise
    
    def _analyze_workouts(self, user_id: str, cutoff_date: datetime) -> Dict[str, Any]:
        """ワークアウトデータの分析"""
        workouts = self.db.query(Workout).filter(
            and_(
                Workout.user_id == user_id,
                Workout.date >= cutoff_date
            )
        ).all()
        
        if not workouts:
            return {"status": "no_data", "message": "No workout data available"}
        
        # 基本統計
        total_workouts = len(workouts)
        total_distance = sum(w.distance_meters for w in workouts if w.distance_meters)
        total_duration = sum(w.duration_seconds for w in workouts if w.duration_seconds)
        
        # ワークアウトタイプ別の分析
        workout_types = {}
        for workout in workouts:
            workout_type = workout.workout_type
            if workout_type not in workout_types:
                workout_types[workout_type] = {
                    "count": 0,
                    "total_distance": 0,
                    "total_duration": 0,
                    "avg_pace": 0
                }
            
            workout_types[workout_type]["count"] += 1
            if workout.distance_meters:
                workout_types[workout_type]["total_distance"] += workout.distance_meters
            if workout.duration_seconds:
                workout_types[workout_type]["total_duration"] += workout.duration_seconds
        
        # 平均ペースの計算
        for workout_type, data in workout_types.items():
            if data["total_distance"] > 0 and data["total_duration"] > 0:
                data["avg_pace"] = data["total_duration"] / (data["total_distance"] / 1000)  # 秒/km
        
        return {
            "total_workouts": total_workouts,
            "total_distance_meters": total_distance,
            "total_duration_seconds": total_duration,
            "avg_distance_per_workout": total_distance / total_workouts if total_workouts > 0 else 0,
            "avg_duration_per_workout": total_duration / total_workouts if total_workouts > 0 else 0,
            "workout_types": workout_types,
            "frequency_per_week": total_workouts / 4.3  # 約30日を週に換算
        }
    
    def _analyze_races(self, user_id: str, cutoff_date: datetime) -> Dict[str, Any]:
        """レースデータの分析"""
        races = self.db.query(Race).filter(
            and_(
                Race.user_id == user_id,
                Race.date >= cutoff_date
            )
        ).all()
        
        if not races:
            return {"status": "no_data", "message": "No race data available"}
        
        # 基本統計
        total_races = len(races)
        completed_races = [r for r in races if r.time_seconds]
        
        if not completed_races:
            return {
                "total_races": total_races,
                "completed_races": 0,
                "status": "no_completed_races"
            }
        
        # レースタイプ別の分析
        race_types = {}
        for race in completed_races:
            race_type = race.race_type.name if race.race_type else "unknown"
            if race_type not in race_types:
                race_types[race_type] = {
                    "count": 0,
                    "times": [],
                    "avg_time": 0,
                    "best_time": float('inf'),
                    "worst_time": 0
                }
            
            race_types[race_type]["count"] += 1
            race_types[race_type]["times"].append(race.time_seconds)
        
        # 統計の計算
        for race_type, data in race_types.items():
            if data["times"]:
                data["avg_time"] = sum(data["times"]) / len(data["times"])
                data["best_time"] = min(data["times"])
                data["worst_time"] = max(data["times"])
                data["improvement"] = data["worst_time"] - data["best_time"] if len(data["times"]) > 1 else 0
        
        return {
            "total_races": total_races,
            "completed_races": len(completed_races),
            "completion_rate": len(completed_races) / total_races if total_races > 0 else 0,
            "race_types": race_types
        }
    
    def _analyze_predictions(self, user_id: str, cutoff_date: datetime) -> Dict[str, Any]:
        """予測精度の分析"""
        predictions = self.db.query(PredictionResult).filter(
            and_(
                PredictionResult.user_id == user_id,
                PredictionResult.created_at >= cutoff_date
            )
        ).all()
        
        if not predictions:
            return {"status": "no_data", "message": "No prediction data available"}
        
        # 予測精度の計算
        accurate_predictions = 0
        total_predictions = len(predictions)
        prediction_errors = []
        
        for prediction in predictions:
            if prediction.actual_time_seconds and prediction.predicted_time_seconds:
                error = abs(prediction.actual_time_seconds - prediction.predicted_time_seconds)
                prediction_errors.append(error)
                
                # 10%以内の誤差を正確とみなす
                error_rate = error / prediction.actual_time_seconds
                if error_rate <= 0.1:
                    accurate_predictions += 1
        
        if prediction_errors:
            avg_error = sum(prediction_errors) / len(prediction_errors)
            max_error = max(prediction_errors)
            min_error = min(prediction_errors)
        else:
            avg_error = max_error = min_error = 0
        
        return {
            "total_predictions": total_predictions,
            "accurate_predictions": accurate_predictions,
            "accuracy_rate": accurate_predictions / total_predictions if total_predictions > 0 else 0,
            "avg_prediction_error_seconds": avg_error,
            "max_prediction_error_seconds": max_error,
            "min_prediction_error_seconds": min_error
        }
    
    def _calculate_overall_metrics(self, workout_analysis: Dict, race_analysis: Dict, prediction_analysis: Dict) -> Dict[str, Any]:
        """総合的なパフォーマンス指標の計算"""
        metrics = {
            "consistency_score": 0,
            "improvement_score": 0,
            "activity_level": "low",
            "performance_trend": "stable"
        }
        
        # 一貫性スコアの計算
        if workout_analysis.get("frequency_per_week", 0) > 3:
            metrics["consistency_score"] += 30
        elif workout_analysis.get("frequency_per_week", 0) > 2:
            metrics["consistency_score"] += 20
        elif workout_analysis.get("frequency_per_week", 0) > 1:
            metrics["consistency_score"] += 10
        
        # 改善スコアの計算
        if race_analysis.get("race_types"):
            for race_type, data in race_analysis["race_types"].items():
                if data.get("improvement", 0) > 0:
                    metrics["improvement_score"] += 20
        
        # 活動レベルの判定
        weekly_frequency = workout_analysis.get("frequency_per_week", 0)
        if weekly_frequency >= 5:
            metrics["activity_level"] = "high"
        elif weekly_frequency >= 3:
            metrics["activity_level"] = "moderate"
        elif weekly_frequency >= 1:
            metrics["activity_level"] = "low"
        else:
            metrics["activity_level"] = "very_low"
        
        # パフォーマンストレンドの判定
        if metrics["improvement_score"] > 40:
            metrics["performance_trend"] = "improving"
        elif metrics["improvement_score"] > 20:
            metrics["performance_trend"] = "slightly_improving"
        elif metrics["improvement_score"] < -20:
            metrics["performance_trend"] = "declining"
        
        return metrics
    
    def _generate_recommendations(self, overall_metrics: Dict[str, Any]) -> List[str]:
        """推奨事項の生成"""
        recommendations = []
        
        activity_level = overall_metrics.get("activity_level", "low")
        consistency_score = overall_metrics.get("consistency_score", 0)
        performance_trend = overall_metrics.get("performance_trend", "stable")
        
        if activity_level == "very_low":
            recommendations.append("ワークアウトの頻度を増やすことをお勧めします")
        elif activity_level == "low":
            recommendations.append("週3回以上のワークアウトを目標にしましょう")
        
        if consistency_score < 20:
            recommendations.append("より一貫したトレーニングスケジュールを維持しましょう")
        
        if performance_trend == "declining":
            recommendations.append("トレーニング強度や方法を見直すことをお勧めします")
        elif performance_trend == "improving":
            recommendations.append("現在のトレーニング方法を継続しましょう")
        
        if not recommendations:
            recommendations.append("現在のトレーニングを継続し、定期的な進捗確認を行いましょう")
        
        return recommendations

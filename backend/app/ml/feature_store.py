"""
特徴量ストア
機械学習用の特徴量を計算・保存・取得する機能
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.workout import Workout
from app.models.ai import FeatureStore as FeatureStoreModel


class FeatureStore:
    """特徴量ストアクラス"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_features(self, user_id: str, analysis_period_days: int = 30) -> Dict[str, Any]:
        """ユーザーの特徴量を計算"""
        try:
            # ワークアウトデータを取得
            workouts = self.get_user_workouts(user_id, analysis_period_days)
            
            if not workouts:
                raise ValueError("Insufficient training data")
            
            # 特徴量を計算
            features = self._calculate_basic_features(workouts)
            features.update(self._calculate_trend_features(workouts))
            features.update(self._calculate_intensity_features(workouts))
            features.update(self._calculate_consistency_features(workouts))
            
            return features
            
        except Exception as e:
            raise ValueError(f"Feature calculation failed: {str(e)}")
    
    def get_user_workouts(self, user_id: str, analysis_period_days: int) -> List[Dict]:
        """ユーザーのワークアウトデータを取得"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=analysis_period_days)
        
        workouts = self.db.query(Workout).filter(
            and_(
                Workout.user_id == user_id,
                Workout.date >= start_date,
                Workout.date <= end_date
            )
        ).order_by(Workout.date.desc()).all()
        
        return [
            {
                "id": workout.id,
                "user_id": workout.user_id,
                "distance_km": workout.distance_km,
                "duration_minutes": workout.duration_minutes,
                "avg_pace_min_per_km": workout.avg_pace_min_per_km,
                "avg_heart_rate": workout.avg_heart_rate,
                "max_heart_rate": workout.max_heart_rate,
                "calories_burned": workout.calories_burned,
                "elevation_gain_m": workout.elevation_gain_m,
                "date": workout.date,
                "created_at": workout.created_at
            }
            for workout in workouts
        ]
    
    def _calculate_basic_features(self, workouts: List[Dict]) -> Dict[str, Any]:
        """基本統計特徴量を計算"""
        distances = [w["distance_km"] for w in workouts if w["distance_km"] is not None]
        paces = [w["avg_pace_min_per_km"] for w in workouts if w["avg_pace_min_per_km"] is not None]
        durations = [w["duration_minutes"] for w in workouts if w["duration_minutes"] is not None]
        
        return {
            "avg_distance": np.mean(distances) if distances else 0,
            "avg_pace": np.mean(paces) if paces else 0,
            "avg_duration": np.mean(durations) if durations else 0,
            "total_distance": np.sum(distances) if distances else 0,
            "total_workouts": len(workouts),
            "training_frequency": len(workouts) / 30.0  # 30日間での頻度
        }
    
    def _calculate_trend_features(self, workouts: List[Dict]) -> Dict[str, Any]:
        """トレンド特徴量を計算"""
        if len(workouts) < 2:
            return {"distance_trend": 0, "pace_trend": 0, "duration_trend": 0}
        
        # 日付順にソート
        sorted_workouts = sorted(workouts, key=lambda x: x["date"])
        
        distances = [w["distance_km"] for w in sorted_workouts if w["distance_km"] is not None]
        paces = [w["avg_pace_min_per_km"] for w in sorted_workouts if w["avg_pace_min_per_km"] is not None]
        durations = [w["duration_minutes"] for w in sorted_workouts if w["duration_minutes"] is not None]
        
        # 線形回帰でトレンドを計算
        distance_trend = self._calculate_linear_trend(distances)
        pace_trend = self._calculate_linear_trend(paces)
        duration_trend = self._calculate_linear_trend(durations)
        
        return {
            "distance_trend": distance_trend,
            "pace_trend": pace_trend,
            "duration_trend": duration_trend
        }
    
    def _calculate_intensity_features(self, workouts: List[Dict]) -> Dict[str, Any]:
        """強度特徴量を計算"""
        heart_rates = [w["avg_heart_rate"] for w in workouts if w["avg_heart_rate"] is not None]
        calories = [w["calories_burned"] for w in workouts if w["calories_burned"] is not None]
        elevations = [w["elevation_gain_m"] for w in workouts if w["elevation_gain_m"] is not None]
        
        return {
            "avg_heart_rate": np.mean(heart_rates) if heart_rates else 0,
            "max_heart_rate": np.max(heart_rates) if heart_rates else 0,
            "avg_calories": np.mean(calories) if calories else 0,
            "total_elevation": np.sum(elevations) if elevations else 0,
            "intensity_score": self._calculate_intensity_score(workouts)
        }
    
    def _calculate_consistency_features(self, workouts: List[Dict]) -> Dict[str, Any]:
        """一貫性特徴量を計算"""
        distances = [w["distance_km"] for w in workouts if w["distance_km"] is not None]
        paces = [w["avg_pace_min_per_km"] for w in workouts if w["avg_pace_min_per_km"] is not None]
        
        distance_consistency = 1 - (np.std(distances) / np.mean(distances)) if distances and np.mean(distances) > 0 else 0
        pace_consistency = 1 - (np.std(paces) / np.mean(paces)) if paces and np.mean(paces) > 0 else 0
        
        return {
            "distance_consistency": max(0, min(1, distance_consistency)),
            "pace_consistency": max(0, min(1, pace_consistency)),
            "overall_consistency": (distance_consistency + pace_consistency) / 2
        }
    
    def _calculate_linear_trend(self, values: List[float]) -> float:
        """線形回帰でトレンドを計算"""
        if len(values) < 2:
            return 0
        
        x = np.arange(len(values))
        y = np.array(values)
        
        # 線形回帰
        slope = np.polyfit(x, y, 1)[0]
        return slope
    
    def _calculate_intensity_score(self, workouts: List[Dict]) -> float:
        """強度スコアを計算"""
        if not workouts:
            return 0
        
        total_score = 0
        for workout in workouts:
            score = 0
            
            # 距離スコア
            if workout["distance_km"]:
                score += min(workout["distance_km"] / 10.0, 1.0) * 0.4
            
            # 心拍数スコア
            if workout["avg_heart_rate"]:
                score += min(workout["avg_heart_rate"] / 180.0, 1.0) * 0.3
            
            # カロリースコア
            if workout["calories_burned"]:
                score += min(workout["calories_burned"] / 500.0, 1.0) * 0.3
            
            total_score += score
        
        return total_score / len(workouts)
    
    def save_features(self, user_id: str, features: Dict[str, Any]) -> str:
        """特徴量をデータベースに保存"""
        feature_data = FeatureStoreModel(
            id=f"features_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            user_id=user_id,
            features=features,
            calculated_at=datetime.now(),
            created_at=datetime.now()
        )
        
        self.db.add(feature_data)
        self.db.commit()
        
        return feature_data.id
    
    def get_latest_features(self, user_id: str) -> Optional[Dict[str, Any]]:
        """最新の特徴量を取得"""
        feature_data = self.db.query(FeatureStoreModel).filter(
            FeatureStoreModel.user_id == user_id
        ).order_by(FeatureStoreModel.calculated_at.desc()).first()
        
        return feature_data.features if feature_data else None

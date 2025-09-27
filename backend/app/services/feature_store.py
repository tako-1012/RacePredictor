"""
練習データから機械学習用の特徴量を抽出・管理するシステム

このモジュールには以下の機能が含まれます：
- ユーザーの特徴量計算（28種類）
- 特徴量の保存・取得
- 学習用データセット作成
- データの前処理とクリーニング
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.ai import FeatureStore
from app.models.workout import Workout
from app.models.race import RaceResult
from app.models.user_profile import UserProfile
from app.core.exceptions import DatabaseError, ValidationError

logger = logging.getLogger(__name__)


class FeatureStoreService:
    """特徴量管理サービスクラス"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_user_features(self, user_id: int, days_back: int = 365) -> Dict[str, Any]:
        """
        ユーザーの特徴量を計算
        
        Args:
            user_id: ユーザーID
            days_back: 遡る日数
            
        Returns:
            計算された特徴量辞書
        """
        try:
            logger.info(f"Calculating features for user {user_id}")
            
            # データ取得期間の設定
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # 練習データの取得
            workouts = self._get_user_workouts(user_id, start_date, end_date)
            race_results = self._get_user_race_results(user_id, start_date, end_date)
            user_profile = self._get_user_profile(user_id)
            
            if len(workouts) == 0:
                logger.warning(f"No workout data found for user {user_id}")
                return self._get_default_features(user_profile)
            
            # 特徴量計算
            features = {}
            
            # 基本統計特徴量
            features.update(self._calculate_basic_stats_features(workouts))
            
            # トレンド特徴量
            features.update(self._calculate_trend_features(workouts))
            
            # 強度分布特徴量
            features.update(self._calculate_intensity_features(workouts))
            
            # レース履歴特徴量
            features.update(self._calculate_race_features(race_results))
            
            # 生理指標特徴量
            features.update(self._calculate_physiological_features(user_profile, workouts))
            
            # 季節性特徴量
            features.update(self._calculate_seasonal_features(workouts))
            
            # メタデータ
            features.update({
                "total_workouts": len(workouts),
                "total_distance": sum(w.distance for w in workouts if w.distance),
                "avg_pace": np.mean([w.pace for w in workouts if w.pace]),
                "training_period_days": days_back,
                "calculation_date": datetime.now().isoformat(),
                "feature_version": "v1.0"
            })
            
            logger.info(f"Calculated {len(features)} features for user {user_id}")
            return features
            
        except Exception as e:
            logger.error(f"Failed to calculate features for user {user_id}: {str(e)}")
            raise ValidationError(f"特徴量の計算に失敗しました: {str(e)}")
    
    def _get_user_workouts(self, user_id: int, start_date: datetime, end_date: datetime) -> List[Workout]:
        """ユーザーの練習データを取得"""
        try:
            workouts = self.db.query(Workout).filter(
                Workout.user_id == user_id,
                Workout.date >= start_date,
                Workout.date <= end_date,
                Workout.distance.isnot(None),
                Workout.distance > 0
            ).order_by(Workout.date).all()
            return workouts
        except Exception as e:
            logger.error(f"Failed to get workouts for user {user_id}: {str(e)}")
            return []
    
    def _get_user_race_results(self, user_id: int, start_date: datetime, end_date: datetime) -> List[RaceResult]:
        """ユーザーのレース結果を取得"""
        try:
            race_results = self.db.query(RaceResult).filter(
                RaceResult.user_id == user_id,
                RaceResult.race_date >= start_date,
                RaceResult.race_date <= end_date,
                RaceResult.time.isnot(None),
                RaceResult.time > 0
            ).order_by(RaceResult.race_date).all()
            return race_results
        except Exception as e:
            logger.error(f"Failed to get race results for user {user_id}: {str(e)}")
            return []
    
    def _get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """ユーザープロフィールを取得"""
        try:
            profile = self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            return profile
        except Exception as e:
            logger.error(f"Failed to get user profile for user {user_id}: {str(e)}")
            return None
    
    def _calculate_basic_stats_features(self, workouts: List[Workout]) -> Dict[str, Any]:
        """基本統計特徴量の計算"""
        if not workouts:
            return {}
        
        distances = [w.distance for w in workouts if w.distance]
        paces = [w.pace for w in workouts if w.pace]
        
        return {
            "weekly_avg_distance": np.mean(distances) * 7 if distances else 0,
            "weekly_avg_frequency": len(workouts) / max(1, (workouts[-1].date - workouts[0].date).days / 7),
            "avg_pace": np.mean(paces) if paces else 0,
            "max_distance": np.max(distances) if distances else 0,
            "min_distance": np.min(distances) if distances else 0,
            "distance_std": np.std(distances) if distances else 0,
            "pace_std": np.std(paces) if paces else 0
        }
    
    def _calculate_trend_features(self, workouts: List[Workout]) -> Dict[str, Any]:
        """トレンド特徴量の計算"""
        if len(workouts) < 2:
            return {"distance_trend": 0, "pace_trend": 0, "intensity_trend": 0}
        
        # 時系列データの準備
        df = pd.DataFrame([{
            'date': w.date,
            'distance': w.distance or 0,
            'pace': w.pace or 0,
            'intensity': self._get_workout_intensity(w)
        } for w in workouts])
        
        df = df.sort_values('date')
        
        # 線形回帰でトレンドを計算
        x = np.arange(len(df))
        
        distance_trend = np.polyfit(x, df['distance'], 1)[0] if len(df) > 1 else 0
        pace_trend = np.polyfit(x, df['pace'], 1)[0] if len(df) > 1 else 0
        intensity_trend = np.polyfit(x, df['intensity'], 1)[0] if len(df) > 1 else 0
        
        return {
            "distance_trend": distance_trend,
            "pace_trend": pace_trend,
            "intensity_trend": intensity_trend
        }
    
    def _calculate_intensity_features(self, workouts: List[Workout]) -> Dict[str, Any]:
        """強度分布特徴量の計算"""
        if not workouts:
            return {}
        
        intensities = [self._get_workout_intensity(w) for w in workouts]
        
        easy_count = sum(1 for i in intensities if i < 0.6)
        tempo_count = sum(1 for i in intensities if 0.6 <= i < 0.8)
        interval_count = sum(1 for i in intensities if 0.8 <= i < 0.9)
        race_count = sum(1 for i in intensities if i >= 0.9)
        
        total = len(intensities)
        
        return {
            "easy_ratio": easy_count / total if total > 0 else 0,
            "tempo_ratio": tempo_count / total if total > 0 else 0,
            "interval_ratio": interval_count / total if total > 0 else 0,
            "race_ratio": race_count / total if total > 0 else 0,
            "avg_intensity": np.mean(intensities) if intensities else 0
        }
    
    def _calculate_race_features(self, race_results: List[RaceResult]) -> Dict[str, Any]:
        """レース履歴特徴量の計算"""
        if not race_results:
            return {
                "recent_race_count": 0,
                "avg_race_pace": 0,
                "race_improvement_trend": 0,
                "best_race_pace": 0
            }
        
        # 最近のレース（過去90日）
        recent_races = [r for r in race_results if (datetime.now() - r.race_date).days <= 90]
        
        # レースペースの計算
        race_paces = []
        for race in race_results:
            if race.distance and race.time:
                pace = race.time / race.distance  # 秒/km
                race_paces.append(pace)
        
        # 改善傾向の計算
        improvement_trend = 0
        if len(race_paces) >= 2:
            x = np.arange(len(race_paces))
            improvement_trend = np.polyfit(x, race_paces, 1)[0]
        
        return {
            "recent_race_count": len(recent_races),
            "avg_race_pace": np.mean(race_paces) if race_paces else 0,
            "race_improvement_trend": improvement_trend,
            "best_race_pace": np.min(race_paces) if race_paces else 0
        }
    
    def _calculate_physiological_features(self, profile: Optional[UserProfile], workouts: List[Workout]) -> Dict[str, Any]:
        """生理指標特徴量の計算"""
        features = {}
        
        if profile:
            # 年齢の計算
            if profile.birth_date:
                age = (datetime.now() - profile.birth_date).days / 365.25
                features["age"] = age
            
            # BMIの計算
            if profile.height and profile.weight:
                height_m = profile.height / 100
                features["bmi"] = profile.weight / (height_m ** 2)
            
            # 性別
            features["gender"] = 1 if profile.gender == "male" else 0
        
        # 心拍数データ（利用可能な場合）
        heart_rates = [w.avg_heart_rate for w in workouts if w.avg_heart_rate]
        features["avg_heart_rate"] = np.mean(heart_rates) if heart_rates else 0
        features["max_heart_rate"] = np.max(heart_rates) if heart_rates else 0
        
        return features
    
    def _calculate_seasonal_features(self, workouts: List[Workout]) -> Dict[str, Any]:
        """季節性特徴量の計算"""
        if not workouts:
            return {"consistency_score": 0, "seasonal_factor": 0}
        
        # 練習の一貫性スコア
        dates = [w.date for w in workouts]
        if len(dates) > 1:
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            consistency_score = 1 / (1 + np.std(intervals)) if intervals else 0
        else:
            consistency_score = 0
        
        # 季節要因（簡易版）
        current_month = datetime.now().month
        seasonal_factor = np.sin(2 * np.pi * current_month / 12)
        
        return {
            "consistency_score": consistency_score,
            "seasonal_factor": seasonal_factor
        }
    
    def _get_workout_intensity(self, workout: Workout) -> float:
        """練習強度の推定"""
        if workout.pace and workout.avg_heart_rate:
            # 心拍数ベースの強度推定
            max_hr = 220 - 30  # 簡易的な最大心拍数推定
            intensity = workout.avg_heart_rate / max_hr
            return min(1.0, max(0.0, intensity))
        elif workout.pace:
            # ペースベースの強度推定（簡易版）
            if workout.pace < 300:  # 5分/km未満
                return 0.9
            elif workout.pace < 360:  # 6分/km未満
                return 0.7
            elif workout.pace < 420:  # 7分/km未満
                return 0.5
            else:
                return 0.3
        else:
            return 0.5  # デフォルト値
    
    def _get_default_features(self, profile: Optional[UserProfile]) -> Dict[str, Any]:
        """デフォルト特徴量（データ不足時）"""
        features = {
            "weekly_avg_distance": 0,
            "weekly_avg_frequency": 0,
            "avg_pace": 0,
            "max_distance": 0,
            "min_distance": 0,
            "distance_std": 0,
            "pace_std": 0,
            "distance_trend": 0,
            "pace_trend": 0,
            "intensity_trend": 0,
            "easy_ratio": 0,
            "tempo_ratio": 0,
            "interval_ratio": 0,
            "race_ratio": 0,
            "avg_intensity": 0,
            "recent_race_count": 0,
            "avg_race_pace": 0,
            "race_improvement_trend": 0,
            "best_race_pace": 0,
            "consistency_score": 0,
            "seasonal_factor": 0,
            "total_workouts": 0,
            "total_distance": 0,
            "training_period_days": 0,
            "calculation_date": datetime.now().isoformat(),
            "feature_version": "v1.0"
        }
        
        if profile:
            if profile.birth_date:
                age = (datetime.now() - profile.birth_date).days / 365.25
                features["age"] = age
            if profile.height and profile.weight:
                height_m = profile.height / 100
                features["bmi"] = profile.weight / (height_m ** 2)
            features["gender"] = 1 if profile.gender == "male" else 0
        
        return features
    
    def save_features(self, user_id: int, features: Dict[str, Any]) -> FeatureStore:
        """
        特徴量をDBに保存
        
        Args:
            user_id: ユーザーID
            features: 特徴量辞書
            
        Returns:
            保存されたFeatureStoreオブジェクト
        """
        try:
            feature_store = FeatureStore(
                user_id=user_id,
                features=features,
                feature_version=features.get("feature_version", "v1.0"),
                total_workouts=features.get("total_workouts", 0),
                total_distance=features.get("total_distance", 0),
                avg_pace=features.get("avg_pace", 0),
                training_period_days=features.get("training_period_days", 0)
            )
            
            self.db.add(feature_store)
            self.db.commit()
            self.db.refresh(feature_store)
            
            logger.info(f"Features saved for user {user_id}")
            return feature_store
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to save features for user {user_id}: {str(e)}")
            raise DatabaseError(f"特徴量の保存に失敗しました: {str(e)}")
    
    def get_latest_features(self, user_id: int) -> Optional[FeatureStore]:
        """
        最新の特徴量を取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            最新のFeatureStoreオブジェクト
        """
        try:
            feature_store = self.db.query(FeatureStore).filter(
                FeatureStore.user_id == user_id
            ).order_by(FeatureStore.calculation_date.desc()).first()
            
            return feature_store
            
        except Exception as e:
            logger.error(f"Failed to get latest features for user {user_id}: {str(e)}")
            raise DatabaseError(f"特徴量の取得に失敗しました: {str(e)}")
    
    def get_features_for_training(self, limit: int = 1000) -> Tuple[List[Dict[str, Any]], List[float]]:
        """
        学習用データセット作成
        
        Args:
            limit: 取得件数制限
            
        Returns:
            (特徴量リスト, ターゲット値リスト)
        """
        try:
            # 特徴量とレース結果を結合して取得
            feature_stores = self.db.query(FeatureStore).limit(limit).all()
            
            X = []
            y = []
            
            for fs in feature_stores:
                # 特徴量の抽出
                features = fs.features
                if not features:
                    continue
                
                # 数値特徴量のみを抽出
                feature_vector = []
                feature_names = [
                    "weekly_avg_distance", "weekly_avg_frequency", "avg_pace",
                    "distance_trend", "pace_trend", "intensity_trend",
                    "easy_ratio", "tempo_ratio", "interval_ratio", "race_ratio",
                    "recent_race_count", "avg_race_pace", "race_improvement_trend",
                    "consistency_score", "seasonal_factor", "age", "bmi", "gender"
                ]
                
                for name in feature_names:
                    feature_vector.append(features.get(name, 0))
                
                X.append(feature_vector)
                
                # ターゲット値（最新のレース結果から）
                # 実際の実装では、レース結果とマッチングする必要がある
                y.append(features.get("avg_race_pace", 0))
            
            logger.info(f"Prepared training dataset: {len(X)} samples")
            return X, y
            
        except Exception as e:
            logger.error(f"Failed to prepare training dataset: {str(e)}")
            raise DatabaseError(f"学習データセットの作成に失敗しました: {str(e)}")
    
    def cleanup_old_features(self, days_to_keep: int = 90) -> int:
        """
        古い特徴量データをクリーンアップ
        
        Args:
            days_to_keep: 保持する日数
            
        Returns:
            削除されたレコード数
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            old_features = self.db.query(FeatureStore).filter(
                FeatureStore.calculation_date < cutoff_date
            ).all()
            
            deleted_count = len(old_features)
            for feature in old_features:
                self.db.delete(feature)
            
            self.db.commit()
            logger.info(f"Cleaned up {deleted_count} old feature records")
            return deleted_count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cleanup old features: {str(e)}")
            raise DatabaseError(f"古い特徴量データのクリーンアップに失敗しました: {str(e)}")

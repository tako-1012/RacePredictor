"""
各練習の個人への効果を分析するシステム

このモジュールには以下の機能が含まれます：
- 個別練習の効果分析
- 練習ストレス計算
- 適応予測
- 練習負荷最適化
- 個人化要素の考慮
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class AdaptationType(Enum):
    """適応タイプ"""
    AEROBIC = "aerobic"         # 有酸素能力
    ANAEROBIC = "anaerobic"     # 無酸素能力
    ENDURANCE = "endurance"     # 持久力
    SPEED = "speed"             # スピード
    RECOVERY = "recovery"       # 回復能力


@dataclass
class WorkoutEffect:
    """練習効果"""
    workout_id: int
    adaptation_type: AdaptationType
    effect_magnitude: float  # 効果の大きさ（0-1）
    adaptation_time_hours: int  # 適応に要する時間
    fatigue_level: float  # 疲労レベル（0-1）
    recovery_time_hours: int  # 回復に要する時間


@dataclass
class TrainingStress:
    """練習ストレス"""
    workout_id: int
    stress_score: float  # ストレススコア
    duration_minutes: int
    intensity: float
    volume_factor: float
    frequency_factor: float


@dataclass
class AdaptationPrediction:
    """適応予測"""
    adaptation_type: AdaptationType
    current_level: float
    predicted_level: float
    improvement_percentage: float
    time_to_adaptation_days: int


class EffectivenessAnalyzer:
    """練習効果分析システム"""
    
    def __init__(self):
        """初期化"""
        self.adaptation_rates = {
            AdaptationType.AEROBIC: 0.02,      # 2%/週
            AdaptationType.ANAEROBIC: 0.03,    # 3%/週
            AdaptationType.ENDURANCE: 0.015,   # 1.5%/週
            AdaptationType.SPEED: 0.025,       # 2.5%/週
            AdaptationType.RECOVERY: 0.01      # 1%/週
        }
        
        self.recovery_rates = {
            'beginner': 0.8,      # 80%の回復率
            'intermediate': 0.9,  # 90%の回復率
            'advanced': 0.95      # 95%の回復率
        }
        
        logger.info("EffectivenessAnalyzer initialized")
    
    def analyze_workout_effect(
        self,
        workout_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        historical_data: List[Dict[str, Any]]
    ) -> WorkoutEffect:
        """
        個別練習の効果分析
        
        Args:
            workout_data: 練習データ
            user_profile: ユーザープロフィール
            historical_data: 過去の練習データ
            
        Returns:
            練習効果分析結果
        """
        try:
            logger.info(f"Analyzing workout effect for workout {workout_data.get('id')}")
            
            # 練習種目の特定
            workout_type = workout_data.get('type', 'easy')
            distance = workout_data.get('distance', 0)
            pace = workout_data.get('pace', 300)
            duration = workout_data.get('duration_minutes', 0)
            
            # 適応タイプの決定
            adaptation_type = self._determine_adaptation_type(workout_type, pace, distance)
            
            # 効果の大きさを計算
            effect_magnitude = self._calculate_effect_magnitude(
                workout_data, user_profile, historical_data
            )
            
            # 適応時間の計算
            adaptation_time_hours = self._calculate_adaptation_time(
                adaptation_type, effect_magnitude, user_profile
            )
            
            # 疲労レベルの計算
            fatigue_level = self._calculate_fatigue_level(
                workout_data, user_profile
            )
            
            # 回復時間の計算
            recovery_time_hours = self._calculate_recovery_time(
                fatigue_level, user_profile
            )
            
            workout_effect = WorkoutEffect(
                workout_id=workout_data.get('id', 0),
                adaptation_type=adaptation_type,
                effect_magnitude=effect_magnitude,
                adaptation_time_hours=adaptation_time_hours,
                fatigue_level=fatigue_level,
                recovery_time_hours=recovery_time_hours
            )
            
            logger.info(f"Workout effect analyzed: {effect_magnitude:.3f} magnitude, {fatigue_level:.3f} fatigue")
            return workout_effect
            
        except Exception as e:
            logger.error(f"Failed to analyze workout effect: {str(e)}")
            raise RuntimeError(f"練習効果の分析に失敗しました: {str(e)}")
    
    def calculate_training_stress(
        self,
        workout_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> TrainingStress:
        """
        練習ストレス計算
        
        Args:
            workout_data: 練習データ
            user_profile: ユーザープロフィール
            
        Returns:
            練習ストレス
        """
        try:
            logger.info(f"Calculating training stress for workout {workout_data.get('id')}")
            
            # 基本パラメータ
            distance = workout_data.get('distance', 0)
            pace = workout_data.get('pace', 300)
            duration = workout_data.get('duration_minutes', 0)
            intensity = workout_data.get('intensity', 0.5)
            
            # ストレススコアの計算（簡易版）
            base_stress = distance * intensity
            
            # ペースによる調整
            pace_factor = self._calculate_pace_factor(pace, user_profile)
            
            # 継続時間による調整
            duration_factor = min(duration / 60, 2.0)  # 最大2時間
            
            # 総合ストレススコア
            stress_score = base_stress * pace_factor * duration_factor
            
            # ボリュームファクター
            volume_factor = distance / user_profile.get('weekly_distance', 20)
            
            # 頻度ファクター
            frequency_factor = 1.0 / user_profile.get('training_frequency', 4)
            
            training_stress = TrainingStress(
                workout_id=workout_data.get('id', 0),
                stress_score=stress_score,
                duration_minutes=duration,
                intensity=intensity,
                volume_factor=volume_factor,
                frequency_factor=frequency_factor
            )
            
            logger.info(f"Training stress calculated: {stress_score:.2f}")
            return training_stress
            
        except Exception as e:
            logger.error(f"Failed to calculate training stress: {str(e)}")
            raise RuntimeError(f"練習ストレスの計算に失敗しました: {str(e)}")
    
    def predict_adaptation(
        self,
        current_fitness: Dict[str, Any],
        planned_workouts: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        time_horizon_days: int = 30
    ) -> List[AdaptationPrediction]:
        """
        適応予測
        
        Args:
            current_fitness: 現在の体力レベル
            planned_workouts: 計画された練習
            user_profile: ユーザープロフィール
            time_horizon_days: 予測期間（日）
            
        Returns:
            適応予測リスト
        """
        try:
            logger.info(f"Predicting adaptation for {len(planned_workouts)} workouts")
            
            predictions = []
            
            # 各適応タイプについて予測
            for adaptation_type in AdaptationType:
                current_level = current_fitness.get(f'{adaptation_type.value}_level', 0.5)
                
                # 計画された練習から該当する適応タイプの効果を計算
                total_effect = 0
                adaptation_workouts = 0
                
                for workout in planned_workouts:
                    workout_effect = self.analyze_workout_effect(
                        workout, user_profile, []
                    )
                    
                    if workout_effect.adaptation_type == adaptation_type:
                        total_effect += workout_effect.effect_magnitude
                        adaptation_workouts += 1
                
                # 適応率の計算
                adaptation_rate = self.adaptation_rates[adaptation_type]
                user_multiplier = self._get_user_adaptation_multiplier(user_profile)
                
                # 予測レベルの計算
                weeks = time_horizon_days / 7
                predicted_improvement = total_effect * adaptation_rate * user_multiplier * weeks
                predicted_level = min(1.0, current_level + predicted_improvement)
                
                # 適応までの時間
                if adaptation_workouts > 0:
                    time_to_adaptation = adaptation_workouts * 2  # 簡易計算
                else:
                    time_to_adaptation = time_horizon_days
                
                prediction = AdaptationPrediction(
                    adaptation_type=adaptation_type,
                    current_level=current_level,
                    predicted_level=predicted_level,
                    improvement_percentage=(predicted_level - current_level) / current_level * 100,
                    time_to_adaptation_days=time_to_adaptation
                )
                
                predictions.append(prediction)
            
            logger.info(f"Adaptation prediction completed: {len(predictions)} predictions")
            return predictions
            
        except Exception as e:
            logger.error(f"Failed to predict adaptation: {str(e)}")
            raise RuntimeError(f"適応予測に失敗しました: {str(e)}")
    
    def optimize_training_load(
        self,
        current_load: Dict[str, Any],
        target_improvements: Dict[str, float],
        user_profile: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        練習負荷最適化
        
        Args:
            current_load: 現在の負荷
            target_improvements: 目標改善率
            user_profile: ユーザープロフィール
            constraints: 制約条件
            
        Returns:
            最適化された練習負荷
        """
        try:
            logger.info("Optimizing training load")
            
            # 現在の負荷レベル
            current_volume = current_load.get('weekly_distance', 20)
            current_frequency = current_load.get('training_frequency', 4)
            current_intensity = current_load.get('avg_intensity', 0.6)
            
            # 制約条件
            max_volume = constraints.get('max_weekly_distance', 50)
            max_frequency = constraints.get('max_training_frequency', 6)
            min_recovery_days = constraints.get('min_recovery_days', 1)
            
            # 最適化計算（簡易版）
            optimized_volume = min(current_volume * 1.1, max_volume)
            optimized_frequency = min(current_frequency + 1, max_frequency)
            
            # 強度の調整
            if target_improvements.get('speed', 0) > 0.1:
                optimized_intensity = min(current_intensity + 0.1, 0.9)
            else:
                optimized_intensity = current_intensity
            
            # 回復日の確保
            recovery_days = max(7 - optimized_frequency, min_recovery_days)
            
            optimized_load = {
                'weekly_distance': optimized_volume,
                'training_frequency': optimized_frequency,
                'avg_intensity': optimized_intensity,
                'recovery_days': recovery_days,
                'volume_increase': (optimized_volume - current_volume) / current_volume * 100,
                'intensity_increase': (optimized_intensity - current_intensity) / current_intensity * 100,
                'recommendations': self._generate_load_recommendations(
                    optimized_volume, optimized_frequency, optimized_intensity, user_profile
                )
            }
            
            logger.info(f"Training load optimized: {optimized_volume:.1f}km/week, {optimized_frequency} sessions")
            return optimized_load
            
        except Exception as e:
            logger.error(f"Failed to optimize training load: {str(e)}")
            raise RuntimeError(f"練習負荷の最適化に失敗しました: {str(e)}")
    
    def _determine_adaptation_type(self, workout_type: str, pace: float, distance: float) -> AdaptationType:
        """適応タイプの決定"""
        if workout_type in ['interval', 'speed']:
            return AdaptationType.SPEED
        elif workout_type in ['tempo', 'threshold']:
            return AdaptationType.ANAEROBIC
        elif workout_type in ['long', 'endurance']:
            return AdaptationType.ENDURANCE
        elif workout_type in ['easy', 'recovery']:
            return AdaptationType.RECOVERY
        else:
            return AdaptationType.AEROBIC
    
    def _calculate_effect_magnitude(
        self,
        workout_data: Dict[str, Any],
        user_profile: Dict[str, Any],
        historical_data: List[Dict[str, Any]]
    ) -> float:
        """効果の大きさを計算"""
        # 基本効果
        base_effect = workout_data.get('intensity', 0.5) * workout_data.get('distance', 0) / 10
        
        # ユーザーの経験レベルによる調整
        experience_level = user_profile.get('experience_level', 'intermediate')
        if experience_level == 'beginner':
            multiplier = 1.2  # 初心者は効果が大きい
        elif experience_level == 'advanced':
            multiplier = 0.8  # 上級者は効果が小さい
        else:
            multiplier = 1.0
        
        # 過去の類似練習との比較
        if historical_data:
            similar_workouts = [
                w for w in historical_data 
                if abs(w.get('distance', 0) - workout_data.get('distance', 0)) < 2
            ]
            if similar_workouts:
                avg_effect = np.mean([w.get('effectiveness', 0.5) for w in similar_workouts])
                base_effect = (base_effect + avg_effect) / 2
        
        return min(1.0, base_effect * multiplier)
    
    def _calculate_adaptation_time(
        self,
        adaptation_type: AdaptationType,
        effect_magnitude: float,
        user_profile: Dict[str, Any]
    ) -> int:
        """適応時間の計算"""
        base_time = {
            AdaptationType.AEROBIC: 48,
            AdaptationType.ANAEROBIC: 24,
            AdaptationType.ENDURANCE: 72,
            AdaptationType.SPEED: 12,
            AdaptationType.RECOVERY: 6
        }[adaptation_type]
        
        # 効果の大きさによる調整
        time_multiplier = 1.0 + (1.0 - effect_magnitude) * 0.5
        
        # ユーザーの回復能力による調整
        recovery_ability = user_profile.get('recovery_ability', 0.5)
        time_multiplier *= (1.0 - recovery_ability * 0.3)
        
        return int(base_time * time_multiplier)
    
    def _calculate_fatigue_level(
        self,
        workout_data: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> float:
        """疲労レベルの計算"""
        # 基本疲労
        base_fatigue = workout_data.get('intensity', 0.5) * workout_data.get('distance', 0) / 20
        
        # 継続時間による調整
        duration_hours = workout_data.get('duration_minutes', 0) / 60
        duration_factor = min(duration_hours / 2, 1.0)
        
        # ユーザーの疲労耐性による調整
        fatigue_tolerance = user_profile.get('fatigue_tolerance', 0.5)
        fatigue_multiplier = 1.0 - fatigue_tolerance * 0.3
        
        return min(1.0, base_fatigue * duration_factor * fatigue_multiplier)
    
    def _calculate_recovery_time(
        self,
        fatigue_level: float,
        user_profile: Dict[str, Any]
    ) -> int:
        """回復時間の計算"""
        base_recovery = fatigue_level * 24  # 基本24時間
        
        # ユーザーの回復能力による調整
        recovery_ability = user_profile.get('recovery_ability', 0.5)
        recovery_multiplier = 1.0 - recovery_ability * 0.5
        
        return int(base_recovery * recovery_multiplier)
    
    def _get_user_adaptation_multiplier(self, user_profile: Dict[str, Any]) -> float:
        """ユーザーの適応倍率を取得"""
        age = user_profile.get('age', 30)
        experience_level = user_profile.get('experience_level', 'intermediate')
        
        # 年齢による調整
        age_factor = max(0.5, 1.0 - (age - 20) * 0.01)
        
        # 経験レベルによる調整
        experience_factor = {
            'beginner': 1.2,
            'intermediate': 1.0,
            'advanced': 0.8
        }.get(experience_level, 1.0)
        
        return age_factor * experience_factor
    
    def _calculate_pace_factor(self, pace: float, user_profile: Dict[str, Any]) -> float:
        """ペースファクターの計算"""
        avg_pace = user_profile.get('avg_pace', 300)
        
        # ペースが速いほどストレスが高い
        pace_ratio = avg_pace / pace
        return min(2.0, max(0.5, pace_ratio))
    
    def _generate_load_recommendations(
        self,
        volume: float,
        frequency: int,
        intensity: float,
        user_profile: Dict[str, Any]
    ) -> List[str]:
        """負荷推奨事項の生成"""
        recommendations = []
        
        # ボリューム推奨
        if volume > user_profile.get('weekly_distance', 20) * 1.2:
            recommendations.append("週間走行距離を段階的に増やしてください")
        
        # 頻度推奨
        if frequency > 5:
            recommendations.append("練習頻度が高いため、十分な回復を確保してください")
        
        # 強度推奨
        if intensity > 0.8:
            recommendations.append("高強度練習が多いため、イージー走の割合を増やしてください")
        
        # 総合推奨
        if not recommendations:
            recommendations.append("現在の練習負荷は適切です")
        
        return recommendations

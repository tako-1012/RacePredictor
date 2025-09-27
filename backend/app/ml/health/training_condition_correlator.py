#!/usr/bin/env python3
"""
練習と体調の相関計算ロジック

このモジュールは以下の機能を提供します：
- 練習強度と体調指標の相関分析
- 疲労蓄積パターンの計算
- 回復時間の予測
- 最適な練習スケジュールの提案
- 体調悪化の早期検知
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta, date
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class TrainingConditionCorrelation:
    """練習と体調の相関データ"""
    workout_intensity: float
    fatigue_impact: float
    recovery_time_hours: int
    sleep_quality_change: float
    motivation_change: float
    energy_depletion: float
    stress_increase: float


@dataclass
class HealthPattern:
    """健康パターン分析結果"""
    pattern_type: str  # healthy, concerning, critical
    fatigue_trend: float  # 疲労トレンド
    recovery_efficiency: float  # 回復効率
    sleep_consistency: float  # 睡眠の一貫性
    motivation_stability: float  # モチベーションの安定性
    risk_factors: List[str]  # リスク要因
    recommendations: List[str]  # 推奨事項


class TrainingConditionCorrelator:
    """練習と体調の相関計算器"""
    
    def __init__(self):
        """初期化"""
        self.correlation_matrix = self._initialize_correlation_matrix()
        self.recovery_models = self._initialize_recovery_models()
        
        logger.info("TrainingConditionCorrelator initialized")
    
    def _initialize_correlation_matrix(self) -> Dict[str, Dict[str, float]]:
        """相関行列の初期化"""
        return {
            'workout_intensity': {
                'fatigue_level': 0.8,      # 練習強度と疲労度の相関
                'sleep_quality': 0.3,      # 練習強度と睡眠の質の相関
                'motivation': 0.4,         # 練習強度とモチベーションの相関
                'energy_level': -0.6,      # 練習強度とエネルギーレベルの相関（負）
                'stress_level': 0.5,       # 練習強度とストレスレベルの相関
                'recovery_time': 0.7       # 練習強度と回復時間の相関
            },
            'fatigue_level': {
                'sleep_quality': -0.4,     # 疲労度と睡眠の質の相関（負）
                'motivation': -0.6,        # 疲労度とモチベーションの相関（負）
                'energy_level': -0.8,      # 疲労度とエネルギーレベルの相関（負）
                'stress_level': 0.7,       # 疲労度とストレスレベルの相関
                'training_readiness': -0.9  # 疲労度と練習準備度の相関（負）
            },
            'sleep_quality': {
                'motivation': 0.5,         # 睡眠の質とモチベーションの相関
                'energy_level': 0.7,       # 睡眠の質とエネルギーレベルの相関
                'stress_level': -0.5,     # 睡眠の質とストレスレベルの相関（負）
                'training_readiness': 0.8, # 睡眠の質と練習準備度の相関
                'recovery_efficiency': 0.9 # 睡眠の質と回復効率の相関
            }
        }
    
    def _initialize_recovery_models(self) -> Dict[str, Dict[str, float]]:
        """回復モデルの初期化"""
        return {
            'fatigue_recovery': {
                'base_recovery_rate': 0.3,    # 基本回復率
                'sleep_multiplier': 1.5,      # 睡眠による回復倍率
                'rest_day_multiplier': 2.0,   # 休息日による回復倍率
                'age_factor': 0.95,           # 年齢による回復率調整
                'fitness_factor': 1.2         # フィットネスレベルによる回復率調整
            },
            'motivation_recovery': {
                'base_recovery_rate': 0.2,    # 基本回復率
                'success_multiplier': 1.8,   # 成功体験による回復倍率
                'social_multiplier': 1.3,    # 社会的サポートによる回復倍率
                'goal_progress_multiplier': 1.5  # 目標進捗による回復倍率
            },
            'energy_recovery': {
                'base_recovery_rate': 0.4,    # 基本回復率
                'nutrition_multiplier': 1.4,  # 栄養による回復倍率
                'hydration_multiplier': 1.2,  # 水分補給による回復倍率
                'sleep_multiplier': 1.6       # 睡眠による回復倍率
            }
        }
    
    def calculate_training_impact(
        self,
        workout_data: Dict[str, Any],
        current_condition: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> TrainingConditionCorrelation:
        """
        練習が体調に与える影響を計算
        
        Args:
            workout_data: 練習データ
            current_condition: 現在の体調
            user_profile: ユーザープロフィール
            
        Returns:
            練習と体調の相関データ
        """
        try:
            logger.info("Calculating training impact on condition")
            
            # 練習強度の取得
            workout_intensity = workout_data.get('intensity', 0.5)
            distance_km = workout_data.get('distance_km', 5.0)
            duration_minutes = workout_data.get('duration_minutes', 30)
            
            # 疲労への影響計算
            fatigue_impact = self._calculate_fatigue_impact(
                workout_intensity, distance_km, duration_minutes, user_profile
            )
            
            # 回復時間の計算
            recovery_time_hours = self._calculate_recovery_time(
                fatigue_impact, workout_intensity, user_profile
            )
            
            # 睡眠の質への影響
            sleep_quality_change = self._calculate_sleep_quality_change(
                workout_intensity, fatigue_impact
            )
            
            # モチベーションへの影響
            motivation_change = self._calculate_motivation_change(
                workout_intensity, workout_data.get('success_rate', 0.7)
            )
            
            # エネルギー消費
            energy_depletion = self._calculate_energy_depletion(
                workout_intensity, distance_km, duration_minutes
            )
            
            # ストレス増加
            stress_increase = self._calculate_stress_increase(
                workout_intensity, current_condition.get('stress_level', 5)
            )
            
            correlation = TrainingConditionCorrelation(
                workout_intensity=workout_intensity,
                fatigue_impact=fatigue_impact,
                recovery_time_hours=recovery_time_hours,
                sleep_quality_change=sleep_quality_change,
                motivation_change=motivation_change,
                energy_depletion=energy_depletion,
                stress_increase=stress_increase
            )
            
            logger.info(f"Training impact calculated: fatigue={fatigue_impact:.2f}, recovery={recovery_time_hours}h")
            return correlation
            
        except Exception as e:
            logger.error(f"Failed to calculate training impact: {e}")
            raise RuntimeError(f"練習影響計算に失敗しました: {e}")
    
    def predict_condition_after_workout(
        self,
        current_condition: Dict[str, Any],
        training_correlation: TrainingConditionCorrelation,
        hours_after_workout: int = 24
    ) -> Dict[str, Any]:
        """
        練習後の体調を予測
        
        Args:
            current_condition: 現在の体調
            training_correlation: 練習と体調の相関データ
            hours_after_workout: 練習後の経過時間
            
        Returns:
            予測される体調データ
        """
        try:
            logger.info(f"Predicting condition {hours_after_workout} hours after workout")
            
            predicted_condition = current_condition.copy()
            
            # 疲労度の予測
            current_fatigue = current_condition.get('fatigue_level', 5)
            fatigue_recovery = self._calculate_fatigue_recovery(
                training_correlation.fatigue_impact, hours_after_workout
            )
            predicted_fatigue = max(1, min(10, current_fatigue + fatigue_recovery))
            predicted_condition['fatigue_level'] = int(predicted_fatigue)
            
            # エネルギーレベルの予測
            current_energy = current_condition.get('energy_level', 7)
            energy_recovery = self._calculate_energy_recovery(
                training_correlation.energy_depletion, hours_after_workout
            )
            predicted_energy = max(1, min(10, current_energy - energy_recovery))
            predicted_condition['energy_level'] = int(predicted_energy)
            
            # モチベーションの予測
            current_motivation = current_condition.get('motivation_level', 7)
            motivation_change = training_correlation.motivation_change
            predicted_motivation = max(1, min(10, current_motivation + motivation_change))
            predicted_condition['motivation_level'] = int(predicted_motivation)
            
            # ストレスレベルの予測
            current_stress = current_condition.get('stress_level', 5)
            stress_change = training_correlation.stress_increase
            predicted_stress = max(1, min(10, current_stress + stress_change))
            predicted_condition['stress_level'] = int(predicted_stress)
            
            # 睡眠の質の予測
            current_sleep_quality = current_condition.get('sleep_quality_score', 7)
            sleep_change = training_correlation.sleep_quality_change
            predicted_sleep_quality = max(1, min(10, current_sleep_quality + sleep_change))
            predicted_condition['sleep_quality_score'] = int(predicted_sleep_quality)
            
            # トレーニング準備度の計算
            training_readiness = self._calculate_training_readiness(predicted_condition)
            predicted_condition['training_readiness'] = int(training_readiness)
            
            logger.info(f"Condition predicted: fatigue={predicted_fatigue:.1f}, energy={predicted_energy:.1f}")
            return predicted_condition
            
        except Exception as e:
            logger.error(f"Failed to predict condition: {e}")
            raise RuntimeError(f"体調予測に失敗しました: {e}")
    
    def analyze_health_patterns(
        self,
        condition_history: List[Dict[str, Any]],
        workout_history: List[Dict[str, Any]]
    ) -> HealthPattern:
        """
        健康パターンの分析
        
        Args:
            condition_history: 体調履歴
            workout_history: 練習履歴
            
        Returns:
            健康パターン分析結果
        """
        try:
            logger.info("Analyzing health patterns")
            
            if len(condition_history) < 7:
                raise ValueError("分析には最低7日間のデータが必要です")
            
            # 疲労トレンドの計算
            fatigue_trend = self._calculate_fatigue_trend(condition_history)
            
            # 回復効率の計算
            recovery_efficiency = self._calculate_recovery_efficiency(
                condition_history, workout_history
            )
            
            # 睡眠の一貫性の計算
            sleep_consistency = self._calculate_sleep_consistency(condition_history)
            
            # モチベーションの安定性の計算
            motivation_stability = self._calculate_motivation_stability(condition_history)
            
            # リスク要因の検出
            risk_factors = self._detect_risk_factors(
                fatigue_trend, recovery_efficiency, sleep_consistency, motivation_stability
            )
            
            # パターンタイプの判定
            pattern_type = self._determine_pattern_type(
                fatigue_trend, recovery_efficiency, len(risk_factors)
            )
            
            # 推奨事項の生成
            recommendations = self._generate_recommendations(
                pattern_type, risk_factors, fatigue_trend, recovery_efficiency
            )
            
            health_pattern = HealthPattern(
                pattern_type=pattern_type,
                fatigue_trend=fatigue_trend,
                recovery_efficiency=recovery_efficiency,
                sleep_consistency=sleep_consistency,
                motivation_stability=motivation_stability,
                risk_factors=risk_factors,
                recommendations=recommendations
            )
            
            logger.info(f"Health pattern analyzed: {pattern_type}")
            return health_pattern
            
        except Exception as e:
            logger.error(f"Failed to analyze health patterns: {e}")
            raise RuntimeError(f"健康パターン分析に失敗しました: {e}")
    
    def suggest_optimal_workout_schedule(
        self,
        current_condition: Dict[str, Any],
        user_profile: Dict[str, Any],
        days_ahead: int = 7
    ) -> List[Dict[str, Any]]:
        """
        最適な練習スケジュールを提案
        
        Args:
            current_condition: 現在の体調
            user_profile: ユーザープロフィール
            days_ahead: 先読み日数
            
        Returns:
            推奨練習スケジュール
        """
        try:
            logger.info(f"Suggesting optimal workout schedule for {days_ahead} days")
            
            schedule = []
            current_fatigue = current_condition.get('fatigue_level', 5)
            current_energy = current_condition.get('energy_level', 7)
            current_motivation = current_condition.get('motivation_level', 7)
            
            for day in range(days_ahead):
                # その日の体調を予測
                predicted_condition = self._predict_daily_condition(
                    current_condition, day, user_profile
                )
                
                # 練習の可否と強度を決定
                workout_suggestion = self._determine_workout_suggestion(
                    predicted_condition, user_profile
                )
                
                schedule.append({
                    'day': day + 1,
                    'date': (datetime.now() + timedelta(days=day)).date(),
                    'predicted_condition': predicted_condition,
                    'workout_suggestion': workout_suggestion
                })
            
            logger.info(f"Workout schedule suggested for {len(schedule)} days")
            return schedule
            
        except Exception as e:
            logger.error(f"Failed to suggest workout schedule: {e}")
            raise RuntimeError(f"練習スケジュール提案に失敗しました: {e}")
    
    def _calculate_fatigue_impact(
        self,
        intensity: float,
        distance_km: float,
        duration_minutes: int,
        user_profile: Dict[str, Any]
    ) -> float:
        """疲労への影響を計算"""
        # 基本疲労影響
        base_fatigue = intensity * distance_km * 0.1
        
        # 時間による調整
        time_factor = duration_minutes / 60.0
        
        # ユーザーの回復能力による調整
        recovery_ability = user_profile.get('recovery_ability', 0.5)
        fatigue_multiplier = 1.0 - recovery_ability * 0.3
        
        total_fatigue_impact = base_fatigue * time_factor * fatigue_multiplier
        
        return min(5.0, total_fatigue_impact)  # 最大5.0に制限
    
    def _calculate_recovery_time(
        self,
        fatigue_impact: float,
        intensity: float,
        user_profile: Dict[str, Any]
    ) -> int:
        """回復時間を計算"""
        # 基本回復時間
        base_recovery_hours = fatigue_impact * 12
        
        # 強度による調整
        intensity_factor = 1.0 + intensity * 0.5
        
        # ユーザーの回復能力による調整
        recovery_ability = user_profile.get('recovery_ability', 0.5)
        recovery_multiplier = 1.0 - recovery_ability * 0.4
        
        total_recovery_hours = base_recovery_hours * intensity_factor * recovery_multiplier
        
        return max(6, min(72, int(total_recovery_hours)))  # 6-72時間の範囲
    
    def _calculate_sleep_quality_change(
        self,
        intensity: float,
        fatigue_impact: float
    ) -> float:
        """睡眠の質への影響を計算"""
        # 高強度練習後は睡眠の質が向上
        if intensity > 0.7:
            return random.uniform(0.5, 1.5)
        elif intensity > 0.5:
            return random.uniform(0.0, 0.8)
        else:
            return random.uniform(-0.3, 0.3)
    
    def _calculate_motivation_change(
        self,
        intensity: float,
        success_rate: float
    ) -> float:
        """モチベーションへの影響を計算"""
        # 成功体験によるモチベーション向上
        success_boost = success_rate * 0.5
        
        # 強度による調整
        intensity_factor = intensity * 0.3
        
        total_change = success_boost + intensity_factor - 0.2
        
        return max(-1.0, min(2.0, total_change))
    
    def _calculate_energy_depletion(
        self,
        intensity: float,
        distance_km: float,
        duration_minutes: int
    ) -> float:
        """エネルギー消費を計算"""
        base_energy_depletion = intensity * distance_km * 0.2
        time_factor = duration_minutes / 60.0
        
        total_depletion = base_energy_depletion * time_factor
        
        return min(3.0, total_depletion)  # 最大3.0に制限
    
    def _calculate_stress_increase(
        self,
        intensity: float,
        current_stress: float
    ) -> float:
        """ストレス増加を計算"""
        # 高強度練習によるストレス増加
        intensity_stress = intensity * 0.5
        
        # 現在のストレスレベルによる調整
        stress_factor = current_stress / 10.0
        
        total_stress_increase = intensity_stress * (1.0 + stress_factor * 0.3)
        
        return max(0.0, min(2.0, total_stress_increase))
    
    def _calculate_fatigue_recovery(
        self,
        fatigue_impact: float,
        hours_after_workout: int
    ) -> float:
        """疲労回復を計算"""
        # 指数関数的な回復
        recovery_rate = 0.3  # 時間あたりの回復率
        recovery = fatigue_impact * np.exp(-recovery_rate * hours_after_workout)
        
        return -recovery  # 負の値で疲労減少を表現
    
    def _calculate_energy_recovery(
        self,
        energy_depletion: float,
        hours_after_workout: int
    ) -> float:
        """エネルギー回復を計算"""
        # 線形的な回復
        recovery_rate = 0.2  # 時間あたりの回復率
        recovery = min(energy_depletion, recovery_rate * hours_after_workout)
        
        return recovery
    
    def _calculate_training_readiness(
        self,
        condition: Dict[str, Any]
    ) -> float:
        """トレーニング準備度を計算"""
        fatigue_level = condition.get('fatigue_level', 5)
        energy_level = condition.get('energy_level', 7)
        sleep_quality = condition.get('sleep_quality_score', 7)
        stress_level = condition.get('stress_level', 5)
        
        # 各指標の重み付け
        readiness = (
            energy_level * 0.3 +
            sleep_quality * 0.25 +
            (10 - fatigue_level) * 0.25 +
            (10 - stress_level) * 0.2
        )
        
        return max(1, min(10, readiness))
    
    def _calculate_fatigue_trend(
        self,
        condition_history: List[Dict[str, Any]]
    ) -> float:
        """疲労トレンドを計算"""
        fatigue_levels = [c.get('fatigue_level', 5) for c in condition_history[-7:]]
        
        if len(fatigue_levels) < 3:
            return 0.0
        
        # 線形回帰でトレンドを計算
        x = np.arange(len(fatigue_levels))
        trend = np.polyfit(x, fatigue_levels, 1)[0]
        
        return trend / 10.0  # 正規化
    
    def _calculate_recovery_efficiency(
        self,
        condition_history: List[Dict[str, Any]],
        workout_history: List[Dict[str, Any]]
    ) -> float:
        """回復効率を計算"""
        if len(condition_history) < 3:
            return 0.5
        
        # 練習後の疲労回復速度を計算
        recovery_rates = []
        
        for i in range(1, len(condition_history)):
            prev_fatigue = condition_history[i-1].get('fatigue_level', 5)
            curr_fatigue = condition_history[i].get('fatigue_level', 5)
            
            if prev_fatigue > curr_fatigue:  # 疲労が減少
                recovery_rate = (prev_fatigue - curr_fatigue) / prev_fatigue
                recovery_rates.append(recovery_rate)
        
        if not recovery_rates:
            return 0.5
        
        return np.mean(recovery_rates)
    
    def _calculate_sleep_consistency(
        self,
        condition_history: List[Dict[str, Any]]
    ) -> float:
        """睡眠の一貫性を計算"""
        sleep_durations = [c.get('sleep_duration_hours', 7) for c in condition_history[-7:]]
        
        if len(sleep_durations) < 3:
            return 0.5
        
        # 標準偏差の逆数で一貫性を計算
        std_dev = np.std(sleep_durations)
        consistency = 1.0 / (1.0 + std_dev)
        
        return min(1.0, consistency)
    
    def _calculate_motivation_stability(
        self,
        condition_history: List[Dict[str, Any]]
    ) -> float:
        """モチベーションの安定性を計算"""
        motivation_levels = [c.get('motivation_level', 7) for c in condition_history[-7:]]
        
        if len(motivation_levels) < 3:
            return 0.5
        
        # 標準偏差の逆数で安定性を計算
        std_dev = np.std(motivation_levels)
        stability = 1.0 / (1.0 + std_dev)
        
        return min(1.0, stability)
    
    def _detect_risk_factors(
        self,
        fatigue_trend: float,
        recovery_efficiency: float,
        sleep_consistency: float,
        motivation_stability: float
    ) -> List[str]:
        """リスク要因を検出"""
        risk_factors = []
        
        if fatigue_trend > 0.3:
            risk_factors.append("疲労の蓄積傾向")
        
        if recovery_efficiency < 0.3:
            risk_factors.append("回復効率の低下")
        
        if sleep_consistency < 0.5:
            risk_factors.append("睡眠パターンの不安定")
        
        if motivation_stability < 0.5:
            risk_factors.append("モチベーションの不安定")
        
        return risk_factors
    
    def _determine_pattern_type(
        self,
        fatigue_trend: float,
        recovery_efficiency: float,
        risk_factor_count: int
    ) -> str:
        """パターンタイプを判定"""
        if risk_factor_count >= 3 or fatigue_trend > 0.5:
            return "critical"
        elif risk_factor_count >= 2 or recovery_efficiency < 0.4:
            return "concerning"
        else:
            return "healthy"
    
    def _generate_recommendations(
        self,
        pattern_type: str,
        risk_factors: List[str],
        fatigue_trend: float,
        recovery_efficiency: float
    ) -> List[str]:
        """推奨事項を生成"""
        recommendations = []
        
        if pattern_type == "critical":
            recommendations.append("練習を一時的に中止し、医師に相談してください")
            recommendations.append("十分な休息と栄養補給を心がけてください")
        elif pattern_type == "concerning":
            recommendations.append("練習強度を下げ、回復を優先してください")
            recommendations.append("睡眠時間を増やし、ストレス管理を改善してください")
        else:
            recommendations.append("現在の練習パターンを維持してください")
            recommendations.append("定期的な体調チェックを継続してください")
        
        # リスク要因別の推奨事項
        for risk_factor in risk_factors:
            if "疲労の蓄積" in risk_factor:
                recommendations.append("休息日を増やし、軽い練習に変更してください")
            elif "回復効率" in risk_factor:
                recommendations.append("睡眠の質を改善し、栄養バランスを見直してください")
            elif "睡眠パターン" in risk_factor:
                recommendations.append("規則正しい就寝・起床時間を設定してください")
            elif "モチベーション" in risk_factor:
                recommendations.append("小さな目標を設定し、達成感を得られるようにしてください")
        
        return recommendations
    
    def _predict_daily_condition(
        self,
        current_condition: Dict[str, Any],
        days_ahead: int,
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """日次の体調を予測"""
        predicted = current_condition.copy()
        
        # 基本的な回復を考慮
        recovery_factor = user_profile.get('recovery_ability', 0.5)
        
        # 疲労度の予測
        current_fatigue = predicted.get('fatigue_level', 5)
        fatigue_recovery = recovery_factor * days_ahead * 0.5
        predicted['fatigue_level'] = max(1, min(10, int(current_fatigue - fatigue_recovery)))
        
        # エネルギーレベルの予測
        current_energy = predicted.get('energy_level', 7)
        energy_recovery = recovery_factor * days_ahead * 0.3
        predicted['energy_level'] = max(1, min(10, int(current_energy + energy_recovery)))
        
        return predicted
    
    def _determine_workout_suggestion(
        self,
        predicted_condition: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """練習提案を決定"""
        fatigue_level = predicted_condition.get('fatigue_level', 5)
        energy_level = predicted_condition.get('energy_level', 7)
        training_readiness = predicted_condition.get('training_readiness', 7)
        
        if training_readiness < 4 or fatigue_level > 7:
            return {
                'recommended': False,
                'reason': '体調不良のため休息を推奨',
                'intensity': 0.0,
                'workout_type': 'rest'
            }
        elif training_readiness >= 8 and energy_level >= 7:
            return {
                'recommended': True,
                'reason': '体調良好、高強度練習可能',
                'intensity': 0.8,
                'workout_type': 'high_intensity'
            }
        elif training_readiness >= 6:
            return {
                'recommended': True,
                'reason': '中程度の練習を推奨',
                'intensity': 0.6,
                'workout_type': 'moderate'
            }
        else:
            return {
                'recommended': True,
                'reason': '軽い練習を推奨',
                'intensity': 0.4,
                'workout_type': 'easy'
            }


# 使用例とテスト関数
def test_correlation_logic():
    """相関ロジックのテスト"""
    correlator = TrainingConditionCorrelator()
    
    # テストデータ
    workout_data = {
        'intensity': 0.8,
        'distance_km': 10.0,
        'duration_minutes': 45,
        'success_rate': 0.8
    }
    
    current_condition = {
        'fatigue_level': 5,
        'energy_level': 7,
        'motivation_level': 7,
        'stress_level': 5,
        'sleep_quality_score': 7
    }
    
    user_profile = {
        'recovery_ability': 0.7,
        'fitness_level': 'intermediate'
    }
    
    # 練習影響の計算
    correlation = correlator.calculate_training_impact(
        workout_data, current_condition, user_profile
    )
    
    print(f"練習強度: {correlation.workout_intensity}")
    print(f"疲労影響: {correlation.fatigue_impact:.2f}")
    print(f"回復時間: {correlation.recovery_time_hours}時間")
    print(f"モチベーション変化: {correlation.motivation_change:.2f}")
    
    # 練習後の体調予測
    predicted_condition = correlator.predict_condition_after_workout(
        current_condition, correlation, hours_after_workout=24
    )
    
    print(f"\n24時間後の予測体調:")
    print(f"疲労度: {predicted_condition['fatigue_level']}")
    print(f"エネルギーレベル: {predicted_condition['energy_level']}")
    print(f"モチベーション: {predicted_condition['motivation_level']}")


if __name__ == "__main__":
    test_correlation_logic()

"""
ユーザーの調子とコンディションを分析するシステム

このモジュールには以下の機能が含まれます：
- 現在の調子分析
- オーバートレーニング検出
- 練習準備度計算
- 回復時間予測
- 異常検知とアラート機能
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from enum import Enum
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class ConditionLevel(Enum):
    """コンディションレベル"""
    EXCELLENT = "excellent"     # 優秀
    GOOD = "good"              # 良好
    FAIR = "fair"              # 普通
    POOR = "poor"              # 不良
    CRITICAL = "critical"      # 危険


class AlertType(Enum):
    """アラートタイプ"""
    OVERTRAINING = "overtraining"      # オーバートレーニング
    FATIGUE_ACCUMULATION = "fatigue"   # 疲労蓄積
    RECOVERY_INSUFFICIENT = "recovery" # 回復不足
    PERFORMANCE_DECLINE = "performance" # パフォーマンス低下
    HEALTH_RISK = "health_risk"        # 健康リスク


@dataclass
class ConditionAnalysis:
    """コンディション分析結果"""
    overall_condition: ConditionLevel
    fatigue_score: float  # 疲労スコア（0-1）
    recovery_score: float  # 回復スコア（0-1）
    readiness_score: float  # 練習準備度（0-1）
    stress_level: float  # ストレスレベル（0-1）
    sleep_quality: float  # 睡眠質（0-1）
    performance_trend: float  # パフォーマンストレンド
    alerts: List[AlertType]
    recommendations: List[str]


@dataclass
class RecoveryPrediction:
    """回復予測"""
    current_fatigue: float
    predicted_recovery_time_hours: int
    optimal_next_workout_time: datetime
    recovery_curve: List[float]  # 回復曲線


class ConditionAnalyzer:
    """調子分析エンジン"""
    
    def __init__(self):
        """初期化"""
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.baseline_metrics = {}
        
        logger.info("ConditionAnalyzer initialized")
    
    def analyze_condition(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]],
        health_metrics: Dict[str, Any]
    ) -> ConditionAnalysis:
        """
        現在の調子分析
        
        Args:
            user_data: ユーザーデータ
            recent_workouts: 最近の練習データ
            health_metrics: 健康指標
            
        Returns:
            コンディション分析結果
        """
        try:
            logger.info("Analyzing user condition")
            
            # 各指標の計算
            fatigue_score = self._calculate_fatigue_score(user_data, recent_workouts)
            recovery_score = self._calculate_recovery_score(user_data, health_metrics)
            readiness_score = self._calculate_readiness_score(fatigue_score, recovery_score)
            stress_level = self._calculate_stress_level(user_data, health_metrics)
            sleep_quality = health_metrics.get('sleep_quality', 0.7)
            performance_trend = self._calculate_performance_trend(recent_workouts)
            
            # アラートの検出
            alerts = self._detect_alerts(
                fatigue_score, recovery_score, readiness_score, 
                stress_level, sleep_quality, performance_trend
            )
            
            # 総合コンディションの判定
            overall_condition = self._determine_overall_condition(
                readiness_score, fatigue_score, len(alerts)
            )
            
            # 推奨事項の生成
            recommendations = self._generate_recommendations(
                overall_condition, alerts, fatigue_score, recovery_score
            )
            
            condition_analysis = ConditionAnalysis(
                overall_condition=overall_condition,
                fatigue_score=fatigue_score,
                recovery_score=recovery_score,
                readiness_score=readiness_score,
                stress_level=stress_level,
                sleep_quality=sleep_quality,
                performance_trend=performance_trend,
                alerts=alerts,
                recommendations=recommendations
            )
            
            logger.info(f"Condition analysis completed: {overall_condition.value}")
            return condition_analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze condition: {str(e)}")
            raise RuntimeError(f"調子分析に失敗しました: {str(e)}")
    
    def detect_overtraining(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]],
        health_metrics: Dict[str, Any]
    ) -> Tuple[bool, float, List[str]]:
        """
        オーバートレーニング検出
        
        Args:
            user_data: ユーザーデータ
            recent_workouts: 最近の練習データ
            health_metrics: 健康指標
            
        Returns:
            (オーバートレーニング判定, リスクスコア, 症状リスト)
        """
        try:
            logger.info("Detecting overtraining")
            
            symptoms = []
            risk_score = 0.0
            
            # 練習負荷の分析
            if len(recent_workouts) >= 7:
                weekly_distance = sum(w.get('distance', 0) for w in recent_workouts[-7:])
                avg_weekly_distance = user_data.get('avg_weekly_distance', 20)
                
                if weekly_distance > avg_weekly_distance * 1.5:
                    risk_score += 0.3
                    symptoms.append("週間走行距離が通常の1.5倍を超えている")
            
            # 練習強度の分析
            if len(recent_workouts) >= 7:
                high_intensity_ratio = sum(1 for w in recent_workouts[-7:] if w.get('intensity', 0) > 0.8) / len(recent_workouts[-7:])
                
                if high_intensity_ratio > 0.4:
                    risk_score += 0.2
                    symptoms.append("高強度練習の割合が40%を超えている")
            
            # パフォーマンスの低下
            if len(recent_workouts) >= 14:
                recent_performance = np.mean([w.get('pace', 300) for w in recent_workouts[-7:]])
                previous_performance = np.mean([w.get('pace', 300) for w in recent_workouts[-14:-7]])
                
                if recent_performance > previous_performance * 1.05:  # 5%以上遅い
                    risk_score += 0.3
                    symptoms.append("最近のパフォーマンスが低下している")
            
            # 主観的疲労度
            subjective_fatigue = health_metrics.get('subjective_fatigue', 0.5)
            if subjective_fatigue > 0.8:
                risk_score += 0.2
                symptoms.append("主観的疲労度が高い")
            
            # 睡眠質の低下
            sleep_quality = health_metrics.get('sleep_quality', 0.7)
            if sleep_quality < 0.5:
                risk_score += 0.2
                symptoms.append("睡眠質が低下している")
            
            # 心拍変動の分析（利用可能な場合）
            hrv = health_metrics.get('hrv', None)
            if hrv and hrv < user_data.get('baseline_hrv', 30):
                risk_score += 0.3
                symptoms.append("心拍変動が低下している")
            
            # オーバートレーニング判定
            is_overtraining = risk_score > 0.6
            
            logger.info(f"Overtraining detection completed: {is_overtraining}, risk: {risk_score:.2f}")
            return is_overtraining, risk_score, symptoms
            
        except Exception as e:
            logger.error(f"Failed to detect overtraining: {str(e)}")
            raise RuntimeError(f"オーバートレーニング検出に失敗しました: {str(e)}")
    
    def calculate_readiness(
        self,
        fatigue_score: float,
        recovery_score: float,
        sleep_quality: float,
        stress_level: float
    ) -> float:
        """
        練習準備度計算
        
        Args:
            fatigue_score: 疲労スコア
            recovery_score: 回復スコア
            sleep_quality: 睡眠質
            stress_level: ストレスレベル
            
        Returns:
            練習準備度（0-1）
        """
        try:
            # 基本準備度の計算
            base_readiness = (recovery_score + sleep_quality) / 2
            
            # 疲労による調整
            fatigue_adjustment = 1.0 - fatigue_score * 0.5
            
            # ストレスによる調整
            stress_adjustment = 1.0 - stress_level * 0.3
            
            # 総合準備度
            readiness = base_readiness * fatigue_adjustment * stress_adjustment
            
            return max(0.0, min(1.0, readiness))
            
        except Exception as e:
            logger.error(f"Failed to calculate readiness: {str(e)}")
            return 0.5  # デフォルト値
    
    def predict_recovery_time(
        self,
        current_fatigue: float,
        user_profile: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> RecoveryPrediction:
        """
        回復時間予測
        
        Args:
            current_fatigue: 現在の疲労レベル
            user_profile: ユーザープロフィール
            recent_workouts: 最近の練習データ
            
        Returns:
            回復予測
        """
        try:
            logger.info("Predicting recovery time")
            
            # 基本回復時間の計算
            base_recovery_hours = current_fatigue * 48  # 最大48時間
            
            # ユーザーの回復能力による調整
            recovery_ability = user_profile.get('recovery_ability', 0.5)
            recovery_multiplier = 1.0 - recovery_ability * 0.5
            
            # 最近の練習負荷による調整
            if recent_workouts:
                recent_load = sum(w.get('distance', 0) * w.get('intensity', 0.5) for w in recent_workouts[-3:])
                avg_load = user_profile.get('avg_weekly_distance', 20) / 7 * 0.6
                
                if recent_load > avg_load * 2:
                    recovery_multiplier *= 1.5  # 回復時間を延長
            
            # 予測回復時間
            predicted_recovery_hours = int(base_recovery_hours * recovery_multiplier)
            
            # 最適な次の練習時間
            optimal_next_workout = datetime.now() + timedelta(hours=predicted_recovery_hours)
            
            # 回復曲線の生成
            recovery_curve = self._generate_recovery_curve(current_fatigue, predicted_recovery_hours)
            
            recovery_prediction = RecoveryPrediction(
                current_fatigue=current_fatigue,
                predicted_recovery_time_hours=predicted_recovery_hours,
                optimal_next_workout_time=optimal_next_workout,
                recovery_curve=recovery_curve
            )
            
            logger.info(f"Recovery prediction completed: {predicted_recovery_hours} hours")
            return recovery_prediction
            
        except Exception as e:
            logger.error(f"Failed to predict recovery time: {str(e)}")
            raise RuntimeError(f"回復時間予測に失敗しました: {str(e)}")
    
    def _calculate_fatigue_score(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> float:
        """疲労スコアの計算"""
        if not recent_workouts:
            return 0.0
        
        # 最近7日間の練習負荷
        recent_load = 0
        for workout in recent_workouts[-7:]:
            distance = workout.get('distance', 0)
            intensity = workout.get('intensity', 0.5)
            recent_load += distance * intensity
        
        # 平均負荷との比較
        avg_weekly_load = user_data.get('avg_weekly_distance', 20) * 0.6
        fatigue_ratio = recent_load / avg_weekly_load if avg_weekly_load > 0 else 1.0
        
        # 疲労スコアの計算（0-1）
        fatigue_score = min(1.0, fatigue_ratio * 0.5)
        
        return fatigue_score
    
    def _calculate_recovery_score(
        self,
        user_data: Dict[str, Any],
        health_metrics: Dict[str, Any]
    ) -> float:
        """回復スコアの計算"""
        # 睡眠質
        sleep_quality = health_metrics.get('sleep_quality', 0.7)
        
        # 主観的疲労度（逆転）
        subjective_fatigue = health_metrics.get('subjective_fatigue', 0.5)
        subjective_recovery = 1.0 - subjective_fatigue
        
        # 心拍変動（利用可能な場合）
        hrv = health_metrics.get('hrv', None)
        hrv_score = 0.5
        if hrv:
            baseline_hrv = user_data.get('baseline_hrv', 30)
            hrv_score = min(1.0, hrv / baseline_hrv)
        
        # 総合回復スコア
        recovery_score = (sleep_quality + subjective_recovery + hrv_score) / 3
        
        return recovery_score
    
    def _calculate_readiness_score(
        self,
        fatigue_score: float,
        recovery_score: float
    ) -> float:
        """練習準備度の計算"""
        # 疲労と回復のバランス
        readiness = recovery_score - fatigue_score * 0.5
        
        return max(0.0, min(1.0, readiness))
    
    def _calculate_stress_level(
        self,
        user_data: Dict[str, Any],
        health_metrics: Dict[str, Any]
    ) -> float:
        """ストレスレベルの計算"""
        # 主観的ストレス
        subjective_stress = health_metrics.get('subjective_stress', 0.5)
        
        # 練習負荷によるストレス
        training_stress = user_data.get('training_stress', 0.5)
        
        # 総合ストレスレベル
        stress_level = (subjective_stress + training_stress) / 2
        
        return stress_level
    
    def _calculate_performance_trend(
        self,
        recent_workouts: List[Dict[str, Any]]
    ) -> float:
        """パフォーマンストレンドの計算"""
        if len(recent_workouts) < 4:
            return 0.0
        
        # 最近のパフォーマンス（ペース）
        recent_paces = [w.get('pace', 300) for w in recent_workouts[-4:]]
        
        # 線形回帰でトレンドを計算
        x = np.arange(len(recent_paces))
        trend = np.polyfit(x, recent_paces, 1)[0]
        
        # トレンドを正規化（負の値は改善、正の値は悪化）
        normalized_trend = -trend / 10  # 10秒/kmの変化を1.0の変化に正規化
        
        return max(-1.0, min(1.0, normalized_trend))
    
    def _detect_alerts(
        self,
        fatigue_score: float,
        recovery_score: float,
        readiness_score: float,
        stress_level: float,
        sleep_quality: float,
        performance_trend: float
    ) -> List[AlertType]:
        """アラートの検出"""
        alerts = []
        
        # オーバートレーニングアラート
        if fatigue_score > 0.8 and recovery_score < 0.3:
            alerts.append(AlertType.OVERTRAINING)
        
        # 疲労蓄積アラート
        if fatigue_score > 0.7:
            alerts.append(AlertType.FATIGUE_ACCUMULATION)
        
        # 回復不足アラート
        if recovery_score < 0.4:
            alerts.append(AlertType.RECOVERY_INSUFFICIENT)
        
        # パフォーマンス低下アラート
        if performance_trend < -0.3:
            alerts.append(AlertType.PERFORMANCE_DECLINE)
        
        # 健康リスクアラート
        if stress_level > 0.8 and sleep_quality < 0.4:
            alerts.append(AlertType.HEALTH_RISK)
        
        return alerts
    
    def _determine_overall_condition(
        self,
        readiness_score: float,
        fatigue_score: float,
        alert_count: int
    ) -> ConditionLevel:
        """総合コンディションの判定"""
        if alert_count >= 3 or readiness_score < 0.2:
            return ConditionLevel.CRITICAL
        elif alert_count >= 2 or readiness_score < 0.4:
            return ConditionLevel.POOR
        elif alert_count >= 1 or readiness_score < 0.6:
            return ConditionLevel.FAIR
        elif readiness_score >= 0.8 and fatigue_score < 0.3:
            return ConditionLevel.EXCELLENT
        else:
            return ConditionLevel.GOOD
    
    def _generate_recommendations(
        self,
        overall_condition: ConditionLevel,
        alerts: List[AlertType],
        fatigue_score: float,
        recovery_score: float
    ) -> List[str]:
        """推奨事項の生成"""
        recommendations = []
        
        if overall_condition == ConditionLevel.CRITICAL:
            recommendations.append("練習を中止し、医師に相談してください")
        elif overall_condition == ConditionLevel.POOR:
            recommendations.append("練習強度を大幅に下げ、回復を優先してください")
        elif overall_condition == ConditionLevel.FAIR:
            recommendations.append("練習強度を調整し、十分な回復を確保してください")
        
        # アラート別の推奨事項
        for alert in alerts:
            if alert == AlertType.OVERTRAINING:
                recommendations.append("オーバートレーニングの兆候があります。練習を減らしてください")
            elif alert == AlertType.FATIGUE_ACCUMULATION:
                recommendations.append("疲労が蓄積しています。イージー走に変更してください")
            elif alert == AlertType.RECOVERY_INSUFFICIENT:
                recommendations.append("回復が不十分です。休養日を増やしてください")
            elif alert == AlertType.PERFORMANCE_DECLINE:
                recommendations.append("パフォーマンスが低下しています。練習負荷を見直してください")
            elif alert == AlertType.HEALTH_RISK:
                recommendations.append("健康リスクが高まっています。ストレス管理を改善してください")
        
        if not recommendations:
            recommendations.append("コンディションは良好です。現在の練習を継続してください")
        
        return recommendations
    
    def _generate_recovery_curve(
        self,
        current_fatigue: float,
        recovery_hours: int
    ) -> List[float]:
        """回復曲線の生成"""
        # 指数関数的な回復曲線
        hours = list(range(0, recovery_hours + 1, 2))  # 2時間間隔
        curve = []
        
        for hour in hours:
            # 指数関数的な回復
            recovery_progress = 1.0 - current_fatigue * np.exp(-hour / (recovery_hours / 3))
            curve.append(max(0.0, min(1.0, recovery_progress)))
        
        return curve

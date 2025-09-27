"""
怪我リスクを予測・予防するシステム

このモジュールには以下の機能が含まれます：
- 怪我リスク評価
- リスク要因特定
- 予防策提案
- 警告サイン監視
- 統計的分析
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class InjuryRiskLevel(Enum):
    """怪我リスクレベル"""
    LOW = "low"           # 低リスク
    MODERATE = "moderate" # 中リスク
    HIGH = "high"         # 高リスク
    CRITICAL = "critical" # 危険


class InjuryType(Enum):
    """怪我タイプ"""
    OVERUSE = "overuse"           # オーバーユース
    MUSCLE_STRAIN = "muscle"      # 筋肉損傷
    JOINT_INJURY = "joint"        # 関節損傷
    STRESS_FRACTURE = "fracture"  # 疲労骨折
    TENDINITIS = "tendinitis"     # 腱炎


class RiskFactor(Enum):
    """リスク要因"""
    RAPID_INCREASE = "rapid_increase"      # 急激な増加
    HIGH_FREQUENCY = "high_frequency"       # 高頻度
    INSUFFICIENT_RECOVERY = "recovery"     # 回復不足
    PREVIOUS_INJURY = "previous_injury"   # 過去の怪我
    POOR_FORM = "poor_form"               # フォーム不良
    INADEQUATE_WARMUP = "warmup"          # ウォームアップ不足


@dataclass
class InjuryRiskAssessment:
    """怪我リスク評価"""
    overall_risk: InjuryRiskLevel
    risk_score: float  # 0-1
    primary_risk_factors: List[RiskFactor]
    injury_types_at_risk: List[InjuryType]
    risk_timeline_days: int  # リスクが高まるまでの日数
    prevention_recommendations: List[str]
    warning_signs: List[str]


@dataclass
class RiskFactorAnalysis:
    """リスク要因分析"""
    factor: RiskFactor
    severity: float  # 0-1
    description: str
    impact_on_risk: float
    mitigation_strategy: str


class InjuryPredictor:
    """怪我予測・予防システム"""
    
    def __init__(self):
        """初期化"""
        self.injury_patterns = {
            InjuryType.OVERUSE: {
                'risk_factors': [RiskFactor.RAPID_INCREASE, RiskFactor.HIGH_FREQUENCY],
                'warning_signs': ['持続的な痛み', '朝のこわばり', 'パフォーマンス低下']
            },
            InjuryType.MUSCLE_STRAIN: {
                'risk_factors': [RiskFactor.INSUFFICIENT_RECOVERY, RiskFactor.POOR_FORM],
                'warning_signs': ['筋肉の緊張', '可動域の制限', '突然の痛み']
            },
            InjuryType.JOINT_INJURY: {
                'risk_factors': [RiskFactor.PREVIOUS_INJURY, RiskFactor.INADEQUATE_WARMUP],
                'warning_signs': ['関節の腫れ', '可動域の制限', '不安定性']
            },
            InjuryType.STRESS_FRACTURE: {
                'risk_factors': [RiskFactor.RAPID_INCREASE, RiskFactor.INSUFFICIENT_RECOVERY],
                'warning_signs': ['局所的な痛み', '夜間の痛み', '体重負荷時の痛み']
            },
            InjuryType.TENDINITIS: {
                'risk_factors': [RiskFactor.HIGH_FREQUENCY, RiskFactor.OVERUSE],
                'warning_signs': ['腱の痛み', '朝のこわばり', '使用時の痛み']
            }
        }
        
        logger.info("InjuryPredictor initialized")
    
    def assess_injury_risk(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]],
        injury_history: List[Dict[str, Any]],
        health_metrics: Dict[str, Any]
    ) -> InjuryRiskAssessment:
        """
        怪我リスク評価
        
        Args:
            user_data: ユーザーデータ
            recent_workouts: 最近の練習データ
            injury_history: 怪我履歴
            health_metrics: 健康指標
            
        Returns:
            怪我リスク評価
        """
        try:
            logger.info("Assessing injury risk")
            
            # リスク要因の分析
            risk_factors = self._analyze_risk_factors(
                user_data, recent_workouts, injury_history, health_metrics
            )
            
            # 総合リスクスコアの計算
            risk_score = self._calculate_overall_risk_score(risk_factors)
            
            # リスクレベルの判定
            risk_level = self._determine_risk_level(risk_score)
            
            # 怪我タイプの特定
            injury_types = self._identify_injury_types(risk_factors)
            
            # リスクタイムラインの予測
            risk_timeline = self._predict_risk_timeline(risk_score, risk_factors)
            
            # 予防推奨事項の生成
            prevention_recommendations = self._generate_prevention_recommendations(
                risk_factors, injury_types
            )
            
            # 警告サインの特定
            warning_signs = self._identify_warning_signs(injury_types)
            
            risk_assessment = InjuryRiskAssessment(
                overall_risk=risk_level,
                risk_score=risk_score,
                primary_risk_factors=[rf.factor for rf in risk_factors if rf.severity > 0.5],
                injury_types_at_risk=injury_types,
                risk_timeline_days=risk_timeline,
                prevention_recommendations=prevention_recommendations,
                warning_signs=warning_signs
            )
            
            logger.info(f"Injury risk assessment completed: {risk_level.value} risk")
            return risk_assessment
            
        except Exception as e:
            logger.error(f"Failed to assess injury risk: {str(e)}")
            raise RuntimeError(f"怪我リスク評価に失敗しました: {str(e)}")
    
    def identify_risk_factors(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]],
        injury_history: List[Dict[str, Any]]
    ) -> List[RiskFactorAnalysis]:
        """
        リスク要因特定
        
        Args:
            user_data: ユーザーデータ
            recent_workouts: 最近の練習データ
            injury_history: 怪我履歴
            
        Returns:
            リスク要因分析リスト
        """
        try:
            logger.info("Identifying risk factors")
            
            risk_analyses = []
            
            # 急激な練習量増加の検出
            rapid_increase_analysis = self._analyze_rapid_increase(user_data, recent_workouts)
            if rapid_increase_analysis:
                risk_analyses.append(rapid_increase_analysis)
            
            # 高頻度練習の検出
            high_frequency_analysis = self._analyze_high_frequency(user_data, recent_workouts)
            if high_frequency_analysis:
                risk_analyses.append(high_frequency_analysis)
            
            # 回復不足の検出
            recovery_analysis = self._analyze_insufficient_recovery(user_data, recent_workouts)
            if recovery_analysis:
                risk_analyses.append(recovery_analysis)
            
            # 過去の怪我履歴の分析
            previous_injury_analysis = self._analyze_previous_injuries(injury_history)
            if previous_injury_analysis:
                risk_analyses.append(previous_injury_analysis)
            
            # フォーム不良の検出（簡易版）
            form_analysis = self._analyze_poor_form(user_data, recent_workouts)
            if form_analysis:
                risk_analyses.append(form_analysis)
            
            # ウォームアップ不足の検出
            warmup_analysis = self._analyze_inadequate_warmup(user_data, recent_workouts)
            if warmup_analysis:
                risk_analyses.append(warmup_analysis)
            
            logger.info(f"Identified {len(risk_analyses)} risk factors")
            return risk_analyses
            
        except Exception as e:
            logger.error(f"Failed to identify risk factors: {str(e)}")
            raise RuntimeError(f"リスク要因の特定に失敗しました: {str(e)}")
    
    def recommend_prevention(
        self,
        risk_assessment: InjuryRiskAssessment,
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        予防策提案
        
        Args:
            risk_assessment: 怪我リスク評価
            user_profile: ユーザープロフィール
            
        Returns:
            予防策提案
        """
        try:
            logger.info("Generating prevention recommendations")
            
            prevention_plan = {
                'risk_level': risk_assessment.overall_risk.value,
                'immediate_actions': [],
                'short_term_actions': [],
                'long_term_actions': [],
                'exercise_recommendations': [],
                'lifestyle_modifications': [],
                'monitoring_plan': []
            }
            
            # リスクレベルに応じた即座の行動
            if risk_assessment.overall_risk == InjuryRiskLevel.CRITICAL:
                prevention_plan['immediate_actions'].append("練習を中止し、医師に相談してください")
            elif risk_assessment.overall_risk == InjuryRiskLevel.HIGH:
                prevention_plan['immediate_actions'].append("練習強度を大幅に下げてください")
                prevention_plan['immediate_actions'].append("痛みがある場合は練習を中止してください")
            
            # リスク要因別の予防策
            for risk_factor in risk_assessment.primary_risk_factors:
                if risk_factor == RiskFactor.RAPID_INCREASE:
                    prevention_plan['short_term_actions'].append("週間走行距離を10%以内に制限してください")
                    prevention_plan['long_term_actions'].append("段階的な練習量増加計画を立ててください")
                
                elif risk_factor == RiskFactor.HIGH_FREQUENCY:
                    prevention_plan['short_term_actions'].append("練習頻度を週4回以下に減らしてください")
                    prevention_plan['long_term_actions'].append("適切な練習頻度の計画を立ててください")
                
                elif risk_factor == RiskFactor.INSUFFICIENT_RECOVERY:
                    prevention_plan['short_term_actions'].append("休養日を増やしてください")
                    prevention_plan['lifestyle_modifications'].append("睡眠時間を7-9時間確保してください")
                
                elif risk_factor == RiskFactor.PREVIOUS_INJURY:
                    prevention_plan['exercise_recommendations'].append("過去の怪我部位の強化運動を行ってください")
                    prevention_plan['monitoring_plan'].append("過去の怪我部位の状態を定期的にチェックしてください")
                
                elif risk_factor == RiskFactor.POOR_FORM:
                    prevention_plan['exercise_recommendations'].append("ランニングフォームの改善に取り組んでください")
                    prevention_plan['long_term_actions'].append("専門家によるフォーム指導を受けてください")
                
                elif risk_factor == RiskFactor.INADEQUATE_WARMUP:
                    prevention_plan['short_term_actions'].append("練習前のウォームアップを15分以上行ってください")
                    prevention_plan['exercise_recommendations'].append("動的ストレッチと軽いジョギングを組み合わせてください")
            
            # 怪我タイプ別の予防策
            for injury_type in risk_assessment.injury_types_at_risk:
                if injury_type == InjuryType.OVERUSE:
                    prevention_plan['exercise_recommendations'].append("クロストレーニングを取り入れてください")
                    prevention_plan['lifestyle_modifications'].append("練習の多様性を増やしてください")
                
                elif injury_type == InjuryType.MUSCLE_STRAIN:
                    prevention_plan['exercise_recommendations'].append("筋力トレーニングを強化してください")
                    prevention_plan['exercise_recommendations'].append("柔軟性向上のためのストレッチを行ってください")
                
                elif injury_type == InjuryType.JOINT_INJURY:
                    prevention_plan['exercise_recommendations'].append("関節周囲の筋力強化を行ってください")
                    prevention_plan['monitoring_plan'].append("関節の可動域と安定性を定期的にチェックしてください")
                
                elif injury_type == InjuryType.STRESS_FRACTURE:
                    prevention_plan['lifestyle_modifications'].append("カルシウムとビタミンDの摂取を増やしてください")
                    prevention_plan['exercise_recommendations'].append("低衝撃の練習に変更してください")
                
                elif injury_type == InjuryType.TENDINITIS:
                    prevention_plan['exercise_recommendations'].append("腱の柔軟性向上のためのエクササイズを行ってください")
                    prevention_plan['short_term_actions'].append("痛みのある部位の使用を制限してください")
            
            logger.info("Prevention recommendations generated")
            return prevention_plan
            
        except Exception as e:
            logger.error(f"Failed to recommend prevention: {str(e)}")
            raise RuntimeError(f"予防策の提案に失敗しました: {str(e)}")
    
    def monitor_warning_signs(
        self,
        current_symptoms: List[str],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        警告サイン監視
        
        Args:
            current_symptoms: 現在の症状
            user_profile: ユーザープロフィール
            
        Returns:
            警告サイン監視結果
        """
        try:
            logger.info("Monitoring warning signs")
            
            warning_signs = {
                'severe_warnings': [],
                'moderate_warnings': [],
                'mild_warnings': [],
                'recommended_actions': [],
                'medical_consultation_needed': False
            }
            
            # 症状の分類
            severe_symptoms = ['持続的な痛み', '夜間の痛み', '体重負荷時の痛み', '関節の腫れ']
            moderate_symptoms = ['朝のこわばり', '可動域の制限', 'パフォーマンス低下', '筋肉の緊張']
            mild_symptoms = ['軽い痛み', '疲労感', '違和感']
            
            for symptom in current_symptoms:
                if symptom in severe_symptoms:
                    warning_signs['severe_warnings'].append(symptom)
                elif symptom in moderate_symptoms:
                    warning_signs['moderate_warnings'].append(symptom)
                elif symptom in mild_symptoms:
                    warning_signs['mild_warnings'].append(symptom)
            
            # 推奨行動の生成
            if warning_signs['severe_warnings']:
                warning_signs['recommended_actions'].append("練習を中止してください")
                warning_signs['recommended_actions'].append("医師に相談してください")
                warning_signs['medical_consultation_needed'] = True
            elif warning_signs['moderate_warnings']:
                warning_signs['recommended_actions'].append("練習強度を下げてください")
                warning_signs['recommended_actions'].append("症状を注意深く観察してください")
            elif warning_signs['mild_warnings']:
                warning_signs['recommended_actions'].append("十分なウォームアップとクールダウンを行ってください")
                warning_signs['recommended_actions'].append("症状の変化に注意してください")
            
            logger.info(f"Warning signs monitored: {len(warning_signs['severe_warnings'])} severe, {len(warning_signs['moderate_warnings'])} moderate")
            return warning_signs
            
        except Exception as e:
            logger.error(f"Failed to monitor warning signs: {str(e)}")
            raise RuntimeError(f"警告サインの監視に失敗しました: {str(e)}")
    
    def _analyze_risk_factors(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]],
        injury_history: List[Dict[str, Any]],
        health_metrics: Dict[str, Any]
    ) -> List[RiskFactorAnalysis]:
        """リスク要因の分析"""
        risk_analyses = []
        
        # 各リスク要因の分析
        rapid_increase = self._analyze_rapid_increase(user_data, recent_workouts)
        if rapid_increase:
            risk_analyses.append(rapid_increase)
        
        high_frequency = self._analyze_high_frequency(user_data, recent_workouts)
        if high_frequency:
            risk_analyses.append(high_frequency)
        
        recovery = self._analyze_insufficient_recovery(user_data, recent_workouts)
        if recovery:
            risk_analyses.append(recovery)
        
        previous_injury = self._analyze_previous_injuries(injury_history)
        if previous_injury:
            risk_analyses.append(previous_injury)
        
        return risk_analyses
    
    def _analyze_rapid_increase(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """急激な練習量増加の分析"""
        if len(recent_workouts) < 14:
            return None
        
        # 最近2週間とその前2週間の比較
        recent_2weeks = sum(w.get('distance', 0) for w in recent_workouts[-14:])
        previous_2weeks = sum(w.get('distance', 0) for w in recent_workouts[-28:-14])
        
        if previous_2weeks > 0:
            increase_ratio = recent_2weeks / previous_2weeks
            
            if increase_ratio > 1.5:  # 50%以上の増加
                severity = min(1.0, (increase_ratio - 1.5) / 0.5)
                return RiskFactorAnalysis(
                    factor=RiskFactor.RAPID_INCREASE,
                    severity=severity,
                    description=f"練習量が{increase_ratio:.1f}倍に急増しています",
                    impact_on_risk=0.8,
                    mitigation_strategy="週間走行距離を10%以内の増加に制限してください"
                )
        
        return None
    
    def _analyze_high_frequency(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """高頻度練習の分析"""
        if len(recent_workouts) < 7:
            return None
        
        # 最近1週間の練習頻度
        recent_week = recent_workouts[-7:]
        frequency = len(recent_week)
        
        if frequency > 5:  # 週5回以上
            severity = min(1.0, (frequency - 5) / 2)  # 週7回で最大
            return RiskFactorAnalysis(
                factor=RiskFactor.HIGH_FREQUENCY,
                severity=severity,
                description=f"週{frequency}回の高頻度練習を行っています",
                impact_on_risk=0.6,
                mitigation_strategy="練習頻度を週4回以下に減らしてください"
            )
        
        return None
    
    def _analyze_insufficient_recovery(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """回復不足の分析"""
        if len(recent_workouts) < 7:
            return None
        
        # 連続練習日の分析
        consecutive_days = 0
        max_consecutive = 0
        
        for i in range(len(recent_workouts) - 1):
            current_date = recent_workouts[i].get('date', datetime.now())
            next_date = recent_workouts[i + 1].get('date', datetime.now())
            
            if isinstance(current_date, str):
                current_date = datetime.fromisoformat(current_date)
            if isinstance(next_date, str):
                next_date = datetime.fromisoformat(next_date)
            
            if (next_date - current_date).days == 1:
                consecutive_days += 1
                max_consecutive = max(max_consecutive, consecutive_days)
            else:
                consecutive_days = 0
        
        if max_consecutive > 3:  # 3日以上連続
            severity = min(1.0, (max_consecutive - 3) / 3)
            return RiskFactorAnalysis(
                factor=RiskFactor.INSUFFICIENT_RECOVERY,
                severity=severity,
                description=f"{max_consecutive}日連続で練習を行っています",
                impact_on_risk=0.7,
                mitigation_strategy="適切な休養日を設けてください"
            )
        
        return None
    
    def _analyze_previous_injuries(
        self,
        injury_history: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """過去の怪我履歴の分析"""
        if not injury_history:
            return None
        
        # 過去1年以内の怪我
        recent_injuries = [
            injury for injury in injury_history
            if (datetime.now() - datetime.fromisoformat(injury.get('date', '2023-01-01'))).days < 365
        ]
        
        if recent_injuries:
            severity = min(1.0, len(recent_injuries) / 3)  # 3回で最大
            return RiskFactorAnalysis(
                factor=RiskFactor.PREVIOUS_INJURY,
                severity=severity,
                description=f"過去1年以内に{len(recent_injuries)}回の怪我があります",
                impact_on_risk=0.9,
                mitigation_strategy="過去の怪我部位の強化運動を行ってください"
            )
        
        return None
    
    def _analyze_poor_form(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """フォーム不良の分析（簡易版）"""
        # 実際の実装では、より詳細な分析が必要
        # ここでは簡易的な指標を使用
        avg_pace = np.mean([w.get('pace', 300) for w in recent_workouts[-7:] if w.get('pace')])
        
        if avg_pace and avg_pace > 400:  # 6分40秒/km以上
            return RiskFactorAnalysis(
                factor=RiskFactor.POOR_FORM,
                severity=0.5,
                description="ペースが遅く、フォームの改善が必要かもしれません",
                impact_on_risk=0.4,
                mitigation_strategy="ランニングフォームの改善に取り組んでください"
            )
        
        return None
    
    def _analyze_inadequate_warmup(
        self,
        user_data: Dict[str, Any],
        recent_workouts: List[Dict[str, Any]]
    ) -> Optional[RiskFactorAnalysis]:
        """ウォームアップ不足の分析"""
        # 実際の実装では、ウォームアップ時間の記録が必要
        # ここでは簡易的な判定
        return None
    
    def _calculate_overall_risk_score(self, risk_factors: List[RiskFactorAnalysis]) -> float:
        """総合リスクスコアの計算"""
        if not risk_factors:
            return 0.0
        
        # 各リスク要因の重み付きスコア
        total_score = 0.0
        total_weight = 0.0
        
        for risk_factor in risk_factors:
            weight = risk_factor.impact_on_risk
            score = risk_factor.severity * weight
            total_score += score
            total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _determine_risk_level(self, risk_score: float) -> InjuryRiskLevel:
        """リスクレベルの判定"""
        if risk_score >= 0.8:
            return InjuryRiskLevel.CRITICAL
        elif risk_score >= 0.6:
            return InjuryRiskLevel.HIGH
        elif risk_score >= 0.4:
            return InjuryRiskLevel.MODERATE
        else:
            return InjuryRiskLevel.LOW
    
    def _identify_injury_types(self, risk_factors: List[RiskFactorAnalysis]) -> List[InjuryType]:
        """怪我タイプの特定"""
        injury_types = []
        
        for risk_factor in risk_factors:
            for injury_type, pattern in self.injury_patterns.items():
                if risk_factor.factor in pattern['risk_factors']:
                    if injury_type not in injury_types:
                        injury_types.append(injury_type)
        
        return injury_types
    
    def _predict_risk_timeline(self, risk_score: float, risk_factors: List[RiskFactorAnalysis]) -> int:
        """リスクタイムラインの予測"""
        # リスクスコアに基づく予測
        if risk_score >= 0.8:
            return 7  # 1週間以内
        elif risk_score >= 0.6:
            return 14  # 2週間以内
        elif risk_score >= 0.4:
            return 30  # 1ヶ月以内
        else:
            return 90  # 3ヶ月以内
    
    def _generate_prevention_recommendations(
        self,
        risk_factors: List[RiskFactorAnalysis],
        injury_types: List[InjuryType]
    ) -> List[str]:
        """予防推奨事項の生成"""
        recommendations = []
        
        for risk_factor in risk_factors:
            recommendations.append(risk_factor.mitigation_strategy)
        
        # 怪我タイプ別の推奨事項
        for injury_type in injury_types:
            if injury_type == InjuryType.OVERUSE:
                recommendations.append("クロストレーニングを取り入れてください")
            elif injury_type == InjuryType.MUSCLE_STRAIN:
                recommendations.append("筋力トレーニングを強化してください")
            elif injury_type == InjuryType.JOINT_INJURY:
                recommendations.append("関節周囲の筋力強化を行ってください")
            elif injury_type == InjuryType.STRESS_FRACTURE:
                recommendations.append("カルシウムとビタミンDの摂取を増やしてください")
            elif injury_type == InjuryType.TENDINITIS:
                recommendations.append("腱の柔軟性向上のためのエクササイズを行ってください")
        
        return list(set(recommendations))  # 重複を除去
    
    def _identify_warning_signs(self, injury_types: List[InjuryType]) -> List[str]:
        """警告サインの特定"""
        warning_signs = []
        
        for injury_type in injury_types:
            if injury_type in self.injury_patterns:
                warning_signs.extend(self.injury_patterns[injury_type]['warning_signs'])
        
        return list(set(warning_signs))  # 重複を除去

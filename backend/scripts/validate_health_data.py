#!/usr/bin/env python3
"""
RunMaster 体調管理機能テストデータ検証スクリプト

このスクリプトは以下の機能を提供します：
- 生成されたテストデータの健康性チェック
- 練習と体調の相関性検証
- データ品質の評価
- 異常値の検出と修正提案
- 包括的なレポート生成

使用方法:
    python scripts/validate_health_data.py
"""

import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging
from dataclasses import dataclass

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.models.user import User
from app.models.daily_metrics import DailyMetrics
from app.models.workout import Workout
from app.ml.health.training_condition_correlator import TrainingConditionCorrelator
from sqlalchemy.orm import Session

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class HealthValidationResult:
    """健康性検証結果"""
    user_id: str
    total_records: int
    healthy_records: int
    unhealthy_records: int
    health_percentage: float
    risk_factors: List[str]
    recommendations: List[str]
    data_quality_score: float


@dataclass
class CorrelationAnalysis:
    """相関分析結果"""
    workout_fatigue_correlation: float
    sleep_quality_fatigue_correlation: float
    motivation_energy_correlation: float
    stress_sleep_correlation: float
    training_readiness_correlation: float


class HealthDataValidator:
    """体調データ検証器"""
    
    def __init__(self):
        """初期化"""
        self.db = next(get_db())
        self.correlator = TrainingConditionCorrelator()
        
        # 健康的な範囲の定義
        self.health_ranges = {
            'weight_kg': {'min': 40, 'max': 120},
            'sleep_duration_hours': {'min': 4, 'max': 12},
            'sleep_quality_score': {'min': 1, 'max': 10},
            'fatigue_level': {'min': 1, 'max': 10},
            'motivation_level': {'min': 1, 'max': 10},
            'stress_level': {'min': 1, 'max': 10},
            'energy_level': {'min': 1, 'max': 10},
            'training_readiness': {'min': 1, 'max': 10},
            'resting_heart_rate': {'min': 40, 'max': 120},
            'blood_pressure_systolic': {'min': 80, 'max': 200},
            'blood_pressure_diastolic': {'min': 50, 'max': 120}
        }
        
        # 危険な範囲の定義
        self.danger_ranges = {
            'fatigue_level': {'min': 8, 'max': 10},  # 極度の疲労
            'motivation_level': {'min': 1, 'max': 3},  # 極度に低いモチベーション
            'stress_level': {'min': 8, 'max': 10},  # 極度のストレス
            'energy_level': {'min': 1, 'max': 3},  # 極度に低いエネルギー
            'sleep_duration_hours': {'min': 0, 'max': 4},  # 極度に短い睡眠
            'sleep_duration_hours_long': {'min': 12, 'max': 24},  # 極度に長い睡眠
            'weight_kg_extreme': {'min': 0, 'max': 30},  # 極度に軽い体重
            'weight_kg_heavy': {'min': 150, 'max': 300},  # 極度に重い体重
        }
        
        logger.info("HealthDataValidator initialized")
    
    def validate_user_health_data(self, user_id: str) -> HealthValidationResult:
        """ユーザーの体調データを検証"""
        try:
            logger.info(f"Validating health data for user: {user_id}")
            
            # 体調記録を取得
            daily_metrics = self.db.query(DailyMetrics).filter(
                DailyMetrics.user_id == user_id
            ).order_by(DailyMetrics.date).all()
            
            if not daily_metrics:
                return HealthValidationResult(
                    user_id=user_id,
                    total_records=0,
                    healthy_records=0,
                    unhealthy_records=0,
                    health_percentage=0.0,
                    risk_factors=["データが存在しません"],
                    recommendations=["体調記録を開始してください"],
                    data_quality_score=0.0
                )
            
            # 各記録の健康性をチェック
            healthy_count = 0
            unhealthy_count = 0
            risk_factors = []
            data_quality_issues = []
            
            for metrics in daily_metrics:
                is_healthy, risks, quality_issues = self._check_single_record_health(metrics)
                
                if is_healthy:
                    healthy_count += 1
                else:
                    unhealthy_count += 1
                
                risk_factors.extend(risks)
                data_quality_issues.extend(quality_issues)
            
            # 重複を除去
            risk_factors = list(set(risk_factors))
            data_quality_issues = list(set(data_quality_issues))
            
            # 健康性パーセンテージ
            health_percentage = (healthy_count / len(daily_metrics)) * 100
            
            # データ品質スコア
            data_quality_score = self._calculate_data_quality_score(daily_metrics)
            
            # 推奨事項の生成
            recommendations = self._generate_recommendations(risk_factors, health_percentage)
            
            result = HealthValidationResult(
                user_id=user_id,
                total_records=len(daily_metrics),
                healthy_records=healthy_count,
                unhealthy_records=unhealthy_count,
                health_percentage=health_percentage,
                risk_factors=risk_factors,
                recommendations=recommendations,
                data_quality_score=data_quality_score
            )
            
            logger.info(f"Validation completed for user {user_id}: {health_percentage:.1f}% healthy")
            return result
            
        except Exception as e:
            logger.error(f"Failed to validate health data for user {user_id}: {e}")
            raise RuntimeError(f"体調データ検証に失敗しました: {e}")
    
    def _check_single_record_health(
        self, 
        metrics: DailyMetrics
    ) -> Tuple[bool, List[str], List[str]]:
        """単一記録の健康性をチェック"""
        risks = []
        quality_issues = []
        
        # 各指標のチェック
        checks = [
            ('weight_kg', metrics.weight_kg),
            ('sleep_duration_hours', metrics.sleep_duration_hours),
            ('sleep_quality_score', metrics.sleep_quality_score),
            ('fatigue_level', metrics.fatigue_level),
            ('motivation_level', metrics.motivation_level),
            ('stress_level', metrics.stress_level),
            ('energy_level', metrics.energy_level),
            ('training_readiness', metrics.training_readiness),
            ('resting_heart_rate', metrics.resting_heart_rate),
            ('blood_pressure_systolic', metrics.blood_pressure_systolic),
            ('blood_pressure_diastolic', metrics.blood_pressure_diastolic)
        ]
        
        for field_name, value in checks:
            if value is None:
                quality_issues.append(f"{field_name}が記録されていません")
                continue
            
            # 基本的な範囲チェック
            if field_name in self.health_ranges:
                range_def = self.health_ranges[field_name]
                if value < range_def['min'] or value > range_def['max']:
                    risks.append(f"{field_name}が異常な値です: {value}")
            
            # 危険な範囲チェック
            if field_name in self.danger_ranges:
                danger_def = self.danger_ranges[field_name]
                if danger_def['min'] <= value <= danger_def['max']:
                    risks.append(f"{field_name}が危険な範囲です: {value}")
        
        # 特殊な組み合わせチェック
        if metrics.fatigue_level and metrics.energy_level:
            if metrics.fatigue_level > 7 and metrics.energy_level < 4:
                risks.append("疲労度が高く、エネルギーが低い状態です")
        
        if metrics.sleep_duration_hours and metrics.sleep_quality_score:
            if metrics.sleep_duration_hours < 5 and metrics.sleep_quality_score < 5:
                risks.append("睡眠時間と睡眠の質が両方とも低いです")
        
        if metrics.motivation_level and metrics.stress_level:
            if metrics.motivation_level < 4 and metrics.stress_level > 7:
                risks.append("モチベーションが低く、ストレスが高い状態です")
        
        # 血圧の組み合わせチェック
        if metrics.blood_pressure_systolic and metrics.blood_pressure_diastolic:
            if metrics.blood_pressure_systolic > 140 or metrics.blood_pressure_diastolic > 90:
                risks.append("血圧が高い値です")
        
        # 健康性の判定
        is_healthy = len(risks) == 0
        
        return is_healthy, risks, quality_issues
    
    def _calculate_data_quality_score(self, daily_metrics: List[DailyMetrics]) -> float:
        """データ品質スコアを計算"""
        if not daily_metrics:
            return 0.0
        
        total_fields = len(daily_metrics) * 11  # 11の主要フィールド
        filled_fields = 0
        
        for metrics in daily_metrics:
            fields = [
                metrics.weight_kg,
                metrics.sleep_duration_hours,
                metrics.sleep_quality_score,
                metrics.fatigue_level,
                metrics.motivation_level,
                metrics.stress_level,
                metrics.energy_level,
                metrics.training_readiness,
                metrics.resting_heart_rate,
                metrics.blood_pressure_systolic,
                metrics.blood_pressure_diastolic
            ]
            
            filled_fields += sum(1 for field in fields if field is not None)
        
        quality_score = (filled_fields / total_fields) * 100
        return min(100.0, quality_score)
    
    def _generate_recommendations(
        self, 
        risk_factors: List[str], 
        health_percentage: float
    ) -> List[str]:
        """推奨事項を生成"""
        recommendations = []
        
        # 全体的な健康性に基づく推奨事項
        if health_percentage < 50:
            recommendations.append("体調管理を改善する必要があります")
        elif health_percentage < 80:
            recommendations.append("体調管理を継続し、改善を図ってください")
        else:
            recommendations.append("体調管理が良好です。現在のパターンを維持してください")
        
        # リスク要因に基づく推奨事項
        for risk in risk_factors:
            if "疲労度" in risk:
                recommendations.append("休息を増やし、練習強度を調整してください")
            elif "睡眠" in risk:
                recommendations.append("睡眠時間と睡眠の質を改善してください")
            elif "モチベーション" in risk:
                recommendations.append("小さな目標を設定し、達成感を得られるようにしてください")
            elif "ストレス" in risk:
                recommendations.append("ストレス管理の方法を見直してください")
            elif "エネルギー" in risk:
                recommendations.append("栄養と休息を見直してください")
            elif "血圧" in risk:
                recommendations.append("医師に相談し、血圧管理を改善してください")
            elif "体重" in risk:
                recommendations.append("栄養バランスと運動量を見直してください")
        
        return recommendations
    
    def analyze_correlations(self, user_id: str) -> CorrelationAnalysis:
        """相関分析を実行"""
        try:
            logger.info(f"Analyzing correlations for user: {user_id}")
            
            # 体調記録を取得
            daily_metrics = self.db.query(DailyMetrics).filter(
                DailyMetrics.user_id == user_id
            ).order_by(DailyMetrics.date).all()
            
            if len(daily_metrics) < 10:
                logger.warning(f"Insufficient data for correlation analysis: {len(daily_metrics)} records")
                return CorrelationAnalysis(
                    workout_fatigue_correlation=0.0,
                    sleep_quality_fatigue_correlation=0.0,
                    motivation_energy_correlation=0.0,
                    stress_sleep_correlation=0.0,
                    training_readiness_correlation=0.0
                )
            
            # データを配列に変換
            fatigue_levels = [m.fatigue_level for m in daily_metrics if m.fatigue_level is not None]
            sleep_qualities = [m.sleep_quality_score for m in daily_metrics if m.sleep_quality_score is not None]
            motivation_levels = [m.motivation_level for m in daily_metrics if m.motivation_level is not None]
            energy_levels = [m.energy_level for m in daily_metrics if m.energy_level is not None]
            stress_levels = [m.stress_level for m in daily_metrics if m.stress_level is not None]
            training_readiness = [m.training_readiness for m in daily_metrics if m.training_readiness is not None]
            
            # 練習データを取得
            workouts = self.db.query(Workout).filter(
                Workout.user_id == user_id
            ).order_by(Workout.date).all()
            
            # 練習強度データを作成（日付ベース）
            workout_intensities = {}
            for workout in workouts:
                workout_intensities[workout.date] = workout.distance_km / (workout.duration_minutes / 60) if workout.duration_minutes else 0
            
            # 相関計算
            correlations = {}
            
            # 練習と疲労の相関
            if len(fatigue_levels) > 1:
                workout_fatigue_values = []
                for i, metrics in enumerate(daily_metrics):
                    if metrics.fatigue_level is not None and metrics.date in workout_intensities:
                        workout_fatigue_values.append((workout_intensities[metrics.date], metrics.fatigue_level))
                
                if len(workout_fatigue_values) > 3:
                    workout_vals, fatigue_vals = zip(*workout_fatigue_values)
                    correlations['workout_fatigue'] = np.corrcoef(workout_vals, fatigue_vals)[0, 1]
                else:
                    correlations['workout_fatigue'] = 0.0
            else:
                correlations['workout_fatigue'] = 0.0
            
            # 睡眠の質と疲労の相関
            if len(sleep_qualities) > 1 and len(fatigue_levels) > 1:
                correlations['sleep_quality_fatigue'] = np.corrcoef(sleep_qualities, fatigue_levels)[0, 1]
            else:
                correlations['sleep_quality_fatigue'] = 0.0
            
            # モチベーションとエネルギーの相関
            if len(motivation_levels) > 1 and len(energy_levels) > 1:
                correlations['motivation_energy'] = np.corrcoef(motivation_levels, energy_levels)[0, 1]
            else:
                correlations['motivation_energy'] = 0.0
            
            # ストレスと睡眠の相関
            if len(stress_levels) > 1 and len(sleep_qualities) > 1:
                correlations['stress_sleep'] = np.corrcoef(stress_levels, sleep_qualities)[0, 1]
            else:
                correlations['stress_sleep'] = 0.0
            
            # トレーニング準備度の相関（疲労、エネルギー、睡眠の質の組み合わせ）
            if len(training_readiness) > 1:
                readiness_factors = []
                for metrics in daily_metrics:
                    if all([
                        metrics.training_readiness is not None,
                        metrics.fatigue_level is not None,
                        metrics.energy_level is not None,
                        metrics.sleep_quality_score is not None
                    ]):
                        readiness_factors.append((
                            metrics.training_readiness,
                            metrics.fatigue_level,
                            metrics.energy_level,
                            metrics.sleep_quality_score
                        ))
                
                if len(readiness_factors) > 3:
                    readiness_vals, fatigue_vals, energy_vals, sleep_vals = zip(*readiness_factors)
                    # 複合指標として疲労（逆）、エネルギー、睡眠の質の平均
                    composite_factor = [(10 - f) + e + s for f, e, s in zip(fatigue_vals, energy_vals, sleep_vals)]
                    correlations['training_readiness'] = np.corrcoef(readiness_vals, composite_factor)[0, 1]
                else:
                    correlations['training_readiness'] = 0.0
            else:
                correlations['training_readiness'] = 0.0
            
            analysis = CorrelationAnalysis(
                workout_fatigue_correlation=correlations.get('workout_fatigue', 0.0),
                sleep_quality_fatigue_correlation=correlations.get('sleep_quality_fatigue', 0.0),
                motivation_energy_correlation=correlations.get('motivation_energy', 0.0),
                stress_sleep_correlation=correlations.get('stress_sleep', 0.0),
                training_readiness_correlation=correlations.get('training_readiness', 0.0)
            )
            
            logger.info(f"Correlation analysis completed for user {user_id}")
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze correlations for user {user_id}: {e}")
            raise RuntimeError(f"相関分析に失敗しました: {e}")
    
    def generate_comprehensive_report(self) -> str:
        """包括的な検証レポートを生成"""
        try:
            logger.info("Generating comprehensive validation report")
            
            # 全ユーザーのデータを取得
            users = self.db.query(User).all()
            
            report = []
            report.append("=" * 80)
            report.append("RunMaster 体調管理機能テストデータ検証レポート")
            report.append("=" * 80)
            report.append(f"生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            report.append(f"対象ユーザー数: {len(users)}")
            report.append("")
            
            # 全体統計
            total_records = 0
            total_healthy_records = 0
            total_unhealthy_records = 0
            total_quality_score = 0
            
            # 各ユーザーの検証結果
            user_results = []
            for user in users:
                validation_result = self.validate_user_health_data(user.id)
                correlation_analysis = self.analyze_correlations(user.id)
                
                user_results.append({
                    'user_id': user.id,
                    'username': user.username,
                    'validation': validation_result,
                    'correlation': correlation_analysis
                })
                
                total_records += validation_result.total_records
                total_healthy_records += validation_result.healthy_records
                total_unhealthy_records += validation_result.unhealthy_records
                total_quality_score += validation_result.data_quality_score
            
            # 全体統計
            overall_health_percentage = (total_healthy_records / total_records * 100) if total_records > 0 else 0
            overall_quality_score = total_quality_score / len(users) if users else 0
            
            report.append("📊 全体統計")
            report.append("-" * 40)
            report.append(f"総記録数: {total_records}")
            report.append(f"健康的な記録: {total_healthy_records} ({overall_health_percentage:.1f}%)")
            report.append(f"不健康な記録: {total_unhealthy_records}")
            report.append(f"平均データ品質スコア: {overall_quality_score:.1f}%")
            report.append("")
            
            # 各ユーザーの詳細結果
            report.append("👥 ユーザー別詳細結果")
            report.append("-" * 40)
            
            for user_result in user_results:
                validation = user_result['validation']
                correlation = user_result['correlation']
                
                report.append(f"\nユーザー: {user_result['username']}")
                report.append(f"  記録数: {validation.total_records}")
                report.append(f"  健康性: {validation.health_percentage:.1f}%")
                report.append(f"  データ品質: {validation.data_quality_score:.1f}%")
                
                if validation.risk_factors:
                    report.append(f"  リスク要因: {', '.join(validation.risk_factors[:3])}")
                
                if validation.recommendations:
                    report.append(f"  推奨事項: {validation.recommendations[0]}")
                
                # 相関分析結果
                report.append(f"  相関分析:")
                report.append(f"    練習-疲労: {correlation.workout_fatigue_correlation:.3f}")
                report.append(f"    睡眠-疲労: {correlation.sleep_quality_fatigue_correlation:.3f}")
                report.append(f"    モチベーション-エネルギー: {correlation.motivation_energy_correlation:.3f}")
            
            # 推奨事項
            report.append("\n🎯 全体推奨事項")
            report.append("-" * 40)
            
            if overall_health_percentage < 70:
                report.append("⚠️  全体の健康性が低いです。以下の改善を推奨します:")
                report.append("  - 体調記録の頻度を増やす")
                report.append("  - 練習強度の調整")
                report.append("  - 睡眠時間の確保")
            elif overall_health_percentage < 90:
                report.append("✅ 全体的に良好ですが、さらなる改善が可能です:")
                report.append("  - データ記録の継続")
                report.append("  - 細かな体調管理")
            else:
                report.append("🌟 非常に良好な体調管理ができています！")
                report.append("  - 現在のパターンを維持")
                report.append("  - 他のユーザーへのアドバイス")
            
            if overall_quality_score < 80:
                report.append("\n📝 データ品質の改善が必要です:")
                report.append("  - 欠損データの補完")
                report.append("  - 記録項目の統一")
            
            report.append("\n" + "=" * 80)
            report.append("検証完了")
            report.append("=" * 80)
            
            return "\n".join(report)
            
        except Exception as e:
            logger.error(f"Failed to generate comprehensive report: {e}")
            raise RuntimeError(f"包括的レポート生成に失敗しました: {e}")


def main():
    """メイン実行関数"""
    logger.info("Starting RunMaster health data validation")
    
    try:
        # 検証器の初期化
        validator = HealthDataValidator()
        
        # 包括的レポート生成
        report = validator.generate_comprehensive_report()
        print(report)
        
        # レポートをファイルに保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"health_data_validation_report_{timestamp}.txt"
        
        with open(report_filename, "w", encoding="utf-8") as f:
            f.write(report)
        
        logger.info(f"Health data validation completed. Report saved to: {report_filename}")
        
    except Exception as e:
        logger.error(f"Error during health data validation: {e}")
        raise


if __name__ == "__main__":
    main()

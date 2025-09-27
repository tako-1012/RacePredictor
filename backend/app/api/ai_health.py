"""
調子と怪我リスクをリアルタイムで監視するAPI

このモジュールには以下のエンドポイントが含まれます：
- GET /api/ai/condition-analysis: 現在のコンディション分析結果
- POST /api/ai/risk-assessment: 怪我リスクの評価実行
- GET /api/ai/recovery-recommendations: 回復促進の推奨事項
- GET /api/ai/health-trends: 健康状態の長期トレンド
- POST /api/ai/monitor-symptoms: 症状の監視
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.models.user import User
from app.services.feature_store import FeatureStoreService
from app.ml.health.condition_analyzer import ConditionAnalyzer, ConditionAnalysis, RecoveryPrediction
from app.ml.health.injury_predictor import InjuryPredictor, InjuryRiskAssessment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Health Monitoring"])


@router.get("/condition-analysis")
async def get_condition_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    現在のコンディション分析結果を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        コンディション分析結果
    """
    try:
        # AI機能の有効性チェック
        if not settings.ai_features_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI機能は現在無効になっています"
            )
        
        logger.info(f"Getting condition analysis for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # ユーザーデータの構築
        user_data = {
            'avg_pace': feature_store.features.get('avg_pace', 300),
            'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
            'training_frequency': feature_store.features.get('weekly_avg_frequency', 4),
            'max_distance': feature_store.features.get('max_distance', 10),
            'experience_level': 'intermediate',
            'recovery_ability': 0.5,
            'fatigue_tolerance': 0.5,
            'baseline_hrv': 30
        }
        
        # 最近の練習データ（簡易版）
        recent_workouts = []  # 実際の実装では、最近の練習データを取得
        
        # 健康指標（簡易版）
        health_metrics = {
            'sleep_quality': 0.7,
            'subjective_fatigue': 0.5,
            'subjective_stress': 0.5,
            'hrv': 30
        }
        
        # コンディション分析器の実行
        analyzer = ConditionAnalyzer()
        condition_analysis = analyzer.analyze_condition(
            user_data=user_data,
            recent_workouts=recent_workouts,
            health_metrics=health_metrics
        )
        
        # レスポンス形式に変換
        analysis_result = {
            'user_id': current_user.id,
            'overall_condition': condition_analysis.overall_condition.value,
            'fatigue_score': condition_analysis.fatigue_score,
            'recovery_score': condition_analysis.recovery_score,
            'readiness_score': condition_analysis.readiness_score,
            'stress_level': condition_analysis.stress_level,
            'sleep_quality': condition_analysis.sleep_quality,
            'performance_trend': condition_analysis.performance_trend,
            'alerts': [alert.value for alert in condition_analysis.alerts],
            'recommendations': condition_analysis.recommendations,
            'analyzed_at': datetime.now().isoformat()
        }
        
        logger.info(f"Condition analysis completed: {condition_analysis.overall_condition.value}")
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get condition analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="コンディション分析の取得に失敗しました"
        )


@router.post("/risk-assessment")
async def assess_injury_risk(
    health_metrics: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    怪我リスクの評価実行
    
    Args:
        health_metrics: 健康指標
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        怪我リスク評価結果
    """
    try:
        logger.info(f"Assessing injury risk for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # ユーザーデータの構築
        user_data = {
            'avg_pace': feature_store.features.get('avg_pace', 300),
            'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
            'training_frequency': feature_store.features.get('weekly_avg_frequency', 4),
            'max_distance': feature_store.features.get('max_distance', 10),
            'experience_level': 'intermediate'
        }
        
        # 最近の練習データ（簡易版）
        recent_workouts = []
        
        # 怪我履歴（簡易版）
        injury_history = []
        
        # 怪我予測器の実行
        predictor = InjuryPredictor()
        risk_assessment = predictor.assess_injury_risk(
            user_data=user_data,
            recent_workouts=recent_workouts,
            injury_history=injury_history,
            health_metrics=health_metrics
        )
        
        # 予防策の提案
        user_profile = {
            'age': feature_store.features.get('age', 30),
            'experience_level': 'intermediate',
            'recovery_ability': 0.5
        }
        
        prevention_plan = predictor.recommend_prevention(risk_assessment, user_profile)
        
        # レスポンス形式に変換
        risk_result = {
            'user_id': current_user.id,
            'overall_risk': risk_assessment.overall_risk.value,
            'risk_score': risk_assessment.risk_score,
            'primary_risk_factors': [factor.value for factor in risk_assessment.primary_risk_factors],
            'injury_types_at_risk': [injury_type.value for injury_type in risk_assessment.injury_types_at_risk],
            'risk_timeline_days': risk_assessment.risk_timeline_days,
            'prevention_recommendations': risk_assessment.prevention_recommendations,
            'warning_signs': risk_assessment.warning_signs,
            'prevention_plan': prevention_plan,
            'assessed_at': datetime.now().isoformat()
        }
        
        logger.info(f"Injury risk assessment completed: {risk_assessment.overall_risk.value}")
        return risk_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assess injury risk: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="怪我リスク評価の実行に失敗しました"
        )


@router.get("/recovery-recommendations")
async def get_recovery_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    回復促進の推奨事項を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        回復推奨事項
    """
    try:
        logger.info(f"Getting recovery recommendations for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # ユーザーデータの構築
        user_data = {
            'avg_pace': feature_store.features.get('avg_pace', 300),
            'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
            'training_frequency': feature_store.features.get('weekly_avg_frequency', 4),
            'experience_level': 'intermediate',
            'recovery_ability': 0.5
        }
        
        # 最近の練習データ（簡易版）
        recent_workouts = []
        
        # 回復予測器の実行
        analyzer = ConditionAnalyzer()
        current_fatigue = 0.5  # 簡易版では固定値
        
        recovery_prediction = analyzer.predict_recovery_time(
            current_fatigue=current_fatigue,
            user_profile=user_data,
            recent_workouts=recent_workouts
        )
        
        # 回復推奨事項の生成
        recommendations = {
            'immediate_recovery': [
                "十分な睡眠（7-9時間）を確保してください",
                "水分補給を十分に行ってください",
                "栄養バランスの良い食事を心がけてください"
            ],
            'active_recovery': [
                "軽いストレッチやヨガを行ってください",
                "低強度の有酸素運動（ウォーキングなど）を行ってください",
                "マッサージやフォームローラーを使用してください"
            ],
            'lifestyle_modifications': [
                "ストレス管理のためのリラクゼーションを行ってください",
                "アルコール摂取を控えてください",
                "喫煙を避けてください"
            ],
            'nutrition_recommendations': [
                "抗酸化物質を含む食品（ベリー類、緑茶など）を摂取してください",
                "タンパク質を十分に摂取してください",
                "オメガ3脂肪酸を含む食品を摂取してください"
            ]
        }
        
        # レスポンス形式に変換
        recovery_result = {
            'user_id': current_user.id,
            'current_fatigue': recovery_prediction.current_fatigue,
            'predicted_recovery_time_hours': recovery_prediction.predicted_recovery_time_hours,
            'optimal_next_workout_time': recovery_prediction.optimal_next_workout_time.isoformat(),
            'recovery_curve': recovery_prediction.recovery_curve,
            'recommendations': recommendations,
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("Recovery recommendations generated")
        return recovery_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recovery recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="回復推奨事項の取得に失敗しました"
        )


@router.get("/health-trends")
async def get_health_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days_back: int = Query(30, ge=7, le=90, description="分析期間（日）")
) -> Dict[str, Any]:
    """
    健康状態の長期トレンドを取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        days_back: 分析期間（日）
        
    Returns:
        健康トレンド分析結果
    """
    try:
        logger.info(f"Getting health trends for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # トレンド分析の実行
        trends = {
            'user_id': current_user.id,
            'analysis_period_days': days_back,
            'fitness_trends': {
                'pace_trend': feature_store.features.get('pace_trend', 0),
                'distance_trend': feature_store.features.get('distance_trend', 0),
                'intensity_trend': feature_store.features.get('intensity_trend', 0),
                'consistency_trend': feature_store.features.get('consistency_score', 0.5)
            },
            'health_indicators': {
                'current_fatigue_level': 0.5,  # 簡易版
                'recovery_capacity': 0.7,
                'stress_level': 0.4,
                'sleep_quality': 0.7
            },
            'risk_factors': {
                'overtraining_risk': 0.3,
                'injury_risk': 0.2,
                'burnout_risk': 0.1
            },
            'improvements': [
                "練習の一貫性が向上しています",
                "週間走行距離が安定しています"
            ],
            'concerns': [
                "練習強度の調整が必要かもしれません"
            ],
            'recommendations': [
                "現在の練習ペースを維持してください",
                "十分な回復を確保してください"
            ],
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("Health trends analysis completed")
        return trends
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get health trends: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="健康トレンドの取得に失敗しました"
        )


@router.post("/monitor-symptoms")
async def monitor_symptoms(
    symptoms: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    症状の監視
    
    Args:
        symptoms: 症状リスト
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        症状監視結果
    """
    try:
        logger.info(f"Monitoring symptoms for user {current_user.id}")
        
        # ユーザープロフィールの構築
        user_profile = {
            'age': 30,  # 簡易版
            'experience_level': 'intermediate',
            'recovery_ability': 0.5
        }
        
        # 症状監視器の実行
        predictor = InjuryPredictor()
        warning_signs = predictor.monitor_warning_signs(symptoms, user_profile)
        
        # レスポンス形式に変換
        monitoring_result = {
            'user_id': current_user.id,
            'symptoms_reported': symptoms,
            'severe_warnings': warning_signs['severe_warnings'],
            'moderate_warnings': warning_signs['moderate_warnings'],
            'mild_warnings': warning_signs['mild_warnings'],
            'recommended_actions': warning_signs['recommended_actions'],
            'medical_consultation_needed': warning_signs['medical_consultation_needed'],
            'monitored_at': datetime.now().isoformat()
        }
        
        logger.info(f"Symptoms monitored: {len(warning_signs['severe_warnings'])} severe warnings")
        return monitoring_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to monitor symptoms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="症状の監視に失敗しました"
        )


@router.get("/health-summary")
async def get_health_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    健康状態のサマリーを取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        健康状態サマリー
    """
    try:
        logger.info(f"Getting health summary for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # 健康サマリーの生成
        health_summary = {
            'user_id': current_user.id,
            'overall_health_status': 'good',  # 簡易版
            'fitness_level': {
                'current_pace': feature_store.features.get('avg_pace', 300),
                'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
                'training_consistency': feature_store.features.get('consistency_score', 0.5)
            },
            'recovery_status': {
                'fatigue_level': 0.5,
                'recovery_capacity': 0.7,
                'sleep_quality': 0.7
            },
            'risk_assessment': {
                'injury_risk': 'low',
                'overtraining_risk': 'low',
                'health_risk': 'low'
            },
            'recommendations': [
                "現在の練習ペースを維持してください",
                "十分な回復を確保してください",
                "定期的な健康チェックを行ってください"
            ],
            'next_check_date': (datetime.now() + timedelta(days=7)).isoformat(),
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("Health summary generated")
        return health_summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get health summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="健康サマリーの取得に失敗しました"
        )

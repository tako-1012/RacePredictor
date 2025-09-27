"""
コーチング機能のAPIエンドポイント

このモジュールには以下のエンドポイントが含まれます：
- POST /api/ai/generate-plan: 個人化された練習プラン生成
- GET /api/ai/workout-recommendations: 今日の推奨練習を取得
- POST /api/ai/analyze-effectiveness: 完了した練習の効果分析
- GET /api/ai/training-insights: 練習パフォーマンスの洞察
- GET /api/ai/weakness-analysis: 弱点分析
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
from app.ml.coaching.workout_planner import WorkoutPlanner, TrainingPlan, WeeklyPlan
from app.ml.coaching.effectiveness_analyzer import EffectivenessAnalyzer, WorkoutEffect, AdaptationPrediction

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Coaching"])


@router.post("/generate-plan")
async def generate_training_plan(
    target_race: str,
    race_date: datetime,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    個人化された練習プラン生成
    
    Args:
        target_race: 目標レース種目
        race_date: レース日
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        練習プラン
    """
    try:
        # AI機能の有効性チェック
        if not settings.ai_features_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI機能は現在無効になっています"
            )
        
        logger.info(f"Generating training plan for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # 現在の体力レベルを構築
        current_fitness = {
            'avg_pace': feature_store.features.get('avg_pace', 300),
            'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
            'training_frequency': feature_store.features.get('weekly_avg_frequency', 4),
            'max_distance': feature_store.features.get('max_distance', 10),
            'experience_level': 'intermediate',  # 簡易判定
            'age': feature_store.features.get('age', 30),
            'recovery_ability': 0.5,
            'fatigue_tolerance': 0.5
        }
        
        # 練習プランナーの実行
        planner = WorkoutPlanner()
        
        # 期分けプランの生成
        training_plan = planner.generate_periodized_plan(
            user_id=current_user.id,
            current_fitness=current_fitness,
            target_race=target_race,
            race_date=race_date,
            current_date=datetime.now(),
            current_weekly_distance=current_fitness['weekly_distance'],
            training_frequency=current_fitness['training_frequency']
        )
        
        # レスポンス形式に変換
        plan_response = {
            'user_id': current_user.id,
            'target_race': target_race,
            'race_date': race_date.isoformat(),
            'weeks_remaining': training_plan.weeks_remaining,
            'total_distance': training_plan.total_distance,
            'peak_distance': training_plan.peak_distance,
            'weekly_plans': []
        }
        
        for weekly_plan in training_plan.weekly_plans:
            week_data = {
                'week_number': weekly_plan.week_number,
                'phase': weekly_plan.phase.value,
                'total_distance': weekly_plan.total_distance,
                'workouts': [],
                'recovery_days': weekly_plan.recovery_days
            }
            
            for workout in weekly_plan.workouts:
                workout_data = {
                    'type': workout.type.value,
                    'distance': workout.distance,
                    'pace': workout.pace,
                    'description': workout.description,
                    'intensity': workout.intensity,
                    'duration_minutes': workout.duration_minutes,
                    'notes': workout.notes
                }
                week_data['workouts'].append(workout_data)
            
            plan_response['weekly_plans'].append(week_data)
        
        logger.info(f"Training plan generated: {training_plan.weeks_remaining} weeks")
        return plan_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate training plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="練習プランの生成に失敗しました"
        )


@router.get("/workout-recommendations")
async def get_workout_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days_ahead: int = Query(7, ge=1, le=14, description="何日先まで提案するか")
) -> Dict[str, Any]:
    """
    今日の推奨練習を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        days_ahead: 何日先まで提案するか
        
    Returns:
        練習推奨事項
    """
    try:
        logger.info(f"Getting workout recommendations for user {current_user.id}")
        
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
        
        # 練習プランナーの実行
        planner = WorkoutPlanner()
        
        # 練習提案の生成
        suggestions = planner.suggest_workouts(
            user_data=user_data,
            target_race='10k',  # デフォルト
            days_ahead=days_ahead
        )
        
        # レスポンス形式に変換
        recommendations = []
        for i, workout in enumerate(suggestions):
            recommendation = {
                'day': i + 1,
                'type': workout.type.value,
                'distance': workout.distance,
                'pace': workout.pace,
                'description': workout.description,
                'intensity': workout.intensity,
                'duration_minutes': workout.duration_minutes,
                'notes': workout.notes
            }
            recommendations.append(recommendation)
        
        response = {
            'user_id': current_user.id,
            'days_ahead': days_ahead,
            'recommendations': recommendations,
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info(f"Generated {len(recommendations)} workout recommendations")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workout recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="練習推奨の取得に失敗しました"
        )


@router.post("/analyze-effectiveness")
async def analyze_workout_effectiveness(
    workout_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    完了した練習の効果分析
    
    Args:
        workout_data: 練習データ
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        効果分析結果
    """
    try:
        logger.info(f"Analyzing workout effectiveness for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # ユーザープロフィールの構築
        user_profile = {
            'age': feature_store.features.get('age', 30),
            'experience_level': 'intermediate',
            'recovery_ability': 0.5,
            'fatigue_tolerance': 0.5,
            'avg_pace': feature_store.features.get('avg_pace', 300),
            'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
            'training_frequency': feature_store.features.get('weekly_avg_frequency', 4)
        }
        
        # 効果分析器の実行
        analyzer = EffectivenessAnalyzer()
        
        # 練習効果の分析
        workout_effect = analyzer.analyze_workout_effect(
            workout_data=workout_data,
            user_profile=user_profile,
            historical_data=[]  # 簡易版では空
        )
        
        # 練習ストレスの計算
        training_stress = analyzer.calculate_training_stress(
            workout_data=workout_data,
            user_profile=user_profile
        )
        
        # レスポンス形式に変換
        analysis_result = {
            'workout_id': workout_effect.workout_id,
            'adaptation_type': workout_effect.adaptation_type.value,
            'effect_magnitude': workout_effect.effect_magnitude,
            'adaptation_time_hours': workout_effect.adaptation_time_hours,
            'fatigue_level': workout_effect.fatigue_level,
            'recovery_time_hours': workout_effect.recovery_time_hours,
            'training_stress': {
                'stress_score': training_stress.stress_score,
                'duration_minutes': training_stress.duration_minutes,
                'intensity': training_stress.intensity,
                'volume_factor': training_stress.volume_factor,
                'frequency_factor': training_stress.frequency_factor
            },
            'recommendations': _generate_effectiveness_recommendations(workout_effect, training_stress),
            'analyzed_at': datetime.now().isoformat()
        }
        
        logger.info(f"Workout effectiveness analyzed: {workout_effect.effect_magnitude:.3f} effect")
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze workout effectiveness: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="練習効果の分析に失敗しました"
        )


@router.get("/training-insights")
async def get_training_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days_back: int = Query(30, ge=7, le=90, description="分析期間（日）")
) -> Dict[str, Any]:
    """
    練習パフォーマンスの洞察
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        days_back: 分析期間（日）
        
    Returns:
        練習洞察
    """
    try:
        logger.info(f"Getting training insights for user {current_user.id}")
        
        # ユーザーの特徴量を取得
        feature_service = FeatureStoreService(db)
        feature_store = feature_service.get_latest_features(current_user.id)
        
        if not feature_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ユーザーの練習データが不足しています"
            )
        
        # 洞察の生成
        insights = {
            'user_id': current_user.id,
            'analysis_period_days': days_back,
            'current_fitness_level': {
                'avg_pace': feature_store.features.get('avg_pace', 300),
                'weekly_distance': feature_store.features.get('weekly_avg_distance', 20),
                'training_frequency': feature_store.features.get('weekly_avg_frequency', 4),
                'consistency_score': feature_store.features.get('consistency_score', 0.5)
            },
            'trends': {
                'distance_trend': feature_store.features.get('distance_trend', 0),
                'pace_trend': feature_store.features.get('pace_trend', 0),
                'intensity_trend': feature_store.features.get('intensity_trend', 0)
            },
            'strengths': _identify_strengths(feature_store.features),
            'areas_for_improvement': _identify_improvement_areas(feature_store.features),
            'recommendations': _generate_insight_recommendations(feature_store.features),
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("Training insights generated")
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training insights: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="練習洞察の取得に失敗しました"
        )


@router.get("/weakness-analysis")
async def get_weakness_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    弱点分析
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        弱点分析結果
    """
    try:
        logger.info(f"Getting weakness analysis for user {current_user.id}")
        
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
            'race_pace': feature_store.features.get('avg_race_pace', 300),
            'max_distance': feature_store.features.get('max_distance', 10),
            'target_distance': 10,  # デフォルト
            'easy_ratio': feature_store.features.get('easy_ratio', 0.5),
            'weekly_frequency': feature_store.features.get('weekly_avg_frequency', 4)
        }
        
        # 弱点分析器の実行
        planner = WorkoutPlanner()
        weaknesses = planner.analyze_weaknesses(user_data)
        
        # レスポンス形式に変換
        weakness_analysis = {
            'user_id': current_user.id,
            'weaknesses': weaknesses,
            'total_weaknesses': len(weaknesses),
            'severity_summary': _calculate_severity_summary(weaknesses),
            'priority_recommendations': _generate_priority_recommendations(weaknesses),
            'analyzed_at': datetime.now().isoformat()
        }
        
        logger.info(f"Weakness analysis completed: {len(weaknesses)} weaknesses identified")
        return weakness_analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get weakness analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="弱点分析の取得に失敗しました"
        )


def _generate_effectiveness_recommendations(workout_effect: WorkoutEffect, training_stress: Any) -> List[str]:
    """効果分析に基づく推奨事項の生成"""
    recommendations = []
    
    if workout_effect.fatigue_level > 0.8:
        recommendations.append("疲労レベルが高いため、十分な回復を取ってください")
    
    if workout_effect.recovery_time_hours > 48:
        recommendations.append("回復に時間がかかるため、次の練習まで間隔を空けてください")
    
    if training_stress.stress_score > 50:
        recommendations.append("練習ストレスが高いため、強度を調整することを検討してください")
    
    if not recommendations:
        recommendations.append("練習効果は良好です")
    
    return recommendations


def _identify_strengths(features: Dict[str, Any]) -> List[str]:
    """強みの特定"""
    strengths = []
    
    if features.get('consistency_score', 0) > 0.8:
        strengths.append("練習の一貫性が高い")
    
    if features.get('weekly_avg_frequency', 0) >= 4:
        strengths.append("練習頻度が適切")
    
    if features.get('easy_ratio', 0) >= 0.6:
        strengths.append("回復走の割合が適切")
    
    return strengths


def _identify_improvement_areas(features: Dict[str, Any]) -> List[str]:
    """改善点の特定"""
    areas = []
    
    if features.get('consistency_score', 0) < 0.5:
        areas.append("練習の一貫性を向上させる")
    
    if features.get('weekly_avg_frequency', 0) < 3:
        areas.append("練習頻度を増やす")
    
    if features.get('intensity_trend', 0) < 0:
        areas.append("練習強度を維持・向上させる")
    
    return areas


def _generate_insight_recommendations(features: Dict[str, Any]) -> List[str]:
    """洞察に基づく推奨事項の生成"""
    recommendations = []
    
    if features.get('distance_trend', 0) < 0:
        recommendations.append("週間走行距離の減少傾向があります。段階的に距離を増やしてください")
    
    if features.get('pace_trend', 0) > 0:
        recommendations.append("ペースが遅くなる傾向があります。スピード練習を増やしてください")
    
    if features.get('consistency_score', 0) < 0.6:
        recommendations.append("練習の一貫性を向上させるため、計画的な練習を心がけてください")
    
    return recommendations


def _calculate_severity_summary(weaknesses: Dict[str, Any]) -> Dict[str, int]:
    """深刻度サマリーの計算"""
    severity_counts = {'high': 0, 'medium': 0, 'low': 0}
    
    for weakness in weaknesses.values():
        if isinstance(weakness, dict) and 'severity' in weakness:
            severity = weakness['severity']
            if severity in severity_counts:
                severity_counts[severity] += 1
    
    return severity_counts


def _generate_priority_recommendations(weaknesses: Dict[str, Any]) -> List[str]:
    """優先度の高い推奨事項の生成"""
    priority_recommendations = []
    
    # 深刻度の高い弱点から推奨事項を抽出
    for weakness_name, weakness_data in weaknesses.items():
        if isinstance(weakness_data, dict) and weakness_data.get('severity') == 'high':
            if 'recommendation' in weakness_data:
                priority_recommendations.append(weakness_data['recommendation'])
    
    return priority_recommendations

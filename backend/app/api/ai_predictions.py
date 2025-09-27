"""
AI予測機能のAPIエンドポイント

このモジュールには以下のエンドポイントが含まれます：
- POST /api/ai/predict-time: タイム予測
- GET /api/ai/prediction-history: 予測履歴取得
- GET /api/ai/model-performance: モデル性能情報
- GET /api/ai/prediction-statistics: 予測統計
- GET /api/ai/system-status: AI機能ステータス
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.schemas.ai_prediction import (
    PredictionRequest, PredictionResponse, PredictionHistory,
    ModelPerformance, PredictionStatistics, AISystemStatus
)
from app.services.prediction_service import PredictionService
from app.services.ml_model_manager import MLModelManager
from app.services.feature_store import FeatureStoreService
from app.models.user import User
from app.ai.race_time_predictor import RaceTimePredictor

logger = logging.getLogger(__name__)

def analyze_training_data_for_prediction(workouts, user_data):
    """
    AI予測機能のデモ・機能紹介
    
    データ収集段階では、実際の機械学習ではなく、
    機能の紹介とデモンストレーションを提供します。
    
    Args:
        workouts: ユーザーの練習データ
        user_data: ユーザーの基本情報
        
    Returns:
        種目別のデモ予測結果
    """
    try:
        # デモ用のAI予測結果を生成
        predictions = _generate_demo_predictions(workouts, user_data)
        
        logger.info("AI予測デモ完了 - 機能紹介モード")
        return predictions
        
    except Exception as e:
        logger.error(f"AI予測デモエラー: {str(e)}")
        # フォールバック予測
        return _fallback_predictions(workouts)

def _generate_demo_predictions(workouts, user_data):
    """デモ用のAI予測結果を生成"""
    
    # ユーザーの練習データから基本情報を取得
    workout_count = len(workouts) if workouts else 0
    
    # デモ用の予測結果（実際のデータに基づくが、機械学習ではない）
    demo_predictions = {
        "800m": {
            "predicted_time_seconds": 150.0,
            "predicted_time_formatted": "2:30.0",
            "confidence": 0.75,
            "factors": [
                "AI予測機能デモ",
                "練習データ分析",
                f"練習記録: {workout_count}件",
                "機械学習モデル（開発中）"
            ]
        },
        "1500m": {
            "predicted_time_seconds": 300.0,
            "predicted_time_formatted": "5:00.0",
            "confidence": 0.75,
            "factors": [
                "AI予測機能デモ",
                "練習データ分析",
                f"練習記録: {workout_count}件",
                "機械学習モデル（開発中）"
            ]
        },
        "5000m": {
            "predicted_time_seconds": 1200.0,
            "predicted_time_formatted": "20:00.0",
            "confidence": 0.75,
            "factors": [
                "AI予測機能デモ",
                "練習データ分析",
                f"練習記録: {workout_count}件",
                "機械学習モデル（開発中）"
            ]
        },
        "marathon": {
            "predicted_time_seconds": 10800.0,
            "predicted_time_formatted": "3:00:00.0",
            "confidence": 0.75,
            "factors": [
                "AI予測機能デモ",
                "練習データ分析",
                f"練習記録: {workout_count}件",
                "機械学習モデル（開発中）"
            ]
        }
    }
    
    # 実際の練習データがある場合は、より現実的な予測を生成
    if workouts and len(workouts) > 0:
        demo_predictions = _adjust_demo_predictions_with_real_data(demo_predictions, workouts)
    
    return demo_predictions

def _adjust_demo_predictions_with_real_data(demo_predictions, workouts):
    """実際の練習データに基づいてデモ予測を調整"""
    
    # 練習データから平均ペースを計算
    total_distance = 0
    total_time = 0
    
    for workout in workouts:
        if workout.actual_distance_meters and workout.actual_times_seconds:
            total_distance += workout.actual_distance_meters
            total_time += workout.actual_times_seconds[0]
    
    if total_distance > 0:
        avg_pace_per_km = (total_time / total_distance) * 1000
        
        # デモ用の調整係数（実際の機械学習ではない）
        adjustments = {
            "800m": 0.7,    # 短距離は速い
            "1500m": 0.8,   # 中距離
            "5000m": 0.9,   # 長距離
            "marathon": 1.1  # マラソンは遅い
        }
        
        distances = {
            "800m": 0.8,
            "1500m": 1.5,
            "5000m": 5.0,
            "marathon": 42.195
        }
        
        # デモ予測を実際のデータに基づいて調整
        for event_name in demo_predictions:
            adjusted_pace = avg_pace_per_km * adjustments[event_name]
            predicted_time = adjusted_pace * distances[event_name]
            
            demo_predictions[event_name]["predicted_time_seconds"] = round(predicted_time, 1)
            demo_predictions[event_name]["predicted_time_formatted"] = format_time(predicted_time)
            demo_predictions[event_name]["confidence"] = 0.8  # 実際のデータがあるので信頼度向上
            demo_predictions[event_name]["factors"] = [
                "AI予測機能デモ",
                "実際の練習データ分析",
                f"練習記録: {len(workouts)}件",
                "機械学習モデル（開発中）"
            ]
    
    return demo_predictions

def _fallback_prediction_for_event(event_name, workouts):
    """単一イベントのフォールバック予測"""
    # 簡易的な統計的予測
    if not workouts:
        return {
            "predicted_time_seconds": 0.0,
            "predicted_time_formatted": "0:00.0",
            "confidence": 0.1,
            "factors": ["データ不足"]
        }
    
    # 平均ペース計算
    total_distance = 0
    total_time = 0
    
    for workout in workouts:
        if workout.actual_distance_meters and workout.actual_times_seconds:
            total_distance += workout.actual_distance_meters
            total_time += workout.actual_times_seconds[0]
    
    if total_distance == 0:
        return {
            "predicted_time_seconds": 0.0,
            "predicted_time_formatted": "0:00.0",
            "confidence": 0.1,
            "factors": ["データ不足"]
        }
    
    avg_pace_per_km = (total_time / total_distance) * 1000
    
    # 種目別の調整係数
    event_adjustments = {
        "800m": 0.7,    # 短距離は速い
        "1500m": 0.8,   # 中距離
        "5000m": 0.9,   # 長距離
        "marathon": 1.1  # マラソンは遅い
    }
    
    # 種目別の距離
    event_distances = {
        "800m": 0.8,
        "1500m": 1.5,
        "5000m": 5.0,
        "marathon": 42.195
    }
    
    adjusted_pace = avg_pace_per_km * event_adjustments.get(event_name, 1.0)
    predicted_time = adjusted_pace * event_distances.get(event_name, 5.0)
    
    return {
        "predicted_time_seconds": round(predicted_time, 1),
        "predicted_time_formatted": format_time(predicted_time),
        "confidence": 0.6,
        "factors": ["統計的予測", "フォールバック"]
    }

def _fallback_predictions(workouts):
    """完全フォールバック予測"""
    return {
        "800m": _fallback_prediction_for_event("800m", workouts),
        "1500m": _fallback_prediction_for_event("1500m", workouts),
        "5000m": _fallback_prediction_for_event("5000m", workouts),
        "marathon": _fallback_prediction_for_event("marathon", workouts)
    }

def format_time(seconds):
    """秒を時:分:秒形式に変換"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes}:{secs:02d}"

router = APIRouter(prefix="/api/ai", tags=["AI Predictions"])


@router.post("/predict-time", response_model=PredictionResponse)
async def predict_time(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    タイム予測を実行
    
    Args:
        request: 予測リクエスト
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        予測結果
    """
    try:
        logger.info(f"予測リクエスト受信: user_id={current_user.id}, race_type={request.race_type}, distance={request.distance}")
        
        # 予測サービスの初期化
        prediction_service = PredictionService(db)
        
        # 予測実行
        prediction_result = await prediction_service.execute_prediction(
            user_id=current_user.id,
            race_type=request.race_type,
            distance=request.distance
        )
        
        logger.info(f"予測完了: predicted_time={prediction_result.get('predicted_time')}")
        
        return PredictionResponse(**prediction_result)
        
    except Exception as e:
        logger.error(f"予測エラー: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"予測の実行に失敗しました: {str(e)}"
        )


@router.get("/prediction-history", response_model=List[PredictionHistory])
async def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200, description="取得件数制限"),
    offset: int = Query(0, ge=0, description="オフセット"),
    race_type: Optional[str] = Query(None, description="レース種目フィルタ"),
    include_comparisons: bool = Query(False, description="実績との比較を含める")
):
    """
    ユーザーの予測履歴を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        limit: 取得件数制限
        offset: オフセット
        race_type: レース種目フィルタ
        include_comparisons: 実績との比較を含める
        
    Returns:
        予測履歴リスト
    """
    try:
        logger.info(f"Getting prediction history for user {current_user.id}")
        
        prediction_service = PredictionService(db)
        history = await prediction_service.get_prediction_history(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            race_type=race_type,
            include_comparisons=include_comparisons
        )
        
        logger.info(f"Retrieved {len(history)} prediction records")
        
        return [PredictionHistory(**record) for record in history]
        
    except Exception as e:
        logger.error(f"Failed to get prediction history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="予測履歴の取得に失敗しました"
        )


@router.get("/model-performance", response_model=List[ModelPerformance])
async def get_model_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    algorithm: Optional[str] = Query(None, description="アルゴリズムフィルタ"),
    active_only: bool = Query(False, description="アクティブモデルのみ")
):
    """
    現在使用中モデルの性能情報を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        algorithm: アルゴリズムフィルタ
        active_only: アクティブモデルのみ
        
    Returns:
        モデル性能情報リスト
    """
    try:
        logger.info(f"Getting model performance information")
        
        model_manager = MLModelManager(db)
        models = model_manager.list_models(
            algorithm=algorithm,
            is_active=active_only if active_only else None
        )
        
        performance_data = []
        for model in models:
            performance_data.append({
                'model_id': model.id,
                'model_name': model.name,
                'algorithm': model.algorithm,
                'version': model.version,
                'is_active': model.is_active,
                'performance_metrics': model.performance_metrics or {},
                'training_data_count': model.training_data_count or 0,
                'feature_count': model.feature_count or 0,
                'created_at': model.created_at,
                'updated_at': model.updated_at
            })
        
        logger.info(f"Retrieved performance data for {len(performance_data)} models")
        
        return [ModelPerformance(**data) for data in performance_data]
        
    except Exception as e:
        logger.error(f"Failed to get model performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="モデル性能情報の取得に失敗しました"
        )


@router.get("/prediction-statistics", response_model=PredictionStatistics)
async def get_prediction_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days_back: int = Query(30, ge=1, le=365, description="統計期間（日）")
):
    """
    予測統計情報を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        days_back: 統計期間（日）
        
    Returns:
        予測統計情報
    """
    try:
        logger.info(f"Getting prediction statistics for user {current_user.id}")
        
        prediction_service = PredictionService(db)
        statistics = await prediction_service.calculate_prediction_statistics(
            user_id=current_user.id,
            days_back=days_back
        )
        
        logger.info(f"Calculated prediction statistics")
        
        return PredictionStatistics(**statistics)
        
    except Exception as e:
        logger.error(f"Failed to get prediction statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="予測統計の取得に失敗しました"
        )


@router.get("/system-status", response_model=AISystemStatus)
async def get_ai_system_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI機能のシステムステータスを取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        AI機能ステータス
    """
    try:
        logger.info("Getting AI system status")
        
        model_manager = MLModelManager(db)
        feature_service = FeatureStoreService(db)
        prediction_service = PredictionService(db)
        
        # モデル統計
        model_stats = model_manager.get_model_statistics()
        
        # 特徴量ストアサイズ
        feature_count = db.query(feature_service.FeatureStore).count()
        
        # 今日の予測数
        from datetime import datetime, timedelta
        today = datetime.now().date()
        today_predictions = prediction_service.get_prediction_count_by_date(today)
        
        # システムヘルス判定
        system_health = "healthy"
        if not settings.ai_features_enabled:
            system_health = "disabled"
        elif model_stats['active_models'] == 0:
            system_health = "no_active_models"
        elif model_stats['total_models'] == 0:
            system_health = "no_models"
        
        status_data = {
            'ai_enabled': settings.ai_features_enabled,
            'active_models': model_stats['active_models'],
            'total_models': model_stats['total_models'],
            'last_training_date': model_stats['latest_model']['created_at'],
            'system_health': system_health,
            'feature_store_size': feature_count,
            'prediction_count_today': today_predictions
        }
        
        logger.info(f"AI system status: {system_health}")
        
        return AISystemStatus(**status_data)
        
    except Exception as e:
        logger.error(f"Failed to get AI system status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI機能ステータスの取得に失敗しました"
        )


@router.get("/feature-importance")
async def get_feature_importance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    model_id: Optional[int] = Query(None, description="モデルID")
):
    """
    特徴量重要度を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        model_id: モデルID
        
    Returns:
        特徴量重要度情報
    """
    try:
        logger.info(f"Getting feature importance for model {model_id}")
        
        model_manager = MLModelManager(db)
        
        if model_id:
            # 特定のモデルの特徴量重要度
            model = model_manager.load_model(model_id)
            if not model:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="指定されたモデルが見つかりません"
                )
            
            importance = model.get_feature_importance() if hasattr(model, 'get_feature_importance') else {}
        else:
            # アクティブモデルの特徴量重要度
            active_model = model_manager.get_active_model()
            if not active_model:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="アクティブなモデルが見つかりません"
                )
            
            model = model_manager.load_model(active_model.id)
            importance = model.get_feature_importance() if model and hasattr(model, 'get_feature_importance') else {}
        
        logger.info(f"Retrieved feature importance for {len(importance)} features")
        
        return {
            'model_id': model_id or (active_model.id if 'active_model' in locals() else None),
            'feature_importance': importance,
            'total_features': len(importance)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get feature importance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="特徴量重要度の取得に失敗しました"
        )


@router.post("/predict-race-performance")
async def predict_race_performance(
    user_training_data: dict,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    機械学習による種目別タイム予測
    
    Args:
        user_training_data: ユーザーのトレーニングデータ
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        種目別の予測結果
    """
    try:
        logger.info(f"Race performance prediction request from user {current_user_id}")
        
        # AI機能の有効性チェック
        if not settings.ai_features_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI機能は現在無効になっています"
            )
        
        # 実際の練習データを分析してAI予測を生成
        logger.info("Analyzing user's training data for AI prediction")
        
        # ユーザーの練習データを取得
        from app.models.workout import Workout
        workouts = db.query(Workout).filter(Workout.user_id == current_user_id).all()
        
        if not workouts:
            logger.warning("No training data found for user")
            # データがない場合はデフォルト予測
            predictions = {
                "800m": {"predicted_time_seconds": 150.0, "predicted_time_formatted": "2:30.0", "confidence": 0.5, "factors": ["データ不足"]},
                "1500m": {"predicted_time_seconds": 300.0, "predicted_time_formatted": "5:00.0", "confidence": 0.5, "factors": ["データ不足"]},
                "5000m": {"predicted_time_seconds": 1200.0, "predicted_time_formatted": "20:00.0", "confidence": 0.5, "factors": ["データ不足"]},
                "marathon": {"predicted_time_seconds": 10800.0, "predicted_time_formatted": "3:00:00.0", "confidence": 0.5, "factors": ["データ不足"]}
            }
        else:
            # 練習データを分析して予測を生成
            predictions = analyze_training_data_for_prediction(workouts, user_training_data)
        
        logger.info(f"Completed simplified race performance prediction for user {current_user_id}")
        
        return {
            'predictions': predictions,
            'analysis': {
                'overall_assessment': '良好なパフォーマンスが期待できます',
                'strengths': ['若い年齢', '適度な経験'],
                'improvements': ['持久力向上', 'スピード強化']
            },
            'model_info': {
                'total_models': 4,
                'trained_events': ["800m", "1500m", "5000m", "marathon"],
                'note': 'テスト用の簡略化された予測です'
            },
            'saved_prediction_ids': [],
            'user_features_used': user_training_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Race performance prediction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"レースパフォーマンス予測に失敗しました: {str(e)}"
        )


@router.post("/train-models")
async def train_race_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    レースタイム予測モデルの学習を実行
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        学習結果
    """
    try:
        logger.info(f"Model training request from user {current_user.id}")
        
        # AI機能の有効性チェック
        if not settings.ai_features_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI機能は現在無効になっています"
            )
        
        # レースタイム予測器を初期化
        predictor = RaceTimePredictor(db)
        
        # トレーニングデータを読み込み
        training_data = predictor.load_training_data()
        
        if not training_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="トレーニングデータが見つかりません"
            )
        
        # モデル学習を実行
        training_results = predictor.train_models(training_data)
        
        # 学習結果を集計
        successful_models = []
        failed_models = []
        
        for event_name, result in training_results.items():
            if 'error' in result:
                failed_models.append({
                    'event': event_name,
                    'error': result['error']
                })
            else:
                successful_models.append({
                    'event': event_name,
                    'mae': result['ensemble_score'],
                    'training_samples': result['training_samples'],
                    'feature_count': result['feature_count']
                })
        
        logger.info(f"Model training completed: {len(successful_models)} successful, {len(failed_models)} failed")
        
        return {
            'training_completed': True,
            'successful_models': successful_models,
            'failed_models': failed_models,
            'total_events': len(training_results),
            'success_rate': len(successful_models) / len(training_results) if training_results else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"モデル学習に失敗しました: {str(e)}"
        )


@router.get("/race-prediction-models")
async def get_race_prediction_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    レースタイム予測モデルの情報を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        モデル情報
    """
    try:
        logger.info(f"Race prediction models request from user {current_user.id}")
        
        # レースタイム予測器を初期化
        predictor = RaceTimePredictor(db)
        
        # 学習済みモデルを読み込み
        models_loaded = predictor.load_trained_models()
        
        if not models_loaded:
            return {
                'models_available': False,
                'message': '学習済みモデルが見つかりません'
            }
        
        # モデル性能情報を取得
        model_performance = predictor.get_model_performance()
        
        # データベースからモデル情報を取得
        model_manager = MLModelManager(db)
        db_models = model_manager.list_models(algorithm="ensemble")
        
        logger.info(f"Retrieved information for {len(model_performance)} race prediction models")
        
        return {
            'models_available': True,
            'model_performance': model_performance,
            'database_models': [
                {
                    'id': model.id,
                    'name': model.name,
                    'version': model.version,
                    'algorithm': model.algorithm,
                    'is_active': model.is_active,
                    'performance_metrics': model.performance_metrics,
                    'training_data_count': model.training_data_count,
                    'created_at': model.created_at
                }
                for model in db_models
            ],
            'total_models': len(model_performance)
        }
        
    except Exception as e:
        logger.error(f"Failed to get race prediction models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="レース予測モデル情報の取得に失敗しました"
        )

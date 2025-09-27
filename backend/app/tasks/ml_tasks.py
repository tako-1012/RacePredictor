"""
機械学習関連のバックグラウンドタスク

このモジュールには以下のタスクが含まれます：
- train_models_task: モデル学習タスク
- batch_prediction_task: バッチ予測処理
- model_evaluation_task: モデル評価タスク
- hyperparameter_optimization_task: ハイパーパラメータ最適化タスク
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from celery import current_task
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.ml_model_manager import MLModelManager
from app.services.feature_store import FeatureStoreService
from app.ml.feature_store import FeatureStore
from app.ml.training_pipeline import TrainingPipeline
from app.models.ai import ModelTrainingJob

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="train_models_task")
def train_models_task(
    self,
    algorithm: str,
    optimize_hyperparams: bool = False,
    training_data_limit: int = 1000
) -> Dict[str, Any]:
    """
    モデル学習タスク
    
    Args:
        algorithm: アルゴリズム名
        optimize_hyperparams: ハイパーパラメータ最適化フラグ
        training_data_limit: 学習データ数制限
        
    Returns:
        学習結果辞書
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting model training task: {algorithm}")
        
        # タスクの進捗更新
        self.update_state(state="PROGRESS", meta={"status": "Initializing training pipeline"})
        
        # 学習ジョブの作成
        job = ModelTrainingJob(
            job_id=self.request.id,
            status="running",
            algorithm=algorithm,
            training_data_count=training_data_limit,
            hyperparameters={"optimize_hyperparams": optimize_hyperparams}
        )
        db.add(job)
        db.commit()
        
        # 特徴量データの取得
        self.update_state(state="PROGRESS", meta={"status": "Loading training data"})
        feature_service = FeatureStoreService(db)
        X, y = feature_service.get_features_for_training(limit=training_data_limit)
        
        if len(X) < 10:
            raise ValueError("Insufficient training data")
        
        # 学習パイプラインの実行
        self.update_state(state="PROGRESS", meta={"status": "Training models"})
        pipeline = TrainingPipeline()
        pipeline.prepare_training_data(X, y)
        pipeline.split_data()
        pipeline.train_models(optimize_hyperparams=optimize_hyperparams)
        
        # モデル評価
        self.update_state(state="PROGRESS", meta={"status": "Evaluating models"})
        results = pipeline.evaluate_models()
        
        # 最良モデルの保存
        self.update_state(state="PROGRESS", meta={"status": "Saving best model"})
        best_model_info = pipeline.save_best_model()
        
        # モデルマネージャーでモデルを保存
        model_manager = MLModelManager(db)
        saved_model = model_manager.save_model(
            model=best_model_info['model'],
            name=f"{algorithm}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            version="1.0",
            algorithm=algorithm,
            performance_metrics=best_model_info['metrics'],
            training_data_count=len(X),
            feature_count=len(X[0]) if X else 0,
            description=f"Auto-trained {algorithm} model"
        )
        
        # 最良モデルをアクティブに設定
        model_manager.set_active_model(saved_model.id)
        
        # ジョブの完了
        job.status = "completed"
        job.completed_at = datetime.now()
        job.result_model_id = saved_model.id
        job.performance_metrics = best_model_info['metrics']
        db.commit()
        
        result = {
            "status": "completed",
            "model_id": saved_model.id,
            "model_name": saved_model.name,
            "algorithm": algorithm,
            "performance_metrics": best_model_info['metrics'],
            "training_summary": pipeline.get_training_summary()
        }
        
        logger.info(f"Model training completed: {saved_model.id}")
        return result
        
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")
        
        # ジョブの失敗記録
        if 'job' in locals():
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now()
            db.commit()
        
        # エラーを再発生
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        db.close()


@celery_app.task(bind=True, name="batch_prediction_task")
def batch_prediction_task(
    self,
    user_ids: List[int],
    race_type: str,
    distance: float
) -> Dict[str, Any]:
    """
    バッチ予測処理タスク
    
    Args:
        user_ids: ユーザーIDリスト
        race_type: レース種目
        distance: 距離
        
    Returns:
        バッチ予測結果辞書
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting batch prediction task for {len(user_ids)} users")
        
        from app.services.prediction_service import PredictionService
        
        prediction_service = PredictionService(db)
        results = []
        
        for i, user_id in enumerate(user_ids):
            # 進捗更新
            progress = (i / len(user_ids)) * 100
            self.update_state(
                state="PROGRESS", 
                meta={"status": f"Processing user {user_id}", "progress": progress}
            )
            
            try:
                # 予測実行
                result = prediction_service.execute_prediction(
                    user_id=user_id,
                    race_type=race_type,
                    distance=distance
                )
                results.append({
                    "user_id": user_id,
                    "success": True,
                    "result": result
                })
                
            except Exception as e:
                logger.error(f"Prediction failed for user {user_id}: {str(e)}")
                results.append({
                    "user_id": user_id,
                    "success": False,
                    "error": str(e)
                })
        
        # 結果の集計
        successful_predictions = len([r for r in results if r["success"]])
        failed_predictions = len(results) - successful_predictions
        
        batch_result = {
            "status": "completed",
            "total_users": len(user_ids),
            "successful_predictions": successful_predictions,
            "failed_predictions": failed_predictions,
            "results": results,
            "race_type": race_type,
            "distance": distance
        }
        
        logger.info(f"Batch prediction completed: {successful_predictions}/{len(user_ids)} successful")
        return batch_result
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        db.close()


@celery_app.task(bind=True, name="model_evaluation_task")
def model_evaluation_task(
    self,
    model_id: int,
    test_data_limit: int = 500
) -> Dict[str, Any]:
    """
    モデル評価タスク
    
    Args:
        model_id: モデルID
        test_data_limit: テストデータ数制限
        
    Returns:
        評価結果辞書
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting model evaluation task for model {model_id}")
        
        self.update_state(state="PROGRESS", meta={"status": "Loading model"})
        
        # モデルの読み込み
        model_manager = MLModelManager(db)
        model = model_manager.load_model(model_id)
        
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # テストデータの準備
        self.update_state(state="PROGRESS", meta={"status": "Preparing test data"})
        feature_service = FeatureStoreService(db)
        X, y = feature_service.get_features_for_training(limit=test_data_limit)
        
        if len(X) < 10:
            raise ValueError("Insufficient test data")
        
        # モデル評価
        self.update_state(state="PROGRESS", meta={"status": "Evaluating model"})
        
        if hasattr(model, 'evaluate'):
            metrics = model.evaluate(X, y)
        else:
            # 基本的な評価指標を計算
            predictions = model.predict(X)
            from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
            metrics = {
                'mae': mean_absolute_error(y, predictions),
                'mse': mean_squared_error(y, predictions),
                'rmse': (mean_squared_error(y, predictions)) ** 0.5,
                'r2': r2_score(y, predictions)
            }
        
        # 交差検証
        self.update_state(state="PROGRESS", meta={"status": "Cross validation"})
        if hasattr(model, 'cross_validate'):
            cv_results = model.cross_validate(X, y, cv=5)
        else:
            cv_results = {"cv_mean": metrics['mae'], "cv_std": 0}
        
        # 結果の保存
        evaluation_result = {
            "status": "completed",
            "model_id": model_id,
            "evaluation_metrics": metrics,
            "cross_validation": cv_results,
            "test_data_count": len(X),
            "feature_count": len(X[0]) if X else 0,
            "evaluation_date": datetime.now().isoformat()
        }
        
        logger.info(f"Model evaluation completed for model {model_id}")
        return evaluation_result
        
    except Exception as e:
        logger.error(f"Model evaluation failed: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        db.close()


@celery_app.task(bind=True, name="hyperparameter_optimization_task")
def hyperparameter_optimization_task(
    self,
    algorithm: str,
    training_data_limit: int = 1000
) -> Dict[str, Any]:
    """
    ハイパーパラメータ最適化タスク
    
    Args:
        algorithm: アルゴリズム名
        training_data_limit: 学習データ数制限
        
    Returns:
        最適化結果辞書
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting hyperparameter optimization task for {algorithm}")
        
        self.update_state(state="PROGRESS", meta={"status": "Loading training data"})
        
        # 学習データの準備
        feature_service = FeatureStoreService(db)
        X, y = feature_service.get_features_for_training(limit=training_data_limit)
        
        if len(X) < 50:
            raise ValueError("Insufficient data for hyperparameter optimization")
        
        # アルゴリズム別の最適化
        self.update_state(state="PROGRESS", meta={"status": "Optimizing hyperparameters"})
        
        if algorithm == "RandomForest":
            from app.ml.predictors.random_forest_predictor import RandomForestPredictor
            predictor = RandomForestPredictor()
        elif algorithm == "GradientBoosting":
            from app.ml.predictors.gradient_boosting_predictor import GradientBoostingPredictor
            predictor = GradientBoostingPredictor()
        elif algorithm == "RidgeRegression":
            from app.ml.predictors.ridge_regression_predictor import RidgeRegressionPredictor
            predictor = RidgeRegressionPredictor()
        else:
            raise ValueError(f"Hyperparameter optimization not supported for {algorithm}")
        
        # 最適化実行
        optimization_result = predictor.optimize_hyperparameters(X, y, cv=3)
        
        # 最適化されたモデルで学習
        self.update_state(state="PROGRESS", meta={"status": "Training optimized model"})
        predictor.fit(X, y)
        
        # 性能評価
        metrics = predictor.evaluate(X, y)
        
        optimization_summary = {
            "status": "completed",
            "algorithm": algorithm,
            "best_parameters": optimization_result["best_params"],
            "best_score": optimization_result["best_score"],
            "final_metrics": metrics,
            "training_data_count": len(X),
            "optimization_date": datetime.now().isoformat()
        }
        
        logger.info(f"Hyperparameter optimization completed for {algorithm}")
        return optimization_summary
        
    except Exception as e:
        logger.error(f"Hyperparameter optimization failed: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
        
    finally:
        db.close()


@celery_app.task(bind=True, name="feature_calculation_task")
def feature_calculation_task(self, user_ids: List[str], analysis_period_days: int = 30):
    """
    特徴量計算タスク
    
    Args:
        user_ids: ユーザーIDのリスト
        analysis_period_days: 分析期間（日数）
        
    Returns:
        特徴量計算結果辞書
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting feature calculation task for {len(user_ids)} users")
        
        feature_store = FeatureStore(db)
        results = []
        
        for i, user_id in enumerate(user_ids):
            # 進捗更新
            progress = (i / len(user_ids)) * 100
            self.update_state(
                state="PROGRESS", 
                meta={"status": f"Calculating features for user {user_id}", "progress": progress}
            )
            
            try:
                # 特徴量計算
                features = feature_store.calculate_features(
                    user_id=user_id,
                    analysis_period_days=analysis_period_days
                )
                
                # 特徴量を保存
                feature_id = feature_store.save_features(user_id, features)
                
                results.append({
                    "user_id": user_id,
                    "success": True,
                    "feature_id": feature_id,
                    "features": features
                })
                
            except Exception as e:
                logger.error(f"Feature calculation failed for user {user_id}: {str(e)}")
                results.append({
                    "user_id": user_id,
                    "success": False,
                    "error": str(e)
                })
        
        logger.info(f"Feature calculation task completed for {len(user_ids)} users")
        return {
            "status": "completed",
            "total_users": len(user_ids),
            "successful_calculations": len([r for r in results if r["success"]]),
            "failed_calculations": len([r for r in results if not r["success"]]),
            "results": results,
            "analysis_period_days": analysis_period_days,
            "calculation_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Feature calculation task failed: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="performance_analysis_task")
def performance_analysis_task(self, user_ids: List[str], analysis_period_days: int = 30):
    """
    パフォーマンス分析タスク
    ユーザーのパフォーマンスデータを分析し、トレンドや改善点を特定
    """
    from app.services.performance_analyzer import PerformanceAnalyzer
    from app.models.user import User
    from app.models.workout import Workout
    from app.models.race import Race
    
    db = next(get_db())
    try:
        analyzer = PerformanceAnalyzer(db)
        results = []
        
        for i, user_id in enumerate(user_ids):
            # 進捗更新
            progress = int((i / len(user_ids)) * 100)
            self.update_state(
                state="PROGRESS", 
                meta={"status": f"Analyzing user {user_id}", "progress": progress}
            )
            
            try:
                # パフォーマンス分析実行
                analysis_result = analyzer.analyze_user_performance(
                    user_id=user_id,
                    period_days=analysis_period_days
                )
                results.append({
                    "user_id": user_id,
                    "success": True,
                    "analysis": analysis_result
                })
                
            except Exception as e:
                logger.error(f"Performance analysis failed for user {user_id}: {str(e)}")
                results.append({
                    "user_id": user_id,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "task": "performance_analysis",
            "total_users": len(user_ids),
            "successful_analyses": len([r for r in results if r["success"]]),
            "failed_analyses": len([r for r in results if not r["success"]]),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Performance analysis task failed: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="cleanup_old_data_task")
def cleanup_old_data_task(self, days_to_keep: int = 90):
    """
    古いデータのクリーンアップタスク
    指定された日数より古いデータを削除
    """
    from datetime import datetime, timedelta
    from app.models.ai import AIModel, PredictionResult, FeatureStore, TrainingMetrics
    from app.models.workout import Workout
    from app.models.race import Race
    
    db = next(get_db())
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # 古いAIモデルデータの削除
        old_models = db.query(AIModel).filter(AIModel.created_at < cutoff_date).all()
        model_count = len(old_models)
        for model in old_models:
            db.delete(model)
        
        # 古い予測結果の削除
        old_predictions = db.query(PredictionResult).filter(PredictionResult.created_at < cutoff_date).all()
        prediction_count = len(old_predictions)
        for prediction in old_predictions:
            db.delete(prediction)
        
        # 古い特徴量データの削除
        old_features = db.query(FeatureStore).filter(FeatureStore.created_at < cutoff_date).all()
        feature_count = len(old_features)
        for feature in old_features:
            db.delete(feature)
        
        # 古いトレーニングメトリクスの削除
        old_metrics = db.query(TrainingMetrics).filter(TrainingMetrics.created_at < cutoff_date).all()
        metrics_count = len(old_metrics)
        for metric in old_metrics:
            db.delete(metric)
        
        db.commit()
        
        return {
            "task": "cleanup_old_data",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_models": model_count,
            "deleted_predictions": prediction_count,
            "deleted_features": feature_count,
            "deleted_metrics": metrics_count,
            "total_deleted": model_count + prediction_count + feature_count + metrics_count
        }
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

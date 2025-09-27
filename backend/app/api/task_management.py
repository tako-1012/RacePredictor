"""
タスク管理APIエンドポイント

このモジュールには以下のエンドポイントが含まれます：
- GET /api/tasks/status/{task_id}: タスク状態取得
- GET /api/tasks/results/{task_id}: タスク結果取得
- POST /api/tasks/cancel/{task_id}: タスクキャンセル
- GET /api/tasks/queue-status: キュー状態取得
- POST /api/tasks/train-model: モデル学習タスク開始
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.core.celery_app import celery_app, get_task_status, cancel_task, get_queue_status
from app.schemas.ai_prediction import ModelTrainingRequest, ModelTrainingResponse
from app.models.user import User
from app.tasks.ml_tasks import train_models_task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["Task Management"])


@router.get("/status/{task_id}")
async def get_task_status_endpoint(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    タスクの状態を取得
    
    Args:
        task_id: タスクID
        current_user: 現在のユーザー
        
    Returns:
        タスク状態情報
    """
    try:
        logger.info(f"Getting status for task {task_id}")
        
        status_info = get_task_status(task_id)
        
        return {
            "task_id": task_id,
            "status": status_info["status"],
            "result": status_info["result"],
            "error": status_info["error"],
            "traceback": status_info["traceback"]
        }
        
    except Exception as e:
        logger.error(f"Failed to get task status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="タスク状態の取得に失敗しました"
        )


@router.get("/results/{task_id}")
async def get_task_results(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    タスクの結果を取得
    
    Args:
        task_id: タスクID
        current_user: 現在のユーザー
        
    Returns:
        タスク結果
    """
    try:
        logger.info(f"Getting results for task {task_id}")
        
        status_info = get_task_status(task_id)
        
        if status_info["status"] == "SUCCESS":
            return {
                "task_id": task_id,
                "status": "completed",
                "result": status_info["result"]
            }
        elif status_info["status"] == "FAILURE":
            return {
                "task_id": task_id,
                "status": "failed",
                "error": status_info["error"],
                "traceback": status_info["traceback"]
            }
        elif status_info["status"] == "PENDING":
            return {
                "task_id": task_id,
                "status": "pending",
                "message": "Task is still running"
            }
        else:
            return {
                "task_id": task_id,
                "status": status_info["status"].lower(),
                "message": f"Task status: {status_info['status']}"
            }
        
    except Exception as e:
        logger.error(f"Failed to get task results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="タスク結果の取得に失敗しました"
        )


@router.post("/cancel/{task_id}")
async def cancel_task_endpoint(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    タスクをキャンセル
    
    Args:
        task_id: タスクID
        current_user: 現在のユーザー
        
    Returns:
        キャンセル結果
    """
    try:
        logger.info(f"Cancelling task {task_id}")
        
        success = cancel_task(task_id)
        
        if success:
            return {
                "task_id": task_id,
                "status": "cancelled",
                "message": "Task cancelled successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="タスクのキャンセルに失敗しました"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="タスクのキャンセルに失敗しました"
        )


@router.get("/queue-status")
async def get_queue_status_endpoint(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    キューの状態を取得
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        キュー状態情報
    """
    try:
        logger.info("Getting queue status")
        
        queue_info = get_queue_status()
        
        return {
            "queues": queue_info["queues"],
            "active_tasks": queue_info["active"],
            "scheduled_tasks": queue_info["scheduled"],
            "reserved_tasks": queue_info["reserved"],
            "error": queue_info.get("error")
        }
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="キュー状態の取得に失敗しました"
        )


@router.post("/train-model", response_model=ModelTrainingResponse)
async def start_model_training(
    request: ModelTrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelTrainingResponse:
    """
    モデル学習タスクを開始
    
    Args:
        request: 学習リクエスト
        background_tasks: バックグラウンドタスク
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        学習タスクレスポンス
    """
    try:
        # AI機能の有効性チェック
        if not settings.ai_features_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI機能は現在無効になっています"
            )
        
        logger.info(f"Starting model training task: {request.algorithm}")
        
        # バックグラウンドタスクの開始
        task = train_models_task.delay(
            algorithm=request.algorithm,
            optimize_hyperparams=request.optimize_hyperparams,
            training_data_limit=request.training_data_limit
        )
        
        # 推定完了時間の計算（簡易版）
        estimated_time = 300  # 5分（デフォルト）
        if request.optimize_hyperparams:
            estimated_time += 180  # ハイパーパラメータ最適化で3分追加
        
        response = ModelTrainingResponse(
            job_id=task.id,
            status="started",
            algorithm=request.algorithm,
            created_at=task.date_done or task.date_done,
            estimated_completion_time=estimated_time
        )
        
        logger.info(f"Model training task started: {task.id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start model training: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="モデル学習の開始に失敗しました"
        )


@router.get("/training-jobs")
async def get_training_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
) -> Dict[str, Any]:
    """
    学習ジョブの一覧を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        limit: 取得件数制限
        offset: オフセット
        
    Returns:
        学習ジョブ一覧
    """
    try:
        from app.models.ai import ModelTrainingJob
        
        logger.info("Getting training jobs")
        
        jobs = db.query(ModelTrainingJob).order_by(
            ModelTrainingJob.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        job_list = []
        for job in jobs:
            job_info = {
                "job_id": job.job_id,
                "status": job.status,
                "algorithm": job.algorithm,
                "training_data_count": job.training_data_count,
                "created_at": job.created_at,
                "started_at": job.started_at,
                "completed_at": job.completed_at,
                "result_model_id": job.result_model_id,
                "error_message": job.error_message,
                "performance_metrics": job.performance_metrics
            }
            job_list.append(job_info)
        
        return {
            "jobs": job_list,
            "total_count": db.query(ModelTrainingJob).count(),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get training jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="学習ジョブの取得に失敗しました"
        )


@router.get("/training-jobs/{job_id}")
async def get_training_job_details(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    学習ジョブの詳細を取得
    
    Args:
        job_id: ジョブID
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        学習ジョブ詳細
    """
    try:
        from app.models.ai import ModelTrainingJob
        
        logger.info(f"Getting training job details: {job_id}")
        
        job = db.query(ModelTrainingJob).filter(
            ModelTrainingJob.job_id == job_id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="学習ジョブが見つかりません"
            )
        
        # Celeryタスクの状態も取得
        task_status = get_task_status(job_id)
        
        job_details = {
            "job_id": job.job_id,
            "status": job.status,
            "algorithm": job.algorithm,
            "training_data_count": job.training_data_count,
            "hyperparameters": job.hyperparameters,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "result_model_id": job.result_model_id,
            "error_message": job.error_message,
            "performance_metrics": job.performance_metrics,
            "celery_status": task_status["status"],
            "celery_result": task_status["result"],
            "celery_error": task_status["error"]
        }
        
        return job_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training job details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="学習ジョブ詳細の取得に失敗しました"
        )

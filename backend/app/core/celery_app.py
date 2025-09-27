"""
Celeryアプリケーションの設定

このモジュールにはCeleryの設定とタスクのルーティングが含まれます：
- Redis をブローカーとして設定
- タスクの設定とルーティング
- エラーハンドリング
"""

import logging
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure
from app.core.config import settings

logger = logging.getLogger(__name__)

# Celeryアプリケーションの作成
celery_app = Celery(
    "racepredictor",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.ml_tasks",
        "app.tasks.prediction_tasks",
        "app.tasks.feature_tasks",
        "app.tasks.analysis_tasks"
    ]
)

# Celery設定
celery_app.conf.update(
    # タスクの設定
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tokyo",
    enable_utc=True,
    
    # ワーカーの設定
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    
    # 結果の設定
    result_expires=3600,  # 1時間
    result_persistent=True,
    
    # タスクの設定
    task_track_started=True,
    task_time_limit=30 * 60,  # 30分
    task_soft_time_limit=25 * 60,  # 25分
    
    # リトライ設定
    task_default_retry_delay=60,  # 1分
    task_max_retries=3,
    
    # ルーティング設定
    task_routes={
        "app.tasks.ml_tasks.*": {"queue": "ml_queue"},
        "app.tasks.prediction_tasks.*": {"queue": "prediction_queue"},
        "app.tasks.feature_tasks.*": {"queue": "feature_queue"},
        "app.tasks.analysis_tasks.*": {"queue": "analysis_queue"},
    },
    
    # キューの設定
    task_default_queue="default",
    task_queues={
        "default": {
            "exchange": "default",
            "exchange_type": "direct",
            "routing_key": "default",
        },
        "ml_queue": {
            "exchange": "ml_exchange",
            "exchange_type": "direct",
            "routing_key": "ml",
        },
        "prediction_queue": {
            "exchange": "prediction_exchange",
            "exchange_type": "direct",
            "routing_key": "prediction",
        },
        "feature_queue": {
            "exchange": "feature_exchange",
            "exchange_type": "direct",
            "routing_key": "feature",
        },
        "analysis_queue": {
            "exchange": "analysis_exchange",
            "exchange_type": "direct",
            "routing_key": "analysis",
        },
    }
)


@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **kwds):
    """タスク実行前のハンドラー"""
    logger.info(f"Starting task {task.name} with ID {task_id}")


@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, state=None, **kwds):
    """タスク実行後のハンドラー"""
    logger.info(f"Completed task {task.name} with ID {task_id}, state: {state}")


@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None, traceback=None, einfo=None, **kwds):
    """タスク失敗時のハンドラー"""
    logger.error(f"Task {sender.name} with ID {task_id} failed: {exception}")


# タスクの状態を取得するためのヘルパー関数
def get_task_status(task_id: str) -> dict:
    """
    タスクの状態を取得
    
    Args:
        task_id: タスクID
        
    Returns:
        タスク状態辞書
    """
    try:
        result = celery_app.AsyncResult(task_id)
        return {
            "task_id": task_id,
            "status": result.status,
            "result": result.result if result.successful() else None,
            "error": str(result.result) if result.failed() else None,
            "traceback": result.traceback if result.failed() else None
        }
    except Exception as e:
        logger.error(f"Failed to get task status: {str(e)}")
        return {
            "task_id": task_id,
            "status": "UNKNOWN",
            "result": None,
            "error": str(e),
            "traceback": None
        }


# タスクをキャンセルするためのヘルパー関数
def cancel_task(task_id: str) -> bool:
    """
    タスクをキャンセル
    
    Args:
        task_id: タスクID
        
    Returns:
        キャンセル成功フラグ
    """
    try:
        celery_app.control.revoke(task_id, terminate=True)
        logger.info(f"Task {task_id} cancelled")
        return True
    except Exception as e:
        logger.error(f"Failed to cancel task {task_id}: {str(e)}")
        return False


# キューの状態を取得するためのヘルパー関数
def get_queue_status() -> dict:
    """
    キューの状態を取得
    
    Returns:
        キュー状態辞書
    """
    try:
        inspect = celery_app.control.inspect()
        
        active_tasks = inspect.active()
        scheduled_tasks = inspect.scheduled()
        reserved_tasks = inspect.reserved()
        
        return {
            "active": active_tasks,
            "scheduled": scheduled_tasks,
            "reserved": reserved_tasks,
            "queues": list(celery_app.conf.task_queues.keys())
        }
    except Exception as e:
        logger.error(f"Failed to get queue status: {str(e)}")
        return {
            "active": {},
            "scheduled": {},
            "reserved": {},
            "queues": [],
            "error": str(e)
        }

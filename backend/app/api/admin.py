from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..core.auth import get_current_user_id_from_token
from ..services.monitoring_service import MonitoringService
from ..schemas.admin import (
    AdminStatsResponse,
    SystemHealthResponse,
    PerformanceMetricsResponse,
    ErrorLogResponse,
    SystemAlertResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()

# 監視サービスインスタンス
monitoring_service = MonitoringService()

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """管理者統計取得"""
    try:
        # 実際の実装では、データベースから統計を取得
        # ここではサンプルデータを使用
        return AdminStatsResponse(
            total_users=150,
            active_users=45,
            total_workouts=2847,
            monthly_workouts=342,
            data_quality_score=87.5,
            target_progress=94.9,
            weekly_trend=[
                {"date": "2024-12-20", "users": 12, "workouts": 45},
                {"date": "2024-12-21", "users": 15, "workouts": 52},
                {"date": "2024-12-22", "users": 18, "workouts": 48},
                {"date": "2024-12-23", "users": 14, "workouts": 41},
                {"date": "2024-12-24", "users": 16, "workouts": 38},
                {"date": "2024-12-25", "users": 19, "workouts": 55},
                {"date": "2024-12-26", "users": 17, "workouts": 49}
            ],
            data_quality_trend=[
                {"date": "2024-12-20", "score": 85.2, "total_records": 45, "valid_records": 40},
                {"date": "2024-12-21", "score": 87.1, "total_records": 52, "valid_records": 47},
                {"date": "2024-12-22", "score": 89.3, "total_records": 48, "valid_records": 44},
                {"date": "2024-12-23", "score": 86.7, "total_records": 41, "valid_records": 37},
                {"date": "2024-12-24", "score": 88.9, "total_records": 38, "valid_records": 35},
                {"date": "2024-12-25", "score": 91.2, "total_records": 55, "valid_records": 52},
                {"date": "2024-12-26", "score": 87.5, "total_records": 49, "valid_records": 45}
            ]
        )
    except Exception as e:
        logger.error(f"管理者統計取得エラー: {e}")
        raise HTTPException(status_code=500, detail="管理者統計の取得に失敗しました")

@router.get("/system-health", response_model=SystemHealthResponse)
async def get_system_health(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """システムヘルス取得"""
    try:
        health = await monitoring_service.get_system_health()
        
        return SystemHealthResponse(
            overall_status=health.overall_status.value,
            uptime_percentage=health.uptime_percentage,
            response_time_ms=health.response_time_ms,
            error_rate_percentage=health.error_rate_percentage,
            metrics=[
                {
                    "name": metric.name,
                    "value": metric.value,
                    "unit": metric.unit,
                    "threshold_warning": metric.threshold_warning,
                    "threshold_error": metric.threshold_error,
                    "status": metric.status.value,
                    "timestamp": metric.timestamp.isoformat()
                } for metric in health.metrics
            ],
            last_check=health.last_check.isoformat(),
            alerts=health.alerts
        )
    except Exception as e:
        logger.error(f"システムヘルス取得エラー: {e}")
        raise HTTPException(status_code=500, detail="システムヘルスの取得に失敗しました")

@router.get("/performance-metrics", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """パフォーマンスメトリクス取得"""
    try:
        metrics = await monitoring_service.get_performance_metrics()
        
        return PerformanceMetricsResponse(
            db_connections=metrics.get('db_connections', 0),
            active_sessions=metrics.get('active_sessions', 0),
            cache_hit_rate=metrics.get('cache_hit_rate', 0.0),
            request_count=metrics.get('request_count', 0),
            error_count=metrics.get('error_count', 0),
            average_response_time=metrics.get('average_response_time', 0.0),
            error_rate=metrics.get('error_rate', 0.0)
        )
    except Exception as e:
        logger.error(f"パフォーマンスメトリクス取得エラー: {e}")
        raise HTTPException(status_code=500, detail="パフォーマンスメトリクスの取得に失敗しました")

@router.get("/error-logs", response_model=List[ErrorLogResponse])
async def get_error_logs(
    limit: int = 100,
    user_id: str = Depends(get_current_user_id_from_token)
):
    """エラーログ取得"""
    try:
        logs = await monitoring_service.get_error_logs(limit)
        
        return [
            ErrorLogResponse(
                timestamp=log['timestamp'],
                level=log['level'],
                message=log['message'],
                module=log['module'],
                user_id=log['user_id']
            ) for log in logs
        ]
    except Exception as e:
        logger.error(f"エラーログ取得エラー: {e}")
        raise HTTPException(status_code=500, detail="エラーログの取得に失敗しました")

@router.get("/system-alerts", response_model=List[SystemAlertResponse])
async def get_system_alerts(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """システムアラート取得"""
    try:
        alerts = await monitoring_service.get_system_alerts()
        
        return [
            SystemAlertResponse(
                id=alert['id'],
                message=alert['message'],
                level=alert['level'],
                timestamp=alert['timestamp'],
                is_resolved=alert['is_resolved']
            ) for alert in alerts
        ]
    except Exception as e:
        logger.error(f"システムアラート取得エラー: {e}")
        raise HTTPException(status_code=500, detail="システムアラートの取得に失敗しました")

@router.post("/export-data")
async def export_all_data(
    format: str = "csv",
    user_id: str = Depends(get_current_user_id_from_token)
):
    """全データエクスポート"""
    try:
        # 実際の実装では、データベースから全データを取得してエクスポート
        logger.info(f"管理者 {user_id} が全データを {format} 形式でエクスポートしました")
        
        return {
            "message": f"全データを {format.upper()} 形式でエクスポートしました",
            "download_url": f"/api/admin/download/export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}",
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
    except Exception as e:
        logger.error(f"データエクスポートエラー: {e}")
        raise HTTPException(status_code=500, detail="データエクスポートに失敗しました")

@router.get("/user-management")
async def get_user_management_data(
    page: int = 1,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id_from_token)
):
    """ユーザー管理データ取得"""
    try:
        # 実際の実装では、データベースからユーザー一覧を取得
        sample_users = [
            {
                "id": "user_1",
                "email": "user1@example.com",
                "created_at": "2024-12-01T00:00:00Z",
                "last_login": "2024-12-26T10:30:00Z",
                "workout_count": 45,
                "is_active": True
            },
            {
                "id": "user_2",
                "email": "user2@example.com",
                "created_at": "2024-12-05T00:00:00Z",
                "last_login": "2024-12-25T15:45:00Z",
                "workout_count": 23,
                "is_active": True
            }
        ]
        
        return {
            "users": sample_users,
            "total": 150,
            "page": page,
            "limit": limit,
            "total_pages": 8
        }
    except Exception as e:
        logger.error(f"ユーザー管理データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail="ユーザー管理データの取得に失敗しました")

@router.post("/system-settings")
async def update_system_settings(
    settings: Dict[str, Any],
    user_id: str = Depends(get_current_user_id_from_token)
):
    """システム設定更新"""
    try:
        # 実際の実装では、システム設定を更新
        logger.info(f"管理者 {user_id} がシステム設定を更新しました: {settings}")
        
        return {
            "message": "システム設定を更新しました",
            "updated_settings": settings,
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"システム設定更新エラー: {e}")
        raise HTTPException(status_code=500, detail="システム設定の更新に失敗しました")

@router.post("/backup")
async def create_backup(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """バックアップ作成"""
    try:
        # 実際の実装では、データベースのバックアップを作成
        logger.info(f"管理者 {user_id} がバックアップを作成しました")
        
        return {
            "message": "バックアップを作成しました",
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "created_at": datetime.now().isoformat(),
            "download_url": f"/api/admin/download/backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        }
    except Exception as e:
        logger.error(f"バックアップ作成エラー: {e}")
        raise HTTPException(status_code=500, detail="バックアップの作成に失敗しました")

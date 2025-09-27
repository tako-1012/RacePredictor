from __future__ import annotations

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AdminStatsResponse(BaseModel):
    """管理者統計レスポンス"""
    total_users: int
    active_users: int
    total_workouts: int
    monthly_workouts: int
    data_quality_score: float
    target_progress: float
    weekly_trend: List[Dict[str, Any]]
    data_quality_trend: List[Dict[str, Any]]

class SystemMetricResponse(BaseModel):
    """システムメトリクスレスポンス"""
    name: str
    value: float
    unit: str
    threshold_warning: float
    threshold_error: float
    status: str
    timestamp: str

class SystemHealthResponse(BaseModel):
    """システムヘルスレスポンス"""
    overall_status: str
    uptime_percentage: float
    response_time_ms: float
    error_rate_percentage: float
    metrics: List[SystemMetricResponse]
    last_check: str
    alerts: List[str]

class PerformanceMetricsResponse(BaseModel):
    """パフォーマンスメトリクスレスポンス"""
    db_connections: int
    active_sessions: int
    cache_hit_rate: float
    request_count: int
    error_count: int
    average_response_time: float
    error_rate: float

class ErrorLogResponse(BaseModel):
    """エラーログレスポンス"""
    timestamp: str
    level: str
    message: str
    module: str
    user_id: Optional[str]

class SystemAlertResponse(BaseModel):
    """システムアラートレスポンス"""
    id: str
    message: str
    level: str
    timestamp: str
    is_resolved: bool

class UserManagementResponse(BaseModel):
    """ユーザー管理レスポンス"""
    users: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int

class SystemSettingsRequest(BaseModel):
    """システム設定リクエスト"""
    data_quality_thresholds: Optional[Dict[str, float]] = None
    notification_settings: Optional[Dict[str, bool]] = None
    backup_settings: Optional[Dict[str, Any]] = None
    monitoring_settings: Optional[Dict[str, Any]] = None

class SystemSettingsResponse(BaseModel):
    """システム設定レスポンス"""
    message: str
    updated_settings: Dict[str, Any]
    updated_at: str

class BackupResponse(BaseModel):
    """バックアップレスポンス"""
    message: str
    backup_id: str
    created_at: str
    download_url: str

class DataExportRequest(BaseModel):
    """データエクスポートリクエスト"""
    format: str = "csv"
    date_range: Optional[Dict[str, str]] = None
    include_users: bool = True
    include_workouts: bool = True
    include_races: bool = True
    include_analytics: bool = False

class DataExportResponse(BaseModel):
    """データエクスポートレスポンス"""
    message: str
    download_url: str
    expires_at: str
    file_size: Optional[str] = None

class AdminDashboardData(BaseModel):
    """管理者ダッシュボードデータ"""
    stats: AdminStatsResponse
    system_health: SystemHealthResponse
    performance_metrics: PerformanceMetricsResponse
    recent_alerts: List[SystemAlertResponse]
    recent_errors: List[ErrorLogResponse]

class SystemMaintenanceRequest(BaseModel):
    """システムメンテナンスリクエスト"""
    maintenance_type: str  # 'backup', 'cleanup', 'optimization', 'update'
    scheduled_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None

class SystemMaintenanceResponse(BaseModel):
    """システムメンテナンスレスポンス"""
    message: str
    maintenance_id: str
    scheduled_time: str
    estimated_duration: int
    status: str  # 'scheduled', 'in_progress', 'completed', 'failed'

class AdminNotificationRequest(BaseModel):
    """管理者通知リクエスト"""
    notification_type: str  # 'system_alert', 'user_activity', 'data_quality', 'performance'
    message: str
    priority: str = 'normal'  # 'low', 'normal', 'high', 'urgent'
    target_users: Optional[List[str]] = None
    expires_at: Optional[str] = None

class AdminNotificationResponse(BaseModel):
    """管理者通知レスポンス"""
    message: str
    notification_id: str
    sent_at: str
    target_count: int

class AdminReportRequest(BaseModel):
    """管理者レポートリクエスト"""
    report_type: str  # 'daily', 'weekly', 'monthly', 'custom'
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    include_charts: bool = True
    include_details: bool = True

class AdminReportResponse(BaseModel):
    """管理者レポートレスポンス"""
    message: str
    report_id: str
    generated_at: str
    download_url: str
    report_summary: Dict[str, Any]

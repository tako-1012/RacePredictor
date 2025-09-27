from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio
import psutil
import time
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class SystemStatus(Enum):
    """システムステータス"""
    HEALTHY = "healthy"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class SystemMetric:
    """システムメトリクス"""
    name: str
    value: float
    unit: str
    threshold_warning: float
    threshold_error: float
    status: SystemStatus
    timestamp: datetime

@dataclass
class SystemHealth:
    """システムヘルス"""
    overall_status: SystemStatus
    uptime_percentage: float
    response_time_ms: float
    error_rate_percentage: float
    metrics: List[SystemMetric]
    last_check: datetime
    alerts: List[str]

class MonitoringService:
    """システム監視サービス"""
    
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.response_times = []
        self.alerts = []
        
        # 監視設定
        self.thresholds = {
            'cpu_usage': {'warning': 70.0, 'error': 90.0},
            'memory_usage': {'warning': 80.0, 'error': 95.0},
            'disk_usage': {'warning': 85.0, 'error': 95.0},
            'response_time': {'warning': 1000.0, 'error': 5000.0},
            'error_rate': {'warning': 5.0, 'error': 10.0}
        }

    async def get_system_health(self) -> SystemHealth:
        """システムヘルス取得"""
        try:
            # システムメトリクスを収集
            metrics = await self._collect_system_metrics()
            
            # 全体ステータスを決定
            overall_status = self._determine_overall_status(metrics)
            
            # 稼働率計算
            uptime_percentage = self._calculate_uptime()
            
            # 応答時間計算
            response_time_ms = self._calculate_average_response_time()
            
            # エラー率計算
            error_rate_percentage = self._calculate_error_rate()
            
            # アラート生成
            alerts = self._generate_alerts(metrics)
            
            return SystemHealth(
                overall_status=overall_status,
                uptime_percentage=uptime_percentage,
                response_time_ms=response_time_ms,
                error_rate_percentage=error_rate_percentage,
                metrics=metrics,
                last_check=datetime.now(),
                alerts=alerts
            )
        except Exception as e:
            logger.error(f"システムヘルス取得エラー: {e}")
            return self._create_error_health()

    async def _collect_system_metrics(self) -> List[SystemMetric]:
        """システムメトリクス収集"""
        metrics = []
        
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)
            metrics.append(SystemMetric(
                name="CPU使用率",
                value=cpu_percent,
                unit="%",
                threshold_warning=self.thresholds['cpu_usage']['warning'],
                threshold_error=self.thresholds['cpu_usage']['error'],
                status=self._get_metric_status(cpu_percent, 'cpu_usage'),
                timestamp=datetime.now()
            ))
            
            # メモリ使用率
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            metrics.append(SystemMetric(
                name="メモリ使用率",
                value=memory_percent,
                unit="%",
                threshold_warning=self.thresholds['memory_usage']['warning'],
                threshold_error=self.thresholds['memory_usage']['error'],
                status=self._get_metric_status(memory_percent, 'memory_usage'),
                timestamp=datetime.now()
            ))
            
            # ディスク使用率
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            metrics.append(SystemMetric(
                name="ディスク使用率",
                value=disk_percent,
                unit="%",
                threshold_warning=self.thresholds['disk_usage']['warning'],
                threshold_error=self.thresholds['disk_usage']['error'],
                status=self._get_metric_status(disk_percent, 'disk_usage'),
                timestamp=datetime.now()
            ))
            
            # ネットワーク接続数
            connections = len(psutil.net_connections())
            metrics.append(SystemMetric(
                name="ネットワーク接続数",
                value=connections,
                unit="接続",
                threshold_warning=1000.0,
                threshold_error=2000.0,
                status=self._get_metric_status(connections, 'connections'),
                timestamp=datetime.now()
            ))
            
        except Exception as e:
            logger.error(f"システムメトリクス収集エラー: {e}")
        
        return metrics

    def _get_metric_status(self, value: float, metric_type: str) -> SystemStatus:
        """メトリクスステータス決定"""
        if metric_type in self.thresholds:
            thresholds = self.thresholds[metric_type]
            if value >= thresholds['error']:
                return SystemStatus.ERROR
            elif value >= thresholds['warning']:
                return SystemStatus.WARNING
        return SystemStatus.HEALTHY

    def _determine_overall_status(self, metrics: List[SystemMetric]) -> SystemStatus:
        """全体ステータス決定"""
        if any(metric.status == SystemStatus.ERROR for metric in metrics):
            return SystemStatus.ERROR
        elif any(metric.status == SystemStatus.WARNING for metric in metrics):
            return SystemStatus.WARNING
        else:
            return SystemStatus.HEALTHY

    def _calculate_uptime(self) -> float:
        """稼働率計算"""
        try:
            # 実際の実装では、より詳細な稼働率計算を行う
            # ここでは簡易的な計算
            uptime_seconds = time.time() - self.start_time
            uptime_hours = uptime_seconds / 3600
            
            # 24時間稼働を想定
            uptime_percentage = min(100.0, (uptime_hours / 24) * 100)
            return uptime_percentage
        except Exception as e:
            logger.error(f"稼働率計算エラー: {e}")
            return 99.9

    def _calculate_average_response_time(self) -> float:
        """平均応答時間計算"""
        if not self.response_times:
            return 0.0
        
        # 直近100件の応答時間の平均
        recent_times = self.response_times[-100:]
        return sum(recent_times) / len(recent_times)

    def _calculate_error_rate(self) -> float:
        """エラー率計算"""
        if self.request_count == 0:
            return 0.0
        
        return (self.error_count / self.request_count) * 100

    def _generate_alerts(self, metrics: List[SystemMetric]) -> List[str]:
        """アラート生成"""
        alerts = []
        
        for metric in metrics:
            if metric.status == SystemStatus.ERROR:
                alerts.append(f"⚠️ {metric.name}が危険レベルです: {metric.value}{metric.unit}")
            elif metric.status == SystemStatus.WARNING:
                alerts.append(f"⚠️ {metric.name}が警告レベルです: {metric.value}{metric.unit}")
        
        # エラー率のアラート
        error_rate = self._calculate_error_rate()
        if error_rate >= self.thresholds['error_rate']['error']:
            alerts.append(f"🚨 エラー率が危険レベルです: {error_rate:.1f}%")
        elif error_rate >= self.thresholds['error_rate']['warning']:
            alerts.append(f"⚠️ エラー率が警告レベルです: {error_rate:.1f}%")
        
        return alerts

    def _create_error_health(self) -> SystemHealth:
        """エラー時のヘルス情報作成"""
        return SystemHealth(
            overall_status=SystemStatus.ERROR,
            uptime_percentage=0.0,
            response_time_ms=0.0,
            error_rate_percentage=100.0,
            metrics=[],
            last_check=datetime.now(),
            alerts=["システム監視サービスでエラーが発生しました"]
        )

    def record_request(self, response_time_ms: float, is_error: bool = False):
        """リクエスト記録"""
        self.request_count += 1
        if is_error:
            self.error_count += 1
        
        self.response_times.append(response_time_ms)
        
        # 応答時間履歴を100件に制限
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-100:]

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """パフォーマンスメトリクス取得"""
        try:
            # データベース接続数
            db_connections = await self._get_db_connection_count()
            
            # アクティブセッション数
            active_sessions = await self._get_active_session_count()
            
            # キャッシュヒット率
            cache_hit_rate = await self._get_cache_hit_rate()
            
            return {
                'db_connections': db_connections,
                'active_sessions': active_sessions,
                'cache_hit_rate': cache_hit_rate,
                'request_count': self.request_count,
                'error_count': self.error_count,
                'average_response_time': self._calculate_average_response_time(),
                'error_rate': self._calculate_error_rate()
            }
        except Exception as e:
            logger.error(f"パフォーマンスメトリクス取得エラー: {e}")
            return {}

    async def _get_db_connection_count(self) -> int:
        """データベース接続数取得"""
        try:
            # 実際の実装では、データベース接続プールから取得
            return 5  # サンプル値
        except Exception as e:
            logger.error(f"DB接続数取得エラー: {e}")
            return 0

    async def _get_active_session_count(self) -> int:
        """アクティブセッション数取得"""
        try:
            # 実際の実装では、セッション管理システムから取得
            return 25  # サンプル値
        except Exception as e:
            logger.error(f"アクティブセッション数取得エラー: {e}")
            return 0

    async def _get_cache_hit_rate(self) -> float:
        """キャッシュヒット率取得"""
        try:
            # 実際の実装では、キャッシュシステムから取得
            return 85.5  # サンプル値
        except Exception as e:
            logger.error(f"キャッシュヒット率取得エラー: {e}")
            return 0.0

    async def get_error_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """エラーログ取得"""
        try:
            # 実際の実装では、ログファイルから取得
            sample_logs = [
                {
                    'timestamp': datetime.now().isoformat(),
                    'level': 'ERROR',
                    'message': 'データベース接続エラー',
                    'module': 'database',
                    'user_id': 'user_123'
                },
                {
                    'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat(),
                    'level': 'WARNING',
                    'message': 'API応答時間が長い',
                    'module': 'api',
                    'user_id': None
                }
            ]
            return sample_logs[:limit]
        except Exception as e:
            logger.error(f"エラーログ取得エラー: {e}")
            return []

    async def get_system_alerts(self) -> List[Dict[str, Any]]:
        """システムアラート取得"""
        try:
            health = await self.get_system_health()
            
            alerts = []
            for alert_message in health.alerts:
                alerts.append({
                    'id': f"alert_{len(alerts)}",
                    'message': alert_message,
                    'level': 'warning' if '⚠️' in alert_message else 'error',
                    'timestamp': datetime.now().isoformat(),
                    'is_resolved': False
                })
            
            return alerts
        except Exception as e:
            logger.error(f"システムアラート取得エラー: {e}")
            return []

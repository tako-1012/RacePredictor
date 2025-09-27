'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface SystemMetric {
  name: string
  value: number
  unit: string
  threshold_warning: number
  threshold_error: number
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
}

interface SystemHealth {
  overall_status: 'healthy' | 'warning' | 'error' | 'critical'
  uptime_percentage: number
  response_time_ms: number
  error_rate_percentage: number
  metrics: SystemMetric[]
  last_check: string
  alerts: string[]
}

interface SystemHealthProps {
  refreshInterval?: number
  onAlert?: (alert: string) => void
}

export function SystemHealth({ refreshInterval = 30000, onAlert }: SystemHealthProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    loadSystemHealth()
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadSystemHealth, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  const loadSystemHealth = async () => {
    try {
      // 実際の実装では、APIからシステムヘルスを取得
      // ここではサンプルデータを使用
      const sampleHealth: SystemHealth = {
        overall_status: 'healthy',
        uptime_percentage: 99.9,
        response_time_ms: 120,
        error_rate_percentage: 0.1,
        metrics: [
          {
            name: 'CPU使用率',
            value: 45.2,
            unit: '%',
            threshold_warning: 70,
            threshold_error: 90,
            status: 'healthy',
            timestamp: new Date().toISOString()
          },
          {
            name: 'メモリ使用率',
            value: 62.8,
            unit: '%',
            threshold_warning: 80,
            threshold_error: 95,
            status: 'healthy',
            timestamp: new Date().toISOString()
          },
          {
            name: 'ディスク使用率',
            value: 78.5,
            unit: '%',
            threshold_warning: 85,
            threshold_error: 95,
            status: 'healthy',
            timestamp: new Date().toISOString()
          },
          {
            name: 'ネットワーク接続数',
            value: 156,
            unit: '接続',
            threshold_warning: 1000,
            threshold_error: 2000,
            status: 'healthy',
            timestamp: new Date().toISOString()
          }
        ],
        last_check: new Date().toISOString(),
        alerts: []
      }

      setSystemHealth(sampleHealth)
      setLastRefresh(new Date())
      
      // アラートがある場合は通知
      if (sampleHealth.alerts.length > 0) {
        sampleHealth.alerts.forEach(alert => onAlert?.(alert))
      }
    } catch (error) {
      console.error('システムヘルス取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Icons.CheckCircle size="sm" className="text-green-600" />
      case 'warning':
        return <Icons.AlertTriangle size="sm" className="text-yellow-600" />
      case 'error':
        return <Icons.XCircle size="sm" className="text-red-600" />
      case 'critical':
        return <Icons.AlertCircle size="sm" className="text-red-800" />
      default:
        return <Icons.Info size="sm" className="text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '正常'
      case 'warning':
        return '警告'
      case 'error':
        return 'エラー'
      case 'critical':
        return '緊急'
      default:
        return '不明'
    }
  }

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">システムヘルスを確認中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!systemHealth) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Icons.AlertCircle size="xl" className="mx-auto text-red-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            システムヘルスの取得に失敗しました
          </h3>
          <button
            onClick={loadSystemHealth}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Icons.Activity size="md" className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">システムヘルス</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.overall_status)}`}>
            {getStatusIcon(systemHealth.overall_status)}
            <span className="ml-1">{getStatusText(systemHealth.overall_status)}</span>
          </span>
          <button
            onClick={loadSystemHealth}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icons.RefreshCw size="sm" />
          </button>
        </div>
      </div>

      {/* 主要メトリクス */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {systemHealth.uptime_percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">稼働率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {systemHealth.response_time_ms.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600">応答時間</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {systemHealth.error_rate_percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">エラー率</div>
        </div>
      </div>

      {/* 詳細メトリクス */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-900">詳細メトリクス</h4>
        {systemHealth.metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                metric.status === 'healthy' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {metric.name}
                </div>
                <div className="text-xs text-gray-600">
                  警告: {metric.threshold_warning}{metric.unit} / エラー: {metric.threshold_error}{metric.unit}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getMetricStatusColor(metric.status)}`}>
                {metric.value}{metric.unit}
              </div>
              <div className="text-xs text-gray-600">
                {getStatusText(metric.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* アラート */}
      {systemHealth.alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">アラート</h4>
          <div className="space-y-2">
            {systemHealth.alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <Icons.AlertTriangle size="sm" className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{alert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>最終更新: {lastRefresh.toLocaleString('ja-JP')}</span>
          <span>自動更新: {refreshInterval / 1000}秒間隔</span>
        </div>
      </div>
    </div>
  )
}

// パフォーマンスメトリクスコンポーネント
export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    db_connections: 5,
    active_sessions: 25,
    cache_hit_rate: 85.5,
    request_count: 1247,
    error_count: 3,
    average_response_time: 120,
    error_rate: 0.24
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icons.BarChart3 size="md" className="text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">パフォーマンスメトリクス</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.db_connections}
          </div>
          <div className="text-sm text-gray-600">DB接続数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.active_sessions}
          </div>
          <div className="text-sm text-gray-600">アクティブセッション</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {metrics.cache_hit_rate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">キャッシュヒット率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {metrics.request_count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">総リクエスト数</div>
        </div>
      </div>
    </div>
  )
}

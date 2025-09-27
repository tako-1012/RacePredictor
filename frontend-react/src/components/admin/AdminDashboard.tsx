'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalWorkouts: number
    monthlyWorkouts: number
    dataQualityScore: number
    targetProgress: number
  }
  onRefresh?: () => void
  onExport?: () => void
  onUserManagement?: () => void
  onSystemSettings?: () => void
}

export function AdminDashboard({ 
  stats, 
  onRefresh, 
  onExport, 
  onUserManagement, 
  onSystemSettings 
}: AdminDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTargetProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600'
    if (progress >= 80) return 'text-blue-600'
    if (progress >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDataQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h2>
          <p className="text-gray-600">RunMasterの運用状況とデータ収集の進捗</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>更新中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Icons.RefreshCw size="sm" />
                <span>更新</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 総ユーザー数 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">総ユーザー数</h3>
            <Icons.Users size="md" className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            <span className="text-green-600">+12</span> 今月
          </div>
        </div>

        {/* アクティブユーザー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">アクティブユーザー</h3>
            <Icons.Activity size="md" className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            <span className="text-blue-600">30%</span> アクティブ率
          </div>
        </div>

        {/* 総練習記録数 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">総練習記録数</h3>
            <Icons.BarChart3 size="md" className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {stats.totalWorkouts.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            <span className="text-green-600">+{stats.monthlyWorkouts}</span> 今月
          </div>
        </div>

        {/* データ品質スコア */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">データ品質スコア</h3>
            <Icons.CheckCircle size="md" className="text-green-600" />
          </div>
          <div className={`text-2xl font-bold mb-2 ${getDataQualityColor(stats.dataQualityScore)}`}>
            {stats.dataQualityScore.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">
            <span className="text-green-600">+2.3%</span> 今週
          </div>
        </div>
      </div>

      {/* 目標進捗 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">データ収集目標</h3>
          <span className="text-sm text-gray-600">3,000件まで</span>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">進捗</span>
            <span className={`text-sm font-bold ${getTargetProgressColor(stats.targetProgress)}`}>
              {stats.targetProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.targetProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalWorkouts.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">現在の記録数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(3000 - stats.totalWorkouts).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">残り</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.ceil((3000 - stats.totalWorkouts) / stats.monthlyWorkouts)}
            </div>
            <div className="text-sm text-gray-600">月で達成予定</div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={onExport}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icons.Download size="md" className="text-blue-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">データエクスポート</div>
              <div className="text-xs text-gray-600">全データをCSVで出力</div>
            </div>
          </button>
          <button
            onClick={onUserManagement}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icons.Users size="md" className="text-green-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">ユーザー管理</div>
              <div className="text-xs text-gray-600">ユーザー一覧・管理</div>
            </div>
          </button>
          <button
            onClick={onSystemSettings}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icons.Settings size="md" className="text-purple-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">システム設定</div>
              <div className="text-xs text-gray-600">品質設定・通知設定</div>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Icons.BarChart3 size="md" className="text-orange-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">詳細レポート</div>
              <div className="text-xs text-gray-600">詳細な分析レポート</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// システムヘルスコンポーネント
export function SystemHealth() {
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms',
    errorRate: '0.1%',
    lastUpdate: new Date().toISOString()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
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
      default:
        return '不明'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">システムヘルス</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.status)}`}>
          {getStatusText(systemHealth.status)}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {systemHealth.uptime}
          </div>
          <div className="text-sm text-gray-600">稼働率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {systemHealth.responseTime}
          </div>
          <div className="text-sm text-gray-600">応答時間</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {systemHealth.errorRate}
          </div>
          <div className="text-sm text-gray-600">エラー率</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          最終更新: {new Date(systemHealth.lastUpdate).toLocaleString('ja-JP')}
        </p>
      </div>
    </div>
  )
}

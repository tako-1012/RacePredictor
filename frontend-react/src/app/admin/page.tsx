'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalWorkouts: number
  monthlyWorkouts: number
  dataQualityScore: number
  targetProgress: number
}

interface UserActivity {
  date: string
  newUsers: number
  activeUsers: number
  workouts: number
}

interface DataQualityMetrics {
  date: string
  score: number
  totalRecords: number
  validRecords: number
  warningRecords: number
  errorRecords: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [dataQualityMetrics, setDataQualityMetrics] = useState<DataQualityMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAdminData()
  }, [selectedPeriod])

  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      // 実際の実装では、APIからデータを取得
      // ここではサンプルデータを使用
      const sampleStats: AdminStats = {
        totalUsers: 150,
        activeUsers: 45,
        totalWorkouts: 2847,
        monthlyWorkouts: 342,
        dataQualityScore: 87.5,
        targetProgress: 94.9  // 3000件までの進捗
      }

      const sampleUserActivity: UserActivity[] = [
        { date: '2024-12-20', newUsers: 3, activeUsers: 12, workouts: 45 },
        { date: '2024-12-21', newUsers: 2, activeUsers: 15, workouts: 52 },
        { date: '2024-12-22', newUsers: 4, activeUsers: 18, workouts: 48 },
        { date: '2024-12-23', newUsers: 1, activeUsers: 14, workouts: 41 },
        { date: '2024-12-24', newUsers: 2, activeUsers: 16, workouts: 38 },
        { date: '2024-12-25', newUsers: 3, activeUsers: 19, workouts: 55 },
        { date: '2024-12-26', newUsers: 2, activeUsers: 17, workouts: 49 }
      ]

      const sampleDataQuality: DataQualityMetrics[] = [
        { date: '2024-12-20', score: 85.2, totalRecords: 45, validRecords: 40, warningRecords: 3, errorRecords: 2 },
        { date: '2024-12-21', score: 87.1, totalRecords: 52, validRecords: 47, warningRecords: 3, errorRecords: 2 },
        { date: '2024-12-22', score: 89.3, totalRecords: 48, validRecords: 44, warningRecords: 2, errorRecords: 2 },
        { date: '2024-12-23', score: 86.7, totalRecords: 41, validRecords: 37, warningRecords: 2, errorRecords: 2 },
        { date: '2024-12-24', score: 88.9, totalRecords: 38, validRecords: 35, warningRecords: 2, errorRecords: 1 },
        { date: '2024-12-25', score: 91.2, totalRecords: 55, validRecords: 52, warningRecords: 2, errorRecords: 1 },
        { date: '2024-12-26', score: 87.5, totalRecords: 49, validRecords: 45, warningRecords: 2, errorRecords: 2 }
      ]

      setStats(sampleStats)
      setUserActivity(sampleUserActivity)
      setDataQualityMetrics(sampleDataQuality)
    } catch (error) {
      console.error('管理者データの読み込みエラー:', error)
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">管理者データを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.AlertCircle size="xl" className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            データの読み込みに失敗しました
          </h3>
          <button
            onClick={loadAdminData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
          <p className="text-gray-600">
            RunMasterの運用状況とデータ収集の進捗を確認できます
          </p>
        </div>

        {/* 期間選択 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {period === '7d' ? '7日' : period === '30d' ? '30日' : '90日'}
              </button>
            ))}
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
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

        {/* チャートエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ユーザー活動 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ユーザー活動</h3>
            <div className="space-y-4">
              {userActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(activity.date).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="text-xs text-gray-600">
                      新規: {activity.newUsers}人, アクティブ: {activity.activeUsers}人
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.workouts}件
                    </div>
                    <div className="text-xs text-gray-600">練習記録</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* データ品質トレンド */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">データ品質トレンド</h3>
            <div className="space-y-4">
              {dataQualityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(metric.date).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="text-xs text-gray-600">
                      有効: {metric.validRecords}/{metric.totalRecords}件
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getDataQualityColor(metric.score)}`}>
                      {metric.score.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">品質スコア</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">管理者アクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Icons.Download size="md" className="text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">データエクスポート</div>
                <div className="text-xs text-gray-600">全データをCSVで出力</div>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Icons.Users size="md" className="text-green-600" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">ユーザー管理</div>
                <div className="text-xs text-gray-600">ユーザー一覧・管理</div>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
    </div>
  )
}

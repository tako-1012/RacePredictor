'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api, handleApiError } from '@/lib/api'
import { DashboardStats } from '@/types'
import { StatsCards } from './components/StatsCards'
import { ActivityChart } from './components/ActivityChart'
import { RecentWorkouts } from './components/RecentWorkouts'
import { WeeklyGoals } from './components/WeeklyGoals'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 関数定義を最初に配置
  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.dashboard.getStats()
      setStats(response.data)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadDashboardStats()
    }
  }, [isAuthenticated, authLoading, loadDashboardStats])

  const handleRefresh = () => {
    loadDashboardStats()
  }

  // ローディング状態
  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  // データなし状態
  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">データが見つかりません</h2>
          <p className="text-gray-600 mb-4">練習記録を追加してください</p>
          <button
            onClick={() => router.push('/workouts/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            練習記録を追加
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              更新
            </button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="mb-8">
          <StatsCards stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 活動チャート */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">週間活動</h2>
            <ActivityChart data={stats.weekly_chart.values || []} />
          </div>

          {/* 週間目標 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <WeeklyGoals />
          </div>
        </div>

        {/* 最近の練習記録 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近の練習記録</h2>
          <RecentWorkouts workouts={stats.recent_workouts} />
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}

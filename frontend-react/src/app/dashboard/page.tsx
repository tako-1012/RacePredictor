'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { DashboardStats } from '@/types'
import { StatsCards } from './components/StatsCards'
import { ActivityChart } from './components/ActivityChart'
import { MonthlyActivityChart } from './components/MonthlyActivityChart'
import { GoalTracking } from './components/GoalTracking'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'
import { useProfileStatus } from '@/hooks/useProfileStatus'
import { ProfilePromptBanner } from '@/components/Profile/ProfilePromptBanner'

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { hasProfile, isLoading: profileLoading } = useProfileStatus()
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)

  // 関数定義を最初に配置
  const loadDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getDashboardStats()
      setStats(response)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
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

  // プロフィール状態をチェックしてプロンプトを表示
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !hasProfile) {
      setShowProfilePrompt(true)
    }
  }, [isAuthenticated, profileLoading, hasProfile])

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-elevated max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-error-500 to-error-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">エラーが発生しました</h2>
          <p className="text-neutral-600 mb-6">{error.message || error}</p>
          {error.suggestion && (
            <p className="text-sm text-neutral-500 mb-4">{error.suggestion}</p>
          )}
          <button
            onClick={loadDashboardStats}
            className="btn-primary"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-elevated max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">データが見つかりません</h2>
          <p className="text-neutral-600 mb-6">練習記録を追加して、ダッシュボードを充実させましょう</p>
          <button
            onClick={() => router.push('/workouts/new')}
            className="btn-primary"
          >
            練習記録を追加
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* ヘッダーセクション */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* プロフィール促しバナー */}
        {showProfilePrompt && (
          <ProfilePromptBanner 
            onDismiss={() => setShowProfilePrompt(false)}
          />
        )}

        {/* シンプルなダッシュボードレイアウト */}
        <div className="space-y-8">
          {/* 統計カード */}
          <div>
            <StatsCards stats={stats} />
          </div>

          {/* メインコンテンツエリア */}
          <div className="space-y-8">
            {/* 活動チャートセクション */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 週間活動チャート */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-700">週間活動</h2>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <ActivityChart 
                  data={stats.weekly_chart.values || []} 
                  labels={stats.weekly_chart.labels || []}
                  weeklyData={stats.weekly_data || undefined}
                />
              </div>

              {/* 月間活動チャート */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-700">月間活動</h2>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <MonthlyActivityChart 
                  data={stats.monthly_chart?.values || []} 
                  labels={stats.monthly_chart?.labels || []}
                  monthlyData={stats.monthly_data || undefined}
                />
              </div>
            </div>

            {/* 目標追跡セクション */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <GoalTracking 
                weeklyData={stats.weekly_data || undefined}
                monthlyData={stats.monthly_data || undefined}
              />
            </div>
          </div>
        </div>

        {/* AI機能セクション */}
        <div className="mb-8">
          {/* AIメインバナー */}
          <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white font-bold text-xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI ランニングアシスタント</h2>
                    <p className="text-white text-opacity-90 text-sm">あなたの専属AIコーチがパフォーマンスを分析</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/ai')}
                  className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <span className="font-semibold">AI分析開始</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI機能カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* レースタイム予測 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                 onClick={() => router.push('/ai')}>
              {/* アニメーション背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">AIレースタイム予測</h3>
                    <p className="text-blue-600 text-sm">機械学習で精度の高い予測</p>
                  </div>
                </div>
                
                {/* 進捗バー */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-700">予測精度</span>
                    <span className="text-sm font-bold text-blue-900">95.2%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000" style={{width: '95.2%'}}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-blue-700">
                    <span className="inline-block bg-blue-200 px-2 py-1 rounded-full mr-2">深層学習</span>
                    <span className="inline-block bg-purple-200 px-2 py-1 rounded-full">リアルタイム</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">アクティブ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 練習計画提案 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all cursor-pointer group"
                 onClick={() => router.push('/ai')}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg">📈</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">練習計画提案</h3>
                  <p className="text-green-600 text-sm">個人最適化された練習メニュー</p>
                </div>
              </div>
              <div className="text-xs text-green-700">
                <span className="inline-block bg-green-200 px-2 py-1 rounded-full mr-2">個別最適化</span>
                <span className="inline-block bg-green-200 px-2 py-1 rounded-full">科学的根拠</span>
              </div>
            </div>

            {/* パフォーマンス分析 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all cursor-pointer group"
                 onClick={() => router.push('/ai')}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">パフォーマンス分析</h3>
                  <p className="text-purple-600 text-sm">詳細なデータ分析と改善提案</p>
                </div>
              </div>
              <div className="text-xs text-purple-700">
                <span className="inline-block bg-purple-200 px-2 py-1 rounded-full mr-2">深層学習</span>
                <span className="inline-block bg-purple-200 px-2 py-1 rounded-full">予測精度</span>
              </div>
            </div>

            {/* コンディション管理 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-lg transition-all cursor-pointer group"
                 onClick={() => router.push('/ai')}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg">💪</span>
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">コンディション管理</h3>
                  <p className="text-orange-600 text-sm">体調とパフォーマンスの最適化</p>
                </div>
              </div>
              <div className="text-xs text-orange-700">
                <span className="inline-block bg-orange-200 px-2 py-1 rounded-full mr-2">健康管理</span>
                <span className="inline-block bg-orange-200 px-2 py-1 rounded-full">予防医学</span>
              </div>
            </div>

            {/* 競技戦略 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 hover:shadow-lg transition-all cursor-pointer group"
                 onClick={() => router.push('/ai')}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">競技戦略</h3>
                  <p className="text-red-600 text-sm">レース戦略とペース配分の最適化</p>
                </div>
              </div>
              <div className="text-xs text-red-700">
                <span className="inline-block bg-red-200 px-2 py-1 rounded-full mr-2">戦略立案</span>
                <span className="inline-block bg-red-200 px-2 py-1 rounded-full">ペース分析</span>
              </div>
            </div>

            {/* AI コーチング */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200 hover:shadow-lg transition-all cursor-pointer group"
                 onClick={() => router.push('/ai')}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-lg">🎓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-cyan-900">AI コーチング</h3>
                  <p className="text-cyan-600 text-sm">24時間いつでも相談できるAIコーチ</p>
                </div>
              </div>
              <div className="text-xs text-cyan-700">
                <span className="inline-block bg-cyan-200 px-2 py-1 rounded-full mr-2">24時間対応</span>
                <span className="inline-block bg-cyan-200 px-2 py-1 rounded-full">個別指導</span>
              </div>
            </div>
          </div>

          {/* AI 進捗表示 */}
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">AI分析進捗</h3>
              <span className="text-sm text-gray-600">データ蓄積中...</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">練習データ分析</span>
                <span className="text-blue-600 font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">パフォーマンス予測モデル</span>
                <span className="text-green-600 font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">個人最適化アルゴリズム</span>
                <span className="text-purple-600 font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '78%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/workouts/new')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm font-medium text-blue-900">練習記録</p>
          </button>
          
          <button
            onClick={() => router.push('/races/create')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center"
          >
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-900">レース結果</p>
          </button>
          
          <button
            onClick={() => router.push('/races/schedule/new')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-center"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-orange-900">レース予定</p>
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center"
          >
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-purple-900">プロフィール</p>
          </button>
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

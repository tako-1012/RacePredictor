'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { DailyMetricsResponse, DailyMetricsListResponse } from '@/types/dailyMetrics'
import { DailyMetricsForm } from '@/components/DailyMetrics/DailyMetricsForm'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

export default function DailyMetricsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [metrics, setMetrics] = useState<DailyMetricsResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingMetrics, setEditingMetrics] = useState<DailyMetricsResponse | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadMetrics()
    }
  }, [isAuthenticated])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response: DailyMetricsListResponse = await apiClient.getDailyMetrics({
        limit: 30,
        page: 1
      })
      setMetrics(response.items)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMetrics = async (data: any) => {
    try {
      setIsSubmitting(true)
      await apiClient.createDailyMetrics(data)
      setToast({ message: 'コンディション記録を保存しました', type: 'success' })
      setShowForm(false)
      loadMetrics()
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateMetrics = async (data: any) => {
    if (!editingMetrics) return
    
    try {
      setIsSubmitting(true)
      await apiClient.updateDailyMetrics(editingMetrics.id, data)
      setToast({ message: 'コンディション記録を更新しました', type: 'success' })
      setEditingMetrics(null)
      loadMetrics()
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMetrics = async (id: string) => {
    if (!confirm('この記録を削除しますか？')) return
    
    try {
      await apiClient.deleteDailyMetrics(id)
      setToast({ message: 'コンディション記録を削除しました', type: 'success' })
      loadMetrics()
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecoveryStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecoveryStatusLabel = (status?: string) => {
    switch (status) {
      case 'excellent': return '優秀'
      case 'good': return '良好'
      case 'fair': return '普通'
      case 'poor': return '不良'
      default: return '未設定'
    }
  }

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error.message || 'エラーが発生しました'}</div>
          {error.suggestion && (
            <div className="text-sm text-gray-500 mb-4">{error.suggestion}</div>
          )}
          <button
            onClick={() => loadMetrics()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">コンディション管理</h1>
              <p className="mt-2 text-gray-600">毎日の体調・睡眠・気分を記録して、トレーニングの質を向上させましょう</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>記録を追加</span>
            </button>
          </div>
        </div>

        {/* 記録一覧 */}
        {metrics.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">記録がありません</h3>
            <p className="text-gray-600 mb-4">最初のコンディション記録を作成しましょう</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              記録を追加
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {formatDate(metric.date)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {metric.data_source === 'manual' ? '手動記録' : 'デバイス連携'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingMetrics(metric)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMetrics(metric.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 身体データ */}
                  {metric.weight_kg && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metric.weight_kg.toFixed(1)}kg</div>
                      <div className="text-sm text-gray-600">体重</div>
                    </div>
                  )}

                  {/* 睡眠データ */}
                  {metric.sleep_duration_hours && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.floor(metric.sleep_duration_hours)}時間{Math.round((metric.sleep_duration_hours % 1) * 60)}分
                      </div>
                      <div className="text-sm text-gray-600">睡眠時間</div>
                    </div>
                  )}

                  {/* コンディション評価 */}
                  {metric.fatigue_level && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.fatigue_level)}`}>
                        {metric.fatigue_level}/10
                      </div>
                      <div className="text-sm text-gray-600">疲労度</div>
                    </div>
                  )}

                  {metric.motivation_level && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(metric.motivation_level)}`}>
                        {metric.motivation_level}/10
                      </div>
                      <div className="text-sm text-gray-600">モチベーション</div>
                    </div>
                  )}
                </div>

                {/* 回復状態 */}
                {metric.recovery_status && (
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecoveryStatusColor(metric.recovery_status)}`}>
                      {getRecoveryStatusLabel(metric.recovery_status)}
                    </span>
                  </div>
                )}

                {/* 気分タグ */}
                {metric.mood_tags && metric.mood_tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {metric.mood_tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* メモ */}
                {metric.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{metric.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* フォームモーダル */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">コンディション記録</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <DailyMetricsForm
                  onSubmit={handleCreateMetrics}
                  onCancel={() => setShowForm(false)}
                  isSubmitting={isSubmitting}
                  mode="create"
                />
              </div>
            </div>
          </div>
        )}

        {/* 編集フォームモーダル */}
        {editingMetrics && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">コンディション編集</h2>
                  <button
                    onClick={() => setEditingMetrics(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <DailyMetricsForm
                  initialData={editingMetrics}
                  onSubmit={handleUpdateMetrics}
                  onCancel={() => setEditingMetrics(null)}
                  isSubmitting={isSubmitting}
                  mode="edit"
                />
              </div>
            </div>
          </div>
        )}

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

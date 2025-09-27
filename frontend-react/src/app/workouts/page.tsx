'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Workout, WorkoutFilter, PaginationParams } from '@/types'
import { WorkoutList } from './components/WorkoutList'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'
import { useProfileStatus } from '@/hooks/useProfileStatus'
import { ProfilePromptBanner } from '@/components/Profile/ProfilePromptBanner'
import { ErrorMessage, convertTechnicalError, LoadingState, EmptyState } from '@/components/UI/ErrorMessage'
import { RetryableError } from '@/components/UI/LoadingStates'
import { Icons } from '@/components/UI/Icons'
import { useFastDataProcessing, useCSVExport, usePrintStyles } from '@/hooks/useDataProcessing'
import { useClipboard, useWebShare } from '@/hooks/useWebAPIs'

// Durationフォーマット関数
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function WorkoutsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)
  const [filter, setFilter] = useState<WorkoutFilter>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sort_by: 'date',
    sort_order: 'desc'
  })
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { hasProfile, isLoading: profileLoading } = useProfileStatus()
  const [showProfilePrompt, setShowProfilePrompt] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Web最適化: 高速データ処理
  const [searchTerm, setSearchTerm] = useState('')
  const { filteredData, isProcessing, totalCount, filteredCount } = useFastDataProcessing(workouts, searchTerm)
  const exportToCSV = useCSVExport(filteredData, `workouts_${new Date().toISOString().split('T')[0]}.csv`)
  const { printPage } = usePrintStyles()
  
  // Web最適化: クリップボード・共有機能
  const { copyWorkoutData } = useClipboard()
  const { shareWorkout } = useWebShare()
  

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkouts()
    }
  }, [isAuthenticated, filter, pagination])

  // プロフィール状態をチェックしてプロンプトを表示
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !hasProfile) {
      setShowProfilePrompt(true)
    }
  }, [isAuthenticated, profileLoading, hasProfile])

  const loadWorkouts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // APIパラメータを構築
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort_by: pagination.sort_by,
        sort_order: pagination.sort_order,
        date_from: filter.date_from,
        date_to: filter.date_to,
        distance_min: filter.distance_min,
        distance_max: filter.distance_max,
      }
      
      const response = await apiClient.getWorkouts(params)
      
      // データ構造の安全な処理
      let workoutItems = []
      if (Array.isArray(response)) {
        workoutItems = response
      } else if (response && Array.isArray(response.items)) {
        workoutItems = response.items
      } else if (response && Array.isArray(response.data)) {
        workoutItems = response.data
      } else if (response && response.data && Array.isArray(response.data.items)) {
        workoutItems = response.data.items
      } else {
        workoutItems = []
      }
      
      setWorkouts(workoutItems)
      
      // ページネーション情報の設定
      if (response.total_pages) {
        setTotalPages(response.total_pages)
      } else {
        setTotalPages(1)
      }
      
      // 成功時はリトライカウントをリセット
      setRetryCount(0)
    } catch (err) {
      console.error('=== エラー詳細 ===')
      console.error('Error type:', typeof err)
      console.error('Error:', err)
      if (err.response) {
        console.error('Response status:', err.response.status)
        console.error('Response data:', err.response.data)
      }
      
      const apiError = handleApiError(err)
      setError(apiError)
      setRetryCount(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この練習を削除しますか？')) return

    try {
      await apiClient.deleteWorkout(id)
      setWorkouts(workouts.filter(w => w.id !== id))
      setToast({ message: '練習を削除しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handleFilterChange = (newFilter: WorkoutFilter) => {
    setFilter(newFilter)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setPagination(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder, page: 1 }))
  }

  const handleCancel = () => {
    router.push('/workouts')
  }



  if (authLoading) {
    return <LoadingState message="認証情報を確認中..." />
  }

  if (isLoading) {
    return <LoadingState message="練習記録を読み込み中..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <RetryableError
            error={error}
            onRetry={loadWorkouts}
            retryCount={retryCount}
            maxRetries={3}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">練習を記録</h1>
            <div className="flex space-x-3">
              <Link
                href="/workouts/new"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Icons.Plus size="md" color="white" />
                <span>練習を記録</span>
              </Link>
            </div>
          </div>

          {/* Web最適化: 検索・エクスポート機能 */}
          {workouts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Icons.Search size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="練習記録を検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isProcessing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredCount} / {totalCount} 件の練習記録
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Icons.Download size="sm" />
                    <span>CSV出力</span>
                  </button>
                  <button
                    onClick={printPage}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Icons.Printer size="sm" />
                    <span>印刷</span>
                  </button>
                  <button
                    onClick={async () => {
                      const success = await copyWorkoutData(filteredData[0])
                      if (success) {
                        setToast({ message: '練習記録をクリップボードにコピーしました', type: 'success' })
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={filteredData.length === 0}
                  >
                    <Icons.Copy size="sm" />
                    <span>コピー</span>
                  </button>
                  <button
                    onClick={async () => {
                      const success = await shareWorkout(filteredData[0])
                      if (success) {
                        setToast({ message: '練習記録を共有しました', type: 'success' })
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    disabled={filteredData.length === 0}
                  >
                    <Icons.Share size="sm" />
                    <span>共有</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* プロフィール促しバナー */}
        {showProfilePrompt && (
          <ProfilePromptBanner 
            onDismiss={() => setShowProfilePrompt(false)}
          />
        )}

        {/* ワークアウト一覧 */}
        {workouts.length === 0 ? (
          <EmptyState
            icon={<Icons.Zap size="2xl" color="muted" />}
            title="練習記録がありません"
            description="まだ練習記録が登録されていません。最初の練習を記録してみましょう。"
            action={{
              label: "練習を記録",
              onClick: () => router.push('/workouts/new')
            }}
          />
        ) : (
          <WorkoutList
            workouts={filteredData}
            onDelete={handleDelete}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            currentPage={pagination.page}
            totalPages={totalPages}
            filter={filter}
            pagination={pagination}
          />
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

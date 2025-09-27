'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Race, RaceType, RaceSchedule, PaginationParams } from '@/types'
import { RaceList } from './components/RaceList'
import { RaceScheduleList } from './components/RaceScheduleList'
import { ConvertScheduleToResultModal } from './components/ConvertScheduleToResultModal'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'
import { ErrorMessage, convertTechnicalError, LoadingState, EmptyState } from '@/components/UI/ErrorMessage'
import { RetryableError } from '@/components/UI/LoadingStates'
import { Icons } from '@/components/UI/Icons'

export default function RacesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'results' | 'schedules'>('results')
  
  // レース結果関連の状態
  const [races, setRaces] = useState<Race[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sort_by: 'race_date',
    sort_order: 'desc'
  })
  const [totalPages, setTotalPages] = useState(1)
  
  // レース予定関連の状態
  const [raceSchedules, setRaceSchedules] = useState<RaceSchedule[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  
  // レース予定→結果変換モーダル
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<RaceSchedule | null>(null)
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadRaces()
      loadRaceTypes()
      loadRaceSchedules()
    }
  }, [isAuthenticated, pagination])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'schedules') {
      loadRaceSchedules()
    }
  }, [isAuthenticated, activeTab])

  const loadRaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.getRaces(pagination)
      
      // データ構造の安全な処理
      let raceItems = []
      if (Array.isArray(response)) {
        raceItems = response
      } else if (response && Array.isArray(response.items)) {
        raceItems = response.items
      } else if (response && Array.isArray(response.data)) {
        raceItems = response.data
      } else if (response && response.data && Array.isArray(response.data.items)) {
        raceItems = response.data.items
      } else {
        raceItems = []
      }
      
      setRaces(raceItems)
      
      // ページネーション情報の設定
      if (response.total_pages) {
        setTotalPages(response.total_pages)
      } else {
        setTotalPages(1)
      }
      
      // 成功時はリトライカウントをリセット
      setRetryCount(0)
    } catch (err: any) {
      console.error('Races API エラー:', err)
      const apiError = handleApiError(err)
      setError(apiError)
      setRetryCount(prev => prev + 1)
      
      // エラーが発生しても空の配列を設定してアプリを継続
      setRaces([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRaceTypes = async () => {
    try {
      // 定数のraceTypesを使用
      setRaceTypes(apiClient.raceTypes.map(name => ({ id: name, name, category: 'road', default_distance_meters: 0 })))
    } catch (err) {
      console.error('Failed to load race types:', err)
    }
  }

  const loadRaceSchedules = async () => {
    try {
      setIsLoadingSchedules(true)
      const response = await apiClient.getRaceSchedules()
      setRaceSchedules(response.items || response.data || response)
    } catch (err) {
      console.error('Failed to load race schedules:', err)
      setToast({ 
        message: 'レース予定の読み込みに失敗しました。ページを再読み込みしてください。', 
        type: 'error' 
      })
    } finally {
      setIsLoadingSchedules(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteRace(id)
      setRaces(races.filter(r => r.id !== id))
      setToast({ message: 'レース結果を削除しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setPagination(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder, page: 1 }))
  }

  const handleFilterChange = (filters: any) => {
    setPagination(prev => ({ 
      ...prev, 
      ...filters,
      page: 1 
    }))
  }

  const handleScheduleDelete = async (id: string) => {
    try {
      await apiClient.deleteRaceSchedule(id)
      setRaceSchedules(raceSchedules.filter(s => s.id !== id))
      setToast({ message: 'レース予定を削除しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handleScheduleComplete = async (id: string) => {
    try {
      await apiClient.completeRaceSchedule(id)
      await loadRaceSchedules()
      setToast({ message: 'レースを完了としてマークしました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handleConvertToResult = (schedule: RaceSchedule) => {
    setSelectedSchedule(schedule)
    setConvertModalOpen(true)
  }

  const handleConvertSubmit = async (raceData: any) => {
    try {
      // レース結果を作成
      await apiClient.createRace(raceData)
      
      // レース予定を削除
      if (selectedSchedule) {
        await apiClient.deleteRaceSchedule(selectedSchedule.id)
      }
      
      // データを再読み込み
      await loadRaces()
      await loadRaceSchedules()
      
      setToast({ message: 'レース結果を保存し、予定を削除しました', type: 'success' })
      setConvertModalOpen(false)
      setSelectedSchedule(null)
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  if (authLoading) {
    return <LoadingState message="認証情報を確認中..." />
  }

  if (activeTab === 'results' && isLoading) {
    return <LoadingState message="レース結果を読み込み中..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <RetryableError
            error={error}
            onRetry={loadRaces}
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                ← ダッシュボードに戻る
              </button>
              <h1 className="text-3xl font-bold text-gray-900">レース</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // 新しいレース追加時は自動保存データをクリア
                  if (activeTab === 'results') {
                    localStorage.removeItem('detailed_race_form_draft')
                    localStorage.removeItem('race_creation_draft')
                    console.log('🆕 新しいレース結果追加: 自動保存データをクリアしました')
                  }
                  router.push(activeTab === 'results' ? '/races/create' : '/races/schedule/new')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {activeTab === 'results' ? '新しいレース結果を追加' : '新しいレース予定を追加'}
              </button>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              レース結果
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              レース予定
            </button>
          </nav>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'results' && (
          races.length === 0 ? (
            <EmptyState
              icon={<Icons.Trophy size="2xl" color="muted" />}
              title="レース結果がありません"
              description="まだレース結果が登録されていません。最初のレース結果を記録してみましょう。"
              action={{
                label: "レース結果を記録",
                onClick: () => router.push('/races/new')
              }}
            />
          ) : (
            <RaceList
              races={races}
              raceTypes={raceTypes}
              onDelete={handleDelete}
              onPageChange={handlePageChange}
              onSortChange={handleSortChange}
              onFilterChange={handleFilterChange}
              currentPage={pagination.page}
              totalPages={totalPages}
              pagination={pagination}
            />
          )
        )}

        {activeTab === 'schedules' && (
          <RaceScheduleList
            raceSchedules={raceSchedules}
            isLoading={isLoadingSchedules}
            onDelete={handleScheduleDelete}
            onComplete={handleScheduleComplete}
            onConvertToResult={handleConvertToResult}
            onRefresh={loadRaceSchedules}
            onAddSchedule={() => router.push('/races/schedule/new')}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <ConvertScheduleToResultModal
          isOpen={convertModalOpen}
          schedule={selectedSchedule}
          onClose={() => {
            setConvertModalOpen(false)
            setSelectedSchedule(null)
          }}
          onSubmit={handleConvertSubmit}
        />
      </div>
    </div>
  )
}

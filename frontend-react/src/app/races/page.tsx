'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Race, RaceType, PaginationParams } from '@/types'
import { RaceList } from './components/RaceList'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

export default function RacesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [races, setRaces] = useState<Race[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sort_by: 'race_date',
    sort_order: 'desc'
  })
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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
    }
  }, [isAuthenticated, pagination])

  const loadRaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getRaces(pagination)
      setRaces(response.data)
      setTotalPages(response.pagination.total_pages)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRaceTypes = async () => {
    try {
      const types = await apiClient.getRaceTypes()
      setRaceTypes(types)
    } catch (err) {
      console.error('Failed to load race types:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このレース結果を削除しますか？')) return

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

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRaces}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">レース結果</h1>
            <button
              onClick={() => router.push('/races/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しいレース結果を追加
            </button>
          </div>
        </div>

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

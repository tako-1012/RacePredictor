'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Workout, WorkoutFilter } from '@/types'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'
import { ConfirmDialog } from '@/components/UI/ConfirmDialog'

interface WorkoutListProps {
  workouts: Workout[]
  onDelete: (id: string) => void
  onFilterChange: (filter: WorkoutFilter) => void
  onPageChange: (page: number) => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  currentPage: number
  totalPages: number
  filter: WorkoutFilter
}

export function WorkoutList({
  workouts,
  onDelete,
  onFilterChange,
  onPageChange,
  onSortChange,
  currentPage,
  totalPages,
  filter
}: WorkoutListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const handleSort = (sortBy: string) => {
    const currentSort = filter.sort_by || 'date'
    const currentOrder = filter.sort_order || 'desc'
    
    if (currentSort === sortBy) {
      onSortChange(sortBy, currentOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(sortBy, 'desc')
    }
  }

  const getSortIcon = (sortBy: string) => {
    const currentSort = filter.sort_by || 'date'
    const currentOrder = filter.sort_order || 'desc'
    
    if (currentSort !== sortBy) return '↕️'
    return currentOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'フィルターを閉じる' : 'フィルターを開く'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                value={filter.date_from || ''}
                onChange={(e) => onFilterChange({ ...filter, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                value={filter.date_to || ''}
                onChange={(e) => onFilterChange({ ...filter, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最小距離 (km)
              </label>
              <input
                type="number"
                value={filter.distance_min || ''}
                onChange={(e) => onFilterChange({ ...filter, distance_min: e.target.value ? Number(e.target.value) * 1000 : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大距離 (km)
              </label>
              <input
                type="number"
                value={filter.distance_max || ''}
                onChange={(e) => onFilterChange({ ...filter, distance_max: e.target.value ? Number(e.target.value) * 1000 : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 練習記録一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  日付 {getSortIcon('date')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('workout_type')}
                >
                  種別 {getSortIcon('workout_type')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('distance_meters')}
                >
                  距離 {getSortIcon('distance_meters')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ペース
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('intensity')}
                >
                  強度 {getSortIcon('intensity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workouts.map((workout) => (
                <tr key={workout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(workout.date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.workout_type?.name || '不明'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDistance(workout.distance_meters)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.times_seconds.length > 0 ? (
                      <div className="space-y-1">
                        <div>合計: {formatTime(workout.times_seconds.reduce((a, b) => a + b, 0))}</div>
                        {workout.times_seconds.length > 1 && (
                          <div className="text-xs text-gray-500">
                            {workout.times_seconds.length}分割
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.avg_pace_seconds ? formatPace(workout.avg_pace_seconds) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      workout.intensity >= 8 ? 'bg-red-100 text-red-800' :
                      workout.intensity >= 6 ? 'bg-orange-100 text-orange-800' :
                      workout.intensity >= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {workout.intensity}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/workouts/${workout.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">練習記録がありません</p>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === currentPage
                    ? 'text-blue-600 bg-blue-50 border border-blue-300'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </nav>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="練習記録を削除"
        message="この練習記録を削除しますか？この操作は取り消せません。"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="削除"
        cancelText="キャンセル"
        type="danger"
      />
    </div>
  )
}

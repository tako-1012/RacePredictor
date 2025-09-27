'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Workout, WorkoutFilter } from '@/types'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'
import { ConfirmDialog } from '@/components/UI/ConfirmDialog'
import { ResponsiveTable, createTableColumns } from '@/components/UI/ResponsiveTable'

// Durationフォーマット関数
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 日付の有効性をチェックする関数
function isValidDate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const currentYear = new Date().getFullYear()
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.getFullYear() >= 1900 && date.getFullYear() <= currentYear + 10
}

// 数値の有効性をチェックする関数
function isValidNumber(value: string, min: number = 0, max: number = 999999): boolean {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

// 時間の有効性をチェックする関数（24時間以内）
function isValidTime(hours: number, minutes: number = 0, seconds: number = 0): boolean {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  return totalSeconds >= 0 && totalSeconds <= 86400 // 24時間 = 86400秒
}

// ワークアウトタイプの表示名を日本語に変換する関数
function getWorkoutTypeDisplayName(typeName: string): string {
  const typeMap: Record<string, string> = {
    // 持久系練習
    'easy_run': 'イージーラン',
    'long_run': 'ロング走',
    'medium_run': 'ミディアムラン',
    'tempo_run': 'テンポ走',
    
    // スピード・強度系練習
    'interval': 'インターバル走',
    'interval_run': 'インターバル走',
    'repetition': 'レペティション',
    'build_up': 'ビルドアップ走',
    'fartlek': 'ファルトレク',
    'pace_change': '変化走',
    
    // 特殊練習
    'hill_training': '坂道練習',
    'hill_run': '坂道練習',
    'stair_run': '階段練習',
    'sand_run': '砂浜・芝生走',
    
    // ウォームアップ
    'jogging': 'ジョギング',
    'walking': 'ウォーキング',
    'marching': 'その場足踏み',
    'movement_prep': '動き作り',
    'ladder': 'ラダートレーニング',
    'flow_run': '流し',
    'wind_sprint': 'ウィンドスプリント',
    'dynamic_stretch': '動的ストレッチ',
    'brazil_warmup': 'ブラジル体操',
    'joint_mobility': '関節体操',
    'balance_coordination': 'バランス・コーディネーション',
    'muscle_activation': '筋活性化エクササイズ',
    'plyometrics': 'プライオメトリクス',
    'core_training': 'コアトレーニング',
    
    // クールダウン
    'cooldown': 'クールダウン',
    
    // その他
    'strength': '筋力トレーニング',
    'recovery': '回復走',
    'other': 'その他',
    'その他': 'その他'
  }
  
  return typeMap[typeName] || typeName
}

interface WorkoutListProps {
  workouts: Workout[]
  onDelete: (id: string) => void
  onFilterChange: (filter: WorkoutFilter) => void
  onPageChange: (page: number) => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  currentPage: number
  totalPages: number
  filter: WorkoutFilter
  pagination: any
}

export function WorkoutList({
  workouts,
  onDelete,
  onFilterChange,
  onPageChange,
  onSortChange,
  currentPage,
  totalPages,
  filter,
  pagination
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
    const currentSort = pagination.sort_by || 'date'
    const currentOrder = pagination.sort_order || 'desc'
    
    if (currentSort === sortBy) {
      onSortChange(sortBy, currentOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(sortBy, 'desc')
    }
  }

  const getSortIcon = (sortBy: string) => {
    const currentSort = pagination?.sort_by || 'date'
    const currentOrder = pagination?.sort_order || 'desc'
    
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
                value={filter.date_from && isValidDate(filter.date_from) ? filter.date_from : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidDate(value)) {
                    onFilterChange({ ...filter, date_from: value })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                value={filter.date_to && isValidDate(filter.date_to) ? filter.date_to : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidDate(value)) {
                    onFilterChange({ ...filter, date_to: value })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最小距離 (km)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.1"
                value={filter.distance_min || ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidNumber(value, 0, 1000)) {
                    onFilterChange({ ...filter, distance_min: value ? Number(value) * 1000 : undefined })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大距離 (km)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.1"
                value={filter.distance_max || ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || isValidNumber(value, 0, 1000)) {
                    onFilterChange({ ...filter, distance_max: value ? Number(value) * 1000 : undefined })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 練習記録一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* デスクトップ表示 */}
        <div className="hidden md:block overflow-x-auto">
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
              {workouts.map((workout) => {
                // デバッグ用: データ構造をコンソールに出力
                console.log('Workout data:', workout)
                
                return (
                <tr key={workout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(workout.date || workout.workout_date) ? (
                      new Date(workout.date || workout.workout_date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                    ) : (
                      <span className="text-gray-400">日付不明</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.workout_type_name || workout.workout_type?.name || workout.workout_type ? 
                      getWorkoutTypeDisplayName(workout.workout_type_name || workout.workout_type?.name || workout.workout_type) : 
                      <span className="text-gray-400">種別不明</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const distance = workout.actual_distance_meters || workout.target_distance_meters || workout.distance_meters || 0
                      return distance > 0 ? formatDistance(distance) : '距離不明'
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workout.duration_seconds ? (
                      <div className="space-y-1">
                        <div>合計: {formatDuration(workout.duration_seconds)}</div>
                        {(workout.actual_times_seconds || workout.target_times_seconds) && 
                         (workout.actual_times_seconds || workout.target_times_seconds).length > 1 && (
                          <div className="text-xs text-gray-500">
                            {(workout.actual_times_seconds || workout.target_times_seconds).length}分割
                          </div>
                        )}
                      </div>
                    ) : workout.actual_times_seconds && workout.actual_times_seconds.length > 0 ? (
                      <div className="space-y-1">
                        <div>合計: {formatDuration(workout.actual_times_seconds.reduce((a, b) => a + b, 0))}</div>
                        {workout.actual_times_seconds.length > 1 && (
                          <div className="text-xs text-gray-500">
                            {workout.actual_times_seconds.length}分割
                          </div>
                        )}
                      </div>
                    ) : (
                      '記録なし'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const distance = workout.actual_distance_meters || workout.target_distance_meters || 0
                      const time = workout.duration_seconds || (workout.actual_times_seconds ? workout.actual_times_seconds.reduce((a, b) => a + b, 0) : 0)
                      
                      if (distance > 0 && time > 0) {
                        return formatPace(time / (distance / 1000), distance)
                      }
                      return '計算不可'
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {workout.intensity ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        workout.intensity >= 8 ? 'bg-red-100 text-red-800' :
                        workout.intensity >= 6 ? 'bg-orange-100 text-orange-800' :
                        workout.intensity >= 4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {workout.intensity}/10
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">未設定</span>
                    )}
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
                )
              })}
            </tbody>
          </table>
        </div>

        {/* モバイル表示 */}
        <div className="md:hidden">
          {workouts.map((workout) => (
            <div key={workout.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {new Date(workout.date).toLocaleDateString('ja-JP')}
                  </h3>
                  <p className="text-sm text-gray-600">{workout.workout_type?.name || '不明'}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  workout.intensity >= 8 ? 'bg-red-100 text-red-800' :
                  workout.intensity >= 6 ? 'bg-orange-100 text-orange-800' :
                  workout.intensity >= 4 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {workout.intensity}/10
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">距離</p>
                  <p className="text-sm font-medium text-gray-900">{formatDistance(workout.distance_meters)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">タイム</p>
                  <p className="text-sm font-medium text-gray-900">
                    {workout.duration_seconds ? formatDuration(workout.duration_seconds) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ペース</p>
                  <p className="text-sm font-medium text-gray-900">
                    {workout.avg_pace_seconds ? formatPace(workout.avg_pace_seconds, workout.distance_meters) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">区間数</p>
                  <p className="text-sm font-medium text-gray-900">
                    {workout.times_seconds && workout.times_seconds.length > 0 ? `${workout.times_seconds.length}分割` : '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/workouts/${workout.id}`)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  詳細
                </button>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
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

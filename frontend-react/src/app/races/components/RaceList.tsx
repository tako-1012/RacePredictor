'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Race, RaceType, PaginationParams } from '@/types'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'
import { ConfirmDialog } from '@/components/UI/ConfirmDialog'

interface RaceListProps {
  races: Race[]
  raceTypes: RaceType[]
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onFilterChange: (filters: any) => void
  currentPage: number
  totalPages: number
  pagination: PaginationParams
}

export function RaceList({
  races,
  raceTypes,
  onDelete,
  onPageChange,
  onSortChange,
  onFilterChange,
  currentPage,
  totalPages,
  pagination
}: RaceListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    race_type_id: '',
    is_relay: '',
    year: ''
  })

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
    const currentSort = pagination.sort_by || 'race_date'
    const currentOrder = pagination.sort_order || 'desc'
    const newOrder = currentSort === sortBy && currentOrder === 'desc' ? 'asc' : 'desc'
    onSortChange(sortBy, newOrder)
  }

  const getSortIcon = (sortBy: string) => {
    const currentSort = pagination.sort_by || 'race_date'
    const currentOrder = pagination.sort_order || 'desc'
    
    if (currentSort !== sortBy) return '↕️'
    return currentOrder === 'asc' ? '↑' : '↓'
  }

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = { race_type_id: '', is_relay: '', year: '' }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">フィルター</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レース種目
            </label>
            <select
              value={filters.race_type_id}
              onChange={(e) => handleFilterChange('race_type_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {raceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種別
            </label>
            <select
              value={filters.is_relay}
              onChange={(e) => handleFilterChange('is_relay', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="false">一般レース</option>
              <option value="true">駅伝</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              フィルタークリア
            </button>
          </div>
        </div>
      </div>

      {/* レース結果一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* デスクトップ表示 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('race_date')}
                >
                  日付 {getSortIcon('race_date')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('race_name')}
                >
                  大会名 {getSortIcon('race_name')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('distance_meters')}
                >
                  距離 {getSortIcon('distance_meters')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('time_seconds')}
                >
                  タイム {getSortIcon('time_seconds')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pace_seconds')}
                >
                  ペース {getSortIcon('pace_seconds')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  順位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {races.map((race) => (
                <tr key={race.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(race.race_date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{race.race_name}</div>
                      <div className="text-xs text-gray-500">{race.race_type?.name || '不明'}</div>
                      {race.is_relay && (
                        <div className="text-xs text-blue-600">
                          {race.relay_segment}区 {race.team_name && `(${race.team_name})`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDistance(race.distance_meters)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(race.time_seconds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPace(race.pace_seconds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {race.place && race.total_participants ? (
                      <div>
                        <div className="font-medium">{race.place}位</div>
                        <div className="text-xs text-gray-500">
                          / {race.total_participants}人中
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/races/${race.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => handleDelete(race.id)}
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

        {/* モバイル表示 */}
        <div className="md:hidden">
          {races.map((race) => (
            <div key={race.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{race.race_name}</h3>
                  <p className="text-xs text-gray-500">{race.race_type?.name || '不明'}</p>
                  {race.is_relay && (
                    <p className="text-xs text-blue-600">
                      {race.relay_segment}区 {race.team_name && `(${race.team_name})`}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/races/${race.id}`)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    詳細
                  </button>
                  <button
                    onClick={() => handleDelete(race.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">日付:</span>
                  <span className="ml-1">{new Date(race.race_date).toLocaleDateString('ja-JP')}</span>
                </div>
                <div>
                  <span className="text-gray-500">距離:</span>
                  <span className="ml-1">{formatDistance(race.distance_meters)}</span>
                </div>
                <div>
                  <span className="text-gray-500">タイム:</span>
                  <span className="ml-1">{formatTime(race.time_seconds)}</span>
                </div>
                <div>
                  <span className="text-gray-500">ペース:</span>
                  <span className="ml-1">{formatPace(race.pace_seconds)}</span>
                </div>
                {race.place && (
                  <div className="col-span-2">
                    <span className="text-gray-500">順位:</span>
                    <span className="ml-1">
                      {race.place}位
                      {race.total_participants && ` / ${race.total_participants}人`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {races.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">レース結果がありません</p>
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
        title="レース結果を削除"
        message="このレース結果を削除しますか？この操作は取り消せません。"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="削除"
        cancelText="キャンセル"
        type="danger"
      />
    </div>
  )
}

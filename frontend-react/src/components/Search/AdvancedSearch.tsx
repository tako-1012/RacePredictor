'use client'

import { useState, useEffect } from 'react'
import { SearchFilter, SavedFilter } from '@/types'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilter) => void
  onSaveFilter: (filter: SavedFilter) => void
  savedFilters: SavedFilter[]
  type: 'workouts' | 'races'
}

export function AdvancedSearch({ onSearch, onSaveFilter, savedFilters, type }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilter>({
    query: '',
    dateFrom: '',
    dateTo: '',
    distanceMin: '',
    distanceMax: '',
    paceMin: '',
    paceMax: '',
    workoutTypes: [],
    raceTypes: [],
    isRelay: undefined,
    weather: '',
    courseType: '',
    intensityMin: '',
    intensityMax: '',
    heartRateMin: '',
    heartRateMax: '',
    tags: []
  })
  const [filterName, setFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleFilterChange = (field: keyof SearchFilter, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleClearFilters = () => {
    setFilters({
      query: '',
      dateFrom: '',
      dateTo: '',
      distanceMin: '',
      distanceMax: '',
      paceMin: '',
      paceMax: '',
      workoutTypes: [],
      raceTypes: [],
      isRelay: undefined,
      weather: '',
      courseType: '',
      intensityMin: '',
      intensityMax: '',
      heartRateMin: '',
      heartRateMax: '',
      tags: []
    })
  }

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter({
        id: Date.now().toString(),
        name: filterName,
        filters: filters,
        type: type,
        created_at: new Date().toISOString()
      })
      setFilterName('')
      setShowSaveDialog(false)
    }
  }

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters)
    onSearch(savedFilter.filters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== '' && value !== undefined
  )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 基本検索 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`${type === 'workouts' ? '練習' : 'レース'}を検索...`}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            検索
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isExpanded ? '詳細を閉じる' : '詳細検索'}
          </button>
        </div>

        {/* 保存済みフィルター */}
        {savedFilters.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">保存済みフィルター:</span>
            <div className="flex space-x-2">
              {savedFilters.slice(0, 3).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleLoadFilter(filter)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {filter.name}
                </button>
              ))}
              {savedFilters.length > 3 && (
                <span className="text-xs text-gray-500">+{savedFilters.length - 3}個</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 詳細検索 */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 日付範囲 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 距離範囲 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小距離 (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={filters.distanceMin}
                onChange={(e) => handleFilterChange('distanceMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大距離 (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={filters.distanceMax}
                onChange={(e) => handleFilterChange('distanceMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ペース範囲 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小ペース (分/km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={filters.paceMin}
                onChange={(e) => handleFilterChange('paceMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大ペース (分/km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={filters.paceMax}
                onChange={(e) => handleFilterChange('paceMax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* レース専用フィルター */}
            {type === 'races' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">駅伝</label>
                  <select
                    value={filters.isRelay === undefined ? '' : filters.isRelay.toString()}
                    onChange={(e) => handleFilterChange('isRelay', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    <option value="true">駅伝のみ</option>
                    <option value="false">一般レースのみ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">天気</label>
                  <select
                    value={filters.weather}
                    onChange={(e) => handleFilterChange('weather', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    <option value="晴れ">晴れ</option>
                    <option value="曇り">曇り</option>
                    <option value="雨">雨</option>
                    <option value="雪">雪</option>
                    <option value="強風">強風</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">コースタイプ</label>
                  <select
                    value={filters.courseType}
                    onChange={(e) => handleFilterChange('courseType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    <option value="トラック">トラック</option>
                    <option value="ロード">ロード</option>
                    <option value="クロスカントリー">クロスカントリー</option>
                    <option value="山岳">山岳</option>
                  </select>
                </div>
              </>
            )}

            {/* 練習専用フィルター */}
            {type === 'workouts' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小強度</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filters.intensityMin}
                    onChange={(e) => handleFilterChange('intensityMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大強度</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filters.intensityMax}
                    onChange={(e) => handleFilterChange('intensityMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小心拍数 (bpm)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={filters.heartRateMin}
                    onChange={(e) => handleFilterChange('heartRateMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大心拍数 (bpm)</label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    value={filters.heartRateMax}
                    onChange={(e) => handleFilterChange('heartRateMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* アクションボタン */}
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                フィルタークリア
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  フィルターを保存
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              検索実行
            </button>
          </div>
        </div>
      )}

      {/* 保存ダイアログ */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">フィルターを保存</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">フィルター名</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="例: 今月の長距離練習"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

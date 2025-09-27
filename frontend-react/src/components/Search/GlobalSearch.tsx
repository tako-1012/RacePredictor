'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, X, Filter, Calendar, MapPin, Trophy } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface SearchResult {
  id: string
  type: 'workout' | 'race'
  title: string
  subtitle: string
  date: string
  distance?: string
  time?: string
  pace?: string
  place?: string
  icon: React.ReactNode
  url: string
}

interface SearchHistory {
  query: string
  timestamp: number
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function GlobalSearch({ isOpen, onClose, className = '' }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // 検索履歴をローカルストレージから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // 検索履歴をローカルストレージに保存
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return
    
    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(item => item.query !== query.trim())
    ].slice(0, 10) // 最新10件まで保持
    
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  // 検索実行
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // 練習記録とレース結果を並行して検索
      const [workoutsResponse, racesResponse] = await Promise.all([
        apiClient.searchWorkouts(searchQuery),
        apiClient.searchRaces(searchQuery)
      ])

      const workoutResults: SearchResult[] = (workoutsResponse.items || []).map((workout: any) => ({
        id: workout.id,
        type: 'workout',
        title: workout.workout_type_name || workout.workout_type?.name || '練習記録',
        subtitle: `${new Date(workout.date).toLocaleDateString('ja-JP')} • ${workout.workout_type_name || workout.workout_type?.name || 'その他'}`,
        date: workout.date,
        distance: workout.actual_distance_meters || workout.target_distance_meters ? 
          `${((workout.actual_distance_meters || workout.target_distance_meters) / 1000).toFixed(1)}km` : undefined,
        time: workout.duration_seconds ? 
          `${Math.floor(workout.duration_seconds / 60)}:${(workout.duration_seconds % 60).toString().padStart(2, '0')}` : undefined,
        pace: workout.avg_pace_seconds ? 
          `${Math.floor(workout.avg_pace_seconds / 60)}:${(workout.avg_pace_seconds % 60).toString().padStart(2, '0')}/km` : undefined,
        icon: <Calendar className="w-4 h-4" />,
        url: `/workouts/${workout.id}`
      }))

      const raceResults: SearchResult[] = (racesResponse.items || []).map((race: any) => ({
        id: race.id,
        type: 'race',
        title: race.race_name,
        subtitle: `${new Date(race.race_date).toLocaleDateString('ja-JP')} • ${race.race_type?.name || 'レース'}`,
        date: race.race_date,
        distance: `${(race.distance_meters / 1000).toFixed(1)}km`,
        time: `${Math.floor(race.time_seconds / 60)}:${(race.time_seconds % 60).toString().padStart(2, '0')}`,
        pace: `${Math.floor(race.pace_seconds / 60)}:${(race.pace_seconds % 60).toString().padStart(2, '0')}/km`,
        place: race.place ? `${race.place}位` : undefined,
        icon: <Trophy className="w-4 h-4" />,
        url: `/races/${race.id}`
      }))

      setResults([...workoutResults, ...raceResults])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // 検索クエリの変更を監視
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query)
      } else {
        setResults([])
        setShowHistory(true)
      }
    }, 300) // 300msのデバウンス

    return () => clearTimeout(timeoutId)
  }, [query])

  // モーダルが開いた時にフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setShowHistory(true)
    }
  }, [isOpen])

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex])
        } else if (query.trim()) {
          // 検索結果がない場合は検索ページに遷移
          router.push(`/search?q=${encodeURIComponent(query)}`)
          onClose()
        }
        break
    }
  }

  // 検索結果クリック
  const handleResultClick = (result: SearchResult) => {
    saveSearchHistory(query)
    router.push(result.url)
    onClose()
  }

  // 履歴クリック
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    setShowHistory(false)
  }

  // 履歴削除
  const removeHistoryItem = (index: number) => {
    const newHistory = searchHistory.filter((_, i) => i !== index)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  // 履歴クリア
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        {/* オーバーレイ */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onClose}
        />
        
        {/* 検索モーダル */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* 検索バー */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="練習記録やレース結果を検索..."
              className="flex-1 text-lg outline-none placeholder-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 検索結果 */}
          <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">検索中...</p>
              </div>
            ) : query.trim() && results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">検索結果が見つかりませんでした</p>
                <p className="text-sm text-gray-400 mt-1">
                  「{query}」に一致する練習記録やレース結果はありません
                </p>
              </div>
            ) : query.trim() && results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            result.type === 'workout' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {result.type === 'workout' ? '練習' : 'レース'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{result.subtitle}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          {result.distance && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {result.distance}
                            </span>
                          )}
                          {result.time && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {result.time}
                            </span>
                          )}
                          {result.pace && (
                            <span>{result.pace}</span>
                          )}
                          {result.place && (
                            <span className="flex items-center">
                              <Trophy className="w-3 h-3 mr-1" />
                              {result.place}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : showHistory && searchHistory.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">最近の検索</h3>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    履歴をクリア
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{item.query}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeHistoryItem(index)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">検索を開始してください</p>
                <p className="text-sm text-gray-400 mt-1">
                  練習記録やレース結果を検索できます
                </p>
              </div>
            )}
          </div>

          {/* ショートカットキー */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>↑↓ ナビゲーション</span>
                <span>Enter 選択</span>
                <span>Esc 閉じる</span>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-3 h-3" />
                <span>Cmd+K で検索</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 検索ページコンポーネント
export function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'workout', 'race'
    dateFrom: '',
    dateTo: '',
    distanceMin: '',
    distanceMax: ''
  })

  useEffect(() => {
    // URLパラメータから検索クエリを取得
    const urlParams = new URLSearchParams(window.location.search)
    const searchQuery = urlParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery)
    }
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      // フィルターを適用した検索
      const searchParams = new URLSearchParams({
        q: searchQuery,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        ...(filters.distanceMin && { distance_min: filters.distanceMin }),
        ...(filters.distanceMax && { distance_max: filters.distanceMax })
      })

      const [workoutsResponse, racesResponse] = await Promise.all([
        apiClient.searchWorkouts(searchQuery, searchParams),
        apiClient.searchRaces(searchQuery, searchParams)
      ])

      // 結果を統合してソート
      const allResults = [
        ...(workoutsResponse.items || []).map((workout: any) => ({
          id: workout.id,
          type: 'workout' as const,
          title: workout.workout_type_name || workout.workout_type?.name || '練習記録',
          subtitle: `${new Date(workout.date).toLocaleDateString('ja-JP')} • ${workout.workout_type_name || workout.workout_type?.name || 'その他'}`,
          date: workout.date,
          distance: workout.actual_distance_meters || workout.target_distance_meters ? 
            `${((workout.actual_distance_meters || workout.target_distance_meters) / 1000).toFixed(1)}km` : undefined,
          time: workout.duration_seconds ? 
            `${Math.floor(workout.duration_seconds / 60)}:${(workout.duration_seconds % 60).toString().padStart(2, '0')}` : undefined,
          pace: workout.avg_pace_seconds ? 
            `${Math.floor(workout.avg_pace_seconds / 60)}:${(workout.avg_pace_seconds % 60).toString().padStart(2, '0')}/km` : undefined,
          icon: <Calendar className="w-4 h-4" />,
          url: `/workouts/${workout.id}`
        })),
        ...(racesResponse.items || []).map((race: any) => ({
          id: race.id,
          type: 'race' as const,
          title: race.race_name,
          subtitle: `${new Date(race.race_date).toLocaleDateString('ja-JP')} • ${race.race_type?.name || 'レース'}`,
          date: race.race_date,
          distance: `${(race.distance_meters / 1000).toFixed(1)}km`,
          time: `${Math.floor(race.time_seconds / 60)}:${(race.time_seconds % 60).toString().padStart(2, '0')}`,
          pace: `${Math.floor(race.pace_seconds / 60)}:${(race.pace_seconds % 60).toString().padStart(2, '0')}/km`,
          place: race.place ? `${race.place}位` : undefined,
          icon: <Trophy className="w-4 h-4" />,
          url: `/races/${race.id}`
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setResults(allResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">検索</h1>
          <p className="text-gray-600">練習記録やレース結果を検索できます</p>
        </div>

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索キーワード
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="大会名、練習種別、メモなどを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '検索中...' : '検索'}
                </button>
              </div>
            </div>

            {/* フィルター */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  種別
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="workout">練習記録</option>
                  <option value="race">レース結果</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* 検索結果 */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                検索結果 ({results.length}件)
              </h2>
            </div>
            
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => router.push(result.url)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          result.type === 'workout' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {result.type === 'workout' ? '練習' : 'レース'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{result.subtitle}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        {result.distance && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {result.distance}
                          </span>
                        )}
                        {result.time && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {result.time}
                          </span>
                        )}
                        {result.pace && (
                          <span>{result.pace}</span>
                        )}
                        {result.place && (
                          <span className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1" />
                            {result.place}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {query && !isLoading && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">検索結果が見つかりませんでした</p>
            <p className="text-sm text-gray-400 mt-1">
              「{query}」に一致する練習記録やレース結果はありません
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

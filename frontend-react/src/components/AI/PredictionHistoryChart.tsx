'use client'

import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

interface PredictionHistory {
  id: string
  prediction_date: string
  target_event: string
  predicted_time_seconds: number
  confidence_level: number
  model_version: string
  base_workouts: any
  created_at: string
}

interface PredictionHistoryChartProps {
  onPredictionSelect?: (prediction: PredictionHistory) => void
}

export function PredictionHistoryChart({ onPredictionSelect }: PredictionHistoryChartProps) {
  const [predictions, setPredictions] = useState<PredictionHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string>('all')

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getModelColor = (modelVersion: string): string => {
    if (modelVersion.includes('ai')) return 'bg-blue-100 text-blue-800'
    if (modelVersion.includes('statistical')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getEventDisplayName = (event: string): string => {
    const eventMap: Record<string, string> = {
      'event_800m': '800m',
      'event_1500m': '1500m',
      'event_3000m': '3000m',
      'event_5000m': '5000m',
      'event_10000m': '10000m',
      'event_5km': '5km',
      'event_10km': '10km',
      'event_half': 'ハーフマラソン',
      'event_full': 'フルマラソン'
    }
    return eventMap[event] || event
  }

  const loadPredictions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiClient.getPredictions()
      setPredictions(data)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPredictions()
  }, [])

  const filteredPredictions = selectedEvent === 'all' 
    ? predictions 
    : predictions.filter(p => p.target_event === selectedEvent)

  const uniqueEvents = Array.from(new Set(predictions.map(p => p.target_event)))

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">予測履歴</h3>
        <div className="flex items-center space-x-3">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全種目</option>
            {uniqueEvents.map(event => (
              <option key={event} value={event}>
                {getEventDisplayName(event)}
              </option>
            ))}
          </select>
          <button
            onClick={loadPredictions}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            更新
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">エラー</h4>
          <p className="text-sm text-red-700">{error.message || 'エラーが発生しました'}</p>
          {error.suggestion && (
            <p className="text-sm text-gray-500 mt-1">{error.suggestion}</p>
          )}
        </div>
      )}

      {filteredPredictions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">予測履歴がありません</p>
          <p className="text-sm text-gray-400 mt-1">AI予測を実行すると履歴が表示されます</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((prediction) => (
            <div
              key={prediction.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onPredictionSelect?.(prediction)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {getEventDisplayName(prediction.target_event)}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getModelColor(prediction.model_version)}`}>
                      {prediction.model_version.includes('ai') ? 'AI予測' : '統計予測'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(prediction.confidence_level)}`}>
                      信頼度: {Math.round(prediction.confidence_level * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-900">{formatTime(prediction.predicted_time_seconds)}</span>
                      <span className="ml-1">予測タイム</span>
                    </div>
                    <div>
                      <span>{formatDate(prediction.prediction_date)}</span>
                      <span className="ml-1">予測日</span>
                    </div>
                    <div>
                      <span>{formatDate(prediction.created_at)}</span>
                      <span className="ml-1">作成日</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {prediction.base_workouts?.total_workouts || 0}回の練習データ
                  </div>
                  <div className="text-xs text-gray-400">
                    {prediction.base_workouts?.analysis_period_days || 0}日間分析
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 統計情報 */}
      {filteredPredictions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">統計情報</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {filteredPredictions.length}
              </div>
              <div className="text-gray-600">総予測数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(filteredPredictions.reduce((sum, p) => sum + p.confidence_level, 0) / filteredPredictions.length * 100)}%
              </div>
              <div className="text-gray-600">平均信頼度</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {filteredPredictions.filter(p => p.model_version.includes('ai')).length}
              </div>
              <div className="text-gray-600">AI予測</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {filteredPredictions.filter(p => p.model_version.includes('statistical')).length}
              </div>
              <div className="text-gray-600">統計予測</div>
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
  )
}

'use client'

import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

interface PredictionResult {
  predicted_time_seconds: number
  confidence_level: number
  base_info: {
    model_version: string
    analysis_period_days: number
    weekly_mileage_km: number
    total_workouts: number
    avg_pace_per_km: number
    training_consistency: number
    intensity_distribution: {
      easy_ratio: number
      tempo_ratio: number
      interval_ratio: number
      race_ratio: number
    }
    trend_analysis: {
      pace_trend: number
      distance_trend: number
      intensity_trend: number
    }
    recent_race_count: number
    confidence_factors: {
      data_volume: string
      consistency: string
      race_history: string
    }
  }
}

interface AIPredictionCardProps {
  targetEvent: string
  onPredictionComplete?: (result: PredictionResult) => void
}

export function AIPredictionCard({ targetEvent, onPredictionComplete }: AIPredictionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

  const formatPace = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return '高'
    if (confidence >= 0.6) return '中'
    return '低'
  }

  const getFactorColor = (factor: string): string => {
    switch (factor) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getFactorText = (factor: string): string => {
    switch (factor) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '不明'
    }
  }

  const handlePredict = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await apiClient.calculatePrediction({
        target_event: targetEvent as any
      })

      setPrediction(result)
      onPredictionComplete?.(result)
      setToast({ message: 'AI予測が完了しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI予測</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{targetEvent}</span>
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '予測中...' : '予測実行'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">エラー</h4>
          <p className="text-sm text-red-700">{error.message || error}</p>
          {error.suggestion && (
            <p className="text-sm text-gray-500 mt-1">{error.suggestion}</p>
          )}
        </div>
      )}

      {prediction && (
        <div className="space-y-6">
          {/* 予測結果 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">予測タイム</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {formatTime(prediction.predicted_time_seconds)}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence_level)}`}>
                  信頼度: {getConfidenceText(prediction.confidence_level)} ({Math.round(prediction.confidence_level * 100)}%)
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  モデル: {prediction.base_info.model_version}
                </p>
              </div>
            </div>
          </div>

          {/* 分析情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">練習データ分析</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">分析期間:</span>
                  <span className="font-medium">{prediction.base_info.analysis_period_days}日</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">練習回数:</span>
                  <span className="font-medium">{prediction.base_info.total_workouts}回</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">週間走行距離:</span>
                  <span className="font-medium">{prediction.base_info.weekly_mileage_km}km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平均ペース:</span>
                  <span className="font-medium">{formatPace(prediction.base_info.avg_pace_per_km)}/km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">練習一貫性:</span>
                  <span className="font-medium">{Math.round(prediction.base_info.training_consistency * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">信頼度要因</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">データ量:</span>
                  <span className={`font-medium ${getFactorColor(prediction.base_info.confidence_factors.data_volume)}`}>
                    {getFactorText(prediction.base_info.confidence_factors.data_volume)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">練習一貫性:</span>
                  <span className={`font-medium ${getFactorColor(prediction.base_info.confidence_factors.consistency)}`}>
                    {getFactorText(prediction.base_info.confidence_factors.consistency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">レース履歴:</span>
                  <span className={`font-medium ${getFactorColor(prediction.base_info.confidence_factors.race_history)}`}>
                    {getFactorText(prediction.base_info.confidence_factors.race_history)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最近のレース:</span>
                  <span className="font-medium">{prediction.base_info.recent_race_count}回</span>
                </div>
              </div>
            </div>
          </div>

          {/* 強度分布 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">練習強度分布</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(prediction.base_info.intensity_distribution.easy_ratio * 100)}%
                </div>
                <div className="text-sm text-gray-600">イージー</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(prediction.base_info.intensity_distribution.tempo_ratio * 100)}%
                </div>
                <div className="text-sm text-gray-600">テンポ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(prediction.base_info.intensity_distribution.interval_ratio * 100)}%
                </div>
                <div className="text-sm text-gray-600">インターバル</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(prediction.base_info.intensity_distribution.race_ratio * 100)}%
                </div>
                <div className="text-sm text-gray-600">レース</div>
              </div>
            </div>
          </div>

          {/* トレンド分析 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">トレンド分析</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  prediction.base_info.trend_analysis.pace_trend < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.base_info.trend_analysis.pace_trend < 0 ? '↗' : '↘'}
                </div>
                <div className="text-gray-600">ペース</div>
                <div className="text-xs text-gray-500">
                  {prediction.base_info.trend_analysis.pace_trend < 0 ? '向上' : '低下'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  prediction.base_info.trend_analysis.distance_trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.base_info.trend_analysis.distance_trend > 0 ? '↗' : '↘'}
                </div>
                <div className="text-gray-600">距離</div>
                <div className="text-xs text-gray-500">
                  {prediction.base_info.trend_analysis.distance_trend > 0 ? '増加' : '減少'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  prediction.base_info.trend_analysis.intensity_trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.base_info.trend_analysis.intensity_trend > 0 ? '↗' : '↘'}
                </div>
                <div className="text-gray-600">強度</div>
                <div className="text-xs text-gray-500">
                  {prediction.base_info.trend_analysis.intensity_trend > 0 ? '向上' : '低下'}
                </div>
              </div>
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

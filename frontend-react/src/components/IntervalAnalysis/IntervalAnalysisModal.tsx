'use client'

import { useState, useEffect } from 'react'
import { IntervalAnalysisResponse, CorrectionApplyResponse } from '@/types/intervalAnalysis'

interface IntervalAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysisData: IntervalAnalysisResponse | null
  onApplyCorrection: (correctionType: string) => Promise<void>
  onSetUserChoice: (choice: 'raw' | 'processed') => Promise<void>
  isLoading?: boolean
}

export function IntervalAnalysisModal({
  isOpen,
  onClose,
  analysisData,
  onApplyCorrection,
  onSetUserChoice,
  isLoading = false
}: IntervalAnalysisModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<'raw' | 'processed'>('raw')
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    if (analysisData) {
      setSelectedChoice('raw')
      setShowComparison(false)
    }
  }, [analysisData])

  if (!isOpen || !analysisData) return null

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const handleApplyCorrection = async () => {
    if (analysisData.suggested_corrections.length > 0) {
      const correction = analysisData.suggested_corrections[0]
      await onApplyCorrection(correction.type)
      setShowComparison(true)
    }
  }

  const handleConfirmChoice = async () => {
    await onSetUserChoice(selectedChoice)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">インターバル分析結果</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 分析結果サマリー */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysisData.total_laps}</div>
                <div className="text-sm text-gray-600">総ラップ数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(analysisData.average_lap_time)}
                </div>
                <div className="text-sm text-gray-600">平均ラップタイム</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDistance(analysisData.average_lap_distance)}
                </div>
                <div className="text-sm text-gray-600">平均ラップ距離</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${analysisData.has_anomaly ? 'text-red-600' : 'text-green-600'}`}>
                  {analysisData.has_anomaly ? '異常あり' : '正常'}
                </div>
                <div className="text-sm text-gray-600">状態</div>
              </div>
            </div>
          </div>

          {/* 異常検出結果 */}
          {analysisData.has_anomaly && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-800">異常が検出されました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p><strong>異常タイプ:</strong> {analysisData.anomaly_type}</p>
                    <p><strong>ラップ番号:</strong> {analysisData.anomaly_lap_index !== null ? analysisData.anomaly_lap_index + 1 : 'N/A'}</p>
                    <p><strong>深刻度:</strong> {analysisData.anomaly_severity}</p>
                    <p><strong>説明:</strong> {analysisData.analysis_metadata.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ラップ詳細 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">ラップ詳細</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ラップ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タイム
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      距離
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ペース
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisData.lap_times.map((time, index) => (
                    <tr key={index} className={index === analysisData.anomaly_lap_index ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistance(analysisData.lap_distances[index])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPace(analysisData.lap_paces[index])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index === analysisData.anomaly_lap_index ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            異常
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 修正提案 */}
          {analysisData.has_anomaly && analysisData.suggested_corrections.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-3">修正提案</h3>
              {analysisData.suggested_corrections.map((correction, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">
                        <strong>修正タイプ:</strong> {correction.type}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>理由:</strong> {correction.reason}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>信頼度:</strong> {(correction.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <button
                      onClick={handleApplyCorrection}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? '適用中...' : '修正を適用'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* データ選択 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">使用するデータを選択</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="dataChoice"
                  value="raw"
                  checked={selectedChoice === 'raw'}
                  onChange={(e) => setSelectedChoice(e.target.value as 'raw' | 'processed')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">元データを使用</div>
                  <div className="text-sm text-gray-600">インポート時の生データを使用します</div>
                </div>
              </label>
              
              {showComparison && (
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dataChoice"
                    value="processed"
                    checked={selectedChoice === 'processed'}
                    onChange={(e) => setSelectedChoice(e.target.value as 'raw' | 'processed')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">修正データを使用</div>
                    <div className="text-sm text-gray-600">異常検出に基づいて修正されたデータを使用します</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirmChoice}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '処理中...' : '選択を確定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

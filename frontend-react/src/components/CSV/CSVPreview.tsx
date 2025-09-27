'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Eye, EyeOff, Download, RefreshCw } from 'lucide-react'

interface PreviewData {
  sample_data: any[]
  total_rows: number
  valid_rows: number
  invalid_rows: number
  detected_encoding: string
  detected_format: string
  columns_count: number
  processing_time_ms: number
  warnings: Array<{
    type: string
    message: string
    severity: 'warning' | 'error' | 'info'
  }>
  lap_analysis?: Array<{
    lap_number: number
    distance: number
    time: number
    pace: string
    avg_heart_rate: number
  }>
  dash_count?: number
}

interface CSVPreviewProps {
  previewData: PreviewData
  onConfirm: () => void
  onCancel: () => void
  onRetry: () => void
  className?: string
}

export function CSVPreview({ 
  previewData, 
  onConfirm, 
  onCancel, 
  onRetry,
  className = '' 
}: CSVPreviewProps) {
  const [showInvalidRows, setShowInvalidRows] = useState(false)
  const [showLapAnalysis, setShowLapAnalysis] = useState(false)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-800 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-800 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-800 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200'
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const downloadSampleCSV = () => {
    const sampleData = `time,distance,duration,pace,heart_rate,speed
2024-01-01 09:00:00,0.0,0,0:00,120,0
2024-01-01 09:01:00,0.2,60,5:00,125,12
2024-01-01 09:02:00,0.4,120,5:00,130,12
2024-01-01 09:03:00,0.6,180,5:00,135,12
2024-01-01 09:04:00,0.8,240,5:00,140,12
2024-01-01 09:05:00,1.0,300,5:00,145,12`

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_workout_data.csv')
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CSVプレビュー</h3>
          <p className="text-sm text-gray-600">ファイルの内容を確認してからインポートを実行してください</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            再読み込み
          </button>
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            サンプル
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">有効行</p>
              <p className="text-2xl font-bold text-green-600">{previewData.valid_rows}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">無効行</p>
              <p className="text-2xl font-bold text-red-600">{previewData.invalid_rows}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">総行数</p>
              <p className="text-2xl font-bold text-blue-600">{previewData.total_rows}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">カラム数</p>
              <p className="text-2xl font-bold text-yellow-600">{previewData.columns_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ファイル情報 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">ファイル情報</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">検出エンコーディング:</span>
            <span className="ml-2 font-medium">{previewData.detected_encoding}</span>
          </div>
          <div>
            <span className="text-gray-600">検出フォーマット:</span>
            <span className="ml-2 font-medium">{previewData.detected_format}</span>
          </div>
          <div>
            <span className="text-gray-600">処理時間:</span>
            <span className="ml-2 font-medium">{formatTime(previewData.processing_time_ms)}</span>
          </div>
          {previewData.dash_count !== undefined && (
            <div>
              <span className="text-gray-600">ダッシュ数:</span>
              <span className="ml-2 font-medium">{previewData.dash_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* 警告・エラー */}
      {previewData.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">警告・エラー</h4>
          {previewData.warnings.map((warning, index) => (
            <div key={index} className={`rounded-lg border p-3 ${getSeverityColor(warning.severity)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  {getSeverityIcon(warning.severity)}
                </div>
                <div>
                  <p className="font-medium">{warning.type}</p>
                  <p className="text-sm">{warning.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ラップ分析 */}
      {previewData.lap_analysis && previewData.lap_analysis.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowLapAnalysis(!showLapAnalysis)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">ラップ分析</h4>
              {showLapAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {showLapAnalysis && (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ラップ</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">距離</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ペース</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">平均心拍</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.lap_analysis.map((lap, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{lap.lap_number}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{lap.distance.toFixed(2)}km</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{Math.floor(lap.time / 60)}:{(lap.time % 60).toString().padStart(2, '0')}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{lap.pace}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{lap.avg_heart_rate}bpm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* サンプルデータ */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">サンプルデータ（最初の10行）</h4>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.sample_data.length > 0 && Object.keys(previewData.sample_data[0]).map((key, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.sample_data.slice(0, 10).map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 無効行の表示 */}
      {previewData.invalid_rows > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowInvalidRows(!showInvalidRows)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-medium text-gray-900">無効行の詳細 ({previewData.invalid_rows}行)</h4>
              {showInvalidRows ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {showInvalidRows && (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  無効行は自動的にスキップされます。エラーの詳細を確認して、必要に応じてファイルを修正してください。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          disabled={previewData.valid_rows === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {previewData.valid_rows > 0 ? `${previewData.valid_rows}件をインポート` : 'インポート不可'}
        </button>
      </div>
    </div>
  )
}

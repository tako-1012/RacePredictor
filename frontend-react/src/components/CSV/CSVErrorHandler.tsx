'use client'

import React, { useState } from 'react'
import { AlertTriangle, Download, RefreshCw, HelpCircle, CheckCircle, XCircle } from 'lucide-react'

interface ErrorDetails {
  type: string
  message: string
  suggestion?: string
  details?: string
  severity: 'error' | 'warning' | 'info'
}

interface CSVErrorHandlerProps {
  error: ErrorDetails | null
  onRetry?: () => void
  onDownloadSample?: () => void
  onShowHelp?: () => void
  className?: string
}

export function CSVErrorHandler({ 
  error, 
  onRetry, 
  onDownloadSample, 
  onShowHelp,
  className = '' 
}: CSVErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!error) return null

  const getIcon = () => {
    switch (error.severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <HelpCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (error.severity) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (error.severity) {
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  const getActionButtons = () => {
    const buttons = []

    if (onRetry) {
      buttons.push(
        <button
          key="retry"
          onClick={onRetry}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          再試行
        </button>
      )
    }

    if (onDownloadSample) {
      buttons.push(
        <button
          key="sample"
          onClick={onDownloadSample}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4 mr-1" />
          サンプルダウンロード
        </button>
      )
    }

    if (onShowHelp) {
      buttons.push(
        <button
          key="help"
          onClick={onShowHelp}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          ヘルプ
        </button>
      )
    }

    return buttons
  }

  return (
    <div className={`rounded-lg border p-4 ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {error.type === 'file_too_large' && 'ファイルサイズが大きすぎます'}
            {error.type === 'no_csv_file' && 'CSVファイルではありません'}
            {error.type === 'empty_file' && 'ファイルが空です'}
            {error.type === 'invalid_file_format' && 'ファイル形式が正しくありません'}
            {error.type === 'encoding_error' && '文字エンコーディングエラー'}
            {error.type === 'preview_failed' && 'プレビュー生成に失敗しました'}
            {error.type === 'import_failed' && 'インポートに失敗しました'}
            {error.type === 'validation_error' && '入力値が正しくありません'}
            {error.type === 'unexpected_error' && '予期しないエラーが発生しました'}
            {!['file_too_large', 'no_csv_file', 'empty_file', 'invalid_file_format', 'encoding_error', 'preview_failed', 'import_failed', 'validation_error', 'unexpected_error'].includes(error.type) && 'エラーが発生しました'}
          </h3>
          
          <div className={`mt-1 text-sm ${getTextColor()}`}>
            <p>{error.message}</p>
          </div>

          {error.suggestion && (
            <div className={`mt-2 text-sm ${getTextColor()}`}>
              <p className="font-medium">推奨対処法:</p>
              <p>{error.suggestion}</p>
            </div>
          )}

          {error.details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {showDetails ? '詳細を隠す' : '詳細を表示'}
              </button>
              {showDetails && (
                <div className={`mt-2 p-3 rounded-md bg-white bg-opacity-50 ${getTextColor()}`}>
                  <pre className="text-xs whitespace-pre-wrap">{error.details}</pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {getActionButtons()}
          </div>
        </div>
      </div>
    </div>
  )
}

// エラーメッセージの変換関数
export function convertTechnicalError(error: any): ErrorDetails {
  if (typeof error === 'string') {
    return {
      type: 'unexpected_error',
      message: error,
      severity: 'error'
    }
  }

  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail
    
    if (typeof detail === 'string') {
      return {
        type: 'unexpected_error',
        message: detail,
        severity: 'error'
      }
    }

    if (typeof detail === 'object') {
      return {
        type: detail.error_type || 'unexpected_error',
        message: detail.message || 'エラーが発生しました',
        suggestion: detail.suggestion,
        details: detail.details,
        severity: 'error'
      }
    }
  }

  if (error?.message) {
    // 技術的エラーメッセージを分かりやすい日本語に変換
    const message = error.message.toLowerCase()
    
    if (message.includes('file too large') || message.includes('size')) {
      return {
        type: 'file_too_large',
        message: 'ファイルサイズが大きすぎます（10MB以下にしてください）',
        suggestion: 'ファイルを分割するか、不要なデータを削除してから再試行してください。',
        severity: 'error'
      }
    }

    if (message.includes('csv') || message.includes('format')) {
      return {
        type: 'invalid_file_format',
        message: 'CSVファイルの形式が正しくありません',
        suggestion: 'ファイルがCSV形式であることを確認し、文字エンコーディングをUTF-8に変更してから再試行してください。',
        severity: 'error'
      }
    }

    if (message.includes('encoding') || message.includes('decode')) {
      return {
        type: 'encoding_error',
        message: '文字エンコーディングエラーが発生しました',
        suggestion: 'ファイルをUTF-8エンコーディングで保存し直してから再試行してください。Garminデバイスのファイルは自動的に文字化けを修正します。',
        severity: 'error'
      }
    }

    if (message.includes('empty') || message.includes('no data')) {
      return {
        type: 'empty_file',
        message: 'ファイルにデータが含まれていません',
        suggestion: 'ファイルに有効なデータが含まれていることを確認してください。',
        severity: 'error'
      }
    }

    return {
      type: 'unexpected_error',
      message: error.message,
      severity: 'error'
    }
  }

  return {
    type: 'unexpected_error',
    message: '予期しないエラーが発生しました',
    suggestion: 'しばらく時間をおいてから再試行してください。問題が続く場合はサポートにお問い合わせください。',
    severity: 'error'
  }
}

// サンプルCSVファイルのダウンロード機能
export function downloadSampleCSV(type: 'workout' | 'race') {
  const sampleData = type === 'workout' 
    ? `time,distance,duration,pace,heart_rate,speed
2024-01-01 09:00:00,0.0,0,0:00,120,0
2024-01-01 09:01:00,0.2,60,5:00,125,12
2024-01-01 09:02:00,0.4,120,5:00,130,12
2024-01-01 09:03:00,0.6,180,5:00,135,12
2024-01-01 09:04:00,0.8,240,5:00,140,12
2024-01-01 09:05:00,1.0,300,5:00,145,12`
    : `race_name,race_date,distance_meters,time_seconds,pace_seconds,place,total_participants,weather,course_type
東京マラソン,2024-03-10,42195,14400,204,1500,35000,晴れ,ロード
大阪マラソン,2024-02-25,42195,15000,213,800,25000,曇り,ロード`

  const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `sample_${type}_data.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

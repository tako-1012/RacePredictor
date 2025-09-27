'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/UI/Icons'

interface ExportOptions {
  format: 'csv' | 'json' | 'excel'
  dateRange: {
    start: string
    end: string
  }
  dataTypes: {
    workouts: boolean
    races: boolean
    profile: boolean
    analytics: boolean
  }
  includeMetadata: boolean
  compression: boolean
}

interface DataExportProps {
  onClose?: () => void
  onExport?: (options: ExportOptions) => void
}

export function DataExport({ onClose, onExport }: DataExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30日前
      end: new Date().toISOString().split('T')[0] // 今日
    },
    dataTypes: {
      workouts: true,
      races: true,
      profile: true,
      analytics: false
    },
    includeMetadata: true,
    compression: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleDataTypeChange = (dataType: keyof ExportOptions['dataTypes'], value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      dataTypes: { ...prev.dataTypes, [dataType]: value }
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // 実際の実装では、APIにエクスポートリクエストを送信
      onExport?.(exportOptions)

      // プログレスシミュレーション
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsExporting(false)
            return 100
          }
          return prev + 10
        })
      }, 200)

    } catch (error) {
      console.error('エクスポートエラー:', error)
      setIsExporting(false)
    }
  }

  const getFileSizeEstimate = () => {
    let size = 0
    if (exportOptions.dataTypes.workouts) size += 50 // KB
    if (exportOptions.dataTypes.races) size += 20 // KB
    if (exportOptions.dataTypes.profile) size += 5 // KB
    if (exportOptions.dataTypes.analytics) size += 100 // KB
    if (exportOptions.includeMetadata) size += 10 // KB
    
    return `${size} KB`
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv':
        return 'ExcelやGoogleスプレッドシートで開ける形式'
      case 'json':
        'プログラミングで処理しやすい形式'
      case 'excel':
        return 'Excelファイル形式（.xlsx）'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icons.Download size="md" className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">データエクスポート</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icons.X size="md" />
            </button>
          )}
        </div>

        {/* フォーム */}
        <div className="p-6 space-y-6">
          {/* エクスポート形式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              エクスポート形式
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'csv', label: 'CSV', icon: <Icons.FileSpreadsheet size="sm" /> },
                { value: 'json', label: 'JSON', icon: <Icons.FileText size="sm" /> },
                { value: 'excel', label: 'Excel', icon: <Icons.FileSpreadsheet size="sm" /> }
              ].map(format => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => handleOptionChange('format', format.value)}
                  className={`p-3 border rounded-md text-left transition-colors ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {format.icon}
                    <span className="font-medium">{format.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getFormatDescription(format.value)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 日付範囲 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              日付範囲
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => handleOptionChange('dateRange', {
                    ...exportOptions.dateRange,
                    start: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => handleOptionChange('dateRange', {
                    ...exportOptions.dateRange,
                    end: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* データタイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              エクスポートするデータ
            </label>
            <div className="space-y-3">
              {[
                { key: 'workouts', label: '練習記録', description: '練習の詳細データ', icon: <Icons.Activity size="sm" /> },
                { key: 'races', label: 'レース結果', description: 'レース記録と結果', icon: <Icons.Trophy size="sm" /> },
                { key: 'profile', label: 'プロフィール', description: '基本情報と自己ベスト', icon: <Icons.User size="sm" /> },
                { key: 'analytics', label: '分析データ', description: '統計と分析結果', icon: <Icons.BarChart3 size="sm" /> }
              ].map(dataType => (
                <label
                  key={dataType.key}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={exportOptions.dataTypes[dataType.key as keyof ExportOptions['dataTypes']]}
                    onChange={(e) => handleDataTypeChange(dataType.key as keyof ExportOptions['dataTypes'], e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    {dataType.icon}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {dataType.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {dataType.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* オプション */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              オプション
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    メタデータを含める
                  </div>
                  <div className="text-xs text-gray-600">
                    エクスポート日時、バージョン情報など
                  </div>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.compression}
                  onChange={(e) => handleOptionChange('compression', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    圧縮する
                  </div>
                  <div className="text-xs text-gray-600">
                    ファイルサイズを小さくします
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* エクスポート情報 */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">エクスポート情報</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>形式: {exportOptions.format.toUpperCase()}</div>
              <div>期間: {exportOptions.dateRange.start} ～ {exportOptions.dateRange.end}</div>
              <div>データ: {Object.entries(exportOptions.dataTypes).filter(([_, selected]) => selected).map(([key, _]) => key).join(', ')}</div>
              <div>推定サイズ: {getFileSizeEstimate()}</div>
            </div>
          </div>

          {/* プログレスバー */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>エクスポート中...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isExporting}
              >
                キャンセル
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>エクスポート中...</span>
                </div>
              ) : (
                'エクスポート開始'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// データエクスポートボタンコンポーネント
export function DataExportButton() {
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowExport(true)}
        className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
      >
        <Icons.Download size="sm" />
        <span>データエクスポート</span>
      </button>

      {showExport && (
        <DataExport
          onClose={() => setShowExport(false)}
          onExport={(options) => {
            console.log('データエクスポート:', options)
            setShowExport(false)
          }}
        />
      )}
    </>
  )
}

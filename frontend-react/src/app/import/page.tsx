'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { CSVImportPreview, CSVImportResult } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
}

function FileUpload({ onFileSelect, isUploading }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => 
      file.type === 'text/csv' || 
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    )
    
    if (csvFile) {
      onFileSelect(csvFile)
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            CSV/Excelファイルをアップロード
          </h3>
          <p className="text-sm text-gray-600">
            ファイルをドラッグ&ドロップするか、クリックして選択してください
          </p>
        </div>
        <div className="text-xs text-gray-500">
          対応形式: CSV, Excel (.xlsx, .xls)<br />
          最大ファイルサイズ: 10MB
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          ファイルを選択
        </label>
      </div>
    </div>
  )
}

interface PreviewTableProps {
  preview: CSVImportPreview
  onMappingChange: (mapping: Record<string, string>) => void
}

function PreviewTable({ preview, onMappingChange }: PreviewTableProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const handleMappingChange = (columnIndex: number, field: string) => {
    const newMapping = { ...mapping, [columnIndex.toString()]: field }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const fieldOptions = [
    { value: '', label: 'マッピングしない' },
    { value: 'date', label: '日付' },
    { value: 'race_name', label: '大会名' },
    { value: 'race_type', label: 'レース種目' },
    { value: 'distance_meters', label: '距離(m)' },
    { value: 'time_seconds', label: 'タイム(秒)' },
    { value: 'place', label: '順位' },
    { value: 'total_participants', label: '参加者数' },
    { value: 'notes', label: 'メモ' },
    { value: 'is_relay', label: '駅伝フラグ' },
    { value: 'relay_segment', label: '区間番号' },
    { value: 'team_name', label: 'チーム名' },
    { value: 'weather', label: '天気' },
    { value: 'course_type', label: 'コースタイプ' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">データプレビュー</h3>
        <div className="text-sm text-gray-600">
          {preview.total_rows}行中{preview.preview_rows.length}行を表示
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {preview.columns.map((column, index) => (
                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  <div className="space-y-1">
                    <div>列 {index + 1}</div>
                    <select
                      value={mapping[index.toString()] || ''}
                      onChange={(e) => handleMappingChange(index, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-1 py-0.5"
                    >
                      {fieldOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.preview_rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">エラー</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {preview.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface ImportProgressProps {
  result: CSVImportResult
  onClose: () => void
}

function ImportProgress({ result, onClose }: ImportProgressProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 text-green-500 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">インポート完了</h3>
        <p className="text-sm text-gray-600">
          {result.success_count}件のレース結果を正常にインポートしました
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">成功:</span>
            <span className="ml-2 font-medium text-green-600">{result.success_count}件</span>
          </div>
          <div>
            <span className="text-gray-600">失敗:</span>
            <span className="ml-2 font-medium text-red-600">{result.error_count}件</span>
          </div>
          <div>
            <span className="text-gray-600">スキップ:</span>
            <span className="ml-2 font-medium text-yellow-600">{result.skipped_count}件</span>
          </div>
          <div>
            <span className="text-gray-600">合計:</span>
            <span className="ml-2 font-medium text-gray-900">{result.total_count}件</span>
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">エラー詳細</h4>
          <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
            {result.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          完了
        </button>
      </div>
    </div>
  )
}

export default function ImportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSVインポート</h1>
          <p className="mt-2 text-gray-600">インポートしたいデータの種類を選択してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 練習記録インポート */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏃</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">練習記録</h2>
              <p className="text-gray-600 mb-6">
                Garmin Connectやその他のランニングアプリからエクスポートした練習データをインポート
              </p>
              <button
                onClick={() => router.push('/workouts/import')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                練習記録をインポート
              </button>
            </div>
          </div>

          {/* レース結果インポート */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏁</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">レース結果</h2>
              <p className="text-gray-600 mb-6">
                レース結果一覧や大会データをCSV/Excelファイルからインポート
              </p>
              <button
                onClick={() => router.push('/races/import')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                レース結果をインポート
              </button>
            </div>
          </div>
        </div>

        {/* ヘルプ情報 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">インポートについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">練習記録インポート</h4>
              <ul className="space-y-1">
                <li>• Garmin Connectエクスポート形式に対応</li>
                <li>• ラップデータの自動解析</li>
                <li>• 練習種別の自動推定</li>
                <li>• 心拍数・ペースデータの取得</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">レース結果インポート</h4>
              <ul className="space-y-1">
                <li>• カスタムマッピング機能</li>
                <li>• 駅伝データ対応</li>
                <li>• 詳細情報（天気・コース等）</li>
                <li>• レース予定への変換</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
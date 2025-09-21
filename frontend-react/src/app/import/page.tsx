'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { CSVImportPreview, CSVImportResult } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

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
  
  const [step, setStep] = useState<'upload' | 'preview' | 'import' | 'complete'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVImportPreview | null>(null)
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'ファイルサイズが10MBを超えています', type: 'error' })
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setSelectedFile(file)

      const formData = new FormData()
      formData.append('file', file)
      
      const previewData = await apiClient.uploadCSV(formData)
      setPreview(previewData)
      setStep('preview')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async (mapping: Record<string, string>) => {
    if (!selectedFile || !preview) return

    try {
      setIsImporting(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mapping', JSON.stringify(mapping))

      const result = await apiClient.importCSV(formData)
      setImportResult(result)
      setStep('complete')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    router.push('/races')
  }

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload')
      setSelectedFile(null)
      setPreview(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSVインポート</h1>
          <p className="mt-2 text-gray-600">CSV/Excelファイルからレース結果を一括インポート</p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <nav className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">ファイルアップロード</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
        </div>
                <span className="ml-2 text-sm font-medium">プレビュー・マッピング</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">インポート完了</span>
              </div>
            </div>
          </nav>
          </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {step === 'upload' && (
            <FileUpload onFileSelect={handleFileSelect} isUploading={isUploading} />
          )}

          {step === 'preview' && preview && (
            <div className="space-y-6">
              <PreviewTable preview={preview} onMappingChange={handleImport} />
              <div className="flex justify-between">
                  <button
                  onClick={handleBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                  戻る
                  </button>
                  <button
                  onClick={() => handleImport({})}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                  {isImporting ? 'インポート中...' : 'インポート実行'}
                  </button>
                </div>
              </div>
          )}

          {step === 'complete' && importResult && (
            <ImportProgress result={importResult} onClose={handleClose} />
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">エラー</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { CSVImportPreview, CSVImportResult } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { IntervalAnalysisModal } from '@/components/IntervalAnalysis/IntervalAnalysisModal'
import { IntervalAnalysisResponse } from '@/types/intervalAnalysis'

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
            練習記録CSV/Excelファイルをアップロード
          </h3>
          <p className="text-sm text-gray-600">
            ファイルをドラッグ&ドロップするか、クリックして選択してください
          </p>
        </div>
        <div className="text-xs text-gray-500">
          対応形式: CSV, Excel (.xlsx, .xls)<br />
          最大ファイルサイズ: 10MB<br />
          推奨: Garmin Connectエクスポート形式
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
  const [showIntervalAnalysis, setShowIntervalAnalysis] = useState(false)
  const [intervalAnalysisData, setIntervalAnalysisData] = useState<IntervalAnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleMappingChange = (columnIndex: number, field: string) => {
    const newMapping = { ...mapping, [columnIndex.toString()]: field }
    setMapping(newMapping)
    onMappingChange(newMapping)
  }

  const handleAnalyzeInterval = async () => {
    try {
      setIsAnalyzing(true)
      
      // ラップデータを抽出
      const lapTimes = preview.lap_analysis
        .filter(lap => lap['ラップ数'] !== '概要' && lap['タイム'] && lap['タイム'] !== '-')
        .map(lap => {
          // 時間を秒に変換（例: "1:30" -> 90秒）
          const timeStr = lap['タイム'] || lap.time || '0:00'
          const [minutes, seconds] = timeStr.split(':').map(Number)
          return minutes * 60 + seconds
        })
      
      const lapDistances = preview.lap_analysis
        .filter(lap => lap['ラップ数'] !== '概要' && lap['距離'] && lap['距離'] !== '-')
        .map(lap => {
          // 距離をメートルに変換（例: "0.4km" -> 400）
          const distanceStr = lap['距離'] || lap.distance || '0'
          return parseFloat(distanceStr.replace('km', '')) * 1000
        })

      // インターバル分析を実行
      const analysisResult = await apiClient.analyzeIntervalData({
        workout_import_data_id: crypto.randomUUID(), // 一時的なUUIDを生成
        lap_times: lapTimes,
        lap_distances: lapDistances
      })

      setIntervalAnalysisData(analysisResult)
      setShowIntervalAnalysis(true)
    } catch (error) {
      console.error('Interval analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 練習記録用のフィールドオプション
  const fieldOptions = [
    { value: '', label: 'マッピングしない' },
    { value: 'date', label: '日付' },
    { value: 'workout_type', label: '練習種別' },
    { value: 'distance_meters', label: '距離(m)' },
    { value: 'duration_seconds', label: '時間(秒)' },
    { value: 'avg_pace_seconds', label: '平均ペース(秒/km)' },
    { value: 'intensity', label: '強度(1-10)' },
    { value: 'avg_heart_rate', label: '平均心拍数' },
    { value: 'max_heart_rate', label: '最大心拍数' },
    { value: 'notes', label: 'メモ' },
    { value: 'calories', label: '消費カロリー' },
    { value: 'elevation_gain', label: '標高ゲイン(m)' },
    { value: 'temperature', label: '気温(℃)' },
    { value: 'humidity', label: '湿度(%)' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">練習記録データプレビュー</h3>
        <div className="text-sm text-gray-600">
          {preview.statistics.total_rows}行中{preview.lap_analysis.length}行を表示
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">検出された情報</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700">総行数:</span>
            <span className="ml-2 font-medium">{preview.statistics.total_rows}</span>
          </div>
          <div>
            <span className="text-blue-700">有効行数:</span>
            <span className="ml-2 font-medium">{preview.statistics.valid_rows}</span>
          </div>
          <div>
            <span className="text-blue-700">エンコーディング:</span>
            <span className="ml-2 font-medium">{preview.statistics.detected_encoding}</span>
          </div>
          <div>
            <span className="text-blue-700">フォーマット:</span>
            <span className="ml-2 font-medium">{preview.statistics.detected_format}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ラップ番号</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">距離</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ペース</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">心拍数</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">判定</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.lap_analysis.slice(0, 10).map((lap, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-sm text-gray-900">{lap['ラップ数'] || lap.lap_number || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{lap['タイム'] || lap.time || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{lap['距離'] || lap.distance || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{lap['平均ペース'] || lap.pace || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">{lap['心拍数'] || lap.heart_rate || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lap['判定'] === 'ダッシュ' || lap.judgment === 'ダッシュ' ? 'bg-blue-100 text-blue-800' :
                    lap['判定'] === 'レスト' || lap.judgment === 'レスト' ? 'bg-green-100 text-green-800' :
                    lap['判定'] === '概要' || lap.judgment === '概要' ? 'bg-gray-100 text-gray-800' :
                    lap['判定'] === '正常' || lap.judgment === '正常' ? 'bg-green-100 text-green-800' :
                    lap['判定'] === '警告' || lap.judgment === '警告' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lap['判定'] || lap.judgment || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">警告</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {preview.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* インターバル分析ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyzeInterval}
          disabled={isAnalyzing}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>分析中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>インターバル分析を実行</span>
            </>
          )}
        </button>
      </div>

      {/* インターバル分析モーダル */}
      <IntervalAnalysisModal
        isOpen={showIntervalAnalysis}
        onClose={() => setShowIntervalAnalysis(false)}
        analysisData={intervalAnalysisData}
        onApplyCorrection={async (correctionType) => {
          // 修正適用の実装
          console.log('Applying correction:', correctionType)
        }}
        onSetUserChoice={async (choice) => {
          // ユーザー選択の実装
          console.log('User choice:', choice)
        }}
        isLoading={isAnalyzing}
      />
    </div>
  )
}

interface ImportSettingsProps {
  onImport: (settings: {
    workoutDate: string
    workoutTypeId: string
    intensity: number
  }) => void
  isImporting: boolean
}

function ImportSettings({ onImport, isImporting }: ImportSettingsProps) {
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [workoutTypeId, setWorkoutTypeId] = useState('')
  const [intensity, setIntensity] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onImport({ workoutDate, workoutTypeId, intensity })
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">インポート設定</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            練習日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            練習種別 <span className="text-red-500">*</span>
          </label>
          <select
            value={workoutTypeId}
            onChange={(e) => setWorkoutTypeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">練習種別を選択</option>
            <option value="easy_run">イージーランニング</option>
            <option value="tempo_run">テンポランニング</option>
            <option value="interval_run">インターバルランニング</option>
            <option value="long_run">ロングランニング</option>
            <option value="recovery_run">リカバリーランニング</option>
            <option value="hill_run">ヒルランニング</option>
            <option value="fartlek">ファートレック</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            強度 (1-10) <span className="text-red-500">*</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 (軽い)</span>
            <span className="font-medium">{intensity}</span>
            <span>10 (激しい)</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isImporting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'インポート中...' : '練習記録をインポート'}
          </button>
        </div>
      </form>
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
          {result.statistics.successful_imports}件の練習記録を正常にインポートしました
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">成功:</span>
            <span className="ml-2 font-medium text-green-600">{result.statistics.successful_imports}件</span>
          </div>
          <div>
            <span className="text-gray-600">失敗:</span>
            <span className="ml-2 font-medium text-red-600">{result.statistics.failed_imports}件</span>
          </div>
          <div>
            <span className="text-gray-600">処理済み:</span>
            <span className="ml-2 font-medium text-blue-600">{result.statistics.total_processed}件</span>
          </div>
          <div>
            <span className="text-gray-600">練習日:</span>
            <span className="ml-2 font-medium text-gray-900">{result.statistics.workout_date}</span>
          </div>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">警告</h4>
          <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
            {result.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
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

export default function WorkoutImportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [step, setStep] = useState<'upload' | 'preview' | 'settings' | 'complete'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVImportPreview | null>(null)
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<any | null>(null)
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

      const previewData = await apiClient.previewCSVImport(file)
      setPreview(previewData)
      setStep('preview')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async (settings: {
    workoutDate: string
    workoutTypeId: string
    intensity: number
  }) => {
    if (!selectedFile) return

    try {
      setIsImporting(true)
      setError(null)

      const result = await apiClient.confirmCSVImport(
        selectedFile,
        settings.workoutDate,
        settings.workoutTypeId,
        settings.intensity
      )
      setImportResult(result)
      setStep('complete')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    router.push('/workouts')
  }

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload')
      setSelectedFile(null)
      setPreview(null)
    } else if (step === 'settings') {
      setStep('preview')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">練習記録CSVインポート</h1>
          <p className="mt-2 text-gray-600">CSV/Excelファイルから練習記録を一括インポート</p>
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
                <span className="ml-2 text-sm font-medium">プレビュー</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">設定</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  4
                </div>
                <span className="ml-2 text-sm font-medium">完了</span>
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
              <PreviewTable preview={preview} onMappingChange={() => {}} />
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep('settings')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {step === 'settings' && (
            <div className="space-y-6">
              <ImportSettings onImport={handleImport} isImporting={isImporting} />
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  戻る
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
              <p className="text-sm text-red-700">{error.message || 'エラーが発生しました'}</p>
              {error.suggestion && (
                <p className="text-sm text-red-600 mt-2">
                  <strong>提案:</strong> {error.suggestion}
                </p>
              )}
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

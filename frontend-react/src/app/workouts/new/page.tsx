'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { WorkoutType, WorkoutFormData, WorkoutTemplate } from '@/types'

// CSVインポート用の型定義
interface CSVImportPreview {
  statistics: {
    total_rows: number
    valid_rows: number
    detected_encoding: string
    detected_format: string
  }
  estimated_workout_type?: string
  lap_analysis: Array<{
    [key: string]: any
  }>
  warnings?: Array<{
    type: string
    message?: string
    invalid_count?: number
    total_count?: number
  }>
}
import { DetailedWorkoutForm } from '../components/DetailedWorkoutForm'
import { WorkoutTemplateSelector } from '../components/WorkoutTemplateSelector'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { IntervalAnalysisModal } from '@/components/IntervalAnalysis/IntervalAnalysisModal'
import { IntervalAnalysisResponse } from '@/types/intervalAnalysis'
import { useTabProgress, useBrowserNotifications, useBookmarkableURL } from '@/hooks/useBrowserFeatures'

export default function NewWorkoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // Web最適化: ブラウザ特化機能
  const { setTabProgress, resetTabProgress } = useTabProgress()
  const { showNotification } = useBrowserNotifications()
  const { updateURL } = useBookmarkableURL()
  
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // インターバル分析関連の状態
  const [showIntervalAnalysis, setShowIntervalAnalysis] = useState(false)
  const [intervalAnalysisData, setIntervalAnalysisData] = useState<IntervalAnalysisResponse | null>(null)
  
  // テンプレート選択用の状態
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showDailyTemplateSelector, setShowDailyTemplateSelector] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    console.log('useEffect - isAuthenticated:', isAuthenticated)
    console.log('useEffect - authLoading:', authLoading)
    if (isAuthenticated) {
      console.log('useEffect - 認証済み、練習種別を読み込み開始')
      loadWorkoutTypes()
    } else if (!authLoading) {
      console.log('useEffect - 未認証、ログインページにリダイレクト')
    }
  }, [isAuthenticated, authLoading])

  const loadWorkoutTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('loadWorkoutTypes - 開始')
      console.log('loadWorkoutTypes - isAuthenticated:', isAuthenticated)
      console.log('loadWorkoutTypes - access_token:', localStorage.getItem('access_token'))
      
      const types = await apiClient.getWorkoutTypes()
      console.log('loadWorkoutTypes - loaded types:', types)
      console.log('loadWorkoutTypes - types.length:', types.length)
      setWorkoutTypes(types)
    } catch (err) {
      const apiError = handleApiError(err)
      console.error('loadWorkoutTypes - error:', apiError)
      console.error('loadWorkoutTypes - error details:', err)
      console.error('loadWorkoutTypes - response status:', err.response?.status)
      console.error('loadWorkoutTypes - response data:', err.response?.data)
      setError(apiError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: WorkoutFormData) => {
    try {
      setIsSubmitting(true)
      
      // Web最適化: タブ進捗表示
      setTabProgress(25, '練習記録を保存中...')
      
      await apiClient.createWorkout(data)
      
      // Web最適化: 進捗完了
      setTabProgress(100, '練習記録を保存しました')
      
      // Web最適化: ブラウザ通知
      await showNotification('練習記録を保存しました！', {
        body: `${data.workout_name || '練習記録'}が正常に保存されました`,
        tag: 'workout-saved'
      })
      
      setToast({ message: '練習記録を作成しました', type: 'success' })
      
      // Web最適化: URLを更新してブックマーク可能にする
      updateURL('/workouts')
      
      router.push('/workouts')
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
      
      // Web最適化: エラー時の通知
      await showNotification('練習記録の保存に失敗しました', {
        body: apiError.message,
        tag: 'workout-error'
      })
    } finally {
      setIsSubmitting(false)
      // Web最適化: 進捗をリセット
      setTimeout(() => resetTabProgress(), 2000)
    }
  }

  const handleCancel = () => {
    router.push('/workouts')
  }

  // CSVインポート関連の関数
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'ファイルサイズが10MBを超えています', type: 'error' })
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setSelectedFile(file)
      setShowEncodingSelector(false)

      const previewData = await apiClient.previewCSVImport(file)
      setPreview(previewData)
      
      // 文字化けが検出された場合、エンコーディング選択UIを表示
      if (previewData.warnings && previewData.warnings.some((w: any) => w.type === 'garbled_columns')) {
        setAvailableEncodings(['shift_jis', 'cp932', 'utf-8-sig', 'utf-8', 'euc-jp'])
        setShowEncodingSelector(true)
      } else {
        // 自動修正が成功した場合
        console.log('自動修正が成功しました。エンコーディング:', previewData.statistics.detected_encoding)
      }
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }


  const handleAnalyzeInterval = async () => {
    if (!preview) return

    try {
      // ラップデータを抽出
      const lapTimes = preview.lap_analysis
        .filter(lap => lap['ラップ数'] !== '概要' && lap['タイム'] && lap['タイム'] !== '-')
        .map(lap => {
          const timeStr = lap['タイム'] || lap.time || '0:00'
          const [minutes, seconds] = timeStr.split(':').map(Number)
          return minutes * 60 + seconds
        })
      
      const lapDistances = preview.lap_analysis
        .filter(lap => lap['ラップ数'] !== '概要' && lap['距離'] && lap['距離'] !== '-')
        .map(lap => {
          const distanceStr = lap['距離'] || lap.distance || '0'
          return parseFloat(distanceStr.replace('km', '')) * 1000
        })

      const analysisResult = await apiClient.analyzeIntervalData({
        workout_import_data_id: crypto.randomUUID(),
        lap_times: lapTimes,
        lap_distances: lapDistances
      })

      setIntervalAnalysisData(analysisResult)
      setShowIntervalAnalysis(true)
    } catch (error) {
      console.error('Interval analysis failed:', error)
      setToast({ message: 'インターバル分析に失敗しました', type: 'error' })
    }
  }

  const handleWorkoutTypeSelect = (workoutTypeId: string) => {
    setSelectedWorkoutTypeId(workoutTypeId)
    
    // インターバル練習が選択された場合、分析の確認を表示
    const selectedType = workoutTypes.find(type => type.id === workoutTypeId)
    if (selectedType && selectedType.name.toLowerCase().includes('インターバル')) {
      setShowIntervalAnalysisPrompt(true)
    } else {
      setShowIntervalAnalysisPrompt(false)
    }
  }

  const handleIntervalAnalysisConfirm = () => {
    setShowIntervalAnalysisPrompt(false)
    handleAnalyzeInterval()
  }

  const handleIntervalAnalysisCancel = () => {
    setShowIntervalAnalysisPrompt(false)
  }

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    setToast({ message: 'テンプレートを適用しました', type: 'success' })
  }

  const handleDailyTemplateSelect = (template: any) => {
    // 一日用テンプレートを適用
    setToast({ message: '一日用テンプレートを適用しました', type: 'success' })
  }

  // CSVインポート関連の状態変数
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEncodingSelector, setShowEncodingSelector] = useState(false)
  const [availableEncodings, setAvailableEncodings] = useState<string[]>([])
  const [selectedWorkoutTypeId, setSelectedWorkoutTypeId] = useState('')
  const [showIntervalAnalysisPrompt, setShowIntervalAnalysisPrompt] = useState(false)

  const handleEncodingRetry = async (encoding: string) => {
    if (!selectedFile) return
    
    try {
      setIsUploading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('encoding', encoding)
      
      const previewData = await apiClient.previewCSVImport(selectedFile, encoding)
      setPreview(previewData)
      setShowEncodingSelector(false)
      
      console.log('エンコーディング再試行成功:', previewData.statistics.detected_encoding)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  // 詳細フォーム用のハンドラー
  const handleDetailedWorkoutSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      // 詳細フォームのデータを従来のWorkoutFormDataに変換
      const convertedData = convertDetailedToWorkoutFormData(data)
      
      const response = await apiClient.post('/workouts', convertedData)
      
      setToast({ message: '練習記録を保存しました', type: 'success' })
      
      setTimeout(() => {
        router.push('/workouts')
      }, 1500)
    } catch (err) {
      const error = handleApiError(err)
      setToast({ message: error.message || 'エラーが発生しました', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 詳細フォームのデータを従来のWorkoutFormDataに変換
  const convertDetailedToWorkoutFormData = (detailedData: any): WorkoutFormData => {
    console.log('🔍 データ変換開始:', { detailedData })
    
    // 最初のセッションのメイン練習を取得（簡略化）
    const firstSession = detailedData.sessions[0]
    const mainSteps = firstSession?.sections.main.steps || []
    
    console.log('🔍 セッション情報:', {
      firstSession: firstSession ? {
        sessionNumber: firstSession.sessionNumber,
        time_period: firstSession.time_period,
        sections: Object.entries(firstSession.sections).map(([sectionType, section]) => ({
          sectionType,
          stepCount: section.steps.length,
          steps: section.steps.map(step => ({ id: step.id, type: step.type, distance: step.distance_meters }))
        }))
      } : null,
      mainSteps: mainSteps.map(step => ({ id: step.id, type: step.type, distance: step.distance_meters }))
    })
    
    if (mainSteps.length === 0) {
      console.log('❌ メイン練習のステップが設定されていません')
      throw new Error('メイン練習のステップが設定されていません')
    }

    // 最初のステップをメインのワークアウトとして使用
    const mainStep = mainSteps[0]
    
    const convertedData = {
      date: detailedData.date,
      workout_type_id: getWorkoutTypeIdByType(mainStep.type),
      distance_meters: mainStep.distance_meters || 0,
      time_seconds: mainStep.duration_seconds || 0,
      pace_per_km: parsePaceToSeconds(mainStep.target_pace || ''),
      intensity: mainStep.intensity_rpe || 5,
      notes: detailedData.notes || '',
      avg_heart_rate: detailedData.avg_heart_rate,
      max_heart_rate: detailedData.max_heart_rate
    }
    
    console.log('✅ データ変換完了:', { convertedData })
    return convertedData
  }

  // 練習種別からworkout_type_idを取得
  const getWorkoutTypeIdByType = (type: string): number => {
    const typeMap: Record<string, number> = {
      'easy_run': 1,
      'long_run': 2,
      'tempo_run': 3,
      'interval_run': 4,
      'repetition': 5,
      'hill_run': 6,
      'jogging': 1,
      'walking': 7,
      'cooldown': 8
    }
    return typeMap[type] || 1
  }

  // ペース文字列を秒に変換
  const parsePaceToSeconds = (pace: string): number => {
    if (!pace) return 0
    const match = pace.match(/(\d+):(\d+)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      return minutes * 60 + seconds
    }
    return 0
  }

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error.message || error}</p>
          {error.suggestion && (
            <p className="text-sm text-gray-500 mb-4">{error.suggestion}</p>
          )}
          {error.supported_formats && (
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium">サポートされている形式:</p>
              <ul className="list-disc list-inside mt-1">
                {error.supported_formats.map((format: string, index: number) => (
                  <li key={index}>{format}</li>
                ))}
              </ul>
            </div>
          )}
          {error.supported_extensions && (
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium">サポートされている拡張子:</p>
              <p>{error.supported_extensions.join(', ')}</p>
            </div>
          )}
          {error.max_size_mb && (
            <div className="text-sm text-gray-500 mb-4">
              <p>最大ファイルサイズ: {error.max_size_mb}MB</p>
              {error.current_size_mb && (
                <p>現在のファイルサイズ: {error.current_size_mb}MB</p>
              )}
            </div>
          )}
          <button
            onClick={loadWorkoutTypes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  // CSVインポート用のコンポーネント
  const FileUpload = ({ onFileSelect, isUploading }: { onFileSelect: (file: File) => void, isUploading: boolean }) => {
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
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
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    }

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
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
            <p className="text-lg font-medium text-gray-900">CSVファイルをアップロード</p>
            <p className="text-sm text-gray-500">ドラッグ&ドロップまたはクリックしてファイルを選択</p>
          </div>
          <div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isUploading ? 'アップロード中...' : 'ファイルを選択'}
            </label>
          </div>
        </div>
      </div>
    )
  }

  const PreviewTable = ({ preview, workoutTypes, onWorkoutTypeSelect, showIntervalAnalysisPrompt, onIntervalAnalysisConfirm, onIntervalAnalysisCancel, showEncodingSelector, availableEncodings, onEncodingRetry }: { 
    preview: CSVImportPreview, 
    workoutTypes: WorkoutType[],
    onWorkoutTypeSelect: (workoutTypeId: string) => void,
    showIntervalAnalysisPrompt: boolean,
    onIntervalAnalysisConfirm: () => void,
    onIntervalAnalysisCancel: () => void,
    showEncodingSelector: boolean,
    availableEncodings: string[],
    onEncodingRetry: (encoding: string) => void
  }) => {
    const [selectedWorkoutType, setSelectedWorkoutType] = useState('')

    // デバッグ用: workoutTypesの状態を確認
    console.log('PreviewTable - workoutTypes:', workoutTypes)
    console.log('PreviewTable - workoutTypes.length:', workoutTypes.length)

    // 推定された練習種別を自動選択
    useEffect(() => {
      if (preview.estimated_workout_type && workoutTypes.length > 0) {
        const estimatedType = workoutTypes.find(type => 
          type.name.includes(preview.estimated_workout_type) || 
          preview.estimated_workout_type.includes(type.name)
        )
        if (estimatedType && !selectedWorkoutType) {
          setSelectedWorkoutType(estimatedType.id)
          onWorkoutTypeSelect(estimatedType.id)
        }
      }
    }, [preview.estimated_workout_type, workoutTypes, selectedWorkoutType, onWorkoutTypeSelect])

    const handleWorkoutTypeChange = (workoutTypeId: string) => {
      setSelectedWorkoutType(workoutTypeId)
      onWorkoutTypeSelect(workoutTypeId)
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">検出された情報</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">総行数:</span>
              <span className="ml-2 font-medium">{preview.statistics.total_rows}</span>
            </div>
            <div>
              <span className="text-gray-600">有効行数:</span>
              <span className="ml-2 font-medium">{preview.statistics.valid_rows}</span>
            </div>
            <div>
              <span className="text-gray-600">エンコーディング:</span>
              <span className="ml-2 font-medium">{preview.statistics.detected_encoding}</span>
            </div>
            <div>
              <span className="text-gray-600">フォーマット:</span>
              <span className="ml-2 font-medium">{preview.statistics.detected_format}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {preview.statistics.valid_rows}行中{preview.statistics.valid_rows}行を表示
          </p>
        </div>

        {/* 自動修正成功メッセージ */}
        {!showEncodingSelector && preview.statistics.detected_encoding && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">自動修正完了</h4>
                <p className="text-sm text-green-700">
                  エンコーディング「<strong>{preview.statistics.detected_encoding}</strong>」で自動修正されました。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 推定された練習種別の表示 */}
        {preview.estimated_workout_type && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">AI推定結果</h4>
                <p className="text-sm text-blue-700">
                  データを分析した結果、「<strong>{preview.estimated_workout_type}</strong>」と推定されました。
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  下記から適切な練習種別を選択してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 練習種別選択 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">練習種別を選択</h3>
          {workoutTypes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">練習種別を読み込み中...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workoutTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleWorkoutTypeChange(type.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedWorkoutType === type.id
                        ? 'border-blue-500 bg-blue-100 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-medium">{type.name}</div>
                    {type.description && (
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    )}
                  </button>
                ))}
              </div>
              {selectedWorkoutType && (
                <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ {workoutTypes.find(t => t.id === selectedWorkoutType)?.name} が選択されました
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* インターバル分析プロンプト */}
        {showIntervalAnalysisPrompt && (
          <IntervalAnalysisPrompt 
            onConfirm={onIntervalAnalysisConfirm}
            onCancel={onIntervalAnalysisCancel}
          />
        )}

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

        {preview.warnings && preview.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">警告</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {preview.warnings.map((warning, index) => {
                let warningText = '';
                if (typeof warning === 'string') {
                  warningText = warning;
                } else if (warning.type === 'garbled_columns') {
                  warningText = '文字化けが検出されたカラムがあります。エンコーディングを確認してください。';
                } else if (warning.type === 'invalid_rows') {
                  warningText = `${warning.invalid_count || 0}/${warning.total_count || 0}行のデータが無効です。`;
                } else {
                  warningText = warning.message || warning.type || '警告が発生しました';
                }
                return (
                  <li key={index}>• {warningText}</li>
                );
              })}
            </ul>
          </div>
        )}

        {/* エンコーディング選択UI */}
        {showEncodingSelector && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">エンコーディングを選択</h4>
            <p className="text-sm text-blue-700 mb-3">
              文字化けが検出されました。適切なエンコーディングを選択して再試行してください。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableEncodings.map(encoding => (
                <button
                  key={encoding}
                  onClick={() => onEncodingRetry(encoding)}
                  className="px-3 py-2 text-sm border border-blue-300 rounded-md bg-white hover:bg-blue-100 text-blue-800 transition-colors"
                >
                  {encoding === 'shift_jis' ? 'Shift_JIS' :
                   encoding === 'cp932' ? 'CP932 (Windows)' :
                   encoding === 'utf-8-sig' ? 'UTF-8 (BOM付き)' :
                   encoding === 'utf-8' ? 'UTF-8' :
                   encoding === 'euc-jp' ? 'EUC-JP' : encoding}
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 自動修正機能により、最適なエンコーディングが既に選択されている可能性があります。
            </p>
          </div>
        )}

      </div>
    )
  }

  const IntervalAnalysisPrompt = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-purple-900">インターバル分析の実行</h3>
            <div className="mt-2 text-sm text-purple-700">
              <p>インターバル練習が選択されました。ラップデータの詳細分析を実行しますか？</p>
              <p className="mt-1 text-xs">分析により、ペースのばらつきや異常なラップを検出できます。</p>
            </div>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={onConfirm}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                はい、実行する
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1 bg-white text-purple-600 text-sm border border-purple-300 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                いいえ、スキップ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ImportSettings = ({ onImport, isImporting, selectedWorkoutTypeId }: { onImport: (settings: any) => void, isImporting: boolean, selectedWorkoutTypeId: string }) => {
    const [settings, setSettings] = useState({
      workoutDate: new Date().toISOString().split('T')[0],
      intensity: 3
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedWorkoutTypeId) {
        setToast({ message: '練習種別を選択してください', type: 'error' })
        return
      }
      onImport({
        ...settings,
        workoutTypeId: selectedWorkoutTypeId
      })
    }

    const selectedWorkoutType = workoutTypes.find(type => type.id === selectedWorkoutTypeId)

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">練習日</label>
          <input
            type="date"
            value={settings.workoutDate}
            onChange={(e) => setSettings(prev => ({ ...prev, workoutDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">選択された練習種目</label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            {selectedWorkoutType ? (
              <div>
                <div className="font-medium text-blue-900">{selectedWorkoutType.name}</div>
                {selectedWorkoutType.description && (
                  <div className="text-sm text-blue-700 mt-1">{selectedWorkoutType.description}</div>
                )}
              </div>
            ) : (
              <div className="text-blue-700">練習種別を選択してください</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">強度 (1-5)</label>
          <input
            type="range"
            min="1"
            max="5"
            value={settings.intensity}
            onChange={(e) => {
              const value = e.target.value
              const intensity = value === '' ? 5 : parseInt(value)
              setSettings(prev => ({ ...prev, intensity }))
            }}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>軽い</span>
            <span>{settings.intensity}</span>
            <span>激しい</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isImporting || !selectedWorkoutTypeId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'インポート中...' : '練習記録をインポート'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/workouts')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                ← 練習記録一覧に戻る
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">練習を記録</h1>
                <p className="mt-2 text-gray-600">ウォームアップ・メイン・クールダウンを詳細に記録</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <button
                  onClick={() => setShowDailyTemplateSelector(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  📅 一日用テンプレート
                </button>
                <p className="text-xs text-gray-500 mt-1">完全な一日の練習メニューを選択</p>
              </div>
              <div className="text-center">
                <button
                  onClick={() => router.push('/workouts/custom')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  📋 テンプレートを作成
                </button>
                <p className="text-xs text-gray-500 mt-1">新しいテンプレートを作成</p>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
        </div>

        {/* 詳細練習記録フォーム */}
        <DetailedWorkoutForm
          workoutTypes={workoutTypes}
          onSubmit={handleDetailedWorkoutSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* インターバル分析モーダル */}
        {showIntervalAnalysis && intervalAnalysisData && (
          <IntervalAnalysisModal
            isOpen={showIntervalAnalysis}
            onClose={() => setShowIntervalAnalysis(false)}
            analysisData={intervalAnalysisData}
            onApplyCorrection={() => {}}
            onSetUserChoice={() => {}}
          />
        )}

        {/* テンプレート選択モーダル */}
        {showTemplateSelector && (
          <WorkoutTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}

        {/* 一日用テンプレート選択モーダル */}
        {showDailyTemplateSelector && (
          <DailyTemplateSelector
            onSelectTemplate={handleDailyTemplateSelect}
            onClose={() => setShowDailyTemplateSelector(false)}
          />
        )}

      </div>
    </div>
  )
}

// 一日用テンプレート選択モーダルコンポーネント
interface DailyTemplateSelectorProps {
  onSelectTemplate: (template: any) => void
  onClose: () => void
}

function DailyTemplateSelector({ onSelectTemplate, onClose }: DailyTemplateSelectorProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDailyTemplates()
  }, [])

  const loadDailyTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 実際のAPIから一日用テンプレートを取得
      const response = await apiClient.getCustomWorkoutTemplates('daily')
      setTemplates(response)
    } catch (err) {
      console.error('テンプレートの読み込みエラー:', err)
      setError('テンプレートの読み込みに失敗しました')
      
      // フォールバック: デフォルトテンプレートを表示
      const defaultTemplates = [
        {
          id: 'easy_day',
          name: 'イージーデー',
          description: '回復を重視した軽い練習',
          sessions: [
            { time_period: 'morning', sections: { warmup: [{ type: 'jogging', distance: 2000, time: 10 }], main: [{ type: 'easy_run', distance: 5000, time: 25 }], cooldown: [{ type: 'walking', distance: 1000, time: 10 }] } }
          ],
          icon: '😌',
          color: 'green'
        },
        {
          id: 'interval_day',
          name: 'インターバルデー',
          description: '高強度インターバル練習',
          sessions: [
            { time_period: 'morning', sections: { warmup: [{ type: 'jogging', distance: 2000, time: 10 }], main: [{ type: 'interval_run', distance: 1600, time: 6 }], cooldown: [{ type: 'jogging', distance: 2000, time: 10 }] } }
          ],
          icon: '🔥',
          color: 'red'
        },
        {
          id: 'long_run_day',
          name: 'ロングランデー',
          description: '長距離持久走練習',
          sessions: [
            { time_period: 'morning', sections: { warmup: [{ type: 'jogging', distance: 2000, time: 10 }], main: [{ type: 'long_run', distance: 15000, time: 75 }], cooldown: [{ type: 'walking', distance: 1000, time: 10 }] } }
          ],
          icon: '🏃‍♂️',
          color: 'blue'
        },
        {
          id: 'tempo_day',
          name: 'テンポデー',
          description: '閾値ペースでの持続走',
          sessions: [
            { time_period: 'morning', sections: { warmup: [{ type: 'jogging', distance: 2000, time: 10 }], main: [{ type: 'tempo_run', distance: 5000, time: 20 }], cooldown: [{ type: 'jogging', distance: 2000, time: 10 }] } }
          ],
          icon: '⚡',
          color: 'orange'
        },
        {
          id: 'double_day',
          name: 'ダブルデー',
          description: '朝練と夕練の2部練',
          sessions: [
            { time_period: 'morning', sections: { warmup: [{ type: 'jogging', distance: 1000, time: 5 }], main: [{ type: 'easy_run', distance: 3000, time: 15 }], cooldown: [{ type: 'walking', distance: 500, time: 5 }] } },
            { time_period: 'evening', sections: { warmup: [{ type: 'jogging', distance: 1000, time: 5 }], main: [{ type: 'tempo_run', distance: 3000, time: 12 }], cooldown: [{ type: 'walking', distance: 1000, time: 10 }] } }
          ],
          icon: '🌅🌆',
          color: 'purple'
        }
      ]
      setTemplates(defaultTemplates)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              一日用テンプレートを選択
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">テンプレートを読み込み中...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={loadDailyTemplates}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  template.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                  template.color === 'red' ? 'border-red-200 bg-red-50 hover:bg-red-100' :
                  template.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' :
                  template.color === 'orange' ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' :
                  'border-purple-200 bg-purple-50 hover:bg-purple-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {template.sessions.length === 1 ? '1部練' : `${template.sessions.length}部練`}
                    </div>
                  </div>
                </div>
              </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

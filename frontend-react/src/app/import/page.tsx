'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { WorkoutType, CSVImportPreview, CSVImportResult } from '@/types'
import { FileDropzone } from './components/FileDropzone'
import { CSVPreview } from './components/CSVPreview'
import { ImportSettings } from './components/ImportSettings'
import { ProgressBar } from './components/ProgressBar'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

type ImportStep = 'upload' | 'preview' | 'settings' | 'importing' | 'complete'

export default function ImportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVImportPreview | null>(null)
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [importSettings, setImportSettings] = useState({
    workoutDate: new Date().toISOString().split('T')[0],
    workoutTypeId: '',
    intensity: 5
  })
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkoutTypes()
    }
  }, [isAuthenticated])

  const loadWorkoutTypes = async () => {
    try {
      const types = await apiClient.getWorkoutTypes()
      setWorkoutTypes(types)
      if (types.length > 0) {
        setImportSettings(prev => ({ ...prev, workoutTypeId: types[0].id }))
      }
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setIsLoading(true)
      setError(null)
      setFile(selectedFile)
      
      const previewData = await apiClient.previewCSVImport(selectedFile)
      setPreview(previewData)
      setCurrentStep('preview')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewConfirm = () => {
    setCurrentStep('settings')
  }

  const handleSettingsConfirm = () => {
    setCurrentStep('importing')
    performImport()
  }

  const performImport = async () => {
    if (!file) return

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await apiClient.confirmCSVImport(
        file,
        importSettings.workoutDate,
        importSettings.workoutTypeId,
        importSettings.intensity
      )
      
      setImportResult(result)
      setCurrentStep('complete')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
      setCurrentStep('settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOver = () => {
    setCurrentStep('upload')
    setFile(null)
    setPreview(null)
    setImportResult(null)
    setError(null)
  }

  const handleGoToWorkouts = () => {
    router.push('/workouts')
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSVインポート</h1>
          <p className="mt-2 text-gray-600">Garmin Connectやその他のアプリからエクスポートしたCSVファイルをインポートできます</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <ProgressBar currentStep={currentStep} />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ステップコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentStep === 'upload' && (
            <FileDropzone
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'preview' && preview && (
            <CSVPreview
              preview={preview}
              onConfirm={handlePreviewConfirm}
              onCancel={handleStartOver}
            />
          )}

          {currentStep === 'settings' && (
            <ImportSettings
              workoutTypes={workoutTypes}
              settings={importSettings}
              onSettingsChange={setImportSettings}
              onConfirm={handleSettingsConfirm}
              onCancel={() => setCurrentStep('preview')}
            />
          )}

          {currentStep === 'importing' && (
            <div className="p-8 text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">CSVファイルを処理中です...</p>
            </div>
          )}

          {currentStep === 'complete' && importResult && (
            <div className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">インポート完了</h3>
                <div className="mt-4 text-sm text-gray-600">
                  <p>成功: {importResult.statistics.successful_imports}件</p>
                  <p>失敗: {importResult.statistics.failed_imports}件</p>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    別のファイルをインポート
                  </button>
                  <button
                    onClick={handleGoToWorkouts}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    練習記録を確認
                  </button>
                </div>
              </div>
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

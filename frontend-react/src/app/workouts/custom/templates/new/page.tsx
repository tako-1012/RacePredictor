'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { WorkoutType, CustomWorkoutTemplateFormData } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { IntervalInput } from '@/app/workouts/components/IntervalInput'

export default function NewCustomWorkoutTemplatePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic')

  const [formData, setFormData] = useState<CustomWorkoutTemplateFormData>({
    name: '',
    description: '',
    category: '',
    workout_type_id: '',
    distance_meters: undefined,
    times_seconds: [],
    repetitions: 1,
    rest_type: '',
    rest_duration: undefined,
    intensity: 5,
    session_period: '',
    warmup_distance: undefined,
    warmup_time: undefined,
    main_distance: undefined,
    main_time: undefined,
    cooldown_distance: undefined,
    cooldown_time: undefined,
    is_favorite: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      setIsLoading(true)
      setError(null)
      const types = await apiClient.getWorkoutTypes()
      setWorkoutTypes(types)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'テンプレート名を入力してください'
    }

    if (!formData.workout_type_id) {
      newErrors.workout_type_id = '練習種別を選択してください'
    }

    if (formData.distance_meters && formData.distance_meters <= 0) {
      newErrors.distance_meters = '距離は0より大きい値を入力してください'
    }

    if (formData.intensity && (formData.intensity < 1 || formData.intensity > 10)) {
      newErrors.intensity = '強度は1-10の範囲で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      await apiClient.createCustomWorkoutTemplate(formData)
      setToast({ message: 'テンプレートを作成しました', type: 'success' })
      router.push('/workouts/new')
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CustomWorkoutTemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleTimesChange = (times: number[]) => {
    handleInputChange('times_seconds', times)
  }

  const calculateTotalTime = () => {
    return formData.times_seconds?.reduce((total, time) => total + time, 0) || 0
  }

  const calculatePace = () => {
    if (formData.distance_meters && formData.distance_meters > 0 && formData.times_seconds && formData.times_seconds.length > 0) {
      const totalTime = calculateTotalTime()
      return totalTime / (formData.distance_meters / 1000) // 秒/km
    }
    return 0
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const sessionPeriodOptions = [
    { value: 'morning', label: '朝練 (6:00-9:00)' },
    { value: 'afternoon', label: '午後練 (13:00-16:00)' },
    { value: 'evening', label: '夕練 (16:00-19:00)' },
    { value: 'night', label: '夜練 (19:00-22:00)' },
  ]

  const categoryOptions = [
    { value: 'base', label: '基礎練習' },
    { value: 'speed', label: 'スピード練習' },
    { value: 'threshold', label: '閾値練習' },
    { value: 'endurance', label: '持久力練習' },
    { value: 'recovery', label: '回復練習' },
    { value: 'other', label: 'その他' },
  ]

  const restTypeOptions = [
    { value: 'active', label: 'アクティブレスト（ジョグ）' },
    { value: 'passive', label: 'パッシブレスト（完全休息）' },
    { value: 'walk', label: 'ウォーキング' },
    { value: 'jog', label: 'ジョギング' },
  ]

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error.message || 'エラーが発生しました'}</p>
          {error.suggestion && (
            <p className="text-sm text-gray-500 mb-4">{error.suggestion}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">新しいテンプレート</h1>
          <p className="mt-2 text-gray-600">練習メニューのテンプレートを作成してください</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タブナビゲーション */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  基本情報
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('detailed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'detailed'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  詳細設定
                </button>
              </nav>
            </div>

            {/* 基本情報タブ */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {/* テンプレート名 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      テンプレート名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例: 200m×8本 インターバル"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* 説明 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="このテンプレートの詳細や使い方など..."
                    />
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 練習種別 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      練習種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.workout_type_id}
                      onChange={(e) => handleInputChange('workout_type_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.workout_type_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">選択してください</option>
                      {workoutTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.workout_type_id && <p className="mt-1 text-sm text-red-600">{errors.workout_type_id}</p>}
                  </div>

                  {/* 距離 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      総距離 (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.distance_meters ? formData.distance_meters / 1000 : ''}
                      onChange={(e) => handleInputChange('distance_meters', e.target.value ? Number(e.target.value) * 1000 : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.distance_meters ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.distance_meters && <p className="mt-1 text-sm text-red-600">{errors.distance_meters}</p>}
                  </div>

                  {/* 強度 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      強度 (1-10)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.intensity || 5}
                        onChange={(e) => handleInputChange('intensity', Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-700 w-8">{formData.intensity || 5}</span>
                    </div>
                    {errors.intensity && <p className="mt-1 text-sm text-red-600">{errors.intensity}</p>}
                  </div>

                  {/* 繰り返し回数 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      繰り返し回数
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.repetitions || 1}
                      onChange={(e) => handleInputChange('repetitions', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* レストタイプ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      レストタイプ
                    </label>
                    <select
                      value={formData.rest_type || ''}
                      onChange={(e) => handleInputChange('rest_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {restTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* レスト時間 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      レスト時間 (秒)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.rest_duration || ''}
                      onChange={(e) => handleInputChange('rest_duration', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 時間帯 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      時間帯
                    </label>
                    <select
                      value={formData.session_period || ''}
                      onChange={(e) => handleInputChange('session_period', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選択してください</option>
                      {sessionPeriodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* タイム入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイム
                  </label>
                  <IntervalInput
                    times={formData.times_seconds || []}
                    onChange={handleTimesChange}
                    error={errors.times_seconds}
                  />
                  {formData.times_seconds && formData.times_seconds.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>合計時間: {formatTime(calculateTotalTime())}</p>
                      <p>平均ペース: {formatPace(calculatePace())}</p>
                    </div>
                  )}
                </div>

                {/* お気に入り */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_favorite"
                    checked={formData.is_favorite || false}
                    onChange={(e) => handleInputChange('is_favorite', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-900">
                    お気に入りに追加
                  </label>
                </div>
              </div>
            )}

            {/* 詳細設定タブ */}
            {activeTab === 'detailed' && (
              <div className="space-y-6">
                {/* 構成要素 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">構成要素</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* ウォームアップ */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">ウォームアップ</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          距離 (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.warmup_distance ? formData.warmup_distance / 1000 : ''}
                          onChange={(e) => handleInputChange('warmup_distance', e.target.value ? Number(e.target.value) * 1000 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          時間 (分)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.warmup_time ? formData.warmup_time / 60 : ''}
                          onChange={(e) => handleInputChange('warmup_time', e.target.value ? Number(e.target.value) * 60 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* メイン */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">メイン</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          距離 (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.main_distance ? formData.main_distance / 1000 : ''}
                          onChange={(e) => handleInputChange('main_distance', e.target.value ? Number(e.target.value) * 1000 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          時間 (分)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.main_time ? formData.main_time / 60 : ''}
                          onChange={(e) => handleInputChange('main_time', e.target.value ? Number(e.target.value) * 60 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* クールダウン */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">クールダウン</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          距離 (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.cooldown_distance ? formData.cooldown_distance / 1000 : ''}
                          onChange={(e) => handleInputChange('cooldown_distance', e.target.value ? Number(e.target.value) * 1000 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          時間 (分)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.cooldown_time ? formData.cooldown_time / 60 : ''}
                          onChange={(e) => handleInputChange('cooldown_time', e.target.value ? Number(e.target.value) * 60 : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 距離の合計表示 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">距離の合計</h4>
                  <div className="text-sm text-blue-800">
                    <p>ウォームアップ: {formData.warmup_distance ? (formData.warmup_distance / 1000).toFixed(1) : '0'} km</p>
                    <p>メイン: {formData.main_distance ? (formData.main_distance / 1000).toFixed(1) : '0'} km</p>
                    <p>クールダウン: {formData.cooldown_distance ? (formData.cooldown_distance / 1000).toFixed(1) : '0'} km</p>
                    <p className="font-medium border-t border-blue-200 pt-2 mt-2">
                      合計: {((formData.warmup_distance || 0) + (formData.main_distance || 0) + (formData.cooldown_distance || 0) / 1000).toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/workouts/new')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '作成中...' : 'テンプレートを作成'}
              </button>
            </div>
          </form>
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

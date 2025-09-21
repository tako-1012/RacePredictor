'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutType, WorkoutFormData } from '@/types'
import { IntervalInput } from './IntervalInput'

interface DetailedWorkoutFormProps {
  workout?: Workout
  workoutTypes: WorkoutType[]
  onSubmit: (data: WorkoutFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function DetailedWorkoutForm({
  workout,
  workoutTypes,
  onSubmit,
  onCancel,
  isSubmitting
}: DetailedWorkoutFormProps) {
  const [formData, setFormData] = useState<WorkoutFormData>({
    date: workout?.date ? new Date(workout.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: workout?.extended_data?.time || '',
    workout_type_id: workout?.workout_type_id || '',
    distance_meters: workout?.distance_meters || 0,
    times_seconds: workout?.times_seconds || [],
    intensity: workout?.intensity || 5,
    notes: workout?.notes || '',
    avg_heart_rate: workout?.avg_heart_rate || undefined,
    max_heart_rate: workout?.max_heart_rate || undefined,
    session_count: workout?.extended_data?.session_count || 1,
    session_period: workout?.extended_data?.session_period || '',
    warmup_distance: workout?.extended_data?.warmup_distance || undefined,
    warmup_time: workout?.extended_data?.warmup_time || undefined,
    main_distance: workout?.extended_data?.main_distance || undefined,
    main_time: workout?.extended_data?.main_time || undefined,
    cooldown_distance: workout?.extended_data?.cooldown_distance || undefined,
    cooldown_time: workout?.extended_data?.cooldown_time || undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = '日付を入力してください'
    }

    if (!formData.workout_type_id) {
      newErrors.workout_type_id = '練習種別を選択してください'
    }

    if (formData.distance_meters <= 0) {
      newErrors.distance_meters = '距離を入力してください'
    }

    if (formData.times_seconds.length === 0) {
      newErrors.times_seconds = 'タイムを入力してください'
    }

    if (formData.intensity < 1 || formData.intensity > 10) {
      newErrors.intensity = '強度は1-10の範囲で入力してください'
    }

    if (formData.avg_heart_rate && (formData.avg_heart_rate < 30 || formData.avg_heart_rate > 250)) {
      newErrors.avg_heart_rate = '平均心拍数は30-250の範囲で入力してください'
    }

    if (formData.max_heart_rate && (formData.max_heart_rate < 30 || formData.max_heart_rate > 250)) {
      newErrors.max_heart_rate = '最大心拍数は30-250の範囲で入力してください'
    }

    if (formData.avg_heart_rate && formData.max_heart_rate && formData.avg_heart_rate > formData.max_heart_rate) {
      newErrors.max_heart_rate = '最大心拍数は平均心拍数より大きい値を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof WorkoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleTimesChange = (times: number[]) => {
    handleInputChange('times_seconds', times)
  }

  const calculateTotalTime = () => {
    return formData.times_seconds.reduce((total, time) => total + time, 0)
  }

  const calculatePace = () => {
    if (formData.distance_meters > 0 && formData.times_seconds.length > 0) {
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

  return (
    <div className="space-y-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報タブ */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* 日付 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* 時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時刻
                </label>
                <input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

              {/* 部練習数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部練習数
                </label>
                <select
                  value={formData.session_count || 1}
                  onChange={(e) => handleInputChange('session_count', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1部練</option>
                  <option value={2}>2部練</option>
                  <option value={3}>3部練</option>
                </select>
              </div>

              {/* 距離 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  総距離 (km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.distance_meters / 1000}
                  onChange={(e) => handleInputChange('distance_meters', Number(e.target.value) * 1000)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.distance_meters ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.distance_meters && <p className="mt-1 text-sm text-red-600">{errors.distance_meters}</p>}
              </div>

              {/* 強度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  強度 (1-10) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.intensity}
                    onChange={(e) => handleInputChange('intensity', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-8">{formData.intensity}</span>
                </div>
                {errors.intensity && <p className="mt-1 text-sm text-red-600">{errors.intensity}</p>}
              </div>

              {/* 平均心拍数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  平均心拍数 (bpm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={formData.avg_heart_rate || ''}
                  onChange={(e) => handleInputChange('avg_heart_rate', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.avg_heart_rate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.avg_heart_rate && <p className="mt-1 text-sm text-red-600">{errors.avg_heart_rate}</p>}
              </div>

              {/* 最大心拍数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大心拍数 (bpm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={formData.max_heart_rate || ''}
                  onChange={(e) => handleInputChange('max_heart_rate', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.max_heart_rate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.max_heart_rate && <p className="mt-1 text-sm text-red-600">{errors.max_heart_rate}</p>}
              </div>
            </div>

            {/* タイム入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイム <span className="text-red-500">*</span>
              </label>
              <IntervalInput
                times={formData.times_seconds}
                onChange={handleTimesChange}
                error={errors.times_seconds}
              />
              {formData.times_seconds.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>合計時間: {formatTime(calculateTotalTime())}</p>
                  <p>平均ペース: {formatPace(calculatePace())}</p>
                </div>
              )}
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メモ
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="練習の感想や気づいたことなど..."
              />
            </div>
          </div>
        )}

        {/* 詳細設定タブ */}
        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* セッション情報 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">セッション情報</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

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
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '保存中...' : workout ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  )
}

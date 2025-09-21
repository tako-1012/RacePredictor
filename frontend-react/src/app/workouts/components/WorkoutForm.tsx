'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutType, WorkoutFormData } from '@/types'
import { IntervalInput } from './IntervalInput'

interface WorkoutFormProps {
  workout?: Workout
  workoutTypes: WorkoutType[]
  onSubmit: (data: WorkoutFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function WorkoutForm({
  workout,
  workoutTypes,
  onSubmit,
  onCancel,
  isSubmitting
}: WorkoutFormProps) {
  const [formData, setFormData] = useState<WorkoutFormData>({
    date: workout?.date ? new Date(workout.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    workout_type_id: workout?.workout_type_id || '',
    distance_meters: workout?.distance_meters || 0,
    times_seconds: workout?.times_seconds || [],
    intensity: workout?.intensity || 5,
    notes: workout?.notes || '',
    avg_heart_rate: workout?.avg_heart_rate || undefined,
    max_heart_rate: workout?.max_heart_rate || undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            距離 (km) <span className="text-red-500">*</span>
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
  )
}

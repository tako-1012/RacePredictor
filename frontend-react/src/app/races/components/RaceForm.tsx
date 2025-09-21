'use client'

import { useState } from 'react'
import { Race, RaceFormData } from '@/types'

interface RaceFormProps {
  race?: Race
  onSubmit: (data: RaceFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function RaceForm({
  race,
  onSubmit,
  onCancel,
  isSubmitting
}: RaceFormProps) {
  const [formData, setFormData] = useState<RaceFormData>({
    date: race?.date ? new Date(race.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    race_type: race?.race_type || '',
    distance_meters: race?.distance_meters || 0,
    time_seconds: race?.time_seconds || 0,
    place: race?.place || undefined,
    total_participants: race?.total_participants || undefined,
    notes: race?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = '日付を入力してください'
    }

    if (!formData.race_type.trim()) {
      newErrors.race_type = 'レース種別を入力してください'
    }

    if (formData.distance_meters <= 0) {
      newErrors.distance_meters = '距離を入力してください'
    }

    if (formData.time_seconds <= 0) {
      newErrors.time_seconds = 'タイムを入力してください'
    }

    if (formData.place && formData.total_participants && formData.place > formData.total_participants) {
      newErrors.place = '順位は参加者数以下である必要があります'
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

  const handleInputChange = (field: keyof RaceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleTimeChange = (value: string) => {
    const timeInSeconds = parseTimeInput(value)
    handleInputChange('time_seconds', timeInSeconds)
  }

  const parseTimeInput = (input: string): number => {
    const parts = input.split(':').map(Number)
    
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    
    return 0
  }

  const formatTimeInput = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const calculatePace = () => {
    if (formData.distance_meters > 0 && formData.time_seconds > 0) {
      return formData.time_seconds / (formData.distance_meters / 1000) // 秒/km
    }
    return 0
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

        {/* レース種別 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            レース種別 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.race_type}
            onChange={(e) => handleInputChange('race_type', e.target.value)}
            placeholder="例: マラソン、ハーフマラソン、10km"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.race_type ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.race_type && <p className="mt-1 text-sm text-red-600">{errors.race_type}</p>}
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

        {/* タイム */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイム <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formatTimeInput(formData.time_seconds)}
            onChange={(e) => handleTimeChange(e.target.value)}
            placeholder="MM:SS または HH:MM:SS"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.time_seconds ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.time_seconds && <p className="mt-1 text-sm text-red-600">{errors.time_seconds}</p>}
          <p className="mt-1 text-xs text-gray-500">例: 1:30:00 (1時間30分00秒)</p>
        </div>

        {/* 順位 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            順位
          </label>
          <input
            type="number"
            min="1"
            value={formData.place || ''}
            onChange={(e) => handleInputChange('place', e.target.value ? Number(e.target.value) : undefined)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.place ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.place && <p className="mt-1 text-sm text-red-600">{errors.place}</p>}
        </div>

        {/* 参加者数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            参加者数
          </label>
          <input
            type="number"
            min="1"
            value={formData.total_participants || ''}
            onChange={(e) => handleInputChange('total_participants', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 計算結果 */}
      {formData.distance_meters > 0 && formData.time_seconds > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">計算結果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">平均ペース:</span>
              <span className="ml-2 font-medium">{formatPace(calculatePace())}</span>
            </div>
            <div>
              <span className="text-blue-700">総距離:</span>
              <span className="ml-2 font-medium">{(formData.distance_meters / 1000).toFixed(2)} km</span>
            </div>
          </div>
        </div>
      )}

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
          placeholder="レースの感想や気づいたことなど..."
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
          {isSubmitting ? '保存中...' : race ? '更新' : '作成'}
        </button>
      </div>
    </form>
  )
}

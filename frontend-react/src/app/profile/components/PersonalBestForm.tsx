'use client'

import { useState } from 'react'
import { PersonalBest, PersonalBestFormData } from '@/types'

interface PersonalBestFormProps {
  initialData?: PersonalBest | null
  onSubmit: (data: PersonalBestFormData) => void
  onCancel?: () => void
}

export function PersonalBestForm({ initialData, onSubmit, onCancel }: PersonalBestFormProps) {
  const [formData, setFormData] = useState<PersonalBestFormData>({
    race_type: initialData?.race_type || 'road',
    distance: initialData?.distance || '',
    custom_distance_m: initialData?.custom_distance_m || undefined,
    time_seconds: initialData?.time_seconds || 0,
    achieved_date: initialData?.achieved_date || new Date().toISOString().split('T')[0],
    race_name: initialData?.race_name || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomDistance, setShowCustomDistance] = useState(false)

  // 種目別の距離オプション
  const distanceOptions = {
    track: ['800m', '1500m', '3000m', '5000m', '10000m'],
    road: ['5km', '10km', 'ハーフマラソン', 'フルマラソン'],
    relay: ['駅伝']
  }

  const handleInputChange = (field: keyof PersonalBestFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRaceTypeChange = (raceType: 'track' | 'road' | 'relay') => {
    setFormData(prev => ({
      ...prev,
      race_type: raceType,
      distance: '',
      custom_distance_m: undefined
    }))
    setShowCustomDistance(false)
  }

  const handleDistanceChange = (distance: string) => {
    if (distance === 'custom') {
      setShowCustomDistance(true)
      setFormData(prev => ({
        ...prev,
        distance: '',
        custom_distance_m: undefined
      }))
    } else {
      setShowCustomDistance(false)
      setFormData(prev => ({
        ...prev,
        distance,
        custom_distance_m: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 種目分類 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            種目分類 *
          </label>
          <div className="space-y-2">
            {(['track', 'road', 'relay'] as const).map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="race_type"
                  value={type}
                  checked={formData.race_type === type}
                  onChange={() => handleRaceTypeChange(type)}
                  className="mr-2"
                />
                <span className="text-sm">
                  {type === 'track' && 'トラック'}
                  {type === 'road' && 'ロード'}
                  {type === 'relay' && '駅伝'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 距離 */}
        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
            距離 *
          </label>
          <select
            id="distance"
            value={formData.distance}
            onChange={(e) => handleDistanceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={!showCustomDistance}
          >
            <option value="">距離を選択</option>
            {distanceOptions[formData.race_type].map((dist) => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
            <option value="custom">その他（カスタム）</option>
          </select>
        </div>

        {/* カスタム距離 */}
        {showCustomDistance && (
          <div className="md:col-span-2">
            <label htmlFor="custom_distance_m" className="block text-sm font-medium text-gray-700 mb-2">
              カスタム距離 (m) *
            </label>
            <input
              type="number"
              id="custom_distance_m"
              min="100"
              max="100000"
              step="100"
              value={formData.custom_distance_m || ''}
              onChange={(e) => handleInputChange('custom_distance_m', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={showCustomDistance}
              placeholder="例: 1500"
            />
          </div>
        )}

        {/* タイム */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            タイム *
          </label>
          <input
            type="text"
            id="time"
            value={formatTime(formData.time_seconds)}
            onChange={(e) => handleInputChange('time_seconds', parseTimeInput(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 15:30 または 1:15:30"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            形式: MM:SS または HH:MM:SS
          </p>
        </div>

        {/* 達成日 */}
        <div>
          <label htmlFor="achieved_date" className="block text-sm font-medium text-gray-700 mb-2">
            達成日 *
          </label>
          <input
            type="date"
            id="achieved_date"
            value={formData.achieved_date}
            onChange={(e) => handleInputChange('achieved_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* レース名 */}
        <div className="md:col-span-2">
          <label htmlFor="race_name" className="block text-sm font-medium text-gray-700 mb-2">
            レース名
          </label>
          <input
            type="text"
            id="race_name"
            value={formData.race_name}
            onChange={(e) => handleInputChange('race_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 東京マラソン2024"
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

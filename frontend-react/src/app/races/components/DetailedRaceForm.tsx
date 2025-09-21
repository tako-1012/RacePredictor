'use client'

import { useState, useEffect } from 'react'
import { Race, RaceType, RaceFormData } from '@/types'

interface DetailedRaceFormProps {
  race?: Race
  raceTypes: RaceType[]
  onSubmit: (data: RaceFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function DetailedRaceForm({
  race,
  raceTypes,
  onSubmit,
  onCancel,
  isSubmitting
}: DetailedRaceFormProps) {
  const [formData, setFormData] = useState<RaceFormData>({
    race_date: race?.race_date ? new Date(race.race_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    race_name: race?.race_name || '',
    race_type_id: race?.race_type_id || '',
    distance_meters: race?.distance_meters || 5000,
    time_seconds: race?.time_seconds || 0,
    pace_seconds: race?.pace_seconds || 0,
    place: race?.place || undefined,
    total_participants: race?.total_participants || undefined,
    notes: race?.notes || '',
    is_relay: race?.is_relay || false,
    relay_segment: race?.relay_segment || undefined,
    team_name: race?.team_name || '',
    relay_time: race?.relay_time || '',
    segment_place: race?.segment_place || undefined,
    segment_total_participants: race?.segment_total_participants || undefined,
    splits: race?.splits || [],
    weather: race?.weather || '',
    course_type: race?.course_type || '',
    strategy_notes: race?.strategy_notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'relay' | 'details'>('basic')
  const [selectedRaceType, setSelectedRaceType] = useState<RaceType | null>(null)

  useEffect(() => {
    if (formData.race_type_id) {
      const raceType = raceTypes.find(rt => rt.id === formData.race_type_id)
      setSelectedRaceType(raceType || null)
      
      if (raceType && !race) {
        // 新規作成時はデフォルト距離を設定
        setFormData(prev => ({
          ...prev,
          distance_meters: raceType.default_distance_meters
        }))
      }
    }
  }, [formData.race_type_id, raceTypes, race])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.race_date) {
      newErrors.race_date = '日付を入力してください'
    }

    if (!formData.race_name.trim()) {
      newErrors.race_name = '大会名を入力してください'
    }

    if (!formData.race_type_id) {
      newErrors.race_type_id = 'レース種目を選択してください'
    }

    if (formData.distance_meters <= 0) {
      newErrors.distance_meters = '距離を入力してください'
    }

    if (formData.time_seconds <= 0) {
      newErrors.time_seconds = 'タイムを入力してください'
    }

    if (formData.is_relay) {
      if (!formData.relay_segment || formData.relay_segment < 1 || formData.relay_segment > 10) {
        newErrors.relay_segment = '区間番号は1-10の範囲で入力してください'
      }
      if (!formData.team_name.trim()) {
        newErrors.team_name = 'チーム名を入力してください'
      }
    }

    if (selectedRaceType) {
      if (formData.distance_meters < selectedRaceType.min_distance_meters || 
          formData.distance_meters > selectedRaceType.max_distance_meters) {
        newErrors.distance_meters = `距離は${selectedRaceType.min_distance_meters}m-${selectedRaceType.max_distance_meters}mの範囲で入力してください`
      }
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

  const handleTimeInput = (timeString: string) => {
    const timeSeconds = parseTimeToSeconds(timeString)
    if (timeSeconds > 0) {
      handleInputChange('time_seconds', timeSeconds)
      if (formData.distance_meters > 0) {
        const paceSeconds = timeSeconds / (formData.distance_meters / 1000)
        handleInputChange('pace_seconds', paceSeconds)
      }
    }
  }

  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(Number)
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  const formatTimeFromSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (secondsPerKm: number): string => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const addSplit = () => {
    const newSplits = [...(formData.splits || []), 0]
    handleInputChange('splits', newSplits)
  }

  const updateSplit = (index: number, value: string) => {
    const timeSeconds = parseTimeToSeconds(value)
    const newSplits = [...(formData.splits || [])]
    newSplits[index] = timeSeconds
    handleInputChange('splits', newSplits)
  }

  const removeSplit = (index: number) => {
    const newSplits = (formData.splits || []).filter((_, i) => i !== index)
    handleInputChange('splits', newSplits)
  }

  const trackRaceTypes = raceTypes.filter(rt => rt.category === 'track')
  const roadRaceTypes = raceTypes.filter(rt => rt.category === 'road')
  const relayRaceTypes = raceTypes.filter(rt => rt.category === 'relay')

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
            onClick={() => setActiveTab('relay')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'relay'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            駅伝情報
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            詳細情報
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
                  value={formData.race_date}
                  onChange={(e) => handleInputChange('race_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.race_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.race_date && <p className="mt-1 text-sm text-red-600">{errors.race_date}</p>}
              </div>

              {/* 大会名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  大会名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.race_name}
                  onChange={(e) => handleInputChange('race_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.race_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 東京マラソン"
                />
                {errors.race_name && <p className="mt-1 text-sm text-red-600">{errors.race_name}</p>}
              </div>

              {/* レース種目 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  レース種目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.race_type_id}
                  onChange={(e) => handleInputChange('race_type_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.race_type_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">選択してください</option>
                  <optgroup label="トラック種目">
                    {trackRaceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.default_distance_meters}m)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="ロード種目">
                    {roadRaceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.default_distance_meters}m)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="駅伝種目">
                    {relayRaceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.default_distance_meters}m)
                      </option>
                    ))}
                  </optgroup>
                </select>
                {errors.race_type_id && <p className="mt-1 text-sm text-red-600">{errors.race_type_id}</p>}
              </div>

              {/* 距離 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  距離 (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={selectedRaceType?.min_distance_meters || 50}
                  max={selectedRaceType?.max_distance_meters || 100000}
                  value={formData.distance_meters}
                  onChange={(e) => handleInputChange('distance_meters', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.distance_meters ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {selectedRaceType && (
                  <p className="mt-1 text-xs text-gray-500">
                    範囲: {selectedRaceType.min_distance_meters}m - {selectedRaceType.max_distance_meters}m
                  </p>
                )}
                {errors.distance_meters && <p className="mt-1 text-sm text-red-600">{errors.distance_meters}</p>}
              </div>

              {/* タイム */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイム <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.time_seconds > 0 ? formatTimeFromSeconds(formData.time_seconds) : ''}
                  onChange={(e) => handleTimeInput(e.target.value)}
                  placeholder="MM:SS または HH:MM:SS"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.time_seconds ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.time_seconds && <p className="mt-1 text-sm text-red-600">{errors.time_seconds}</p>}
              </div>

              {/* ペース */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ペース
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                  {formData.pace_seconds > 0 ? formatPace(formData.pace_seconds) : '-'}
                </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
          </div>
        )}

        {/* 駅伝情報タブ */}
        {activeTab === 'relay' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">駅伝情報</h3>
              <p className="text-sm text-blue-800">
                駅伝レースの場合は以下の情報を入力してください
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* 駅伝フラグ */}
              <div className="sm:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_relay}
                    onChange={(e) => handleInputChange('is_relay', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    駅伝レース
                  </span>
                </label>
              </div>

              {/* 区間番号 */}
              {formData.is_relay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    区間番号 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relay_segment || ''}
                    onChange={(e) => handleInputChange('relay_segment', e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.relay_segment ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">選択してください</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((segment) => (
                      <option key={segment} value={segment}>
                        {segment}区
                      </option>
                    ))}
                  </select>
                  {errors.relay_segment && <p className="mt-1 text-sm text-red-600">{errors.relay_segment}</p>}
                </div>
              )}

              {/* チーム名 */}
              {formData.is_relay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    チーム名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.team_name || ''}
                    onChange={(e) => handleInputChange('team_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.team_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="例: 東京大学"
                  />
                  {errors.team_name && <p className="mt-1 text-sm text-red-600">{errors.team_name}</p>}
                </div>
              )}

              {/* 襷時刻 */}
              {formData.is_relay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    襷時刻
                  </label>
                  <input
                    type="text"
                    value={formData.relay_time || ''}
                    onChange={(e) => handleInputChange('relay_time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="HH:MM:SS"
                  />
                </div>
              )}

              {/* 区間順位 */}
              {formData.is_relay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    区間順位
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.segment_place || ''}
                    onChange={(e) => handleInputChange('segment_place', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 区間参加者数 */}
              {formData.is_relay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    区間参加者数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.segment_total_participants || ''}
                    onChange={(e) => handleInputChange('segment_total_participants', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 詳細情報タブ */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* 天気 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  天気
                </label>
                <select
                  value={formData.weather || ''}
                  onChange={(e) => handleInputChange('weather', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="晴れ">晴れ</option>
                  <option value="曇り">曇り</option>
                  <option value="雨">雨</option>
                  <option value="雪">雪</option>
                  <option value="強風">強風</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {/* コースタイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  コースタイプ
                </label>
                <select
                  value={formData.course_type || ''}
                  onChange={(e) => handleInputChange('course_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="トラック">トラック</option>
                  <option value="ロード">ロード</option>
                  <option value="クロスカントリー">クロスカントリー</option>
                  <option value="山岳">山岳</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>

            {/* スプリットタイム */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スプリットタイム
              </label>
              <div className="space-y-2">
                {(formData.splits || []).map((split, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-16">
                      {index + 1}km:
                    </span>
                    <input
                      type="text"
                      value={split > 0 ? formatTimeFromSeconds(split) : ''}
                      onChange={(e) => updateSplit(index, e.target.value)}
                      placeholder="MM:SS"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeSplit(index)}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    >
                      削除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSplit}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                >
                  + スプリットを追加
                </button>
              </div>
            </div>

            {/* 戦略メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                戦略メモ
              </label>
              <textarea
                value={formData.strategy_notes || ''}
                onChange={(e) => handleInputChange('strategy_notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="レース戦略、ペース配分、気づいたことなど..."
              />
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
            {isSubmitting ? '保存中...' : race ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  )
}

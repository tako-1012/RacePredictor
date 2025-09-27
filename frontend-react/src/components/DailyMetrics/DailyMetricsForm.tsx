'use client'

import { useState, useEffect } from 'react'
import { DailyMetricsCreate, DailyMetricsUpdate } from '@/types/dailyMetrics'

interface DailyMetricsFormProps {
  initialData?: DailyMetricsCreate | DailyMetricsUpdate
  onSubmit: (data: DailyMetricsCreate | DailyMetricsUpdate) => void
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

export function DailyMetricsForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode
}: DailyMetricsFormProps) {
  const [formData, setFormData] = useState<DailyMetricsCreate | DailyMetricsUpdate>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    weight_kg: initialData?.weight_kg || undefined,
    body_fat_percentage: initialData?.body_fat_percentage || undefined,
    muscle_mass_kg: initialData?.muscle_mass_kg || undefined,
    sleep_duration_hours: initialData?.sleep_duration_hours || undefined,
    sleep_quality_score: initialData?.sleep_quality_score || undefined,
    bedtime: initialData?.bedtime || undefined,
    wake_time: initialData?.wake_time || undefined,
    fatigue_level: initialData?.fatigue_level || undefined,
    motivation_level: initialData?.motivation_level || undefined,
    stress_level: initialData?.stress_level || undefined,
    energy_level: initialData?.energy_level || undefined,
    training_readiness: initialData?.training_readiness || undefined,
    recovery_status: initialData?.recovery_status || undefined,
    resting_heart_rate: initialData?.resting_heart_rate || undefined,
    blood_pressure_systolic: initialData?.blood_pressure_systolic || undefined,
    blood_pressure_diastolic: initialData?.blood_pressure_diastolic || undefined,
    notes: initialData?.notes || undefined,
    mood_tags: initialData?.mood_tags || []
  })

  // 睡眠時間を時間・分に変換する関数
  const hoursToHoursMinutes = (hours: number | undefined) => {
    if (!hours) return { hours: 0, minutes: 0 }
    const h = Math.floor(hours)
    const m = Math.round((hours % 1) * 60)
    return { hours: h, minutes: m }
  }

  // 時間・分を時間に変換する関数
  const hoursMinutesToHours = (hours: number, minutes: number) => {
    return hours + minutes / 60
  }

  // 睡眠時間の時間・分状態
  const [sleepHours, setSleepHours] = useState(() => {
    const { hours } = hoursToHoursMinutes(formData.sleep_duration_hours)
    return hours
  })
  const [sleepMinutes, setSleepMinutes] = useState(() => {
    const { minutes } = hoursToHoursMinutes(formData.sleep_duration_hours)
    return minutes
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'body' | 'sleep' | 'condition' | 'health'>('body')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = '日付を入力してください'
    }

    // 体重のバリデーション
    if (formData.weight_kg && (formData.weight_kg < 20 || formData.weight_kg > 200)) {
      newErrors.weight_kg = '体重は20-200kgの範囲で入力してください'
    }

    // 睡眠時間のバリデーション
    if (formData.sleep_duration_hours && (formData.sleep_duration_hours < 0 || formData.sleep_duration_hours > 24)) {
      newErrors.sleep_duration_hours = '睡眠時間は0-24時間の範囲で入力してください'
    }
    
    // 睡眠時間の時間・分のバリデーション
    if (sleepHours < 0 || sleepHours > 23) {
      newErrors.sleep_duration_hours = '時間は0-23の範囲で入力してください'
    }
    if (sleepMinutes < 0 || sleepMinutes > 59) {
      newErrors.sleep_duration_hours = '分は0-59の範囲で入力してください'
    }

    // スコア系のバリデーション
    const scoreFields = ['sleep_quality_score', 'fatigue_level', 'motivation_level', 'stress_level', 'energy_level', 'training_readiness']
    scoreFields.forEach(field => {
      const value = formData[field as keyof typeof formData] as number
      if (value && (value < 1 || value > 10)) {
        newErrors[field] = 'スコアは1-10の範囲で入力してください'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof (DailyMetricsCreate | DailyMetricsUpdate), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const moodTagOptions = [
    '元気', '疲れている', 'ストレス', 'リラックス', '集中している',
    'やる気', '不安', '楽しい', '悲しい', '怒っている',
    '落ち着いている', '興奮している', '眠い', '目覚めている'
  ]

  const handleMoodTagToggle = (tag: string) => {
    const currentTags = formData.mood_tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    handleInputChange('mood_tags', newTags)
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'コンディション記録' : 'コンディション編集'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          毎日の体調・睡眠・気分を記録して、トレーニングの質を向上させましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* 日付入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'body', label: '身体データ', icon: '⚖️' },
              { id: 'sleep', label: '睡眠', icon: '😴' },
              { id: 'condition', label: 'コンディション', icon: '💪' },
              { id: 'health', label: '健康指標', icon: '❤️' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 身体データタブ */}
        {activeTab === 'body' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">身体データ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="200"
                  value={formData.weight_kg || ''}
                  onChange={(e) => handleInputChange('weight_kg', e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.weight_kg ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例: 65.5"
                />
                {errors.weight_kg && <p className="mt-1 text-sm text-red-600">{errors.weight_kg}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  体脂肪率 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.body_fat_percentage || ''}
                  onChange={(e) => handleInputChange('body_fat_percentage', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 15.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  筋肉量 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.muscle_mass_kg || ''}
                  onChange={(e) => handleInputChange('muscle_mass_kg', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 45.8"
                />
              </div>
            </div>
          </div>
        )}

        {/* 睡眠タブ */}
        {activeTab === 'sleep' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">睡眠データ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  睡眠時間
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={sleepHours || ''}
                    onChange={(e) => {
                      const hours = e.target.value ? Number(e.target.value) : 0
                      setSleepHours(hours)
                      const totalHours = hoursMinutesToHours(hours, sleepMinutes)
                      handleInputChange('sleep_duration_hours', totalHours)
                    }}
                    className={`w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.sleep_duration_hours ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="7"
                  />
                  <span className="text-gray-600">時間</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={sleepMinutes || ''}
                    onChange={(e) => {
                      const minutes = e.target.value ? Number(e.target.value) : 0
                      setSleepMinutes(minutes)
                      const totalHours = hoursMinutesToHours(sleepHours, minutes)
                      handleInputChange('sleep_duration_hours', totalHours)
                    }}
                    className={`w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.sleep_duration_hours ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="30"
                  />
                  <span className="text-gray-600">分</span>
                </div>
                {errors.sleep_duration_hours && <p className="mt-1 text-sm text-red-600">{errors.sleep_duration_hours}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  睡眠の質 (1-10)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.sleep_quality_score || 5}
                    onChange={(e) => handleInputChange('sleep_quality_score', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-8">{formData.sleep_quality_score || 5}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (浅い)</span>
                  <span>10 (深い)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  就寝時間
                </label>
                <input
                  type="time"
                  value={formData.bedtime || ''}
                  onChange={(e) => handleInputChange('bedtime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  起床時間
                </label>
                <input
                  type="time"
                  value={formData.wake_time || ''}
                  onChange={(e) => handleInputChange('wake_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* コンディションタブ */}
        {activeTab === 'condition' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">コンディション評価</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { field: 'fatigue_level', label: '疲労度', icon: '😴' },
                { field: 'motivation_level', label: 'モチベーション', icon: '🔥' },
                { field: 'stress_level', label: 'ストレスレベル', icon: '😰' },
                { field: 'energy_level', label: 'エネルギーレベル', icon: '⚡' },
                { field: 'training_readiness', label: 'トレーニング準備度', icon: '💪' }
              ].map(({ field, label, icon }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {icon} {label} (1-10)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData[field as keyof typeof formData] as number || 5}
                      onChange={(e) => handleInputChange(field as keyof typeof formData, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {formData[field as keyof typeof formData] as number || 5}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 (低い)</span>
                    <span>10 (高い)</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回復状態
              </label>
              <select
                value={formData.recovery_status || ''}
                onChange={(e) => handleInputChange('recovery_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="excellent">優秀</option>
                <option value="good">良好</option>
                <option value="fair">普通</option>
                <option value="poor">不良</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                気分タグ
              </label>
              <div className="flex flex-wrap gap-2">
                {moodTagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleMoodTagToggle(tag)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.mood_tags?.includes(tag)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 健康指標タブ */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">健康指標</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  安静時心拍数 (bpm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={formData.resting_heart_rate || ''}
                  onChange={(e) => handleInputChange('resting_heart_rate', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 65"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  収縮期血圧 (mmHg)
                </label>
                <input
                  type="number"
                  min="80"
                  max="250"
                  value={formData.blood_pressure_systolic || ''}
                  onChange={(e) => handleInputChange('blood_pressure_systolic', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拡張期血圧 (mmHg)
                </label>
                <input
                  type="number"
                  min="40"
                  max="150"
                  value={formData.blood_pressure_diastolic || ''}
                  onChange={(e) => handleInputChange('blood_pressure_diastolic', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 80"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="その日の体調や気づいたことなど..."
              />
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
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
            {isSubmitting ? '保存中...' : mode === 'create' ? '記録を保存' : '更新'}
          </button>
        </div>
      </form>
    </div>
  )
}

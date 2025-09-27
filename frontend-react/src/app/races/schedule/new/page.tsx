'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { RaceScheduleFormData } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { formatDateToSlash, formatDateFromSlash, getCurrentDateSlash } from '@/utils/dateFormat'
import { DateInput } from '@/components/UI/DateInput'

export default function NewRaceSchedulePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [formData, setFormData] = useState<RaceScheduleFormData>({
    race_name: '',
    race_date: '',
    location: '',
    race_type: 'road',
    distance: '',
    custom_distance_m: undefined,
    target_time_seconds: undefined,
  })

  const [showCustomDistance, setShowCustomDistance] = useState(false)
  const [selectedDistance, setSelectedDistance] = useState('')
  const [selectedSubType, setSelectedSubType] = useState('')
  const [timeString, setTimeString] = useState('')
  
  // ラップタイム予定
  const [lapTimes, setLapTimes] = useState<Array<{lap: number, time: string, seconds: number, distance: number}>>([])
  const [currentLap, setCurrentLap] = useState('')
  const [currentLapDistance, setCurrentLapDistance] = useState('')
  
  // 目標タイムテンプレート
  const [showTimeTemplates, setShowTimeTemplates] = useState(false)

  // 目標タイムテンプレート
  const getQuickTimesForDistance = (distance: number, raceType: string) => {
    const templates = {
      track: {
        800: [
          { label: '初心者', seconds: 180, pace: '3:45/km' },
          { label: '中級者', seconds: 150, pace: '3:07/km' },
          { label: '上級者', seconds: 120, pace: '2:30/km' },
          { label: 'エリート', seconds: 105, pace: '2:11/km' }
        ],
        1500: [
          { label: '初心者', seconds: 360, pace: '4:00/km' },
          { label: '中級者', seconds: 300, pace: '3:20/km' },
          { label: '上級者', seconds: 240, pace: '2:40/km' },
          { label: 'エリート', seconds: 210, pace: '2:20/km' }
        ],
        3000: [
          { label: '初心者', seconds: 720, pace: '4:00/km' },
          { label: '中級者', seconds: 600, pace: '3:20/km' },
          { label: '上級者', seconds: 480, pace: '2:40/km' },
          { label: 'エリート', seconds: 420, pace: '2:20/km' }
        ],
        5000: [
          { label: '初心者', seconds: 1200, pace: '4:00/km' },
          { label: '中級者', seconds: 1000, pace: '3:20/km' },
          { label: '上級者', seconds: 800, pace: '2:40/km' },
          { label: 'エリート', seconds: 700, pace: '2:20/km' }
        ],
        10000: [
          { label: '初心者', seconds: 2400, pace: '4:00/km' },
          { label: '中級者', seconds: 2000, pace: '3:20/km' },
          { label: '上級者', seconds: 1600, pace: '2:40/km' },
          { label: 'エリート', seconds: 1400, pace: '2:20/km' }
        ]
      },
      road: {
        5000: [
          { label: '初心者', seconds: 1200, pace: '4:00/km' },
          { label: '中級者', seconds: 1000, pace: '3:20/km' },
          { label: '上級者', seconds: 800, pace: '2:40/km' },
          { label: 'エリート', seconds: 700, pace: '2:20/km' }
        ],
        10000: [
          { label: '初心者', seconds: 2400, pace: '4:00/km' },
          { label: '中級者', seconds: 2000, pace: '3:20/km' },
          { label: '上級者', seconds: 1600, pace: '2:40/km' },
          { label: 'エリート', seconds: 1400, pace: '2:20/km' }
        ],
        21097: [
          { label: '初心者', seconds: 5400, pace: '4:16/km' },
          { label: '中級者', seconds: 4500, pace: '3:33/km' },
          { label: '上級者', seconds: 3600, pace: '2:51/km' },
          { label: 'エリート', seconds: 3000, pace: '2:22/km' }
        ],
        42195: [
          { label: '初心者', seconds: 10800, pace: '4:16/km' },
          { label: '中級者', seconds: 9000, pace: '3:33/km' },
          { label: '上級者', seconds: 7200, pace: '2:51/km' },
          { label: 'エリート', seconds: 6000, pace: '2:22/km' }
        ]
      }
    }
    
    return templates[raceType as keyof typeof templates]?.[distance as keyof typeof templates.track] || []
  }

  // 距離選択ハンドラー
  const handleDistanceSelect = (distance: string | number) => {
    setSelectedDistance(distance.toString())
    
    if (distance === 'custom') {
      setShowCustomDistance(true)
      setFormData(prev => ({
        ...prev,
        distance: '',
        custom_distance_m: undefined
      }))
    } else {
      setShowCustomDistance(false)
      const distanceNum = typeof distance === 'number' ? distance : parseFloat(distance)
      setFormData(prev => ({
        ...prev,
        distance: distanceNum.toString(),
        custom_distance_m: distanceNum
      }))
      
      // 距離選択時にクイックタイムの最初の値を自動設定
      const quickTimes = getQuickTimesForDistance(distanceNum, formData.race_type)
      if (quickTimes.length > 0) {
        const firstQuickTime = quickTimes[0]
        setTimeString(formatTime(firstQuickTime.seconds))
        setFormData(prev => ({ ...prev, target_time_seconds: firstQuickTime.seconds }))
      }
    }
  }

  // 種別選択ハンドラー
  const handleSubTypeSelect = (subType: string) => {
    setSelectedSubType(subType)
    
    if (selectedDistance && selectedDistance !== 'custom') {
      const distance = parseFloat(selectedDistance)
      setFormData(prev => ({
        ...prev,
        distance: distance.toString(),
        custom_distance_m: distance
      }))
      
      // 種別選択時にクイックタイムの最初の値を自動設定
      const quickTimes = getQuickTimesForDistance(distance, formData.race_type)
      if (quickTimes.length > 0) {
        const firstQuickTime = quickTimes[0]
        setTimeString(formatTime(firstQuickTime.seconds))
        setFormData(prev => ({ ...prev, target_time_seconds: firstQuickTime.seconds }))
      }
    }
  }

  const handleInputChange = (field: keyof RaceScheduleFormData, value: string | number) => {
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
    setSelectedDistance('')
    setSelectedSubType('')
  }

  // ラップタイム機能
  const getLapDistanceTemplate = () => {
    const distance = selectedDistance === 'custom' ? (formData.custom_distance_m || 0) : parseFloat(selectedDistance)
    
    if (distance <= 0) return []
    
    const templates = {
      800: [400, 400],
      1500: [300, 300, 300, 300, 300],
      3000: [600, 600, 600, 600, 600],
      5000: [1000, 1000, 1000, 1000, 1000],
      10000: [2000, 2000, 2000, 2000, 2000],
      21097: [5000, 5000, 5000, 5000, 1097],
      42195: [10000, 10000, 10000, 10000, 10000, 2195]
    }
    
    return templates[distance as keyof typeof templates] || []
  }

  const addLapTime = () => {
    if (!currentLap || !currentLapDistance) return
    
    const lapTimeSeconds = parseTimeInput(currentLap)
    const lapDistance = parseFloat(currentLapDistance)
    
    if (lapTimeSeconds <= 0 || lapDistance <= 0) return
    
    const newLap = {
      lap: lapTimes.length + 1,
      time: currentLap,
      seconds: lapTimeSeconds,
      distance: lapDistance
    }
    
    setLapTimes(prev => [...prev, newLap])
    setCurrentLap('')
    setCurrentLapDistance('')
  }

  const removeLapTime = (index: number) => {
    setLapTimes(prev => prev.filter((_, i) => i !== index))
  }

  const generateLapTemplate = () => {
    const template = getLapDistanceTemplate()
    if (template.length === 0) return
    
    const totalDistance = template.reduce((sum, dist) => sum + dist, 0)
    const targetTime = formData.target_time_seconds || 0
    
    if (targetTime <= 0) return
    
    const newLapTimes = template.map((distance, index) => {
      const lapTimeSeconds = (targetTime * distance) / totalDistance
      return {
        lap: index + 1,
        time: formatTime(lapTimeSeconds),
        seconds: lapTimeSeconds,
        distance: distance
      }
    })
    
    setLapTimes(newLapTimes)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await apiClient.createRaceSchedule(formData)
      setToast({ message: 'レース予定を作成しました', type: 'success' })
      setTimeout(() => {
        router.push('/races')
      }, 1500)
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/races')
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">新しいレース予定</h1>
          <p className="mt-2 text-gray-600">レース予定を追加して、目標に向けて準備を始めましょう</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* レース名 */}
              <div className="md:col-span-2">
                <label htmlFor="race_name" className="block text-sm font-medium text-gray-700 mb-2">
                  レース名 *
                </label>
                <input
                  type="text"
                  id="race_name"
                  value={formData.race_name}
                  onChange={(e) => handleInputChange('race_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 東京マラソン2024"
                  required
                />
              </div>

              {/* レース日 */}
              <div>
                <label htmlFor="race_date" className="block text-sm font-medium text-gray-700 mb-2">
                  レース日 *
                </label>
                <input
                  type="date"
                  id="race_date"
                  value={formData.race_date}
                  onChange={(e) => handleInputChange('race_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 会場 */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  会場
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 東京都庁"
                />
              </div>

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

              {/* 距離と種別選択 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">距離と種別を選択 *</label>
                
                {/* トラック種目の場合 */}
                {formData.race_type === 'track' && (
                  <div className="space-y-4">
                    {/* 距離選択 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">距離</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 800, label: '800m' },
                          { value: 1500, label: '1500m' },
                          { value: 3000, label: '3000m' },
                          { value: 5000, label: '5000m' },
                          { value: 10000, label: '10000m' },
                          { value: 'custom', label: 'その他' }
                        ].map((distance) => (
                          <button
                            key={distance.value}
                            type="button"
                            onClick={() => handleDistanceSelect(distance.value)}
                            className={`p-3 text-sm border rounded-lg transition-all ${
                              selectedDistance === distance.value.toString()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            {distance.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 種別選択 */}
                    {selectedDistance && selectedDistance !== 'custom' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">種別</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'preliminary', label: '予選', icon: '🏃‍♂️' },
                            { value: 'final', label: '決勝', icon: '🏆' },
                            { value: 'time_trial', label: '記録会', icon: '⏱️' }
                          ].map((subType) => (
                            <button
                              key={subType.value}
                              type="button"
                              onClick={() => handleSubTypeSelect(subType.value)}
                              className={`p-3 text-sm border rounded-lg transition-all ${
                                selectedSubType === subType.value
                                  ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-lg mb-1">{subType.icon}</span>
                                <span>{subType.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ロード種目の場合 */}
                {formData.race_type === 'road' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">距離</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 5000, label: '5km', icon: '🏃‍♂️' },
                          { value: 10000, label: '10km', icon: '🏃‍♀️' },
                          { value: 21097, label: 'ハーフマラソン', icon: '🏃‍♂️' },
                          { value: 42195, label: 'フルマラソン', icon: '🏃‍♀️' },
                          { value: 'custom', label: 'その他', icon: '📏' }
                        ].map((distance) => (
                          <button
                            key={distance.value}
                            type="button"
                            onClick={() => handleDistanceSelect(distance.value)}
                            className={`p-4 text-sm border rounded-lg transition-all ${
                              selectedDistance === distance.value.toString()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xl mb-1">{distance.icon}</span>
                              <span className="font-medium">{distance.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 選択確認表示 */}
                {selectedDistance && selectedDistance !== 'custom' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">✅</span>
                      <p className="text-blue-800 text-sm font-medium">
                        選択中: 
                        {formData.race_type === 'track' 
                          ? `${selectedDistance}m${selectedSubType ? ` (${selectedSubType === 'preliminary' ? '予選' : selectedSubType === 'final' ? '決勝' : '記録会'})` : ''}`
                          : `${selectedDistance === '5000' ? '5km' : selectedDistance === '10000' ? '10km' : selectedDistance === '21097' ? 'ハーフマラソン' : selectedDistance === '42195' ? 'フルマラソン' : selectedDistance + 'm'}`
                        }
                      </p>
                    </div>
                    {formData.race_type === 'track' && !selectedSubType && (
                      <div className="mt-2 flex items-center space-x-1">
                        <span className="text-orange-500">⚠️</span>
                        <p className="text-orange-600 text-xs">種別（予選・決勝・記録会）を選択してください</p>
                      </div>
                    )}
                  </div>
                )}
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

              {/* 目標タイム */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="target_time" className="block text-sm font-medium text-gray-700">
                    目標タイム
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTimeTemplates(!showTimeTemplates)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showTimeTemplates ? 'テンプレートを隠す' : 'テンプレートを表示'}
                  </button>
                </div>
                
                <input
                  type="text"
                  id="target_time"
                  value={timeString}
                  onChange={(e) => {
                    setTimeString(e.target.value)
                    handleInputChange('target_time_seconds', parseTimeInput(e.target.value))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 1:30:00 または 90:00"
                />
                <p className="mt-1 text-sm text-gray-500">
                  形式: MM:SS または HH:MM:SS
                </p>

                {/* 目標タイムテンプレート */}
                {showTimeTemplates && selectedDistance && selectedDistance !== 'custom' && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">目標タイムテンプレート</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getQuickTimesForDistance(parseFloat(selectedDistance), formData.race_type).map((template, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setTimeString(formatTime(template.seconds))
                            handleInputChange('target_time_seconds', template.seconds)
                          }}
                          className="p-3 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{template.label}</div>
                            <div className="text-blue-600">{formatTime(template.seconds)}</div>
                            <div className="text-xs text-gray-500">{template.pace}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ラップタイム予定 */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ラップタイム予定（任意）
                  </label>
                  {selectedDistance && selectedDistance !== 'custom' && formData.target_time_seconds && (
                    <button
                      type="button"
                      onClick={generateLapTemplate}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      テンプレート生成
                    </button>
                  )}
                </div>

                {/* ラップタイム追加フォーム */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input
                    type="text"
                    value={currentLap}
                    onChange={(e) => setCurrentLap(e.target.value)}
                    placeholder="ラップタイム (例: 1:30)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={currentLapDistance}
                    onChange={(e) => setCurrentLapDistance(e.target.value)}
                    placeholder="距離 (m)"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addLapTime}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    追加
                  </button>
                </div>

                {/* ラップタイム一覧 */}
                {lapTimes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">登録済みラップタイム</h4>
                    {lapTimes.map((lap, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-600">#{lap.lap}</span>
                          <span className="text-sm text-gray-900">{lap.time}</span>
                          <span className="text-sm text-gray-500">{lap.distance}m</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLapTime(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '作成中...' : 'レース予定を作成'}
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

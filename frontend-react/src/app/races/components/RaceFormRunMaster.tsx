'use client'

import React, { useState, useEffect } from 'react'
import { formatDateToSlash, formatDateFromSlash, getCurrentDateSlash } from '@/utils/dateFormat'
import { DateInput } from '@/components/UI/DateInput'

// ペース文字列を秒に変換する関数
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

// タイム入力コンポーネント（トラック種目小数第二位対応）
const TimeInput = ({ raceType, onTimeChange, initialValue = 0 }: {
  raceType: string
  onTimeChange: (time: number) => void
  initialValue?: number
}) => {
  const [timeString, setTimeString] = useState('')
  const [error, setError] = useState('')

  const isTrack = raceType === 'track'

  // 秒数を表示文字列に変換
  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return ''
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      const secStr = isTrack 
        ? seconds.toFixed(2).padStart(5, '0') 
        : Math.floor(seconds).toString().padStart(2, '0')
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secStr}`
    } else {
      const secStr = isTrack 
        ? seconds.toFixed(2).padStart(5, '0') 
        : Math.floor(seconds).toString().padStart(2, '0')
      return `${minutes}:${secStr}`
    }
  }

  // 文字列を秒数に変換
  const parseTime = (timeStr) => {
    if (!timeStr.trim()) return 0
    
    const parts = timeStr.split(':')
    
    try {
      if (parts.length === 2) {
        const minutes = parseInt(parts[0])
        const seconds = parseFloat(parts[1])
        if (isNaN(minutes) || isNaN(seconds) || seconds >= 60) return 0
        return minutes * 60 + seconds
      } else if (parts.length === 3) {
        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])
        const seconds = parseFloat(parts[2])
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || minutes >= 60 || seconds >= 60) return 0
        return hours * 3600 + minutes * 60 + seconds
      }
    } catch {
      return 0
    }
    return 0
  }

  // バリデーション
  const validateTime = (timeStr) => {
    if (!timeStr.trim()) return ''
    
    const regex = isTrack 
      ? /^(\d{1,2}):([0-5]?\d(?:\.\d{1,2})?)$|^(\d{1,2}):([0-5]?\d):([0-5]?\d(?:\.\d{1,2})?)$/
      : /^(\d{1,2}):([0-5]?\d)$|^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/
    
    return regex.test(timeStr) ? '' : '正しい形式で入力してください'
  }

  const handleChange = (e) => {
    const value = e.target.value
    setTimeString(value)
    
    const errorMsg = validateTime(value)
    setError(errorMsg)
    
    if (!errorMsg && value.trim()) {
      onTimeChange(parseTime(value))
    } else if (!value.trim()) {
      onTimeChange(0)
    }
  }

  // 種目別クイックタイム
  const getQuickTimes = () => {
    if (isTrack) {
      return [
        { label: '12.50', value: '12.50' },
        { label: '25.00', value: '25.00' },
        { label: '50.00', value: '50.00' },
        { label: '2:00.00', value: '2:00.00' },
        { label: '4:00.00', value: '4:00.00' },
        { label: '15:00.00', value: '15:00.00' }
      ]
    } else {
      return [
        { label: '15:00', value: '15:00' },
        { label: '20:00', value: '20:00' },
        { label: '30:00', value: '30:00' },
        { label: '1:30:00', value: '1:30:00' },
        { label: '3:00:00', value: '3:00:00' }
      ]
    }
  }

  const quickTimes = getQuickTimes()

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        タイム *
      </label>
      
      <input
        type="text"
        value={timeString}
        onChange={handleChange}
        placeholder={isTrack ? "MM:SS.XX または HH:MM:SS.XX" : "MM:SS または HH:MM:SS"}
        className={`w-full p-3 border rounded-md font-mono text-lg ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      
      <p className="text-gray-500 text-sm mt-1">
        {isTrack 
          ? 'トラック種目は小数第二位まで入力可能（例: 12.50、2:15.34）'
          : 'ロード・駅伝は秒単位で入力（例: 25:30、1:25:30）'
        }
      </p>

      <div className="mt-3">
        <p className="text-sm text-gray-600 mb-2">よく使われるタイム:</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickTimes.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => {
                setTimeString(time.value)
                setError('')
                onTimeChange(parseTime(time.value))
              }}
              className="p-2 text-xs border border-gray-300 rounded hover:bg-gray-50 font-mono"
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// 距離選択コンポーネント（プルダウン + 手入力オプション）
const DistanceSelector = ({ raceType, onDistanceChange }: {
  raceType: string
  onDistanceChange: (distance: number) => void
}) => {
  const [selectedDistance, setSelectedDistance] = useState('')
  const [customDistance, setCustomDistance] = useState('')

  // README仕様に基づく標準距離定義
  const standardDistances = {
    track: [
      { value: 800, label: '800m' },
      { value: 1500, label: '1500m' },
      { value: 3000, label: '3000m' },
      { value: 5000, label: '5000m' },
      { value: 10000, label: '10000m' },
      { value: 'custom', label: 'その他（手入力）' }
    ],
    road: [
      { value: 5000, label: '5km' },
      { value: 10000, label: '10km' },
      { value: 21097, label: 'ハーフマラソン' },
      { value: 42195, label: 'フルマラソン' },
      { value: 'custom', label: 'その他（手入力）' }
    ],
    relay: [
      { value: 'custom', label: '区間距離を入力' }
    ]
  }

  const distances = standardDistances[raceType] || []
  const isCustomSelected = selectedDistance === 'custom'
  const isEkiden = raceType === 'relay'

  const handleDistanceChange = (value) => {
    setSelectedDistance(value)
    
    if (value === 'custom') {
      // カスタム選択時は手入力待ち
      return
    } else {
      // 標準距離選択時
      onDistanceChange(value)
      setCustomDistance('')
    }
  }

  const handleCustomInput = (value) => {
    setCustomDistance(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      // 駅伝はkm単位入力をm単位に変換
      const meters = isEkiden ? numValue * 1000 : numValue
      onDistanceChange(meters)
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {isEkiden ? '区間距離 *' : '距離 *'}
      </label>
      
      {/* プルダウン選択 */}
      <select
        value={selectedDistance}
        onChange={(e) => handleDistanceChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md mb-3"
        required
      >
        <option value="">選択してください</option>
        {distances.map((distance) => (
          <option key={distance.value} value={distance.value}>
            {distance.label}
          </option>
        ))}
      </select>

      {/* カスタム距離入力 */}
      {isCustomSelected && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isEkiden ? '区間距離を入力 (km)' : 'カスタム距離を入力 (m)'}
          </label>
          <input
            type="number"
            step={isEkiden ? '0.1' : '1'}
            value={customDistance}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder={isEkiden ? '例: 5.8' : '例: 800'}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {isEkiden 
              ? 'あなたが走った区間の距離をkm単位で入力してください'
              : 'メートル単位で距離を入力してください'
            }
          </p>
        </div>
      )}

      {/* 選択確認表示 */}
      {selectedDistance && selectedDistance !== 'custom' && (
        <div className="mt-2 text-sm text-blue-600">
          選択中: {distances.find(d => d.value === selectedDistance)?.label}
        </div>
      )}
    </div>
  )
}

// メインレースフォーム
const RaceFormRunMaster: React.FC = () => {
  const [formData, setFormData] = useState({
    raceName: '',
    date: getCurrentDateSlash(),
    raceType: 'track', // track, road, relay
    distance: 0,
    timeSeconds: 0,
    pace: '',
    position: '',
    participants: '',
    weather: '',
    temperature: '',
    notes: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // エラー表示コンポーネント
  const ErrorMessage = ({ field }: { field: string }) => {
    return errors[field] ? (
      <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
    ) : null
  }

  // バリデーション関数
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.raceName.trim()) {
      newErrors.raceName = '大会名を入力してください'
    }
    
    if (formData.timeSeconds <= 0) {
      newErrors.timeSeconds = 'タイムを入力してください'
    }

    if (formData.distance <= 0) {
      newErrors.distance = '距離を選択してください'
    }

    if (formData.temperature && (isNaN(parseFloat(formData.temperature)) || parseFloat(formData.temperature) < -50 || parseFloat(formData.temperature) > 60)) {
      newErrors.temperature = '気温は-50℃から60℃の範囲で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // レース種目変更時の距離リセット
  const handleRaceTypeChange = (newRaceType) => {
    setFormData(prev => ({
      ...prev,
      raceType: newRaceType,
      distance: 0 // 距離をリセット
    }))
    // エラーもクリア
    if (errors.distance) {
      setErrors(prev => ({ ...prev, distance: '' }))
    }
  }

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // バリデーション
    if (!validateForm()) {
      return
    }
    
    // 認証チェック
    const token = localStorage.getItem('token')
    if (!token) {
      alert('ログインが必要です。ログインページに移動します。')
      window.location.href = '/login'
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const submitData = {
        race_name: formData.raceName,
        race_date: formatDateFromSlash(formData.date),
        race_type: formData.raceType,
        distance_meters: formData.distance,
        time_seconds: formData.timeSeconds,
        pace_seconds: formData.pace ? parsePaceToSeconds(formData.pace) : null,
        place: formData.position ? parseInt(formData.position) : null,
        total_participants: formData.participants ? parseInt(formData.participants) : null,
        notes: formData.notes || null
      }

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log('送信データ:', submitData)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/races-runmaster/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const result = await response.json()
        // デバッグ情報（開発環境のみ）
        if (process.env.NODE_ENV === 'development') {
          console.log('保存成功:', result)
        }
        alert('レース結果を保存しました！')
        // 成功後の処理
        window.location.href = '/races'
      } else if (response.status === 401) {
        alert('認証エラーです。ログインし直してください。')
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        const error = await response.json()
        if (process.env.NODE_ENV === 'development') {
          console.error('サーバーエラー:', error)
        }
        alert('保存に失敗しました: ' + (error.detail || 'サーバーエラー'))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ネットワークエラー:', error)
      }
      alert('ネットワークエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">新しいレース結果</h1>
        <p className="text-gray-600">レースの詳細を入力してください</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">日付 *</label>
          <DateInput
            value={formData.date}
            onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
            placeholder="2024/1/1"
          />
        </div>

        {/* 大会名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">大会名 *</label>
          <input
            type="text"
            value={formData.raceName}
            onChange={(e) => setFormData(prev => ({ ...prev, raceName: e.target.value }))}
            placeholder="例: 東京マラソン"
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.raceName ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          <ErrorMessage field="raceName" />
        </div>

        {/* レース種目 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">レース種目 *</label>
          <div className="flex space-x-4">
            {[
              { value: 'track', label: 'トラック' },
              { value: 'road', label: 'ロード' },
              { value: 'relay', label: '駅伝' }
            ].map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="raceType"
                  value={type.value}
                  checked={formData.raceType === type.value}
                  onChange={(e) => handleRaceTypeChange(e.target.value)}
                  className="mr-2"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* 距離選択（プルダウン + 手入力） */}
        <div className={errors.distance ? 'border border-red-500 rounded-md p-3 bg-red-50' : ''}>
          <DistanceSelector 
            raceType={formData.raceType}
            onDistanceChange={(distance) => {
              setFormData(prev => ({ ...prev, distance }))
              if (errors.distance) {
                setErrors(prev => ({ ...prev, distance: '' }))
              }
            }}
          />
          <ErrorMessage field="distance" />
        </div>

        {/* タイム入力（トラック種目小数第二位対応） */}
        <div className={errors.timeSeconds ? 'border border-red-500 rounded-md p-3 bg-red-50' : ''}>
          <TimeInput
            raceType={formData.raceType}
            onTimeChange={(timeSeconds) => {
              setFormData(prev => ({ ...prev, timeSeconds }))
              if (errors.timeSeconds) {
                setErrors(prev => ({ ...prev, timeSeconds: '' }))
              }
            }}
            initialValue={formData.timeSeconds}
          />
          <ErrorMessage field="timeSeconds" />
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ペース</label>
            <input
              type="text"
              value={formData.pace}
              onChange={(e) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
              placeholder="例: 4:30/km"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">順位</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="例: 5位"
              className="w-full p-3 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参加者数</label>
          <input
            type="text"
            value={formData.participants}
            onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            placeholder="例: 500人"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        {/* 環境記録（README仕様） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">天候</label>
            <select
              value={formData.weather}
              onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              <option value="晴れ">晴れ</option>
              <option value="曇り">曇り</option>
              <option value="雨">雨</option>
              <option value="雪">雪</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">気温 (℃)</label>
            <input
              type="number"
              value={formData.temperature}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, temperature: e.target.value }))
                if (errors.temperature) {
                  setErrors(prev => ({ ...prev, temperature: '' }))
                }
              }}
              placeholder="例: 15"
              className={`w-full p-3 border rounded-md ${
                errors.temperature ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            <ErrorMessage field="temperature" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="レースの感想や気づいたことを..."
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        {/* デバッグ情報 */}
        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
          <strong>入力確認:</strong> 
          タイム: {formData.timeSeconds}秒 | 
          距離: {formData.distance}m | 
          種目: {formData.raceType}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? '保存中...' : 'レース結果を保存'}
        </button>
      </form>
    </div>
  )
}

export default RaceFormRunMaster

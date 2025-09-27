'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToastHelpers } from '@/components/UI/Toast'
import { LapAnalysisStep } from './LapAnalysisStep'
import { formatDateToSlash, formatDateFromSlash, getCurrentDateSlash } from '@/utils/dateFormat'
import { DateInput } from '@/components/UI/DateInput'

interface RaceData {
  raceName: string
  date: string
  raceType: string
  distance: number
  raceSubType: string
  timeSeconds: number
  position: string
  participants: string
  notes: string
  lapTimes: Array<{lap: number, time: string, seconds: number, distance: number}>
  splits: Array<{distance: number, time: string, seconds: number}>
}

interface Step {
  number: number
  title: string
  required: boolean
}

// 秒数を時間:分:秒.ミリ秒形式に変換する共通関数
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
  } else {
    return `${minutes}:${secs.toFixed(2).padStart(5, '0')}`
  }
}

export function RaceCreationFlow() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const toast = useToastHelpers()
  const [step, setStep] = useState(1)
  const [raceData, setRaceData] = useState<RaceData>({
    raceName: '',
    date: getCurrentDateSlash(),
    raceType: 'track',
    distance: 0,
    raceSubType: '',
    timeSeconds: 0,
    position: '',
    participants: '',
    notes: '',
    lapTimes: [],
    splits: []
  })

  // 自動保存機能
  const AUTO_SAVE_KEY = 'race_creation_draft'
  
  // 初期化時に保存されたデータを復元（新しいレース追加時はクリア）
  useEffect(() => {
    try {
      // URLパスを確認して、新しいレース追加の場合は自動保存データをクリア
      const isNewRace = window.location.pathname.includes('/races/create')
      
      if (isNewRace) {
        // 新しいレース追加時は自動保存データをクリア
        localStorage.removeItem(AUTO_SAVE_KEY)
        console.log('🆕 新しいレース追加: 自動保存データをクリアしました')
        return
      }
      
      // 編集時のみ自動保存データを復元
      const savedData = localStorage.getItem(AUTO_SAVE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setRaceData(parsedData)
        console.log('📝 自動保存データを復元しました')
      }
    } catch (error) {
      console.error('自動保存データの復元に失敗:', error)
    }
  }, [])

  // データ変更時に自動保存
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(raceData))
        console.log('💾 自動保存しました')
      } catch (error) {
        console.error('自動保存に失敗:', error)
      }
    }, 1000) // 1秒後に保存

    return () => clearTimeout(timeoutId)
  }, [raceData])

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  const steps: Step[] = [
    { number: 1, title: 'レース情報入力', required: true },
    { number: 2, title: '確認・保存', required: true }
  ]

  const handleSave = async () => {
    // バリデーション
    if (!raceData.raceName.trim()) {
      toast.warning('入力エラー', '大会名を入力してください')
      return
    }
    
    if (raceData.timeSeconds <= 0) {
      toast.warning('入力エラー', 'タイムを入力してください')
      return
    }

    if (raceData.distance <= 0) {
      toast.warning('入力エラー', '距離を選択してください')
      return
    }

    try {
      // apiClientを使用して認証ヘッダーを自動追加
      const { apiClient } = await import('@/lib/api')
      
      // 日付のデバッグ情報を追加
      console.log('raceData.date:', raceData.date)
      console.log('raceData.date type:', typeof raceData.date)
      
      // 日付の処理
      let formattedDate = ''
      if (raceData.date) {
        if (typeof raceData.date === 'string') {
          formattedDate = formatDateFromSlash(raceData.date)
        } else if (raceData.date instanceof Date) {
          formattedDate = raceData.date.toISOString().split('T')[0]
        } else {
          console.warn('Invalid date format:', raceData.date)
          formattedDate = new Date().toISOString().split('T')[0] // デフォルトは今日の日付
        }
      } else {
        formattedDate = new Date().toISOString().split('T')[0] // デフォルトは今日の日付
      }
      
      const submitData = {
        race_name: raceData.raceName,
        race_date: formattedDate,
        race_type: raceData.raceType,
        distance_meters: raceData.distance,
        time_seconds: raceData.timeSeconds,
        place: raceData.position ? parseInt(raceData.position) : null,
        total_participants: raceData.participants ? parseInt(raceData.participants) : null,
        notes: raceData.notes || null
      }
      
      console.log('送信データ:', submitData)
      
      await apiClient.createRace(submitData)

      toast.success('保存完了', 'レース結果を保存しました！')
      
      // 自動保存データをクリア
      localStorage.removeItem(AUTO_SAVE_KEY)
      
      // フォームリセット
      setRaceData({
        raceName: '',
        date: getCurrentDateSlash(),
        raceType: 'track',
        distance: 0,
        raceSubType: '',
        timeSeconds: 0,
        position: '',
        participants: '',
        notes: '',
        lapTimes: [],
        splits: []
      })
      setStep(1)
    } catch (error) {
      console.error('レース保存エラー:', error)
      console.error('エラー詳細:', error.response?.data)
      toast.error('保存失敗', `保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        const isValid = raceData.raceName.trim() && raceData.distance > 0 && 
               (raceData.raceType !== 'track' || raceData.raceSubType) &&
               raceData.timeSeconds > 0
        console.log('バリデーション:', {
          raceName: raceData.raceName.trim(),
          distance: raceData.distance,
          raceType: raceData.raceType,
          raceSubType: raceData.raceSubType,
          timeSeconds: raceData.timeSeconds,
          isValid
        })
        return isValid
      case 2:
        return true // 確認・保存ページ
      default:
        return false
    }
  }

  return (
    <div className="w-full">
      {authLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">認証状態を確認中...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="text-center py-8">
          <p className="text-gray-600">ログインが必要です</p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8">新しいレース結果</h1>
          
          {/* ステップ表示 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s.number}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500">
                      {s.required ? '必須' : '任意'}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-16 h-px bg-gray-300 mx-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ステップ別コンテンツ */}
          {step === 1 && (
            <div className="space-y-8">
              <BasicInfoStep raceData={raceData} setRaceData={setRaceData} />
              <TimeDetailsStep raceData={raceData} setRaceData={setRaceData} />
              <LapAnalysisStep raceData={raceData} setRaceData={setRaceData} />
            </div>
          )}
          {step === 2 && <ConfirmSaveStep raceData={raceData} />}

          {/* ナビゲーション */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
            >
              戻る
            </button>
            
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                確認へ
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={!canProceedToNext()}
                  className={`px-6 py-2 rounded-md ${
                    canProceedToNext() 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  保存
                </button>
                {!canProceedToNext() && (
                  <p className="text-sm text-red-600">
                    基本情報の入力が完了していません
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ステップ1: 基本情報
function BasicInfoStep({ raceData, setRaceData }: {
  raceData: RaceData
  setRaceData: React.Dispatch<React.SetStateAction<RaceData>>
}) {
  const [selectedDistance, setSelectedDistance] = useState('')
  const [selectedSubType, setSelectedSubType] = useState('')
  const [timeString, setTimeString] = useState('')
  const [timeError, setTimeError] = useState('')

  const handleDistanceSelect = (distance: number | string) => {
    setSelectedDistance(distance.toString())
    setSelectedSubType('')
    
    if (raceData.raceType !== 'track' && distance !== 'custom') {
      setRaceData(prev => ({
        ...prev,
        distance: distance as number,
        raceSubType: 'standard'
      }))
      
      // 距離選択時にクイックタイムの最初の値を自動設定
      const quickTimes = getQuickTimesForDistance(distance as number, raceData.raceType)
      if (quickTimes.length > 0) {
        const firstQuickTime = quickTimes[0]
        setTimeString(formatTime(firstQuickTime.seconds))
        setRaceData(prev => ({ ...prev, timeSeconds: firstQuickTime.seconds }))
      }
    }
  }

  const handleSubTypeSelect = (subType: string) => {
    setSelectedSubType(subType)
    
    if (selectedDistance && selectedDistance !== 'custom') {
      const distance = parseFloat(selectedDistance)
      setRaceData(prev => ({
        ...prev,
        distance: distance,
        raceSubType: `${selectedDistance}_${subType}`
      }))
      
      // 種別選択時にクイックタイムの最初の値を自動設定
      const quickTimes = getQuickTimesForDistance(distance, raceData.raceType)
      if (quickTimes.length > 0) {
        const firstQuickTime = quickTimes[0]
        setTimeString(formatTime(firstQuickTime.seconds))
        setRaceData(prev => ({ ...prev, timeSeconds: firstQuickTime.seconds }))
      }
    }
  }

  // タイム処理関数
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr.trim()) return 0
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0])
      const seconds = parseFloat(parts[1])
      return minutes * 60 + seconds
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseFloat(parts[2])
      return hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }


  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTimeString(value)
    setTimeError('')
    
    const seconds = parseTimeToSeconds(value)
    if (seconds > 0) {
      setRaceData(prev => ({ ...prev, timeSeconds: seconds }))
    }
  }

  // 距離別クイックタイム取得関数
  const getQuickTimesForDistance = (distance: number, raceType: string) => {
    if (raceType === 'track') {
      if (distance <= 800) {
        return [
          { label: '2:00.00', seconds: 120 },
          { label: '2:15.00', seconds: 135 },
          { label: '2:30.00', seconds: 150 },
          { label: '2:45.00', seconds: 165 }
        ]
      } else if (distance <= 1500) {
        return [
          { label: '4:00.00', seconds: 240 },
          { label: '4:30.00', seconds: 270 },
          { label: '5:00.00', seconds: 300 },
          { label: '5:30.00', seconds: 330 }
        ]
      } else if (distance <= 3000) {
        return [
          { label: '9:00.00', seconds: 540 },
          { label: '10:00.00', seconds: 600 },
          { label: '11:00.00', seconds: 660 },
          { label: '12:00.00', seconds: 720 }
        ]
      } else if (distance <= 5000) {
        return [
          { label: '15:00.00', seconds: 900 },
          { label: '18:00.00', seconds: 1080 },
          { label: '20:00.00', seconds: 1200 },
          { label: '25:00.00', seconds: 1500 }
        ]
      } else {
        return [
          { label: '30:00.00', seconds: 1800 },
          { label: '35:00.00', seconds: 2100 },
          { label: '40:00.00', seconds: 2400 },
          { label: '45:00.00', seconds: 2700 }
        ]
      }
    } else if (raceType === 'road') {
      if (distance <= 5000) {
        // 5km: トラック5000mと同じタイムに統一
        return [
          { label: '15:00', seconds: 900 },
          { label: '18:00', seconds: 1080 },
          { label: '20:00', seconds: 1200 },
          { label: '25:00', seconds: 1500 }
        ]
      } else if (distance <= 10000) {
        // 10km: トラック10000mと同じタイムに統一
        return [
          { label: '30:00', seconds: 1800 },
          { label: '35:00', seconds: 2100 },
          { label: '40:00', seconds: 2400 },
          { label: '45:00', seconds: 2700 }
        ]
      } else if (distance <= 21097) {
        return [
          { label: '1:30:00', seconds: 5400 },
          { label: '1:45:00', seconds: 6300 },
          { label: '2:00:00', seconds: 7200 },
          { label: '2:15:00', seconds: 8100 }
        ]
      } else {
        return [
          { label: '3:00:00', seconds: 10800 },
          { label: '3:30:00', seconds: 12600 },
          { label: '4:00:00', seconds: 14400 },
          { label: '4:30:00', seconds: 16200 }
        ]
      }
    } else if (raceType === 'relay') {
      return [
        { label: '15:00', seconds: 900 },
        { label: '20:00', seconds: 1200 },
        { label: '25:00', seconds: 1500 },
        { label: '30:00', seconds: 1800 }
      ]
    }
    
    return []
  }

  // クイックタイム設定
  const getQuickTimes = () => {
    return getQuickTimesForDistance(raceData.distance, raceData.raceType)
  }

  const handleQuickTimeSelect = (seconds: number) => {
    const formattedTime = formatTime(seconds)
    setTimeString(formattedTime)
    setTimeError('')
    setRaceData(prev => ({ ...prev, timeSeconds: seconds }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">基本情報</h2>
      
      {/* 大会名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">大会名 *</label>
        <input
          type="text"
          value={raceData.raceName}
          onChange={(e) => setRaceData(prev => ({ ...prev, raceName: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-md"
          placeholder="例: 第50回市民マラソン大会"
          required
        />
      </div>

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">日付 *</label>
        <DateInput
          value={raceData.date}
          onChange={(value) => setRaceData(prev => ({ ...prev, date: value }))}
          placeholder="2024/1/1"
          showCalendarIcon={true}
        />
      </div>

      {/* レース種目 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">レース種目 *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'track', label: 'トラック' },
            { value: 'road', label: 'ロード' },
            { value: 'relay', label: '駅伝' }
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setRaceData(prev => ({ ...prev, raceType: type.value, distance: 0, raceSubType: '' }))}
              className={`p-3 text-sm border rounded-md transition-colors ${
                raceData.raceType === type.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 距離選択 */}
      {raceData.raceType === 'relay' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">区間距離 * (km)</label>
          <input
            type="number"
            step="0.1"
            value={raceData.distance / 1000}
            onChange={(e) => setRaceData(prev => ({ ...prev, distance: parseFloat(e.target.value) * 1000 }))}
            placeholder="例: 5.8"
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">距離と種別を選択 *</label>
          
          {/* トラック種目の場合 */}
          {raceData.raceType === 'track' && (
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
          {raceData.raceType === 'road' && (
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
                  {raceData.raceType === 'track' 
                    ? `${selectedDistance}m${selectedSubType ? ` (${selectedSubType === 'preliminary' ? '予選' : selectedSubType === 'final' ? '決勝' : '記録会'})` : ''}`
                    : `${selectedDistance === '5000' ? '5km' : selectedDistance === '10000' ? '10km' : selectedDistance === '21097' ? 'ハーフマラソン' : selectedDistance === '42195' ? 'フルマラソン' : selectedDistance + 'm'}`
                  }
                </p>
              </div>
              {raceData.raceType === 'track' && !selectedSubType && (
                <div className="mt-2 flex items-center space-x-1">
                  <span className="text-orange-500">⚠️</span>
                  <p className="text-orange-600 text-xs">種別（予選・決勝・記録会）を選択してください</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* タイム入力 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">タイム *</label>
        <input
          type="text"
          value={timeString}
          onChange={handleTimeChange}
          placeholder={raceData.distance > 0 ? (() => {
            const quickTimes = getQuickTimesForDistance(raceData.distance, raceData.raceType)
            return quickTimes.length > 0 ? `例: ${quickTimes[0].label}` : (raceData.raceType === 'track' ? "例: 2:15.50" : "例: 25:30")
          })() : (raceData.raceType === 'track' ? "例: 2:15.50" : "例: 25:30")}
          className={`w-full p-3 border rounded-md font-mono text-lg ${
            timeError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          required
        />
        {timeError && <p className="text-red-500 text-sm mt-1">{timeError}</p>}
        
        {/* クイックタイムボタン */}
        {raceData.distance > 0 && getQuickTimes().length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">クイックタイム:</p>
            <div className="flex gap-2 flex-wrap">
              {getQuickTimes().map((quickTime) => (
                <button
                  key={quickTime.label}
                  type="button"
                  onClick={() => handleQuickTimeSelect(quickTime.seconds)}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                    timeString === formatTime(quickTime.seconds)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {quickTime.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-gray-500 text-sm mt-1">
          {raceData.raceType === 'track' 
            ? 'トラック種目は小数第二位まで入力可能（例: 2:15.50）'
            : 'ロード・駅伝は秒単位で入力（例: 25:30）'
          }
        </p>
      </div>
    </div>
  )
}

// ステップ2: 詳細情報
function TimeDetailsStep({ raceData, setRaceData }: {
  raceData: RaceData
  setRaceData: React.Dispatch<React.SetStateAction<RaceData>>
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">詳細情報（任意）</h2>
      <p className="text-gray-600">
        レースの詳細情報を入力してください。すべて任意項目です。
      </p>

      {/* 順位・参加者数 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">順位（任意）</label>
          <input
            type="number"
            value={raceData.position}
            onChange={(e) => setRaceData(prev => ({ ...prev, position: e.target.value }))}
            placeholder="例: 15"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参加者数（任意）</label>
          <input
            type="number"
            value={raceData.participants}
            onChange={(e) => setRaceData(prev => ({ ...prev, participants: e.target.value }))}
            placeholder="例: 500"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
        <textarea
          value={raceData.notes}
          onChange={(e) => setRaceData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="レースの感想、戦略、天気など..."
          className="w-full p-3 border border-gray-300 rounded-md h-24 resize-none"
        />
      </div>

      {/* スキップオプション */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">💡 詳細情報について</h4>
        <div className="text-sm text-blue-700 mt-1 space-y-1">
          <p>• 順位、参加者数、メモはすべて任意項目です</p>
          <p>• 入力しなくてもレース記録として保存できます</p>
          <p>• 後から追加・編集することも可能です</p>
        </div>
      </div>
    </div>
  )
}


// ステップ4: 確認・保存
function ConfirmSaveStep({ raceData }: { raceData: RaceData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">確認・保存</h2>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium mb-4">入力内容の確認</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">大会名:</span>
            <span className="font-medium">{raceData.raceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">日付:</span>
            <span className="font-medium">{raceData.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">種目:</span>
            <span className="font-medium">
              {raceData.raceType === 'track' ? 'トラック' : 
               raceData.raceType === 'road' ? 'ロード' : '駅伝'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">距離:</span>
            <span className="font-medium">
              {raceData.raceType === 'relay' 
                ? `${(raceData.distance / 1000).toFixed(1)}km`
                : `${raceData.distance}m`
              }
            </span>
          </div>
          {raceData.raceSubType && (
            <div className="flex justify-between">
              <span className="text-gray-600">種別:</span>
              <span className="font-medium">
                {raceData.raceSubType.includes('preliminary') ? '予選' :
                 raceData.raceSubType.includes('final') ? '決勝' : '記録会'}
              </span>
            </div>
          )}
          {raceData.timeSeconds > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">タイム:</span>
              <span className="font-medium font-mono">
                {Math.floor(raceData.timeSeconds / 60)}:{(raceData.timeSeconds % 60).toFixed(2).padStart(5, '0')}
              </span>
            </div>
          )}
          {raceData.position && (
            <div className="flex justify-between">
              <span className="text-gray-600">順位:</span>
              <span className="font-medium">{raceData.position}位</span>
            </div>
          )}
          {raceData.participants && (
            <div className="flex justify-between">
              <span className="text-gray-600">参加者数:</span>
              <span className="font-medium">{raceData.participants}人</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { WorkoutStepType } from '@/types/customWorkout'
import { 
  parseTimeToSeconds, 
  parsePaceToSeconds, 
  calculatePaceFromTime, 
  calculateTimeFromPace,
  createDefaultStepData 
} from '@/lib/workoutUtils'

// 秒数を時間形式に変換する関数
const formatTimeFromSeconds = (seconds: number): string => {
  if (!seconds || seconds <= 0) return ''
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

// 秒数をペース形式に変換する関数
const formatPaceFromSeconds = (secondsPerKm: number): string => {
  if (!secondsPerKm || secondsPerKm <= 0) return ''
  
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.floor(secondsPerKm % 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

interface StepFormData {
  duration: number
  distance: number
  pace: string
  time: string
  heartRate: number
  intensity: number
  notes: string
  goalType: 'time' | 'pace'
  restFormat?: 'complete_rest' | 'sitting' | 'standing'
  recoveryFormat?: 'walking' | 'light_jog'
}

interface StepDetailFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (stepData: any) => void
  stepType: WorkoutStepType | null
  title?: string
  existingStep?: any // 既存のステップデータ
}

export function StepDetailForm({ 
  isOpen, 
  onClose, 
  onSave, 
  stepType, 
  title = "ステップ詳細を入力",
  existingStep
}: StepDetailFormProps) {
  const [stepFormData, setStepFormData] = useState<StepFormData>(createDefaultStepData('run'))

  useEffect(() => {
    if (stepType) {
      if (existingStep) {
        // 既存のステップデータがある場合はそれを使用
        console.log('🔍 Initializing StepDetailForm with existing step:', existingStep)
        setStepFormData({
          duration: existingStep.duration || 0,
          distance: existingStep.distance || 0,
          pace: existingStep.pace ? formatPaceFromSeconds(existingStep.pace) : '',
          time: existingStep.duration ? formatTimeFromSeconds(existingStep.duration) : '',
          heartRate: existingStep.heartRate || 0,
          intensity: existingStep.intensity || 5,
          notes: existingStep.notes || '',
          goalType: 'time' as 'time' | 'pace',
          restFormat: existingStep.restFormat || 'complete_rest',
          recoveryFormat: existingStep.recoveryFormat || 'walking'
        })
      } else {
        // 新規作成の場合はデフォルト値を使用
        console.log('🔍 Initializing StepDetailForm with default data for:', stepType)
        const defaultData = createDefaultStepData(stepType)
        setStepFormData({
          ...defaultData,
          restFormat: 'complete_rest',
          recoveryFormat: 'walking'
        })
      }
    }
  }, [stepType, existingStep])

  if (!isOpen || !stepType) return null

  const handleSave = () => {
    console.log('🔍 StepDetailForm handleSave called with:', { stepFormData, stepType })
    
    // タイムまたはペースからdurationを計算
    let duration = stepFormData.duration
    if ((stepType === 'run' || stepType === 'rest' || stepType === 'recovery' || stepType === 'cooldown' || stepType === 'warmup' || stepType === 'strength' || stepType === 'stretch' || stepType === 'other') && stepFormData.time) {
      duration = parseTimeToSeconds(stepFormData.time)
    } else if (stepType === 'run' && stepFormData.pace && stepFormData.distance) {
      const paceSeconds = parsePaceToSeconds(stepFormData.pace)
      duration = Math.round((paceSeconds * stepFormData.distance) / 1000)
    }

    const stepData = {
      type: stepType,
      duration: duration,
      distance: (stepType === 'run' || stepType === 'recovery' || stepType === 'cooldown') ? stepFormData.distance : undefined,
      pace: stepType === 'run' && stepFormData.pace ? parsePaceToSeconds(stepFormData.pace) : undefined,
      heartRate: (stepType === 'run' || stepType === 'recovery' || stepType === 'cooldown') ? stepFormData.heartRate : undefined,
      intensity: stepFormData.intensity,
      notes: stepFormData.notes,
      estimatedTime: duration, // 計算されたdurationをestimatedTimeとして設定
      estimatedDistance: (stepType === 'run' || stepType === 'recovery' || stepType === 'cooldown') ? stepFormData.distance : undefined,
      // 休息・回復専用フィールド
      restFormat: stepType === 'rest' ? stepFormData.restFormat : undefined,
      recoveryFormat: stepType === 'recovery' ? stepFormData.recoveryFormat : undefined
    }

    console.log('StepDetailForm: Saving step data:', stepData)
    console.log('🔍 Calling onSave with stepData:', stepData)
    onSave(stepData)
    console.log('🔍 onSave called, now calling onClose')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* 距離（ランニング、回復、クールダウンの場合） */}
            {(stepType === 'run' || stepType === 'recovery' || stepType === 'cooldown') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  距離 (m) {stepType === 'run' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  value={stepFormData.distance || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const distance = value === '' ? 0 : parseInt(value) || 0
                    setStepFormData(prev => ({ ...prev, distance }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={stepType === 'run' ? "例: 400" : stepType === 'recovery' ? "例: 200 (任意)" : "例: 1000 (任意)"}
                />
                {(stepType === 'recovery' || stepType === 'cooldown') && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stepType === 'recovery' ? '回復走の距離（任意）' : 'クールダウンの距離（任意）'}
                  </p>
                )}
              </div>
            )}

            {/* 時間（ランニング、休息、回復、クールダウン、ウォームアップ、筋力、ストレッチ、その他の場合） */}
            {(stepType === 'run' || stepType === 'rest' || stepType === 'recovery' || stepType === 'cooldown' || stepType === 'warmup' || stepType === 'strength' || stepType === 'stretch' || stepType === 'other') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  時間 {stepType === 'run' && <span className="text-red-500">*</span>}
                </label>
                
                <div className="space-y-3">
                  {/* メイン時間入力 */}
                <input
                  type="text"
                  value={stepFormData.time || ''}
                  onChange={(e) => {
                    const newTime = e.target.value
                    setStepFormData(prev => ({
                      ...prev,
                      time: newTime,
                      duration: parseTimeToSeconds(newTime)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    stepType === 'run' ? "例: 4:00" : 
                    stepType === 'rest' ? "例: 5:00" : 
                    stepType === 'recovery' ? "例: 3:00" : 
                    stepType === 'cooldown' ? "例: 10:00" :
                    stepType === 'warmup' ? "例: 15:00" :
                    stepType === 'strength' ? "例: 30:00" :
                    stepType === 'stretch' ? "例: 10:00" :
                    "例: 20:00"
                  }
                />
                  
                  {/* クイック選択ボタン */}
                  <div>
                    <div className="text-xs text-gray-600 mb-2">クイック選択</div>
                    <div className="grid grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const time = "5:00"
                          setStepFormData(prev => ({
                            ...prev,
                            time,
                            duration: parseTimeToSeconds(time)
                          }))
                        }}
                        className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        5分
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const time = "10:00"
                          setStepFormData(prev => ({
                            ...prev,
                            time,
                            duration: parseTimeToSeconds(time)
                          }))
                        }}
                        className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        10分
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const time = "20:00"
                          setStepFormData(prev => ({
                            ...prev,
                            time,
                            duration: parseTimeToSeconds(time)
                          }))
                        }}
                        className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        20分
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const time = "50:00"
                          setStepFormData(prev => ({
                            ...prev,
                            time,
                            duration: parseTimeToSeconds(time)
                          }))
                        }}
                        className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        50分
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const time = "1:00:00"
                          setStepFormData(prev => ({
                            ...prev,
                            time,
                            duration: parseTimeToSeconds(time)
                          }))
                        }}
                        className="px-2 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        1時間
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">MM:SS または H:MM:SS 形式で入力してください</p>
                {stepType === 'run' && stepFormData.pace && (
                  <p className="text-xs text-green-600 mt-1">
                    自動計算ペース: {stepFormData.pace}
                  </p>
                )}
              </div>
            )}

            {/* 目標設定（ランニングの場合のみ） */}
            {stepType === 'run' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標設定
                </label>
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => setStepFormData(prev => ({ ...prev, goalType: 'time' }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      stepFormData.goalType === 'time'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    目標タイム
                  </button>
                  <button
                    onClick={() => setStepFormData(prev => ({ ...prev, goalType: 'pace' }))}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      stepFormData.goalType === 'pace'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    目標ペース
                  </button>
                </div>

                {/* 目標タイム入力 */}
                {stepFormData.goalType === 'time' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      目標タイム
                    </label>
                    <input
                      type="text"
                      value={stepFormData.time || ''}
                      onChange={(e) => {
                        const newTime = e.target.value
                        setStepFormData(prev => ({
                          ...prev,
                          time: newTime,
                          pace: calculatePaceFromTime(newTime, prev.distance)
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例: 4:00"
                    />
                    <p className="text-xs text-gray-500 mt-1">MM:SS 形式で入力してください</p>
                    {stepFormData.pace && (
                      <p className="text-xs text-green-600 mt-1">
                        自動計算ペース: {stepFormData.pace}
                      </p>
                    )}
                  </div>
                )}

                {/* 目標ペース入力 */}
                {stepFormData.goalType === 'pace' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      目標ペース
                    </label>
                    <input
                      type="text"
                      value={stepFormData.pace || ''}
                      onChange={(e) => {
                        const newPace = e.target.value
                        setStepFormData(prev => ({
                          ...prev,
                          pace: newPace,
                          time: calculateTimeFromPace(newPace, prev.distance)
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例: 4:00/km"
                    />
                    <p className="text-xs text-gray-500 mt-1">MM:SS/km 形式で入力してください</p>
                    {stepFormData.time && (
                      <p className="text-xs text-green-600 mt-1">
                        自動計算タイム: {stepFormData.time}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 休息形式（休息の場合のみ） */}
            {stepType === 'rest' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  休息形式
                </label>
                <select
                  value={stepFormData.restFormat || 'complete_rest'}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, restFormat: e.target.value as 'complete_rest' | 'sitting' | 'standing' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="complete_rest">完全休息（立ち止まり）</option>
                  <option value="sitting">座って休息</option>
                  <option value="standing">立って休息</option>
                </select>
              </div>
            )}

            {/* 回復形式（回復の場合のみ） */}
            {stepType === 'recovery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回復形式
                </label>
                <select
                  value={stepFormData.recoveryFormat || 'walking'}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, recoveryFormat: e.target.value as 'walking' | 'light_jog' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="walking">ウォーキング</option>
                  <option value="light_jog">軽いジョグ</option>
                </select>
              </div>
            )}

            {/* 心拍ゾーン（ランニング、回復、クールダウンの場合） */}
            {(stepType === 'run' || stepType === 'recovery' || stepType === 'cooldown') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  心拍ゾーン
                </label>
                <input
                  type="text"
                  value={stepFormData.heartRate ? `${stepFormData.heartRate}%` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace('%', '')
                    setStepFormData(prev => ({ ...prev, heartRate: parseInt(value) || 0 }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    stepType === 'run' ? "例: 85-90%" : 
                    stepType === 'recovery' ? "例: 60-70%" : 
                    "例: 50-60%"
                  }
                />
                {(stepType === 'recovery' || stepType === 'cooldown') && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stepType === 'recovery' ? '回復走の心拍ゾーン（任意）' : 'クールダウンの心拍ゾーン（任意）'}
                  </p>
                )}
              </div>
            )}

            {/* 強度 (1-10) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                強度 (1-10)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stepFormData.intensity}
                  onChange={(e) => {
                    const value = e.target.value
                    const intensity = parseInt(value) || 5
                    setStepFormData(prev => ({ ...prev, intensity }))
                  }}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-blue-600 w-8 text-center">
                  {stepFormData.intensity}
                </span>
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ
              </label>
              <textarea
                value={stepFormData.notes}
                onChange={(e) => setStepFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="メモを入力..."
              />
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { WorkoutType, DetailedWorkoutData, DetailedWorkoutSession, DetailedWorkoutStep, DetailedWorkoutType, DetailedWarmupType } from '@/types'
import { WorkoutStepEditorWithResults } from './WorkoutStepEditorWithResults'
import { WorkoutPreview } from './WorkoutPreview'
import { CSVImportModal } from './CSVImportModal'
import { apiClient } from '@/lib/api'
import { useFormPersistence, useDraftSave, SmartInput, useAutoFocus } from '@/hooks/useWebOptimization'

// 日付の有効性をチェックする関数
function isValidDate(dateString: string): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  const currentYear = new Date().getFullYear()
  return date instanceof Date && !isNaN(date.getTime()) && 
         date.getFullYear() >= 1900 && date.getFullYear() <= currentYear + 10
}

// 数値の有効性をチェックする関数
function isValidNumber(value: string, min: number = 0, max: number = 999999): boolean {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

// 時間の有効性をチェックする関数（24時間以内）
function isValidTime(hours: number, minutes: number = 0, seconds: number = 0): boolean {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  return totalSeconds >= 0 && totalSeconds <= 86400 // 24時間 = 86400秒
}

// 合計時間を計算する関数
function calculateTotalTime(sessions: DetailedWorkoutSession[]): number {
  return sessions.reduce((total, session) => {
    return total + session.sections.reduce((sectionTotal, section) => {
      return sectionTotal + section.steps.reduce((stepTotal, step) => {
        return stepTotal + (step.duration || 0)
      }, 0)
    }, 0)
  }, 0)
}

interface DetailedWorkoutFormProps {
  workoutTypes: WorkoutType[]
  onSubmit: (data: DetailedWorkoutData) => void
  onCancel: () => void
  isSubmitting: boolean
}

// 練習種別のラベルと説明
const DETAILED_WORKOUT_LABELS = {
  // 持久系練習
  easy_run: { label: 'イージーラン', description: '楽なペースでのジョギング', icon: '🏃‍♂️' },
  long_run: { label: 'ロング走', description: '長距離・長時間の持久走', icon: '🏃‍♂️' },
  medium_run: { label: 'ミディアムラン', description: '中程度の強度でのランニング', icon: '🏃‍♂️' },
  tempo_run: { label: 'テンポ走', description: '閾値ペースでの持続走', icon: '⚡' },
  
  // スピード・強度系練習
  interval_run: { label: 'インターバル走', description: '高強度と休息を繰り返す', icon: '🔥' },
  repetition: { label: 'レペティション', description: '完全回復での高強度走', icon: '💨' },
  build_up: { label: 'ビルドアップ走', description: '段階的にペースを上げる', icon: '📈' },
  fartlek: { label: 'ファルトレク', description: '自由な強度変化走', icon: '🎯' },
  pace_change: { label: '変化走', description: '複数ペースの組み合わせ', icon: '🔄' },
  
  // 特殊練習
  hill_run: { label: '坂道練習', description: '上り坂・下り坂での練習', icon: '⛰️' },
  stair_run: { label: '階段練習', description: '階段を使った強度練習', icon: '🪜' },
  sand_run: { label: '砂浜・芝生走', description: '特殊な路面での練習', icon: '🏖️' }
} as const

const DETAILED_WARMUP_LABELS = {
  // 基本的な準備運動（スタンダード）
  jogging: { label: 'ジョギング', description: '楽なペースでのランニング', icon: '🏃‍♂️' },
  walking: { label: 'ウォーキング', description: '歩行でのウォームアップ', icon: '🚶‍♂️' },
  dynamic_stretch: { label: '動的ストレッチ', description: '動きながらのストレッチ', icon: '🤸‍♀️' },
  flow_run: { label: '流し', description: '短距離の加速走', icon: '💨' }
} as const

// セッションの時間帯ラベル
const TIME_PERIOD_LABELS = {
  morning: '朝練',
  morning_afternoon: '午前練',
  afternoon: '午後練',
  evening: '夜練',
  other: 'その他'
}

// 新しいステップを作成
const createNewStep = (type: DetailedWorkoutType | DetailedWarmupType | 'cooldown'): DetailedWorkoutStep => ({
  id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  name: '',
  description: '',
  distance_meters: undefined,
  duration_seconds: undefined,
  intensity_rpe: 5,
  heart_rate_zone: '',
  target_pace: '',
  notes: '',
  focus_points: []
})

// 新しいセッションを作成
const createNewSession = (sessionNumber: number, timePeriod: 'morning' | 'afternoon' | 'evening'): DetailedWorkoutSession => ({
  id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  session_number: sessionNumber,
  time_period: timePeriod,
  sections: {
    warmup: {
      type: 'warmup',
      steps: [],
      estimated_duration_minutes: 0,
      estimated_distance_meters: 0
    },
    main: {
      type: 'main',
      steps: [],
      estimated_duration_minutes: 0,
      estimated_distance_meters: 0
    },
    cooldown: {
      type: 'cooldown',
      steps: [],
      estimated_duration_minutes: 0,
      estimated_distance_meters: 0
    }
  },
  total_estimated_duration_minutes: 0,
  total_estimated_distance_meters: 0
})

// 練習種別の表示名を取得する関数
function getWorkoutTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    // 持久系練習
    easy_run: 'イージーラン',
    long_run: 'ロング走',
    medium_run: 'ミディアムラン',
    tempo_run: 'テンポ走',
    
    // スピード・強度系練習
    interval_run: 'インターバル走',
    repetition: 'レペティション',
    build_up: 'ビルドアップ走',
    fartlek: 'ファルトレク',
    pace_change: '変化走',
    
    // 特殊練習
    hill_run: '坂道練習',
    stair_run: '階段練習',
    sand_run: '砂浜・芝生走',
    
    // ウォームアップ（スタンダード）
    jogging: 'ジョギング',
    walking: 'ウォーキング',
    dynamic_stretch: '動的ストレッチ',
    flow_run: '流し',
    
    // クールダウン
    cooldown: 'クールダウン'
  }
  return labelMap[type] || type
}

export function DetailedWorkoutForm({
  workoutTypes,
  onSubmit,
  onCancel,
  isSubmitting
}: DetailedWorkoutFormProps) {
  console.log('DetailedWorkoutForm レンダリング開始', { workoutTypes: workoutTypes.length, isSubmitting })
  
  // Web最適化: フォーム状態の永続化
  const initialFormData: DetailedWorkoutData = {
    date: new Date().toISOString().split('T')[0],
    session_count: 1,
    workout_name: '',
    sessions: [createNewSession(1, 'morning')],
    notes: '',
    avg_heart_rate: undefined,
    max_heart_rate: undefined,
    total_estimated_duration_minutes: 0,
    total_estimated_distance_meters: 0
  }

  const { formData, updateFormData, clearFormData } = useFormPersistence('workout_form', initialFormData)
  
  // Web最適化: 下書き保存
  useDraftSave('workout_form', formData)
  
  // Web最適化: 自動フォーカス管理
  const { registerField, handleKeyDown } = useAutoFocus()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingStep, setEditingStep] = useState<{ step: DetailedWorkoutStep; sessionIndex: number; sectionType: 'warmup' | 'main' | 'cooldown' } | null>(null)
  const [showStepEditor, setShowStepEditor] = useState(false)
  
  // CSVインポート関連の状態
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [csvImportTarget, setCsvImportTarget] = useState<{
    sessionIndex: number
    sectionType: 'warmup' | 'main' | 'cooldown'
    stepType?: string
  } | null>(null)

  // 練習種別選択モーダルの状態
  const [showWorkoutTypeSelector, setShowWorkoutTypeSelector] = useState(false)
  const [workoutTypeSelectorTarget, setWorkoutTypeSelectorTarget] = useState<{
    sessionIndex: number
    sectionType: 'warmup' | 'main' | 'cooldown'
  } | null>(null)

  // 部練数変更時のセッション配列更新
  useEffect(() => {
    const timePeriods: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening']
    const newSessions = Array.from({ length: formData.session_count }, (_, index) => {
      if (formData.sessions[index]) {
        return formData.sessions[index]
      }
      return createNewSession(index + 1, timePeriods[index])
    })
    
    updateFormData({
      ...formData,
      sessions: newSessions
    })
  }, [formData.session_count])

  // 総計を計算
  useEffect(() => {
    const totalDuration = formData.sessions.reduce((total, session) => {
      return total + session.sections.warmup.estimated_duration_minutes +
             session.sections.main.estimated_duration_minutes +
             session.sections.cooldown.estimated_duration_minutes
    }, 0)

    const totalDistance = formData.sessions.reduce((total, session) => {
      return total + session.sections.warmup.estimated_distance_meters +
             session.sections.main.estimated_distance_meters +
             session.sections.cooldown.estimated_distance_meters
    }, 0)

    updateFormData({
      ...formData,
      total_estimated_duration_minutes: totalDuration,
      total_estimated_distance_meters: totalDistance
    })
  }, [formData.sessions])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    console.log('🔍 バリデーション開始:', {
      date: formData.date,
      session_count: formData.session_count,
      sessions: formData.sessions.map((session, index) => ({
        sessionIndex: index,
        sections: Object.entries(session.sections).map(([sectionType, section]) => ({
          sectionType,
          stepCount: section.steps.length,
          steps: section.steps.map(step => ({ id: step.id, type: step.type }))
        }))
      }))
    })

    if (!formData.date) {
      newErrors.date = '日付を入力してください'
    }

    if (!formData.session_count || formData.session_count < 1 || formData.session_count > 3) {
      newErrors.session_count = '部練数を選択してください'
    }

    // 各セッションのバリデーション
    formData.sessions.forEach((session, sessionIndex) => {
      const hasSteps = Object.values(session.sections).some(section => section.steps.length > 0)
      console.log(`🔍 セッション${sessionIndex + 1}のバリデーション:`, {
        hasSteps,
        sections: Object.entries(session.sections).map(([sectionType, section]) => ({
          sectionType,
          stepCount: section.steps.length
        }))
      })
      if (!hasSteps) {
        newErrors[`session_${sessionIndex}_steps`] = `セッション${sessionIndex + 1}に少なくとも1つのステップを追加してください`
      }
    })

    console.log('🔍 バリデーション結果:', { errors: newErrors, isValid: Object.keys(newErrors).length === 0 })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 フォーム送信開始:', { formData })
    
    // 合計時間のチェック
    const totalTime = calculateTotalTime(formData.sessions)
    if (totalTime > 86400) { // 24時間 = 86400秒
      const hours = Math.floor(totalTime / 3600)
      const minutes = Math.floor((totalTime % 3600) / 60)
      setErrors(prev => ({ 
        ...prev, 
        sessions: `合計時間が24時間を超えています（${hours}時間${minutes}分）。練習時間を調整してください。` 
      }))
      return
    }
    
    if (validateForm()) {
      console.log('✅ バリデーション成功、データ送信中:', { formData })
      // Web最適化: 送信成功時に下書きをクリア
      clearFormData()
      onSubmit(formData)
    } else {
      console.log('❌ バリデーション失敗:', { errors })
    }
  }

  const handleBasicInfoChange = (field: keyof Pick<DetailedWorkoutData, 'date' | 'session_count' | 'workout_name' | 'notes' | 'avg_heart_rate' | 'max_heart_rate'>, value: any) => {
    updateFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSessionTimePeriodChange = (sessionIndex: number, timePeriod: 'morning' | 'morning_afternoon' | 'afternoon' | 'evening' | 'other') => {
    updateFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, index) => 
        index === sessionIndex ? { ...session, time_period: timePeriod } : session
      )
    }))
  }


  const handleSectionHeartRateChange = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', field: 'avg_heart_rate' | 'max_heart_rate', value: number | undefined) => {
    updateFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, index) => 
        index === sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [sectionType]: {
                  ...session.sections[sectionType],
                  [field]: value
                }
              }
            }
          : session
      )
    }))
  }

  // CSVインポート関連のハンドラー
  const handleCSVImportClick = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepType?: string) => {
    setCsvImportTarget({ sessionIndex, sectionType, stepType })
    setShowCSVImport(true)
  }

  const handleCSVImport = (stepData: Partial<DetailedWorkoutStep>) => {
    if (!csvImportTarget) return

    const newStep: DetailedWorkoutStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: stepData.type || 'jogging',
      name: stepData.name || '',
      description: stepData.description || '',
      distance_meters: stepData.distance_meters,
      duration_seconds: stepData.duration_seconds,
      intensity_rpe: stepData.intensity_rpe || 5,
      heart_rate_zone: stepData.heart_rate_zone || '',
      target_pace: stepData.target_pace || '',
      notes: stepData.notes || '',
      focus_points: stepData.focus_points || []
    }

    updateFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, index) => 
        index === csvImportTarget.sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [csvImportTarget.sectionType]: {
                  ...session.sections[csvImportTarget.sectionType],
                  steps: [...session.sections[csvImportTarget.sectionType].steps, newStep]
                }
              }
            }
          : session
      )
    }))

    setShowCSVImport(false)
    setCsvImportTarget(null)
  }

  const addStep = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown') => {
    // 練習種別選択モーダルを表示
    setWorkoutTypeSelectorTarget({ sessionIndex, sectionType })
    setShowWorkoutTypeSelector(true)
  }

  const handleWorkoutTypeSelect = async (workoutType: string) => {
    if (!workoutTypeSelectorTarget) return

    const { sessionIndex, sectionType } = workoutTypeSelectorTarget
    
    // カスタムテンプレートの場合
    if (workoutType.startsWith('template_')) {
      const templateId = workoutType.replace('template_', '')
      try {
        const template = await apiClient.getCustomWorkoutTemplateNew(templateId)
        console.log('🔍 テンプレート取得結果:', template)
        
        if (template && Array.isArray(template.steps)) {
          // テンプレートのステップを適用
          const templateSteps = template.steps.map((step: any, index: number) => {
            // ステップがオブジェクトでない場合はデフォルト値を使用
            if (!step || typeof step !== 'object') {
              return {
                id: `step_${Date.now()}_${index}`,
                type: 'run',
                duration: 300,
                distance: undefined,
                pace: undefined,
                heartRate: undefined,
                intensity: 5,
                notes: '',
                estimatedTime: 300,
                estimatedDistance: undefined,
                restFormat: undefined,
                recoveryFormat: undefined
              }
            }
            
            return {
              id: `step_${Date.now()}_${index}`,
              type: step.type || 'run',
              duration: step.duration_seconds || step.duration || 300,
              distance: step.distance_meters || step.distance || undefined,
              pace: step.target_pace || step.pace || undefined,
              heartRate: step.heartRate || undefined,
              intensity: step.intensity_rpe || step.intensity || 5,
              notes: step.notes || '',
              estimatedTime: step.duration_seconds || step.duration || 300,
              estimatedDistance: step.distance_meters || step.distance || undefined,
              restFormat: step.restFormat || undefined,
              recoveryFormat: step.recoveryFormat || undefined
            }
          })
          
          updateFormData(prev => {
            const newFormData = {
              ...prev,
              sessions: prev.sessions.map((session, index) => 
                index === sessionIndex 
                  ? {
                      ...session,
                      sections: {
                        ...session.sections,
                        [sectionType]: {
                          ...session.sections[sectionType],
                          steps: [...session.sections[sectionType].steps, ...templateSteps]
                        }
                      }
                    }
                  : session
              )
            }
            return newFormData
          })
        }
      } catch (error) {
        console.error('テンプレート適用エラー:', error)
        alert('テンプレートの適用に失敗しました')
      }
    } else {
      // 標準練習種別の場合
      const newStep = createNewStep(workoutType as any)
      
      console.log('🔍 ステップ追加開始:', {
        sessionIndex,
        sectionType,
        workoutType,
        newStep: { id: newStep.id, type: newStep.type }
      })
      
      updateFormData(prev => {
        const newFormData = {
          ...prev,
          sessions: prev.sessions.map((session, index) => 
            index === sessionIndex 
              ? {
                  ...session,
                  sections: {
                    ...session.sections,
                    [sectionType]: {
                      ...session.sections[sectionType],
                      steps: [...session.sections[sectionType].steps, newStep]
                    }
                  }
                }
              : session
          )
        }
        
        console.log('🔍 ステップ追加後の状態:', {
          sessionIndex,
          sectionType,
          newStepCount: newFormData.sessions[sessionIndex].sections[sectionType].steps.length,
          allSteps: newFormData.sessions[sessionIndex].sections[sectionType].steps.map(step => ({ id: step.id, type: step.type }))
        })
        
        return newFormData
      })
    }

    setShowWorkoutTypeSelector(false)
    setWorkoutTypeSelectorTarget(null)
  }

  const removeStep = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string) => {
    updateFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, index) => 
        index === sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [sectionType]: {
                  ...session.sections[sectionType],
                  steps: session.sections[sectionType].steps.filter(step => step.id !== stepId)
                }
              }
            }
          : session
      )
    }))
  }

  const updateStep = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string, updates: Partial<DetailedWorkoutStep>) => {
    updateFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, index) => 
        index === sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [sectionType]: {
                  ...session.sections[sectionType],
                  steps: session.sections[sectionType].steps.map(step => 
                    step.id === stepId ? { ...step, ...updates } : step
                  )
                }
              }
            }
          : session
      )
    }))
  }

  const moveStep = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string, direction: 'up' | 'down') => {
    updateFormData(prev => {
      const session = prev.sessions[sessionIndex]
      const steps = session.sections[sectionType].steps
      const currentIndex = steps.findIndex(step => step.id === stepId)
      
      if (currentIndex === -1) return prev
      
      let newIndex: number
      if (direction === 'up') {
        newIndex = Math.max(0, currentIndex - 1)
      } else {
        newIndex = Math.min(steps.length - 1, currentIndex + 1)
      }
      
      if (newIndex === currentIndex) return prev
      
      const newSteps = [...steps]
      const [movedStep] = newSteps.splice(currentIndex, 1)
      newSteps.splice(newIndex, 0, movedStep)
      
      return {
        ...prev,
        sessions: prev.sessions.map((session, index) => 
          index === sessionIndex 
            ? {
                ...session,
                sections: {
                  ...session.sections,
                  [sectionType]: {
                    ...session.sections[sectionType],
                    steps: newSteps
                  }
                }
              }
            : session
        )
      }
    })
  }

  const editStep = (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string) => {
    const session = formData.sessions[sessionIndex]
    const step = session.sections[sectionType].steps.find(s => s.id === stepId)
    
    if (step) {
      setEditingStep({ step, sessionIndex, sectionType })
      setShowStepEditor(true)
    }
  }

  console.log('DetailedWorkoutForm return開始', { formData })

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">詳細練習記録作成</h2>
          <p className="text-gray-600 mt-1">本格的な競技レベルの練習記録</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* 基本情報セクション */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 日付 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date && isValidDate(formData.date) ? formData.date : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || isValidDate(value)) {
                      handleBasicInfoChange('date', value)
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* 部練数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部練数 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  {[1, 2, 3].map(count => (
                    <label key={count} className="flex items-center">
                <input
                        type="radio"
                        name="session_count"
                        value={count}
                        checked={formData.session_count === count}
                        onChange={(e) => {
                          const value = e.target.value
                          const sessionCount = value === '' ? 1 : parseInt(value)
                          handleBasicInfoChange('session_count', sessionCount)
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{count}部練</span>
                </label>
                  ))}
              </div>
                {errors.session_count && <p className="mt-1 text-sm text-red-600">{errors.session_count}</p>}
              </div>

              {/* ワークアウト名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ワークアウト名
                </label>
                <SmartInput
                  value={formData.workout_name}
                  onChange={(value) => handleBasicInfoChange('workout_name', value)}
                  suggestions={[
                    '朝練インターバルメニュー',
                    '午後テンポ走',
                    'ロング走',
                    '坂道練習',
                    '流し練習',
                    'クールダウンラン'
                  ]}
                  placeholder="例: 朝練インターバルメニュー"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
              </div>

          {/* セッション配列 */}
          <div className="space-y-6">
            {formData.sessions.map((session, sessionIndex) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    セッション{session.session_number}
                  </h3>
                  <div className="flex space-x-2">
                    {(['morning', 'morning_afternoon', 'afternoon', 'evening', 'other'] as const).map(period => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => handleSessionTimePeriodChange(sessionIndex, period)}
                        className={`px-4 py-2 text-sm rounded-md font-medium ${
                          session.time_period === period
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {TIME_PERIOD_LABELS[period]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 縦並び構造 */}
                <div className="space-y-4">
                  {(['warmup', 'main', 'cooldown'] as const).map(sectionType => (
                    <div key={sectionType} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {sectionType === 'warmup' ? '🔥' : 
                             sectionType === 'main' ? '💪' : '🧘'}
                          </span>
                          <h4 className="font-medium text-gray-800">
                            {sectionType === 'warmup' ? 'ウォームアップ' : 
                             sectionType === 'main' ? 'メイン練習' : 'クールダウン'}
                          </h4>
                        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => addStep(sessionIndex, sectionType)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            + 追加
          </button>
          <button
            type="button"
            onClick={() => handleCSVImportClick(sessionIndex, sectionType)}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            📊 CSV
          </button>
        </div>
              </div>

                      {/* セクション別心拍数入力 */}
                      <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">心拍数データ</h5>
                        <div className="grid grid-cols-2 gap-3">
              <div>
                            <label className="block text-xs text-gray-600 mb-1">平均心拍数</label>
                <input
                  type="number"
                              value={session.sections[sectionType].avg_heart_rate || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                const heartRate = value === '' ? undefined : parseInt(value)
                                handleSectionHeartRateChange(sessionIndex, sectionType, 'avg_heart_rate', heartRate)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="例: 150"
                            />
              </div>
              <div>
                            <label className="block text-xs text-gray-600 mb-1">最大心拍数</label>
                <input
                  type="number"
                              value={session.sections[sectionType].max_heart_rate || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                const heartRate = value === '' ? undefined : parseInt(value)
                                handleSectionHeartRateChange(sessionIndex, sectionType, 'max_heart_rate', heartRate)
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="例: 180"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {session.sections[sectionType].steps.length === 0 ? (
                          <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-gray-500 text-sm">「+ 追加」をクリックして開始</div>
                          </div>
                        ) : (
                          session.sections[sectionType].steps.map((step, stepIndex) => (
                            <div key={step.id} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {getWorkoutTypeLabel(step.type) || `ステップ${stepIndex + 1}`}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    {step.distance_meters && `${(step.distance_meters / 1000).toFixed(1)}km`}
                                    {step.distance_meters && step.duration_seconds && ' • '}
                                    {step.duration_seconds && `${Math.floor(step.duration_seconds / 60)}分`}
                                    {step.target_pace && ` • ${step.target_pace}/km`}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    type="button"
                                    onClick={() => editStep(sessionIndex, sectionType, step.id)}
                                    className="text-gray-400 hover:text-blue-600 text-sm px-2 py-1 rounded transition-colors"
                                  >
                                    編集
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeStep(sessionIndex, sectionType, step.id)}
                                    className="text-gray-400 hover:text-red-600 text-sm px-2 py-1 rounded transition-colors"
                                  >
                                    削除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {errors[`session_${sessionIndex}_steps`] && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors[`session_${sessionIndex}_steps`]}
                  </p>
              )}
              </div>
            ))}
            </div>

          {/* 全体メモ */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">全体メモ</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                練習の感想や気づき
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleBasicInfoChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="練習の感想や気づきを記録..."
              />
            </div>
          </div>

          {/* プレビュー */}
          <WorkoutPreview 
            workoutData={formData} 
            onMoveStep={moveStep}
            onEditStep={editStep}
            onRemoveStep={removeStep}
          />

        {/* ボタン */}
          <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
              {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
      </div>


      {/* ステップエディターモーダル */}
      {showStepEditor && editingStep && (
        <WorkoutStepEditorWithResults
          step={editingStep.step}
          onUpdate={(updates) => {
            updateStep(editingStep.sessionIndex, editingStep.sectionType, editingStep.step.id, updates)
            setShowStepEditor(false)
            setEditingStep(null)
          }}
          onClose={() => {
            setShowStepEditor(false)
            setEditingStep(null)
          }}
        />
      )}

      {/* CSVインポートモーダル */}
      {showCSVImport && csvImportTarget && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => {
            setShowCSVImport(false)
            setCsvImportTarget(null)
          }}
          onImport={handleCSVImport}
          sectionType={csvImportTarget.sectionType}
          stepType={csvImportTarget.stepType}
        />
      )}

      {/* 練習種別選択モーダル */}
      {showWorkoutTypeSelector && workoutTypeSelectorTarget && (
        <WorkoutTypeSelectorModal
          isOpen={showWorkoutTypeSelector}
          onClose={() => {
            setShowWorkoutTypeSelector(false)
            setWorkoutTypeSelectorTarget(null)
          }}
          onSelect={handleWorkoutTypeSelect}
          sectionType={workoutTypeSelectorTarget.sectionType}
        />
      )}
    </div>
  )
}

// 練習種別選択モーダルコンポーネント
interface WorkoutTypeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (workoutType: string) => void
  sectionType: 'warmup' | 'main' | 'cooldown'
}

function WorkoutTypeSelectorModal({ isOpen, onClose, onSelect, sectionType }: WorkoutTypeSelectorModalProps) {
  const [customTemplates, setCustomTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates()
    }
  }, [isOpen, sectionType])

  const loadCustomTemplates = async () => {
    try {
      setLoadingTemplates(true)
      console.log('🔍 カスタムテンプレート読み込み開始:', sectionType)
      
      // セクションテンプレートを取得
      const response = await apiClient.getCustomWorkoutTemplates('section')
      console.log('🔍 APIレスポンス:', response)
      
      // レスポンスが配列でない場合は空配列にフォールバック
      const templates = Array.isArray(response) ? response : (response?.data || [])
      console.log('🔍 取得したテンプレート:', templates)
      
      // セクションタイプに合致するテンプレートのみをフィルタリング
      const filteredTemplates = templates.filter(template => {
        // テンプレートがオブジェクトでない場合はスキップ
        if (!template || typeof template !== 'object') {
          return false
        }
        
        // セクションタイプが完全に一致するもののみを表示
        const matches = template.section_type === sectionType
        console.log('🔍 テンプレートフィルタリング:', { 
          templateName: template.name, 
          templateSectionType: template.section_type, 
          currentSectionType: sectionType, 
          matches 
        })
        return matches
      })
      
      console.log('🔍 フィルタリング後のテンプレート:', filteredTemplates)
      console.log('🔍 カスタムテンプレート数:', filteredTemplates.length)
      setCustomTemplates(filteredTemplates)
    } catch (error) {
      console.error('カスタムテンプレートの読み込みエラー:', error)
      console.log('🔍 エラー詳細:', error)
      setCustomTemplates([])
    } finally {
      setLoadingTemplates(false)
    }
  }

  if (!isOpen) return null

  const getWorkoutTypeOptions = () => {
    const options = {
      warmup: [
        { value: 'jogging', label: 'ジョギング', description: '楽なペースでのランニング', icon: '🏃‍♂️', recommended: true },
        { value: 'walking', label: 'ウォーキング', description: '歩行でのウォームアップ', icon: '🚶‍♂️', recommended: true },
        { value: 'dynamic_stretch', label: '動的ストレッチ', description: '動きながらのストレッチ', icon: '🤸‍♀️', recommended: true },
        { value: 'flow_run', label: '流し', description: '短距離の加速走', icon: '💨', recommended: false }
      ],
      main: [
        { value: 'easy_run', label: 'イージーラン', description: '楽なペースでのジョギング', icon: '🏃‍♂️', recommended: true },
        { value: 'long_run', label: 'ロング走', description: '長距離・長時間の持久走', icon: '🏃‍♂️', recommended: true },
        { value: 'medium_run', label: 'ミディアムラン', description: '中程度の強度でのランニング', icon: '🏃‍♂️', recommended: false },
        { value: 'tempo_run', label: 'テンポ走', description: '閾値ペースでの持続走', icon: '⚡', recommended: true },
        { value: 'interval_run', label: 'インターバル走', description: '高強度と休息を繰り返す', icon: '🔥', recommended: true },
        { value: 'repetition', label: 'レペティション', description: '完全回復での高強度走', icon: '💨', recommended: false },
        { value: 'build_up', label: 'ビルドアップ走', description: '段階的にペースを上げる', icon: '📈', recommended: false },
        { value: 'fartlek', label: 'ファルトレク', description: '自由な強度変化走', icon: '🎯', recommended: false },
        { value: 'pace_change', label: '変化走', description: '複数ペースの組み合わせ', icon: '🔄', recommended: false },
        { value: 'hill_run', label: '坂道練習', description: '上り坂・下り坂での練習', icon: '⛰️', recommended: false },
        { value: 'stair_run', label: '階段練習', description: '階段を使った強度練習', icon: '🪜', recommended: false },
        { value: 'sand_run', label: '砂浜・芝生走', description: '特殊な路面での練習', icon: '🏖️', recommended: false }
      ],
      cooldown: [
        { value: 'jogging', label: 'ジョギング', description: '楽なペースでのランニング', icon: '🏃‍♂️', recommended: true },
        { value: 'walking', label: 'ウォーキング', description: '歩行でのクールダウン', icon: '🚶‍♂️', recommended: true },
        { value: 'dynamic_stretch', label: '動的ストレッチ', description: '動きながらのストレッチ', icon: '🤸‍♀️', recommended: true },
        { value: 'cooldown', label: 'クールダウン', description: '整理運動', icon: '🧘‍♂️', recommended: true }
      ]
    }
    return options[sectionType] || []
  }

  const sectionTitle = {
    warmup: 'ウォームアップ',
    main: 'メイン練習',
    cooldown: 'クールダウン'
  }

  const options = getWorkoutTypeOptions()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] my-8">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {sectionTitle[sectionType]}の練習種別を選択
            </h3>
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* ローディング状態 */}
          {loadingTemplates && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>テンプレートを読み込み中...</span>
              </div>
            </div>
          )}

          {/* カスタムテンプレートセクション */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              作成したテンプレート
            </h4>
            
            {customTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelect(`template_${template.id}`)}
                    className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full font-medium">
                            テンプレート
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description || 'カスタムテンプレート'}
                        </p>
                        {template.steps && template.steps.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {template.steps.length}個のステップ
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">
                  {sectionType === 'main' ? 'メイン練習' : sectionType === 'warmup' ? 'ウォームアップ' : 'クールダウン'}用のテンプレートがありません
                </p>
                <p className="text-xs mt-1">
                  カスタムワークアウトページでテンプレートを作成してください
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>デバッグ情報:</p>
                  <p>セクションタイプ: {sectionType}</p>
                  <p>テンプレート数: {customTemplates.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* 標準練習種別セクション */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏃‍♂️</span>
              標準練習種別
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSelect(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    option.recommended
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        {option.recommended && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full font-medium">
                            おすすめ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
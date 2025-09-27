'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { WorkoutStep, WorkoutStepType, RepeatBlock } from '@/types/customWorkout'
import { WorkoutStepCard } from './WorkoutStepCard'
import { RepeatBlockCard } from './RepeatBlockCard'
import { AddStepButton } from './AddStepButton'
import { AddRepeatButton } from './AddRepeatButton'
import { WorkoutSummary } from './WorkoutSummary'
import { StepTypeSelector } from './StepTypeSelector'
import { StepDetailForm } from './StepDetailForm'
import { SectionTemplateSelector } from './SectionTemplateSelector'
import { 
  parseTimeToSeconds, 
  parsePaceToSeconds, 
  calculatePaceFromTime, 
  calculateTimeFromPace,
  createDefaultStepData 
} from '@/lib/workoutUtils'

interface CustomWorkoutBuilderProps {
  initialSteps?: (WorkoutStep | RepeatBlock)[]
  initialWorkoutName?: string
  initialWorkoutMemo?: string
  onStepsChange: (steps: (WorkoutStep | RepeatBlock)[]) => void
  onSessionsChange?: (sessions: any[]) => void
  onSave: (workoutName: string, workoutMemo: string) => void
  onCancel: () => void
  isSubmitting?: boolean
  templateType?: 'daily' | 'set' | 'section'
  isEditMode?: boolean
  editingTemplate?: any
}

export function CustomWorkoutBuilder({
  initialSteps = [],
  initialWorkoutName = '',
  initialWorkoutMemo = '',
  onStepsChange,
  onSessionsChange,
  onSave,
  onCancel,
  isSubmitting = false,
  templateType = 'daily',
  isEditMode = false,
  editingTemplate
}: CustomWorkoutBuilderProps) {
  const [steps, setSteps] = useState<(WorkoutStep | RepeatBlock)[]>(initialSteps)
  const [showAddStep, setShowAddStep] = useState(false)
  const [showAddRepeat, setShowAddRepeat] = useState(false)
  const [workoutName, setWorkoutName] = useState(
    isEditMode && editingTemplate ? editingTemplate.name : initialWorkoutName
  )
  const [workoutMemo, setWorkoutMemo] = useState(
    isEditMode && editingTemplate ? editingTemplate.description : initialWorkoutMemo
  )
  const [sectionType, setSectionType] = useState<'warmup' | 'main' | 'cooldown'>('warmup')
  const [showMemoInput, setShowMemoInput] = useState(false)
  const [currentSection, setCurrentSection] = useState<{ sessionIndex: number; sectionType: 'warmup' | 'main' | 'cooldown' } | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)
  const [selectedStepType, setSelectedStepType] = useState<WorkoutStepType | null>(null)
  const [showSectionTemplateSelector, setShowSectionTemplateSelector] = useState(false)
  const [sectionTemplateTarget, setSectionTemplateTarget] = useState<{ sessionIndex: number; sectionType: 'warmup' | 'main' | 'cooldown' } | null>(null)
  
  // 一日用テンプレート用の状態
  const [sessionCount, setSessionCount] = useState(1)
  const [sessions, setSessions] = useState([
    {
      id: 'session_1',
      sessionNumber: 1,
      timePeriod: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night' | 'other',
      sections: {
        warmup: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined },
        main: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined },
        cooldown: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined }
      }
    }
  ])

  // 部練数を変更する関数
  const handleSessionCountChange = useCallback((count: number) => {
    setSessionCount(count)
    const newSessions = []
    for (let i = 1; i <= count; i++) {
      newSessions.push({
        id: `session_${i}`,
        sessionNumber: i,
        timePeriod: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night' | 'other',
        sections: {
          warmup: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined },
          main: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined },
          cooldown: { steps: [], avg_heart_rate: undefined, max_heart_rate: undefined }
        }
      })
    }
    setSessions(newSessions)
    onSessionsChange?.(newSessions)
  }, [onSessionsChange])

  // セッションの時間帯を変更する関数
  const handleSessionTimePeriodChange = useCallback((sessionIndex: number, timePeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'other') => {
    setSessions(prev => {
      const newSessions = prev.map((session, index) => 
        index === sessionIndex 
          ? { ...session, timePeriod }
          : session
      )
      onSessionsChange?.(newSessions)
      return newSessions
    })
  }, [onSessionsChange])

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const newSteps = Array.from(steps)
    const [reorderedItem] = newSteps.splice(result.source.index, 1)
    newSteps.splice(result.destination.index, 0, reorderedItem)

    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const addStep = useCallback((stepType: WorkoutStepType) => {
    const duration = stepType === 'run' ? 1000 : 300
    const newStep: WorkoutStep = {
      id: `step_${Date.now()}`,
      type: stepType,
      duration: duration,
      distance: stepType === 'run' ? 1000 : undefined,
      intensity: 5,
      notes: '',
      estimatedTime: duration // durationと同じ値をestimatedTimeとして設定
    }

    const newSteps = [...steps, newStep]
    setSteps(newSteps)
    onStepsChange(newSteps)
    setShowAddStep(false)
  }, [steps, onStepsChange])

  const addRepeatBlock = useCallback((repeatCount: number) => {
    const newRepeatBlock: RepeatBlock = {
      id: `repeat_${Date.now()}`,
      type: 'repeat',
      repeatCount,
      steps: []
    }

    const newSteps = [...steps, newRepeatBlock]
    setSteps(newSteps)
    onStepsChange(newSteps)
    setShowAddRepeat(false)
  }, [steps, onStepsChange])

  const updateStep = useCallback((stepId: string, updates: Partial<WorkoutStep>) => {
    const newSteps = steps.map(step => {
      if (step.id === stepId && step.type !== 'repeat') {
        return { ...step, ...updates }
      }
      return step
    })
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const updateRepeatBlock = useCallback((blockId: string, updates: Partial<RepeatBlock>) => {
    const newSteps = steps.map(step => {
      if (step.id === blockId && step.type === 'repeat') {
        return { ...step, ...updates }
      }
      return step
    })
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const deleteStep = useCallback((stepId: string) => {
    const newSteps = steps.filter(step => step.id !== stepId)
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const addStepToRepeatBlock = useCallback((blockId: string, stepType: WorkoutStepType) => {
    console.log('addStepToRepeatBlock called:', blockId, stepType)
    const duration = stepType === 'run' ? 1000 : 300
    const newStep: WorkoutStep = {
      id: `step_${Date.now()}`,
      type: stepType,
      duration: duration,
      distance: stepType === 'run' ? 1000 : undefined,
      intensity: 5,
      notes: '',
      estimatedTime: duration // durationと同じ値をestimatedTimeとして設定
    }

    const newSteps = steps.map(step => {
      if (step.id === blockId && step.type === 'repeat') {
        console.log('Found repeat block, adding step:', newStep)
        return {
          ...step,
          steps: [...step.steps, newStep]
        }
      }
      return step
    })
    console.log('New steps:', newSteps)
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const updateStepInRepeatBlock = useCallback((blockId: string, stepId: string, updates: Partial<WorkoutStep>) => {
    const newSteps = steps.map(step => {
      if (step.id === blockId && step.type === 'repeat') {
        return {
          ...step,
          steps: step.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
        }
      }
      return step
    })
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  const deleteStepFromRepeatBlock = useCallback((blockId: string, stepId: string) => {
    const newSteps = steps.map(step => {
      if (step.id === blockId && step.type === 'repeat') {
        return {
          ...step,
          steps: step.steps.filter(s => s.id !== stepId)
        }
      }
      return step
    })
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  // 繰り返しブロック内のステップ移動
  const moveStepInRepeatBlock = useCallback((blockId: string, stepId: string, direction: 'up' | 'down') => {
    const newSteps = steps.map(step => {
      if (step.id === blockId && step.type === 'repeat') {
        const blockSteps = step.steps
        const currentIndex = blockSteps.findIndex(s => s.id === stepId)
        
        if (currentIndex === -1) return step
        
        let newIndex: number
        if (direction === 'up') {
          newIndex = Math.max(0, currentIndex - 1)
        } else {
          newIndex = Math.min(blockSteps.length - 1, currentIndex + 1)
        }
        
        if (newIndex === currentIndex) return step
        
        const newBlockSteps = [...blockSteps]
        const [movedStep] = newBlockSteps.splice(currentIndex, 1)
        newBlockSteps.splice(newIndex, 0, movedStep)
        
        return {
          ...step,
          steps: newBlockSteps
        }
      }
      return step
    })
    setSteps(newSteps)
    onStepsChange(newSteps)
  }, [steps, onStepsChange])

  // セクション別のステップ追加
  const addStepToSection = useCallback((sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', step: WorkoutStep) => {
    console.log('🔍 addStepToSection called:', { sessionIndex, sectionType, step })
    setSessions(prev => {
      console.log('🔍 Current sessions before update:', prev)
      const newSessions = prev.map((session, index) => 
        index === sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [sectionType]: {
                  ...session.sections[sectionType],
                  steps: [...session.sections[sectionType].steps, step]
                }
              }
            }
          : session
      )
      console.log('🔍 New sessions after update:', newSessions)
      onSessionsChange?.(newSessions)
      return newSessions
    })
  }, [onSessionsChange])

  // セクション別のステップ更新
  const updateStepInSection = useCallback((sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string, updates: Partial<WorkoutStep>) => {
    console.log('🔍 updateStepInSection called:', { sessionIndex, sectionType, stepId, updates })
    setSessions(prev => {
      const newSessions = prev.map((session, index) => 
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
      console.log('🔍 Updated sessions:', newSessions)
      onSessionsChange?.(newSessions)
      return newSessions
    })
  }, [onSessionsChange])

  // セクション別のステップ削除
  const deleteStepFromSection = useCallback((sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string) => {
    setSessions(prev => {
      const newSessions = prev.map((session, index) => 
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
      onSessionsChange?.(newSessions)
      return newSessions
    })
  }, [onSessionsChange])

  // セクション別のステップ移動
  const moveStepInSection = useCallback((sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepIndex: number, direction: 'up' | 'down') => {
    setSessions(prev => {
      const newSessions = prev.map((session, index) => 
        index === sessionIndex 
          ? {
              ...session,
              sections: {
                ...session.sections,
                [sectionType]: {
                  ...session.sections[sectionType],
                  steps: (() => {
                    const steps = [...session.sections[sectionType].steps]
                    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
                    
                    if (newIndex >= 0 && newIndex < steps.length) {
                      [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]]
                    }
                    
                    return steps
                  })()
                }
              }
            }
          : session
      )
      onSessionsChange?.(newSessions)
      return newSessions
    })
  }, [onSessionsChange])

  const handleStepTypeSelect = useCallback((stepType: WorkoutStepType) => {
    console.log('StepTypeSelector: Adding step type:', stepType, 'to section:', currentSection)
    console.log('🔍 Before setting form state:', { currentSection, stepType })
    setSelectedStepType(stepType)
    setShowAddStep(false)
    setShowStepForm(true)
    console.log('🔍 After setting form state - currentSection should still be:', currentSection)
    // currentSection は既に設定されているので、そのまま保持
  }, [currentSection])

  const handleStepSave = useCallback((stepData: any) => {
    console.log('🔍 handleStepSave called:', { stepData, currentSection })
    console.log('🔍 Current state:', { showStepForm, selectedStepType, currentSection })
    
    const newStep: WorkoutStep = {
      id: `step_${Date.now()}`,
      name: stepData.name || stepData.type || 'run', // ステップ名を設定
      ...stepData
    }

    if (currentSection) {
      // セクション固有のステップ追加
      console.log('🔍 Adding step to section:', { newStep, currentSection })
      addStepToSection(currentSection.sessionIndex, currentSection.sectionType, newStep)
    } else {
      // 一般ステップ追加
      console.log('🔍 Adding step to general steps:', newStep)
      const newSteps = [...steps, newStep]
      setSteps(newSteps)
      onStepsChange(newSteps)
    }
    
    setShowStepForm(false)
    setSelectedStepType(null)
    setCurrentSection(null)
  }, [currentSection, addStepToSection, steps, onStepsChange])

  // セクションテンプレート選択のハンドラー
  const handleSectionTemplateClick = useCallback((sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown') => {
    setSectionTemplateTarget({ sessionIndex, sectionType })
    setShowSectionTemplateSelector(true)
  }, [])

  const handleSectionTemplateSelect = useCallback((template: any) => {
    if (!sectionTemplateTarget) return

    const { sessionIndex, sectionType } = sectionTemplateTarget
    
    // テンプレートのステップを現在のセクションに追加
    const templateSteps = template.steps.map((step: any, index: number) => ({
      id: `step_${Date.now()}_${index}`,
      type: step.type || 'run',
      name: step.name || template.name || step.type || 'run', // テンプレート名を優先
      duration: step.duration || 300,
      distance: step.distance || undefined,
      pace: step.pace || undefined,
      heartRate: step.heartRate || undefined,
      intensity: step.intensity || 5,
      notes: step.notes || '',
      estimatedTime: step.duration || 300,
      estimatedDistance: step.distance || undefined,
      // 休息・回復専用フィールド
      restFormat: step.restFormat || undefined,
      recoveryFormat: step.recoveryFormat || undefined
    }))

    setSessions(prev => {
      console.log('🔍 Applying template steps:', { templateSteps, sessionIndex, sectionType })
      const newSessions = prev.map((session, index) => 
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
      console.log('🔍 New sessions after template application:', newSessions)
      onSessionsChange?.(newSessions)
      return newSessions
    })

    setShowSectionTemplateSelector(false)
    setSectionTemplateTarget(null)
  }, [sectionTemplateTarget, onSessionsChange])
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
          >
            キャンセル
          </button>
          <h1 className="text-lg font-semibold text-gray-900">ランワークアウト</h1>
          <button
            onClick={() => {
              if (!workoutName.trim()) {
                alert('ワークアウト名を入力してください')
                return
              }
              
              // 一日用テンプレート・セットテンプレートの場合はsessionsをチェック
              if (templateType === 'daily' || templateType === 'set') {
                const hasSteps = sessions.some(session => 
                  Object.values(session.sections).some(section => section.steps.length > 0)
                )
                if (!hasSteps) {
                  alert('少なくとも1つのセクションにステップを追加してください')
                  return
                }
              } else {
                // セクション用テンプレートの場合はstepsをチェック
                if (steps.length === 0) {
                  alert('少なくとも1つのステップを追加してください')
                  return
                }
              }
              
              onSave(workoutName.trim(), workoutMemo.trim())
            }}
            disabled={isSubmitting}
            className="text-blue-600 text-sm font-medium disabled:opacity-50 hover:text-blue-700 transition-colors"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* 一日用テンプレート・セットテンプレートの場合は新しいUI */}
        {(templateType === 'daily' || templateType === 'set') ? (
          <>
            {/* ワークアウト情報 */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💾 ワークアウト情報</h2>
              
              {/* テンプレートタイプ説明 */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">
                    {templateType === 'daily' && '🏃‍♂️'}
                    {templateType === 'set' && '🎯'}
                  </span>
                  <span className="font-medium text-blue-900">
                    {templateType === 'daily' && '一日用テンプレート'}
                    {templateType === 'set' && 'セットテンプレート'}
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {templateType === 'daily' && '一日の練習メニュー（ウォームアップ・メイン・クールダウン）を作成します。練習メニュー選択で使用されます。'}
                  {templateType === 'set' && 'アップ・メイン・ダウンをセットで登録するテンプレートを作成します。セクション内で一括適用できます。'}
                </p>
              </div>
              
              {/* ワークアウト名 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ワークアウト名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder={
                    templateType === 'daily' ? '例: 朝練インターバルメニュー' :
                    '例: 基本インターバルセット'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 メモ
                </label>
                <textarea
                  value={workoutMemo}
                  onChange={(e) => setWorkoutMemo(e.target.value)}
                  placeholder={
                    templateType === 'daily' ? '例: 400m×6本 基本メニュー' :
                    '例: ジョグ→400m×6本→ジョグ'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* 部練数選択（一日用テンプレートのみ） */}
            {templateType === 'daily' && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 部練数選択</h2>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4].map(count => (
                    <button
                      key={count}
                      onClick={() => handleSessionCountChange(count)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        sessionCount === count
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {count}部練
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 全体サマリー */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 全体サマリー</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(sessions.reduce((total, session) => 
                      total + session.sections.warmup.steps.reduce((sum, step) => sum + (step.duration || 0), 0) +
                      session.sections.main.steps.reduce((sum, step) => sum + (step.duration || 0), 0) +
                      session.sections.cooldown.steps.reduce((sum, step) => sum + (step.duration || 0), 0), 0
                    ) / 60)}
                  </div>
                  <div className="text-sm text-blue-700">推定時間(分)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessions.reduce((total, session) => 
                      total + session.sections.warmup.steps.reduce((sum, step) => sum + (step.distance || 0), 0) +
                      session.sections.main.steps.reduce((sum, step) => sum + (step.distance || 0), 0) +
                      session.sections.cooldown.steps.reduce((sum, step) => sum + (step.distance || 0), 0), 0
                    )}
                  </div>
                  <div className="text-sm text-green-700">推定距離(m)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {sessions.length}
                  </div>
                  <div className="text-sm text-purple-700">セッション数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {sessions.reduce((total, session) => 
                      total + session.sections.warmup.steps.length +
                      session.sections.main.steps.length +
                      session.sections.cooldown.steps.length, 0
                    )}
                  </div>
                  <div className="text-sm text-orange-700">総ステップ数</div>
                </div>
              </div>
            </div>

            {/* セッション設定 */}
            <div className="space-y-6">
              {(templateType === 'set' ? sessions.slice(0, 1) : sessions).map((session, sessionIndex) => (
                <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {templateType === 'set' ? 'セット構成' : `セッション${session.sessionNumber}`}
                    </h3>
                    
                    {/* 時間帯選択（一日用テンプレートのみ） */}
                    {templateType === 'daily' && (
                      <select 
                        value={session.timePeriod}
                        onChange={(e) => handleSessionTimePeriodChange(sessionIndex, e.target.value as any)}
                        className="px-3 py-1 border rounded-md text-sm"
                      >
                        <option value="morning">朝練</option>
                        <option value="afternoon">午前練</option>
                        <option value="evening">午後練</option>
                        <option value="night">夜練</option>
                        <option value="other">その他</option>
                      </select>
                    )}
                  </div>

                  {/* 縦並び構造 */}
                  <div className="space-y-4">
                    {(['warmup', 'main', 'cooldown'] as const).map(sectionType => {
                      const sectionStyles = {
                        warmup: "border-orange-200 bg-orange-50",
                        main: "border-blue-200 bg-blue-50", 
                        cooldown: "border-green-200 bg-green-50"
                      };
                      return (
                        <div key={sectionType} className={`border rounded-lg p-4 ${sectionStyles[sectionType]}`}>
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
                                onClick={() => handleSectionTemplateClick(sessionIndex, sectionType)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                              >
                                📋 テンプレート
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentSection({ sessionIndex, sectionType })
                                  setShowAddStep(true)
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                + 追加
                              </button>
                            </div>
                          </div>
                          
                          {/* セクション内のステップ一覧 */}
                          {session.sections[sectionType].steps.length > 0 ? (
                            <div className="space-y-2">
                              {session.sections[sectionType].steps.map((step, stepIndex) => (
                                <div key={step.id} className="bg-white rounded-md p-2 border border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium">
                                        {stepIndex + 1}. {step.name || step.type}
                                      </span>
                                      {step.duration && (
                                        <span className="text-xs text-gray-500">
                                          {Math.floor(step.duration / 60)}分
                                        </span>
                                      )}
                                      {step.distance && (
                                        <span className="text-xs text-gray-500">
                                          {step.distance}m
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => moveStepInSection(sessionIndex, sectionType, stepIndex, 'up')}
                                        disabled={stepIndex === 0}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="上に移動"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        onClick={() => moveStepInSection(sessionIndex, sectionType, stepIndex, 'down')}
                                        disabled={stepIndex === session.sections[sectionType].steps.length - 1}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="下に移動"
                                      >
                                        ↓
                                      </button>
                                      <button
                                        onClick={() => deleteStepFromSection(sessionIndex, sectionType, step.id)}
                                        className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                                        title="削除"
                                      >
                                        削除
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">ステップがありません。上の「+ 追加」ボタンから追加してください。</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* セクション用・個別セクション用の既存UI */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💾 ワークアウト情報</h2>
              
              {/* テンプレートタイプ説明 */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">
                    {templateType === 'section' && '⚡'}
                  </span>
                  <span className="font-medium text-blue-900">
                    {templateType === 'section' && 'セクションテンプレート'}
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {templateType === 'section' && 'ウォームアップ、メイン、クールダウンのいずれかのセクション用テンプレートを作成します。セクションテンプレートで使用されます。'}
                </p>
              </div>
              
              {/* セクションタイプ選択（セクション用の場合のみ） */}
              {templateType === 'section' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    対象のセクション <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="warmup"
                        checked={sectionType === 'warmup'}
                        onChange={(e) => setSectionType(e.target.value as 'warmup' | 'main' | 'cooldown')}
                        className="mr-2"
                      />
                      <span className="text-sm">🔥 ウォームアップ</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="main"
                        checked={sectionType === 'main'}
                        onChange={(e) => setSectionType(e.target.value as 'warmup' | 'main' | 'cooldown')}
                        className="mr-2"
                      />
                      <span className="text-sm">⚡ メイン</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="cooldown"
                        checked={sectionType === 'cooldown'}
                        onChange={(e) => setSectionType(e.target.value as 'warmup' | 'main' | 'cooldown')}
                        className="mr-2"
                      />
                      <span className="text-sm">❄️ クールダウン</span>
                    </label>
                  </div>
                </div>
              )}
          
          {/* ワークアウト名 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ワークアウト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder={
                    templateType === 'section' ? '例: ウォームアップ基本メニュー' :
                    '例: 400mインターバルセット'
                  }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 メモ
            </label>
            <textarea
              value={workoutMemo}
              onChange={(e) => setWorkoutMemo(e.target.value)}
                  placeholder={
                    templateType === 'section' ? '例: ジョグ→ストレッチ→動的ウォームアップ' :
                    '例: 400m×6本 インターバル練習'
                  }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Workout Summary */}
        <WorkoutSummary steps={steps} />

        {/* Steps Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">ステップ</h2>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="workout-steps">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {steps.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                        >
                          {step.type === 'repeat' ? (
                            <RepeatBlockCard
                              block={step}
                              onUpdate={(updates) => updateRepeatBlock(step.id, updates)}
                              onDelete={() => deleteStep(step.id)}
                              onAddStep={(stepType) => addStepToRepeatBlock(step.id, stepType)}
                              onUpdateStep={(stepId, updates) => updateStepInRepeatBlock(step.id, stepId, updates)}
                              onDeleteStep={(stepId) => deleteStepFromRepeatBlock(step.id, stepId)}
                              onMoveStep={(stepId, direction) => moveStepInRepeatBlock(step.id, stepId, direction)}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          ) : (
                            <WorkoutStepCard
                              step={step}
                              onUpdate={(updates) => updateStep(step.id, updates)}
                              onDelete={() => deleteStep(step.id)}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pb-8">
          <AddStepButton
            onClick={() => setShowAddStep(true)}
            showModal={showAddStep}
                onClose={() => {
                  setShowAddStep(false)
                  setCurrentSection(null)
                }}
                onSelectStep={(stepType) => {
                  // ステップタイプを選択してフォームを表示
                  setSelectedStepType(stepType)
                  setShowAddStep(false)
                  setShowStepForm(true)
                  // 一般ステップ追加の場合は currentSection を null のままにする
                }}
          />
          <AddRepeatButton
            onClick={() => setShowAddRepeat(true)}
            showModal={showAddRepeat}
            onClose={() => setShowAddRepeat(false)}
            onSelectRepeat={addRepeatBlock}
          />
        </div>
          </>
        )}

        {/* ステップタイプ選択モーダル（共通コンポーネント使用） */}
        <StepTypeSelector
          isOpen={showAddStep}
          onClose={() => {
            setShowAddStep(false)
            setCurrentSection(null)
          }}
          onSelectStepType={handleStepTypeSelect}
          title={currentSection ? 
            `${sessions[currentSection.sessionIndex].sessionNumber}部練 - ${
              currentSection.sectionType === 'warmup' ? '🔥 ウォームアップ' :
              currentSection.sectionType === 'main' ? '⚡ メイン' : '🧘 クールダウン'
            }にステップを追加` :
            'ステップタイプを選択'
          }
        />

        {/* ステップ詳細入力フォーム（共通コンポーネント使用） */}
        <StepDetailForm
          isOpen={showStepForm}
          onClose={() => {
            setShowStepForm(false)
            setSelectedStepType(null)
            // currentSection は保存時にリセットするので、ここではリセットしない
          }}
          onSave={handleStepSave}
          stepType={selectedStepType}
          title={currentSection ? 
            `${sessions[currentSection.sessionIndex].sessionNumber}部練 - ${
              currentSection.sectionType === 'warmup' ? '🔥 ウォームアップ' :
              currentSection.sectionType === 'main' ? '⚡ メイン' : '🧘 クールダウン'
            }に${selectedStepType === 'run' ? 'ランニング' :
             selectedStepType === 'rest' ? 'レスト' :
             selectedStepType === 'recovery' ? 'リカバリー' :
             selectedStepType === 'warmup' ? 'ウォームアップ' :
             selectedStepType === 'cooldown' ? 'クールダウン' :
             selectedStepType === 'strength' ? '筋力' :
             selectedStepType === 'stretch' ? 'ストレッチ' : 'その他'}を追加` :
            'ステップ詳細を入力'
          }
        />

        {/* セクションテンプレート選択モーダル */}
        {showSectionTemplateSelector && sectionTemplateTarget && (
          <SectionTemplateSelector
            isOpen={showSectionTemplateSelector}
            onClose={() => {
              setShowSectionTemplateSelector(false)
              setSectionTemplateTarget(null)
            }}
            onSelectTemplate={handleSectionTemplateSelect}
            sectionType={sectionTemplateTarget.sectionType}
          />
        )}
      </div>
    </div>
  )
}

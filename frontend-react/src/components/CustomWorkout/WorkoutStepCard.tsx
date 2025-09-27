'use client'

import { useState } from 'react'
import { WorkoutStep, STEP_TYPE_COLORS, STEP_TYPE_LABELS, STEP_TYPE_ICONS, STEP_TYPE_DESCRIPTIONS } from '@/types/customWorkout'
import { StepDetailForm } from './StepDetailForm'

interface WorkoutStepCardProps {
  step: WorkoutStep
  onUpdate: (updates: Partial<WorkoutStep>) => void
  onDelete: () => void
  onMove?: (direction: 'up' | 'down') => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  dragHandleProps?: any
}

export function WorkoutStepCard({ step, onUpdate, onDelete, onMove, canMoveUp = true, canMoveDown = true, dragHandleProps }: WorkoutStepCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  const handleSave = (stepData: any) => {
    console.log('🔍 WorkoutStepCard: Saving step data:', stepData)
    onUpdate(stepData)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* ステップカード */}
      <div className="flex items-center">
        {/* ステップタイプの色バー */}
        <div className={`w-1 h-16 ${STEP_TYPE_COLORS[step.type]}`} />
        
        {/* ドラッグハンドル */}
        <div {...dragHandleProps} className="p-3 cursor-grab active:cursor-grabbing">
          <div className="w-4 h-4 flex flex-col space-y-1">
            <div className="w-full h-0.5 bg-gray-600"></div>
            <div className="w-full h-0.5 bg-gray-600"></div>
            <div className="w-full h-0.5 bg-gray-600"></div>
          </div>
        </div>

        {/* ステップ情報 */}
        <div className="flex-1 p-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{STEP_TYPE_ICONS[step.type]}</span>
            <span className="font-medium text-gray-900">{STEP_TYPE_LABELS[step.type]}</span>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              {step.distance ? `${formatDistance(step.distance)}` : ''}
              {step.distance && step.duration ? ' | ' : ''}
              {step.duration ? `${formatTime(step.duration)}` : ''}
            </div>
            <div className="text-xs text-gray-500">
              {step.pace && `ペース: ${step.pace}`}
              {step.pace && step.intensity ? ' | ' : ''}
              {step.intensity && `強度: ${step.intensity}/10`}
            </div>
            {step.notes && (
              <div className="text-xs text-gray-400 italic">
                {step.notes}
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="p-3 flex flex-col space-y-2">
          {/* 移動ボタン */}
          {onMove && (
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => onMove('up')}
                disabled={!canMoveUp}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="上に移動"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => onMove('down')}
                disabled={!canMoveDown}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                title="下に移動"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ステップ詳細入力フォーム（共通コンポーネント使用） */}
      <StepDetailForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        stepType={step.type}
        title={`${step.type === 'run' ? 'ランニング' :
                step.type === 'rest' ? 'レスト' :
                step.type === 'recovery' ? 'リカバリー' :
                step.type === 'warmup' ? 'ウォームアップ' :
                step.type === 'cooldown' ? 'クールダウン' :
                step.type === 'strength' ? '筋力' :
                step.type === 'stretch' ? 'ストレッチ' : 'その他'}を編集`}
        existingStep={step}
      />
    </div>
  )
}
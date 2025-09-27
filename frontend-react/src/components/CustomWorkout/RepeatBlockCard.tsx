'use client'

import { useState } from 'react'
import { RepeatBlock, WorkoutStep, WorkoutStepType, STEP_TYPE_COLORS, STEP_TYPE_LABELS, STEP_TYPE_ICONS, STEP_TYPE_DESCRIPTIONS } from '@/types/customWorkout'
import { WorkoutStepCard } from './WorkoutStepCard'
import { StepTypeSelector } from './StepTypeSelector'

interface RepeatBlockCardProps {
  block: RepeatBlock
  onUpdate: (updates: Partial<RepeatBlock>) => void
  onDelete: () => void
  onAddStep: (stepType: WorkoutStepType) => void
  onUpdateStep: (stepId: string, updates: Partial<WorkoutStep>) => void
  onDeleteStep: (stepId: string) => void
  onMoveStep?: (stepId: string, direction: 'up' | 'down') => void
  dragHandleProps?: any
}

export function RepeatBlockCard({
  block,
  onUpdate,
  onDelete,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onMoveStep,
  dragHandleProps
}: RepeatBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingRepeatCount, setIsEditingRepeatCount] = useState(false)
  const [editRepeatCount, setEditRepeatCount] = useState(block.repeatCount)
  const [showAddStepModal, setShowAddStepModal] = useState(false)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const calculateBlockTime = () => {
    return block.steps.reduce((total, step) => total + step.estimatedTime, 0)
  }

  const calculateBlockDistance = () => {
    return block.steps.reduce((total, step) => total + (step.estimatedDistance || 0), 0)
  }

  const handleSaveRepeatCount = () => {
    onUpdate({ repeatCount: editRepeatCount })
    setIsEditingRepeatCount(false)
  }

  const handleCancelRepeatCount = () => {
    setEditRepeatCount(block.repeatCount)
    setIsEditingRepeatCount(false)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* ブロックヘッダー */}
      <div className="flex items-center">
        {/* 繰り返しブロックの色バー */}
        <div className="w-1 h-16 bg-purple-500" />
        
        {/* ドラッグハンドル */}
        <div {...dragHandleProps} className="p-3 cursor-grab active:cursor-grabbing">
          <div className="w-4 h-4 flex flex-col space-y-1">
            <div className="w-full h-0.5 bg-gray-600"></div>
            <div className="w-full h-0.5 bg-gray-600"></div>
            <div className="w-full h-0.5 bg-gray-600"></div>
          </div>
        </div>

        {/* ブロック情報 */}
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔄</span>
              <span className="text-gray-900 font-medium">
                {isEditingRepeatCount ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={editRepeatCount}
                      onChange={(e) => setEditRepeatCount(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-sm text-gray-900"
                    />
                    <button
                      onClick={handleSaveRepeatCount}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelRepeatCount}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <span onClick={() => setIsEditingRepeatCount(true)} className="cursor-pointer">
                    {block.repeatCount}回
                  </span>
                )}
              </span>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            合計時間: {formatTime(calculateBlockTime() * block.repeatCount)}
            {calculateBlockDistance() > 0 && (
              <span> | 合計距離: {(calculateBlockDistance() * block.repeatCount / 1000).toFixed(1)} km</span>
            )}
          </div>

          {block.steps.length === 0 && (
            <div className="text-xs text-gray-400 mt-2">
              ステップがありません。+ ボタンでステップを追加してください。
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="p-3 flex flex-col space-y-2">
          <button
            onClick={() => setShowAddStepModal(true)}
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700"
            title="ステップを追加"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
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

      {/* 展開されたステップ一覧 */}
      {isExpanded && block.steps.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4 space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              繰り返し内容 ({block.steps.length}ステップ):
            </div>
            {block.steps.map((step, index) => (
              <div key={step.id} className="ml-4">
                <WorkoutStepCard
                  step={step}
                  onUpdate={(updates) => onUpdateStep(step.id, updates)}
                  onDelete={() => onDeleteStep(step.id)}
                  onMove={onMoveStep ? (direction) => onMoveStep(step.id, direction) : undefined}
                  canMoveUp={index > 0}
                  canMoveDown={index < block.steps.length - 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ステップ追加モーダル（共通コンポーネント使用） */}
      <StepTypeSelector
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onSelectStepType={(stepType) => {
          console.log('RepeatBlockCard: Adding step type:', stepType)
          onAddStep(stepType)
          setShowAddStepModal(false)
        }}
        title="ステップタイプを選択"
      />
    </div>
  )
}

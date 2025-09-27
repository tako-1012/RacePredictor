'use client'

import { WorkoutStepType, STEP_TYPE_ICONS, STEP_TYPE_LABELS, STEP_TYPE_DESCRIPTIONS } from '@/types/customWorkout'

interface StepTypeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectStepType: (stepType: WorkoutStepType) => void
  title?: string
}

export function StepTypeSelector({ 
  isOpen, 
  onClose, 
  onSelectStepType, 
  title = "ステップタイプを選択" 
}: StepTypeSelectorProps) {
  if (!isOpen) return null

  const stepTypes: WorkoutStepType[] = ['run', 'rest', 'recovery', 'warmup', 'cooldown', 'strength', 'stretch', 'other']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
        <div className="p-6">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stepTypes.map((stepType) => (
              <button
                key={stepType}
                onClick={() => {
                  console.log('StepTypeSelector: Adding step type:', stepType)
                  onSelectStepType(stepType)
                  onClose()
                }}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {stepType === 'run' ? '🏃' :
                     stepType === 'rest' ? '⏸️' :
                     stepType === 'recovery' ? '🚶' :
                     stepType === 'warmup' ? '🔥' :
                     stepType === 'cooldown' ? '❄️' :
                     stepType === 'strength' ? '💪' :
                     stepType === 'stretch' ? '🤸' : '📝'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {stepType === 'run' ? 'ランニング' :
                       stepType === 'rest' ? 'レスト' :
                       stepType === 'recovery' ? 'リカバリー' :
                       stepType === 'warmup' ? 'ウォームアップ' :
                       stepType === 'cooldown' ? 'クールダウン' :
                       stepType === 'strength' ? '筋力' :
                       stepType === 'stretch' ? 'ストレッチ' : 'その他'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stepType === 'run' ? '走行練習' :
                       stepType === 'rest' ? '休憩' :
                       stepType === 'recovery' ? '回復走' :
                       stepType === 'warmup' ? '準備運動' :
                       stepType === 'cooldown' ? '整理運動' :
                       stepType === 'strength' ? '筋力トレーニング' :
                       stepType === 'stretch' ? 'ストレッチ' : 'その他の運動'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

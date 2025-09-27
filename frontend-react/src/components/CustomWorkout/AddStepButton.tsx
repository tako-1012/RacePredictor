'use client'

import { useState } from 'react'
import { WorkoutStepType, STEP_TYPE_LABELS, STEP_TYPE_ICONS, STEP_TYPE_DESCRIPTIONS } from '@/types/customWorkout'

interface AddStepButtonProps {
  onClick: () => void
  showModal: boolean
  onClose: () => void
  onSelectStep: (stepType: WorkoutStepType) => void
}

export function AddStepButton({ onClick, showModal, onClose, onSelectStep }: AddStepButtonProps) {
  const stepTypes: WorkoutStepType[] = ['run', 'rest', 'recovery', 'warmup', 'cooldown', 'strength', 'stretch', 'other']

  return (
    <>
      <button
        onClick={onClick}
        className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>ステップを追加</span>
      </button>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">ステップタイプを選択</h2>
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
                      onSelectStep(stepType)
                      onClose()
                    }}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{STEP_TYPE_ICONS[stepType]}</span>
                      <div>
                        <div className="font-medium text-gray-900">{STEP_TYPE_LABELS[stepType]}</div>
                        <div className="text-xs text-gray-600">
                          {STEP_TYPE_DESCRIPTIONS[stepType]}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

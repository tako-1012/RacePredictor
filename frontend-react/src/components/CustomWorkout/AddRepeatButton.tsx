'use client'

import { useState } from 'react'

interface AddRepeatButtonProps {
  onClick: () => void
  showModal: boolean
  onClose: () => void
  onSelectRepeat: (repeatCount: number) => void
}

export function AddRepeatButton({ onClick, showModal, onClose, onSelectRepeat }: AddRepeatButtonProps) {
  const repeatOptions = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]

  return (
    <>
      <button
        onClick={onClick}
        className="flex-1 bg-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>繰り返しを追加</span>
      </button>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">繰り返し回数を選択</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {repeatOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      onSelectRepeat(count)
                      onClose()
                    }}
                    className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
                  >
                    <div className="text-lg font-semibold">{count}</div>
                    <div className="text-xs text-gray-400">回</div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm text-gray-400 mb-2">カスタム回数</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="回数を入力"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseInt((e.target as HTMLInputElement).value)
                        if (value > 0 && value <= 100) {
                          onSelectRepeat(value)
                          onClose()
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement
                      const value = parseInt(input.value)
                      if (value > 0 && value <= 100) {
                        onSelectRepeat(value)
                        onClose()
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

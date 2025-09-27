'use client'

import React, { useState } from 'react'

interface IntervalInputProps {
  times: number[]
  onChange: (times: number[]) => void
  error?: string
  placeholder?: string
}

export function IntervalInput({ 
  times, 
  onChange, 
  error, 
  placeholder = "例: 1:30, 1:25, 1:28" 
}: IntervalInputProps) {
  const [inputValue, setInputValue] = useState('')

  const parseTimeString = (timeStr: string): number => {
    const parts = timeStr.trim().split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseInt(parts[1]) || 0
      return minutes * 60 + seconds
    } else if (parts.length === 1) {
      // 秒のみの場合
      return parseInt(parts[0]) || 0
    }
    return 0
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleAddTimes = () => {
    if (!inputValue.trim()) return

    const timeStrings = inputValue.split(',').map(s => s.trim()).filter(s => s)
    const newTimes = timeStrings.map(parseTimeString).filter(time => time > 0)
    
    if (newTimes.length > 0) {
      onChange([...times, ...newTimes])
      setInputValue('')
    }
  }

  const handleRemoveTime = (index: number) => {
    const newTimes = times.filter((_, i) => i !== index)
    onChange(newTimes)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTimes()
    }
  }

  return (
    <div className="space-y-3">
      {/* 入力フィールド */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={handleAddTimes}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          追加
        </button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 追加されたタイムの表示 */}
      {times.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">追加されたタイム:</p>
          <div className="flex flex-wrap gap-2">
            {times.map((time, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-md"
              >
                <span className="text-sm font-mono">{formatTime(time)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTime(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      <p className="text-xs text-gray-500">
        カンマ区切りで複数のタイムを入力できます（例: 1:30, 1:25, 1:28）
      </p>
    </div>
  )
}

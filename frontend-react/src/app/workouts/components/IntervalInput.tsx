'use client'

import { useState } from 'react'

interface IntervalInputProps {
  times: number[]
  onChange: (times: number[]) => void
  error?: string
}

export function IntervalInput({ times, onChange, error }: IntervalInputProps) {
  const [inputValues, setInputValues] = useState<string[]>(
    times.length > 0 ? times.map(time => formatTimeInput(time)) : ['']
  )

  const formatTimeInput = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (input: string): number => {
    const parts = input.split(':').map(Number)
    
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    
    return 0
  }

  const handleInputChange = (index: number, value: string) => {
    const newInputValues = [...inputValues]
    newInputValues[index] = value
    setInputValues(newInputValues)

    // 有効な時間のみを抽出して更新
    const validTimes = newInputValues
      .map(parseTimeInput)
      .filter(time => time > 0)
    
    onChange(validTimes)
  }

  const addInterval = () => {
    const newInputValues = [...inputValues, '']
    setInputValues(newInputValues)
  }

  const removeInterval = (index: number) => {
    if (inputValues.length > 1) {
      const newInputValues = inputValues.filter((_, i) => i !== index)
      setInputValues(newInputValues)
      
      const validTimes = newInputValues
        .map(parseTimeInput)
        .filter(time => time > 0)
      
      onChange(validTimes)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const calculateTotal = () => {
    return times.reduce((total, time) => total + time, 0)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {inputValues.map((value, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                区間 {index + 1}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder="MM:SS または HH:MM:SS"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {inputValues.length > 1 && (
              <button
                type="button"
                onClick={() => removeInterval(index)}
                className="mt-6 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
              >
                削除
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addInterval}
          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
        >
          + 区間を追加
        </button>
        
        {times.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">合計: {formatTime(calculateTotal())}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="text-xs text-gray-500">
        <p>• 時間は MM:SS または HH:MM:SS の形式で入力してください</p>
        <p>• 例: 5:30 (5分30秒), 1:25:30 (1時間25分30秒)</p>
      </div>
    </div>
  )
}

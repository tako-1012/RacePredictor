'use client'

import { useState } from 'react'

interface RaceDistanceInputProps {
  value: string
  onChange: (value: string) => void
  raceType: string
  error?: string
}

export function RaceDistanceInput({ value, onChange, raceType, error }: RaceDistanceInputProps) {
  const [localError, setLocalError] = useState('')

  const getDistanceValidation = (raceType: string) => {
    switch(raceType) {
      case 'track':
        return {
          min: 100,      // 100m から
          max: 10000,    // 10000m まで
          common: [100, 200, 400, 800, 1500, 3000, 5000, 10000],
          unit: 'm'
        }
      case 'road':
        return {
          min: 1,        // 1km から
          max: 100,      // 100km まで
          common: [5, 10, 21.0975, 42.195], // 5km, 10km, ハーフ, フル
          unit: 'km'
        }
      case 'relay':
        return {
          min: 100,      // 100m から
          max: 50000,    // 50km まで (駅伝)
          common: [4 * 100, 4 * 400, 42195], // 4x100m, 4x400m, 駅伝
          unit: 'm'
        }
      default:
        return {
          min: 0.01,
          max: 1000,
          common: [],
          unit: 'km'
        }
    }
  }

  const validation = getDistanceValidation(raceType)
  
  const handleDistanceChange = (inputValue: string) => {
    const numValue = parseFloat(inputValue)
    
    // バリデーションチェック
    if (inputValue && (isNaN(numValue) || numValue <= 0)) {
      setLocalError('正の数値で入力してください')
    } else if (numValue > validation.max) {
      setLocalError(`${validation.max}${validation.unit}以下で入力してください`)
    } else {
      setLocalError('')
    }
    
    onChange(inputValue)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        距離 ({validation.unit}) *
      </label>
      <input
        type="number"
        step={validation.unit === 'm' ? '1' : '0.001'}
        value={value}
        onChange={(e) => handleDistanceChange(e.target.value)}
        className={`w-full p-3 border rounded-md ${
          error || localError ? 'border-red-300 bg-red-50' : 'border-gray-300'
        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        placeholder={`例: ${validation.common.join(', ')}`}
      />
      
      {/* 一般的な距離のクイック選択 */}
      {validation.common.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">よく使われる距離:</div>
          <div className="flex flex-wrap gap-1">
            {validation.common.map((distance) => (
              <button
                key={distance}
                type="button"
                onClick={() => handleDistanceChange(distance.toString())}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {distance}{validation.unit}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {(error || localError) && (
        <div className="text-sm text-red-600 mt-1">{error || localError}</div>
      )}
    </div>
  )
}

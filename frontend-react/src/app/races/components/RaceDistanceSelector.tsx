import React, { useState, useEffect } from 'react'

interface DistanceOption {
  value: number | string
  label: string
  unit: string
}

interface RaceDistanceSelectorProps {
  raceType: 'track' | 'road' | 'relay' | 'ekiden'
  value: string | number
  onChange: (value: string | number) => void
}

export function RaceDistanceSelector({ raceType, value, onChange }: RaceDistanceSelectorProps) {
  const standardDistances: Record<string, DistanceOption[]> = {
    track: [
      { value: 100, label: '100m', unit: 'm' },
      { value: 200, label: '200m', unit: 'm' },
      { value: 400, label: '400m', unit: 'm' },
      { value: 800, label: '800m', unit: 'm' },
      { value: 1500, label: '1500m', unit: 'm' },
      { value: 3000, label: '3000m', unit: 'm' },
      { value: 5000, label: '5000m', unit: 'm' },
      { value: 10000, label: '10000m', unit: 'm' },
      { value: 'custom', label: 'その他', unit: 'm' }
    ],
    road: [
      { value: 5, label: '5km', unit: 'km' },
      { value: 10, label: '10km', unit: 'km' },
      { value: 21.0975, label: 'ハーフマラソン', unit: 'km' },
      { value: 42.195, label: 'フルマラソン', unit: 'km' },
      { value: 'custom', label: 'その他', unit: 'km' }
    ],
    relay: [
      { value: 400, label: '400m', unit: 'm' },
      { value: 800, label: '800m', unit: 'm' },
      { value: 1600, label: '1600m', unit: 'm' },
      { value: 'custom', label: 'その他', unit: 'm' }
    ],
    ekiden: [
      // 駅伝は標準選択肢なし、すべてカスタム入力
      { value: 'custom', label: '区間距離を入力', unit: 'km' }
    ]
  }

  const [selectedDistance, setSelectedDistance] = useState<string | number>(value || '')
  const [customDistance, setCustomDistance] = useState<string>('')
  const [isCustom, setIsCustom] = useState<boolean>(raceType === 'ekiden' || false)

  // 駅伝の場合は最初からカスタム入力モード
  useEffect(() => {
    if (raceType === 'ekiden') {
      setIsCustom(true)
      setSelectedDistance('')
      setCustomDistance(value?.toString() || '')
    } else {
      setIsCustom(false)
      setSelectedDistance(value || '')
    }
  }, [raceType, value])

  const handleSelectionChange = (selectedValue: string | number) => {
    if (selectedValue === 'custom') {
      setIsCustom(true)
      setSelectedDistance('')
    } else {
      setIsCustom(false)
      setSelectedDistance(selectedValue)
      onChange(selectedValue)
    }
  }

  const handleCustomInput = (inputValue: string) => {
    setCustomDistance(inputValue)
    onChange(inputValue)
  }

  const validateDistance = (distance: string, raceType: string): string | null => {
    const numDistance = parseFloat(distance)
    
    if (!distance || isNaN(numDistance) || numDistance <= 0) {
      return '距離を入力してください'
    }
    
    // 現実的な上限値のみ設定（下限制限を完全削除）
    const maxLimits = {
      track: 25000,  // 25km（25000m）
      road: 200,     // 200km
      relay: 100,    // 100km  
      ekiden: 50     // 50km
    }
    
    const limit = maxLimits[raceType] || 100
    const unit = raceType === 'track' ? 'm' : 'km'
    
    if (numDistance > limit) {
      return `${limit}${unit}以下で入力してください`
    }
    
    return null // バリデーション成功
  }

  const formatDistance = (distance: string | number, raceType: string): string => {
    const numDistance = parseFloat(distance.toString())
    
    if (raceType === 'track') {
      if (numDistance >= 1000) {
        return `${(numDistance / 1000).toFixed(1)}km`
      }
      return `${numDistance}m`
    } else {
      return `${numDistance}km`
    }
  }

  // 駅伝専用UI
  if (raceType === 'ekiden') {
    const error = validateDistance(customDistance, raceType)
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          区間距離 * (km)
        </label>
        <input
          type="number"
          step="0.1"
          value={customDistance}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder="例: 5.8 (あなたが走った区間の距離)"
          className={`w-full p-2 border rounded-md ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        <p className="text-sm text-gray-500 mt-1">
          あなたが走った区間の距離を入力してください
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    )
  }

  const error = validateDistance(customDistance, raceType)

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        距離 *
      </label>
      
      {/* 標準距離選択 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
        {standardDistances[raceType]?.map((distance) => (
          <button
            key={distance.value}
            type="button"
            onClick={() => handleSelectionChange(distance.value)}
            className={`p-2 text-sm border rounded-md transition-colors ${
              selectedDistance === distance.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {distance.label}
          </button>
        ))}
      </div>

      {/* カスタム距離入力 */}
      {isCustom && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            距離を入力してください ({standardDistances[raceType]?.[0]?.unit || 'km'})
          </label>
          <input
            type="number"
            step={raceType === 'track' ? '1' : '0.001'}
            value={customDistance}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder={raceType === 'track' ? '例: 800' : '例: 15.5'}
            className={`w-full p-2 border rounded-md ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>
      )}

      {/* 選択された距離の表示 */}
      {selectedDistance && !isCustom && (
        <div className="text-sm text-gray-600 mt-2">
          選択中: {standardDistances[raceType]?.find(d => d.value === selectedDistance)?.label}
        </div>
      )}
    </div>
  )
}

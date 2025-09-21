'use client'

import { useState, memo } from 'react'

interface ActivityChartProps {
  data?: number[]
}

export const ActivityChart = memo(function ActivityChart({ data }: ActivityChartProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  
  // dataがundefinedまたは空の場合はデフォルト値を設定
  const safeData = data || [0, 0, 0, 0, 0, 0, 0]
  const maxDistance = Math.max(...safeData, 1)
  const weeks = ['月', '火', '水', '木', '金', '土', '日']
  
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  return (
    <div className="space-y-4">
      {/* チャート */}
      <div className="flex items-end justify-between h-48 space-x-1">
        {safeData.map((distance, index) => {
          const height = (distance / maxDistance) * 100
          const isSelected = selectedWeek === index
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative w-full">
                <button
                  onClick={() => setSelectedWeek(selectedWeek === index ? null : index)}
                  className={`w-full rounded-t transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500' 
                      : distance > 0 
                        ? 'bg-blue-300 hover:bg-blue-400' 
                        : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${weeks[index]}: ${formatDistance(distance)}`}
                />
                {isSelected && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    {formatDistance(distance)}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600">{weeks[index]}</div>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>0 km</span>
        <span className="font-medium">週間距離</span>
        <span>{formatDistance(maxDistance)}</span>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatDistance(safeData.reduce((sum, d) => sum + d, 0))}
          </div>
          <div className="text-xs text-gray-600">週間合計</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatDistance(safeData.reduce((sum, d) => sum + d, 0) / 7)}
          </div>
          <div className="text-xs text-gray-600">日平均</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {safeData.filter(d => d > 0).length}
          </div>
          <div className="text-xs text-gray-600">練習日数</div>
        </div>
      </div>
    </div>
  )
})

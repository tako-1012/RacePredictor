'use client'

import { useState } from 'react'

interface DistanceChartProps {
  data: Array<{
    date: string
    distance: number
  }>
  period?: 'week' | 'month' | 'year'
}

export function DistanceChart({ data, period = 'week' }: DistanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    switch (selectedPeriod) {
      case 'week':
        return date.toLocaleDateString('ja-JP', { weekday: 'short' })
      case 'month':
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      case 'year':
        return date.toLocaleDateString('ja-JP', { month: 'short' })
      default:
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    }
  }

  const maxDistance = Math.max(...data.map(d => d.distance), 1)

  return (
    <div className="space-y-4">
      {/* 期間選択 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">距離推移</h3>
        <div className="flex space-x-2">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p as any)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                selectedPeriod === p
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'week' ? '週' : p === 'month' ? '月' : '年'}
            </button>
          ))}
        </div>
      </div>

      {/* チャート */}
      <div className="h-64">
        <div className="flex items-end justify-between h-full space-x-1">
          {data.map((item, index) => {
            const height = (item.distance / maxDistance) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-blue-300 rounded-t hover:bg-blue-400 transition-colors"
                     style={{ height: `${Math.max(height, 4)}%` }}
                     title={`${formatDate(item.date)}: ${formatDistance(item.distance)}`}
                />
                <div className="mt-2 text-xs text-gray-600">
                  {formatDate(item.date)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatDistance(data.reduce((sum, d) => sum + d.distance, 0))}
          </div>
          <div className="text-xs text-gray-600">総距離</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatDistance(data.reduce((sum, d) => sum + d.distance, 0) / data.length)}
          </div>
          <div className="text-xs text-gray-600">平均</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatDistance(Math.max(...data.map(d => d.distance)))}
          </div>
          <div className="text-xs text-gray-600">最大</div>
        </div>
      </div>
    </div>
  )
}

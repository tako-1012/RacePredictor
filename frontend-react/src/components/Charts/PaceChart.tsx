'use client'

import { useState } from 'react'

interface PaceChartProps {
  data: Array<{
    date: string
    pace: number // 秒/km
  }>
}

export function PaceChart({ data }: PaceChartProps) {
  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  const minPace = Math.min(...data.map(d => d.pace))
  const maxPace = Math.max(...data.map(d => d.pace))
  const paceRange = maxPace - minPace

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">ペース推移</h3>

      {/* チャート */}
      <div className="h-64">
        <div className="flex items-end justify-between h-full space-x-1">
          {data.map((item, index) => {
            // ペースが速いほど高く表示（逆転）
            const height = ((maxPace - item.pace) / paceRange) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-green-300 rounded-t hover:bg-green-400 transition-colors"
                     style={{ height: `${Math.max(height, 4)}%` }}
                     title={`${formatDate(item.date)}: ${formatPace(item.pace)}`}
                />
                <div className="mt-2 text-xs text-gray-600">
                  {formatDate(item.date)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>{formatPace(maxPace)}</span>
        <span className="font-medium">ペース（速い）</span>
        <span>{formatPace(minPace)}</span>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatPace(data.reduce((sum, d) => sum + d.pace, 0) / data.length)}
          </div>
          <div className="text-xs text-gray-600">平均ペース</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatPace(minPace)}
          </div>
          <div className="text-xs text-gray-600">ベストペース</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatPace(maxPace)}
          </div>
          <div className="text-xs text-gray-600">最遅ペース</div>
        </div>
      </div>
    </div>
  )
}

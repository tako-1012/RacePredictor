'use client'

import { Race } from '@/types'
import { formatTime, formatPace, formatDistance } from '@/lib/utils'

interface BestTimeCardProps {
  races: Race[]
  distance: number // メートル
  title: string
}

export function BestTimeCard({ races, distance, title }: BestTimeCardProps) {
  const racesAtDistance = races.filter(race => race.distance_meters === distance)
  
  if (racesAtDistance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500">記録なし</p>
      </div>
    )
  }

  const bestRace = racesAtDistance.reduce((best, current) => 
    current.time_seconds < best.time_seconds ? current : best
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">ベストタイム</span>
          <span className="text-2xl font-bold text-blue-600">
            {formatTime(bestRace.time_seconds)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">平均ペース</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatPace(bestRace.pace_seconds)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">レース日</span>
          <span className="text-sm text-gray-900">
            {formatDate(bestRace.date)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">レース名</span>
          <span className="text-sm text-gray-900">
            {bestRace.race_type}
          </span>
        </div>
        
        {bestRace.place && bestRace.total_participants && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">順位</span>
            <span className="text-sm text-gray-900">
              {bestRace.place}位 / {bestRace.total_participants}人中
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>総レース数</span>
          <span>{racesAtDistance.length}回</span>
        </div>
      </div>
    </div>
  )
}

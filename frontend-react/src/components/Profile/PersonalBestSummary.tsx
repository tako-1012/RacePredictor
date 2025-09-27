'use client'

import { PersonalBest } from '@/types'

interface PersonalBestSummaryProps {
  personalBests: PersonalBest[]
}

// 種目の一覧（READMEから）
const RACE_TYPES = {
  track: [
    { value: '800m', label: '800m' },
    { value: '1500m', label: '1500m' },
    { value: '3000m', label: '3000m' },
    { value: '5000m', label: '5000m' },
    { value: '10000m', label: '10000m' },
    { value: 'other_track', label: 'その他（トラック）' }
  ],
  road: [
    { value: '5km', label: '5km' },
    { value: '10km', label: '10km' },
    { value: 'half_marathon', label: 'ハーフマラソン' },
    { value: 'marathon', label: 'フルマラソン' },
    { value: 'other_road', label: 'その他（ロード）' }
  ],
  ekiden: [
    { value: 'ekiden', label: '駅伝' }
  ]
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function PersonalBestSummary({ personalBests }: PersonalBestSummaryProps) {
  // 距離を数値に変換する関数
  const getDistanceInMeters = (pb: PersonalBest): number => {
    if (pb.custom_distance_m) {
      return pb.custom_distance_m
    }
    
    // 文字列の距離を数値に変換
    const distanceStr = pb.distance.toLowerCase()
    if (distanceStr.includes('km')) {
      return parseFloat(distanceStr) * 1000
    } else if (distanceStr.includes('m')) {
      return parseInt(distanceStr)
    } else if (distanceStr === 'half_marathon') {
      return 21097
    } else if (distanceStr === 'marathon') {
      return 42195
    }
    return 0
  }

  // 距離表示を日本語に変換する関数
  const formatDistanceDisplay = (pb: PersonalBest): string => {
    if (pb.custom_distance_m) {
      return pb.custom_distance_m >= 1000 
        ? `${(pb.custom_distance_m / 1000).toFixed(1)}km`
        : `${pb.custom_distance_m}m`
    }
    
    // 固定の距離名を日本語に変換
    switch (pb.distance) {
      case 'half_marathon':
        return 'ハーフマラソン'
      case 'marathon':
        return 'フルマラソン'
      default:
        return pb.distance
    }
  }

  // 種目別に自己ベストをグループ化し、距離順にソート
  const groupedBests = personalBests.reduce((acc, pb) => {
    if (!acc[pb.race_type]) {
      acc[pb.race_type] = []
    }
    acc[pb.race_type].push(pb)
    return acc
  }, {} as Record<string, PersonalBest[]>)

  // 各グループ内で距離順にソート
  Object.keys(groupedBests).forEach(raceType => {
    groupedBests[raceType].sort((a, b) => getDistanceInMeters(a) - getDistanceInMeters(b))
  })

  // 最新の更新日を取得
  const latestUpdate = personalBests.length > 0 
    ? new Date(Math.max(...personalBests.map(pb => new Date(pb.achieved_date).getTime())))
    : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">自己ベスト概要</h2>
        {latestUpdate && (
          <div className="text-sm text-gray-600">
            最終更新: {formatDate(latestUpdate.toISOString())}
          </div>
        )}
      </div>

      {personalBests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">まだ自己ベストが登録されていません</div>
          <div className="text-sm text-gray-400">レース結果を登録すると自動で更新されます</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* トラック種目 */}
          {groupedBests.track && groupedBests.track.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                🏃‍♂️ トラック種目
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedBests.track.map((pb) => (
                  <div key={pb.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {formatDistanceDisplay(pb)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(pb.achieved_date)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {formatTime(pb.time_seconds)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {pb.race_name || '記録なし'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ロード種目 */}
          {groupedBests.road && groupedBests.road.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                🛣️ ロード種目
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedBests.road.map((pb) => (
                  <div key={pb.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {formatDistanceDisplay(pb)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(pb.achieved_date)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatTime(pb.time_seconds)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {pb.race_name || '記録なし'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 駅伝種目 */}
          {groupedBests.ekiden && groupedBests.ekiden.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                🏃‍♀️ 駅伝種目
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedBests.ekiden.map((pb) => (
                  <div key={pb.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {formatDistanceDisplay(pb)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(pb.achieved_date)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-purple-600 mb-1">
                      {formatTime(pb.time_seconds)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {pb.race_name || '記録なし'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

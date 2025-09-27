'use client'

import { DetailedWorkoutData } from '@/types'

interface WorkoutSummaryProps {
  workout: DetailedWorkoutData
}

export function WorkoutSummary({ workout }: WorkoutSummaryProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {workout.workout_name || '練習記録'}
        </h2>
        <div className="text-sm text-gray-500">
          {formatDate(workout.date)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">総距離</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatDistance(workout.total_estimated_distance_meters)}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">総時間</div>
          <div className="text-2xl font-bold text-green-900">
            {formatTime(workout.total_estimated_duration_minutes * 60)}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">部練数</div>
          <div className="text-2xl font-bold text-purple-900">
            {workout.session_count}部練
          </div>
        </div>
      </div>

      {workout.avg_heart_rate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">平均心拍数</div>
            <div className="text-xl font-bold text-red-900">
              {workout.avg_heart_rate} bpm
            </div>
          </div>
          
          {workout.max_heart_rate && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">最大心拍数</div>
              <div className="text-xl font-bold text-orange-900">
                {workout.max_heart_rate} bpm
              </div>
            </div>
          )}
        </div>
      )}

      {workout.notes && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">メモ</h4>
          <p className="text-gray-600">{workout.notes}</p>
        </div>
      )}
    </div>
  )
}

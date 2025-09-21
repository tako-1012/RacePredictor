'use client'

import { memo } from 'react'
import { WorkoutSummary } from '@/types'

interface RecentWorkoutsProps {
  workouts: WorkoutSummary[]
}

export const RecentWorkouts = memo(function RecentWorkouts({ workouts }: RecentWorkoutsProps) {
  if (workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500">最近の練習記録がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {workout.workout_type_name || '不明'}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span>{workout.distance_km.toFixed(1)} km</span>
                  <span>{workout.time_minutes.toFixed(1)} 分</span>
                  {workout.pace_per_km && (
                    <span>{workout.pace_per_km}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-sm text-gray-500">
            {new Date(workout.date).toLocaleDateString('ja-JP', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      ))}
    </div>
  )
})

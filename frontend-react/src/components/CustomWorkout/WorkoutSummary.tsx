'use client'

import { WorkoutStep, RepeatBlock } from '@/types/customWorkout'

interface WorkoutSummaryProps {
  steps: (WorkoutStep | RepeatBlock)[]
}

export function WorkoutSummary({ steps }: WorkoutSummaryProps) {
  const calculateTotalTime = () => {
    return steps.reduce((total, step) => {
      if (step.type === 'repeat') {
        const blockTime = step.steps.reduce((blockTotal, s) => blockTotal + s.estimatedTime, 0)
        return total + (blockTime * step.repeatCount)
      } else {
        return total + step.estimatedTime
      }
    }, 0)
  }

  const calculateTotalDistance = () => {
    return steps.reduce((total, step) => {
      if (step.type === 'repeat') {
        const blockDistance = step.steps.reduce((blockTotal, s) => blockTotal + (s.estimatedDistance || 0), 0)
        return total + (blockDistance * step.repeatCount)
      } else {
        return total + (step.estimatedDistance || 0)
      }
    }, 0)
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

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  const totalTime = calculateTotalTime()
  const totalDistance = calculateTotalDistance()

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">概要</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatTime(totalTime)}
          </div>
          <div className="text-sm text-gray-600">概算時間</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatDistance(totalDistance)}
          </div>
          <div className="text-sm text-gray-600">合計距離</div>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            ステップ数: {steps.length}個
            {steps.some(s => s.type === 'repeat') && (
              <span className="ml-2">
                (繰り返しブロック: {steps.filter(s => s.type === 'repeat').length}個)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

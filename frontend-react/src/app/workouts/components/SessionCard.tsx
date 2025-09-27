'use client'

import { WorkoutSession } from '@/types'

interface SessionCardProps {
  session: WorkoutSession
  sessionNumber: number
}

export function SessionCard({ session, sessionNumber }: SessionCardProps) {
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

  const getTimePeriodLabel = (period: string): string => {
    const labels: Record<string, string> = {
      'morning': '朝練',
      'afternoon': '午後練',
      'evening': '夕練',
      'night': '夜練',
      'other': 'その他'
    }
    return labels[period] || period
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {sessionNumber}部練 - {getTimePeriodLabel(session.time_period)}
        </h3>
        <div className="text-sm text-gray-500">
          {formatTime(session.total_estimated_duration_minutes * 60)} | {formatDistance(session.total_estimated_distance_meters)}
        </div>
      </div>

      <div className="space-y-4">
        {/* ウォームアップ */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">ウォームアップ</h4>
          <div className="space-y-2">
            {session.sections.warmup.steps.map((step, index) => (
              <div key={step.id || index} className="flex justify-between items-center text-sm">
                <span className="text-green-700">{step.name || 'ウォームアップ'}</span>
                <span className="text-green-600">
                  {step.distance_meters && formatDistance(step.distance_meters)}
                  {step.distance_meters && step.duration_seconds && ' | '}
                  {step.duration_seconds && formatTime(step.duration_seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* メイン練習 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">メイン練習</h4>
          <div className="space-y-2">
            {session.sections.main.steps.map((step, index) => (
              <div key={step.id || index} className="flex justify-between items-center text-sm">
                <span className="text-blue-700">{step.name || 'メイン練習'}</span>
                <span className="text-blue-600">
                  {step.distance_meters && formatDistance(step.distance_meters)}
                  {step.distance_meters && step.duration_seconds && ' | '}
                  {step.duration_seconds && formatTime(step.duration_seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* クールダウン */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">クールダウン</h4>
          <div className="space-y-2">
            {session.sections.cooldown.steps.map((step, index) => (
              <div key={step.id || index} className="flex justify-between items-center text-sm">
                <span className="text-purple-700">{step.name || 'クールダウン'}</span>
                <span className="text-purple-600">
                  {step.distance_meters && formatDistance(step.distance_meters)}
                  {step.distance_meters && step.duration_seconds && ' | '}
                  {step.duration_seconds && formatTime(step.duration_seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

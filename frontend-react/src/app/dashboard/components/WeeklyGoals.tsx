'use client'

import { useState, useEffect } from 'react'

interface WeeklyGoalsProps {
  // 将来的にAPIから目標を取得する場合に使用
}

export function WeeklyGoals({}: WeeklyGoalsProps) {
  const [goals, setGoals] = useState({
    distance: 50, // km
    workouts: 4,
    time: 300 // 分
  })

  const [progress, setProgress] = useState({
    distance: 0,
    workouts: 0,
    time: 0
  })

  // 実際のアプリケーションでは、APIから進捗を取得
  useEffect(() => {
    // モックデータ
    setProgress({
      distance: 35,
      workouts: 3,
      time: 240
    })
  }, [])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressText = (percentage: number) => {
    if (percentage >= 100) return '完了！'
    if (percentage >= 75) return '順調'
    if (percentage >= 50) return '半分'
    return '頑張ろう'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">今週の目標</h2>
        <p className="text-sm text-gray-600">週間目標の進捗を確認しましょう</p>
      </div>

      {/* 距離目標 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">距離</span>
          <span className="text-sm text-gray-600">
            {progress.distance} / {goals.distance} km
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
              getProgressPercentage(progress.distance, goals.distance)
            )}`}
            style={{ width: `${getProgressPercentage(progress.distance, goals.distance)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {getProgressText(getProgressPercentage(progress.distance, goals.distance))}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(getProgressPercentage(progress.distance, goals.distance))}%
          </span>
        </div>
      </div>

      {/* 練習回数目標 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">練習回数</span>
          <span className="text-sm text-gray-600">
            {progress.workouts} / {goals.workouts} 回
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
              getProgressPercentage(progress.workouts, goals.workouts)
            )}`}
            style={{ width: `${getProgressPercentage(progress.workouts, goals.workouts)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {getProgressText(getProgressPercentage(progress.workouts, goals.workouts))}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(getProgressPercentage(progress.workouts, goals.workouts))}%
          </span>
        </div>
      </div>

      {/* 時間目標 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">練習時間</span>
          <span className="text-sm text-gray-600">
            {progress.time} / {goals.time} 分
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
              getProgressPercentage(progress.time, goals.time)
            )}`}
            style={{ width: `${getProgressPercentage(progress.time, goals.time)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {getProgressText(getProgressPercentage(progress.time, goals.time))}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(getProgressPercentage(progress.time, goals.time))}%
          </span>
        </div>
      </div>

      {/* 週間サマリー */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(
              (getProgressPercentage(progress.distance, goals.distance) +
               getProgressPercentage(progress.workouts, goals.workouts) +
               getProgressPercentage(progress.time, goals.time)) / 3
            )}%
          </div>
          <div className="text-sm text-gray-600">週間目標達成率</div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'

interface WeeklyGoalsProps {
  weeklyData?: {
    distance: number
    workouts: number
    time: number
  }
}

export function WeeklyGoals({ weeklyData }: WeeklyGoalsProps) {
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

  const [isLoading, setIsLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoals, setEditingGoals] = useState({
    distance: 50,
    workouts: 4,
    time: 300
  })

  // 実際の週間データを取得
  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        setIsLoading(true)
        
        if (weeklyData) {
          // 親コンポーネントからデータが渡された場合
          setProgress(weeklyData)
        } else {
          // APIから直接取得
          const response = await apiClient.getDashboardStats()
          if (response.weekly_data) {
            // 新しい週間データを使用
            setProgress({
              distance: Math.round(response.weekly_data.distance_km * 10) / 10, // 小数点第1位まで
              workouts: response.weekly_data.workout_count,
              time: Math.round(response.weekly_data.time_minutes)
            })
          } else if (response.weekly_chart && response.weekly_chart.values) {
            // フォールバック: 週間チャートから距離のみ取得
            const weeklyDistance = response.weekly_chart.values.reduce((sum: number, val: number) => sum + val, 0)
            setProgress({
              distance: Math.round(weeklyDistance * 10) / 10, // 小数点第1位まで
              workouts: 0, // 週間練習回数（今後実装予定）
              time: 0 // 週間練習時間（今後実装予定）
            })
          }
        }
      } catch (err) {
        console.error('週間データ取得エラー:', err)
        // エラー時は0で初期化
        setProgress({
          distance: 0,
          workouts: 0,
          time: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWeeklyData()
  }, [weeklyData])

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

  const handleGoalEdit = () => {
    setEditingGoals(goals)
    setShowGoalModal(true)
  }

  const handleGoalSave = () => {
    setGoals(editingGoals)
    setShowGoalModal(false)
    // TODO: APIに保存
  }

  const handleGoalCancel = () => {
    setEditingGoals(goals)
    setShowGoalModal(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">今週の目標</h2>
          <p className="text-sm text-gray-600">データを読み込み中...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">今週の目標</h2>
          <p className="text-sm text-gray-600">週間目標の進捗を確認しましょう</p>
        </div>
        <button
          onClick={handleGoalEdit}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span>目標設定</span>
        </button>
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
        <div className="flex justify-end items-center mt-1">
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
        <div className="flex justify-end items-center mt-1">
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
        <div className="flex justify-end items-center mt-1">
          <span className="text-xs text-gray-500">
            {Math.round(getProgressPercentage(progress.time, goals.time))}%
          </span>
        </div>
      </div>

      {/* 週間サマリー */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {progress.distance === 0 && progress.workouts === 0 && progress.time === 0 ? (
              '0'
            ) : (
              Math.round(
                (getProgressPercentage(progress.distance, goals.distance) +
                 getProgressPercentage(progress.workouts, goals.workouts) +
                 getProgressPercentage(progress.time, goals.time)) / 3
              )
            )}%
          </div>
          <div className="text-sm text-gray-600">
            週間目標達成率
          </div>
        </div>
      </div>

      {/* 目標設定モーダル */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">週間目標を設定</h3>
              <button
                onClick={handleGoalCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 距離目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  距離目標 (km)
                </label>
                <input
                  type="number"
                  value={editingGoals.distance}
                  onChange={(e) => {
                    const value = e.target.value
                    const distance = value === '' ? 0 : parseInt(value)
                    setEditingGoals(prev => ({ ...prev, distance }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="200"
                />
              </div>

              {/* 練習回数目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  練習回数目標 (回)
                </label>
                <input
                  type="number"
                  value={editingGoals.workouts}
                  onChange={(e) => {
                    const value = e.target.value
                    const workouts = value === '' ? 0 : parseInt(value)
                    setEditingGoals(prev => ({ ...prev, workouts }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="14"
                />
              </div>

              {/* 時間目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  練習時間目標 (分)
                </label>
                <input
                  type="number"
                  value={editingGoals.time}
                  onChange={(e) => {
                    const value = e.target.value
                    const time = value === '' ? 0 : parseInt(value)
                    setEditingGoals(prev => ({ ...prev, time }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="1800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleGoalCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleGoalSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

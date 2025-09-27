'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface GoalTrackingProps {
  weeklyData?: {
    distance_km: number
    workout_count: number
    time_minutes: number
  }
  monthlyData?: {
    distance_km: number
    workout_count: number
    time_minutes: number
  }
}

interface Goal {
  id: string
  type: 'distance' | 'workouts' | 'time'
  period: 'weekly' | 'monthly'
  target: number
  current: number
  unit: string
  color: string
}

export function GoalTracking({ weeklyData, monthlyData }: GoalTrackingProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoals, setEditingGoals] = useState({
    weeklyDistance: 50,
    weeklyWorkouts: 4,
    weeklyTime: 300,
    monthlyDistance: 200,
    monthlyWorkouts: 16,
    monthlyTime: 1200
  })

  // 目標の初期化と更新
  useEffect(() => {
    const loadGoals = async () => {
      try {
        // ローカルストレージから目標を読み込み
        const savedGoals = localStorage.getItem('running-goals')
        if (savedGoals) {
          const parsed = JSON.parse(savedGoals)
          setEditingGoals(parsed)
        }

        // 現在の目標を設定
        const currentGoals: Goal[] = [
          // 週間目標
          {
            id: 'weekly-distance',
            type: 'distance',
            period: 'weekly',
            target: editingGoals.weeklyDistance,
            current: weeklyData?.distance_km || 0,
            unit: 'km',
            color: 'blue'
          },
          {
            id: 'weekly-workouts',
            type: 'workouts',
            period: 'weekly',
            target: editingGoals.weeklyWorkouts,
            current: weeklyData?.workout_count || 0,
            unit: '回',
            color: 'green'
          },
          {
            id: 'weekly-time',
            type: 'time',
            period: 'weekly',
            target: editingGoals.weeklyTime,
            current: weeklyData?.time_minutes || 0,
            unit: '分',
            color: 'orange'
          },
          // 月間目標
          {
            id: 'monthly-distance',
            type: 'distance',
            period: 'monthly',
            target: editingGoals.monthlyDistance,
            current: monthlyData?.distance_km || 0,
            unit: 'km',
            color: 'blue'
          },
          {
            id: 'monthly-workouts',
            type: 'workouts',
            period: 'monthly',
            target: editingGoals.monthlyWorkouts,
            current: monthlyData?.workout_count || 0,
            unit: '回',
            color: 'green'
          },
          {
            id: 'monthly-time',
            type: 'time',
            period: 'monthly',
            target: editingGoals.monthlyTime,
            current: monthlyData?.time_minutes || 0,
            unit: '分',
            color: 'orange'
          }
        ]
        setGoals(currentGoals)
      } catch (error) {
        console.error('目標の読み込みに失敗:', error)
      }
    }

    loadGoals()
  }, [weeklyData, monthlyData, editingGoals])

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  const getColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500'
  }

  const getTextColorClass = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
  }

  const handleSaveGoals = () => {
    try {
      localStorage.setItem('running-goals', JSON.stringify(editingGoals))
      setShowGoalModal(false)
      // 目標を再読み込み
      window.location.reload()
    } catch (error) {
      console.error('目標の保存に失敗:', error)
    }
  }

  const getGoalTitle = (type: string, period: string) => {
    const typeMap = {
      distance: '距離',
      workouts: '練習回数',
      time: '練習時間'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">目標追跡</h2>
        <button
          onClick={() => setShowGoalModal(true)}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 目標カード */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 週間目標 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">週間目標</h3>
          <div className="space-y-3">
            {goals.filter(goal => goal.period === 'weekly').map((goal) => {
              const progress = getProgressPercentage(goal.current, goal.target)
              const isCompleted = progress >= 100

              return (
                <div key={goal.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      {getGoalTitle(goal.type, goal.period)}
                    </h4>
                    <span className={`text-xs font-medium ${getTextColorClass(goal.color)}`}>
                      {goal.current.toFixed(1)}/{goal.target}{goal.unit}
                    </span>
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getColorClass(goal.color)}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{progress.toFixed(0)}%</span>
                    {isCompleted && (
                      <span className="text-green-600 font-medium">🎉</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 月間目標 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">月間目標</h3>
          <div className="space-y-3">
            {goals.filter(goal => goal.period === 'monthly').map((goal) => {
              const progress = getProgressPercentage(goal.current, goal.target)
              const isCompleted = progress >= 100

              return (
                <div key={goal.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      {getGoalTitle(goal.type, goal.period)}
                    </h4>
                    <span className={`text-xs font-medium ${getTextColorClass(goal.color)}`}>
                      {goal.current.toFixed(1)}/{goal.target}{goal.unit}
                    </span>
                  </div>
                  
                  {/* プログレスバー */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getColorClass(goal.color)}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{progress.toFixed(0)}%</span>
                    {isCompleted && (
                      <span className="text-green-600 font-medium">🎉</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 目標設定モーダル */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">目標設定</h3>
            
            <div className="space-y-4">
              {/* 週間目標 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">週間目標</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">距離:</label>
                    <input
                      type="number"
                      value={editingGoals.weeklyDistance}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, weeklyDistance: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">回数:</label>
                    <input
                      type="number"
                      value={editingGoals.weeklyWorkouts}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, weeklyWorkouts: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">回</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">時間:</label>
                    <input
                      type="number"
                      value={editingGoals.weeklyTime}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, weeklyTime: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">分</span>
                  </div>
                </div>
              </div>

              {/* 月間目標 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">月間目標</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">距離:</label>
                    <input
                      type="number"
                      value={editingGoals.monthlyDistance}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, monthlyDistance: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">回数:</label>
                    <input
                      type="number"
                      value={editingGoals.monthlyWorkouts}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, monthlyWorkouts: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">回</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-16">時間:</label>
                    <input
                      type="number"
                      value={editingGoals.monthlyTime}
                      onChange={(e) => setEditingGoals(prev => ({ ...prev, monthlyTime: Number(e.target.value) }))}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">分</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveGoals}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

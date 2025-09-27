'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Workout, WorkoutType } from '@/types'
import { DetailedWorkoutForm } from '../components/DetailedWorkoutForm'
import { SessionCard } from '../components/SessionCard'
import { WorkoutSummary } from '../components/WorkoutSummary'
import { StatCard } from '../components/StatCard'
import { SectionSummary } from '../components/SectionSummary'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { Breadcrumb, BreadcrumbPresets } from '@/components/Layout/Breadcrumb'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'

// Duration format function
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Get workout type display name function
function getWorkoutTypeDisplay(workoutType: any): string {
  // Object case
  if (workoutType && typeof workoutType === 'object') {
    return workoutType.name || workoutType.type || 'Other'
  }
  
  // String case
  if (typeof workoutType === 'string') {
    const typeMap: Record<string, string> = {
      'easy_run': 'イージーラン',
      'long_run': 'ロング走',
      'tempo_run': 'テンポ走',
      'interval': 'インターバル走',
      'interval_run': 'インターバル走',
      'repetition': 'レペティション',
      'fartlek': 'ファートレック',
      'hill_training': 'ヒルトレーニング',
      'strength': '筋力トレーニング',
      'recovery': '回復走',
      'other': 'その他',
      'Other': 'その他'
    }
    
    return typeMap[workoutType] || workoutType
  }
  
  return 'Other'
}

// Infer workout type from session data function
function inferWorkoutTypeFromSession(sessionData: any): string {
  if (!sessionData || !Array.isArray(sessionData) || sessionData.length === 0) {
    return 'Other'
  }
  
  // Infer from first exercise in main section
  for (const session of sessionData) {
    if (session.main && session.main.length > 0) {
      const mainExercise = session.main[0]
      if (mainExercise.type) {
        return mainExercise.type
      }
    }
  }
  
  return 'Other'
}

export default function WorkoutDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && workoutId) {
      loadWorkout()
      loadWorkoutTypes()
    }
  }, [isAuthenticated, workoutId])

  const loadWorkout = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Debug log
      console.log('Workout ID:', workoutId)
      
      const workoutData = await apiClient.getWorkout(workoutId)
      
      // Basic data validation
      if (!workoutData || typeof workoutData !== 'object') {
        throw new Error('Invalid data format')
      }
      
      console.log('Retrieved workout data:', workoutData)
      console.log('times_seconds:', workoutData.times_seconds)
      console.log('distances_meters:', workoutData.distances_meters)
      console.log('workout type:', workoutData.workout_type)
      console.log('session data:', workoutData.session_data)
      
      // Workout type fallback processing
      const processedData = {
        ...workoutData,
        workout_type: workoutData.workout_type || 
                     workoutData.workoutType || 
                     inferWorkoutTypeFromSession(workoutData.session_data) || 
                     'Other'
      }
      
      console.log('Processed workout type:', processedData.workout_type)
      
      setWorkout(processedData)
    } catch (err: any) {
      console.error('Workout retrieval error:', err)
      
      let errorMessage = 'Failed to retrieve workout record'
      
      if (err.message) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          errorMessage = 'Workout record not found'
        } else if (err.message.includes('403') || err.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to access this workout record'
        } else if (err.message.includes('500') || err.message.includes('server error')) {
          errorMessage = 'A server error occurred. Please try again later.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkoutTypes = async () => {
    try {
      const types = await apiClient.getWorkoutTypes()
      setWorkoutTypes(types)
    } catch (err) {
      console.error('Failed to load workout types:', err)
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      setIsSubmitting(true)
      const updatedWorkout = await apiClient.updateWorkout(workoutId, data)
      setWorkout(updatedWorkout)
      setIsEditing(false)
      setToast({ message: '練習記録を更新しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この練習記録を削除してもよろしいですか？この操作は取り消せません。')) return

    try {
      await apiClient.deleteWorkout(workoutId)
      setToast({ message: '練習記録を削除しました', type: 'success' })
      router.push('/workouts')
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (authLoading || isLoading) {
    return (<LoadingSpinner />)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">An error occurred</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={loadWorkout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Workout record not found</h2>
          <button
            onClick={() => router.push('/workouts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Workout List
          </button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            {BreadcrumbPresets.workoutsEdit(workoutId, workout.workout_name || '練習記録')}
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">練習記録を編集</h1>
            <p className="mt-2 text-gray-600">練習の詳細を修正してください</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <DetailedWorkoutForm
              workout={workout}
              workoutTypes={workoutTypes}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        {BreadcrumbPresets.workoutsDetail(workoutId, workout.workout_name || 'Workout')}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {workout.workout_name || '練習記録'}
          </h1>
          <p className="text-gray-600">
            {(workout.date || workout.workout_date) ? 
              new Date(workout.date || workout.workout_date).toLocaleDateString('ja-JP') : 
              '日付不明'
            } • {getWorkoutTypeDisplay(workout.workout_type)}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            削除
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="総距離" 
          value={(() => {
            const distance = workout.actual_distance_meters || workout.target_distance_meters || workout.distance_meters || 0
            return distance > 0 ? formatDistance(distance) : '0m'
          })()}
          color="blue" 
        />
        <StatCard 
          title="総時間" 
          value={(() => {
            if (workout.duration_seconds) {
              return formatDuration(workout.duration_seconds)
            }
            if (workout.actual_times_seconds && workout.actual_times_seconds.length > 0) {
              return formatTime(workout.actual_times_seconds.reduce((total, time) => total + time, 0))
            }
            if (workout.times_seconds && workout.times_seconds.length > 0) {
              return formatTime(workout.times_seconds.reduce((total, time) => total + time, 0))
            }
            return '--:--'
          })()}
          color="green" 
        />
        <StatCard 
          title="平均ペース" 
          value={(() => {
            const distance = workout.actual_distance_meters || workout.target_distance_meters || workout.distance_meters || 0
            const time = workout.duration_seconds || 
                        (workout.actual_times_seconds ? workout.actual_times_seconds.reduce((a, b) => a + b, 0) : 0) ||
                        (workout.times_seconds ? workout.times_seconds.reduce((a, b) => a + b, 0) : 0)
            
            if (distance > 0 && time > 0) {
              return formatPace(time / (distance / 1000), distance)
            }
            return '--:--'
          })()}
          color="purple" 
        />
        <StatCard 
          title="強度" 
          value={workout.intensity ? `${workout.intensity}/10` : '未設定'}
          color="orange" 
        />
      </div>

      {/* Session Information */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              練習詳細
            </h3>
            <div className="text-sm text-gray-500">
              {getWorkoutTypeDisplay(workout.workout_type_name || workout.workout_type || 'Other')}
            </div>
          </div>

          {/* Workout data display */}
          <div className="space-y-4">
            {workout.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">メモ</h4>
                <p className="text-gray-700">{workout.notes}</p>
              </div>
            )}

            {/* Distance and time details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">距離情報</h4>
                <div className="space-y-1 text-sm">
                  <div>実際の距離: {formatDistance(workout.actual_distance_meters || 0)}</div>
                  <div>目標距離: {formatDistance(workout.target_distance_meters || 0)}</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">時間情報</h4>
                <div className="space-y-1 text-sm">
                  {workout.actual_times_seconds && workout.actual_times_seconds.length > 0 && (
                    <div>実際の時間: {workout.actual_times_seconds.map(time => formatTime(time)).join(', ')}</div>
                  )}
                  {workout.target_times_seconds && workout.target_times_seconds.length > 0 && (
                    <div>目標時間: {workout.target_times_seconds.map(time => formatTime(time)).join(', ')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Warmup */}
            {workout.extended_data?.warmup_distance && (
              <SectionSummary 
                title="Warmup" 
                icon="🔥" 
                color="orange"
                steps={[{
                  type: 'Warmup',
                  distance: workout.extended_data.warmup_distance / 1000,
                  time: workout.extended_data.warmup_time ? workout.extended_data.warmup_time / 60 : 0
                }]} 
              />
            )}

            {/* Main */}
            {workout.extended_data?.main_distance && (
              <SectionSummary 
                title="Main" 
                icon="💪" 
                color="blue"
                steps={[{
                  type: 'Main',
                  distance: workout.extended_data.main_distance / 1000,
                  time: workout.extended_data.main_time ? workout.extended_data.main_time / 60 : 0
                }]} 
              />
            )}

            {/* Cooldown */}
            {workout.extended_data?.cooldown_distance && (
              <SectionSummary 
                title="Cooldown" 
                icon="🧘" 
                color="green"
                steps={[{
                  type: 'Cooldown',
                  distance: workout.extended_data.cooldown_distance / 1000,
                  time: workout.extended_data.cooldown_time ? workout.extended_data.cooldown_time / 60 : 0
                }]} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">メモ</h3>
          <p className="text-gray-700">{workout.notes}</p>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
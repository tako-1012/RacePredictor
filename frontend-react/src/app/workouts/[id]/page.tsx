'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Workout, WorkoutType } from '@/types'
import { DetailedWorkoutForm } from '../components/DetailedWorkoutForm'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'

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
      const workoutData = await apiClient.getWorkout(workoutId)
      setWorkout(workoutData)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
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
    if (!confirm('この練習記録を削除しますか？この操作は取り消せません。')) return

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
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadWorkout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">練習記録が見つかりません</h2>
          <button
            onClick={() => router.push('/workouts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            練習記録一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">練習記録詳細</h1>
              <p className="mt-2 text-gray-600">
                {new Date(workout.date).toLocaleDateString('ja-JP')} - {workout.workout_type?.name || '不明'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本情報 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">日付</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(workout.date).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {workout.extended_data?.time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">時刻</label>
                    <p className="mt-1 text-sm text-gray-900">{workout.extended_data.time}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">練習種別</label>
                  <p className="mt-1 text-sm text-gray-900">{workout.workout_type?.name || '不明'}</p>
                </div>
                {workout.extended_data?.session_count && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">部練習数</label>
                    <p className="mt-1 text-sm text-gray-900">{workout.extended_data.session_count}部練</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">総距離</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDistance(workout.distance_meters)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">強度</label>
                  <p className="mt-1 text-sm text-gray-900">{workout.intensity}/10</p>
                </div>
              </div>
            </div>

            {/* タイム情報 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">タイム情報</h2>
              <div className="space-y-3">
                {workout.times_seconds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">区間タイム</label>
                    <div className="mt-1 space-y-1">
                      {workout.times_seconds.map((time, index) => (
                        <p key={index} className="text-sm text-gray-900">
                          区間 {index + 1}: {formatTime(time)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">合計時間</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatTime(workout.times_seconds.reduce((total, time) => total + time, 0))}
                  </p>
                </div>
                {workout.avg_pace_seconds && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">平均ペース</label>
                    <p className="mt-1 text-sm text-gray-900">{formatPace(workout.avg_pace_seconds)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 心拍数情報 */}
            {(workout.avg_heart_rate || workout.max_heart_rate) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">心拍数情報</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workout.avg_heart_rate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">平均心拍数</label>
                      <p className="mt-1 text-sm text-gray-900">{workout.avg_heart_rate} bpm</p>
                    </div>
                  )}
                  {workout.max_heart_rate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">最大心拍数</label>
                      <p className="mt-1 text-sm text-gray-900">{workout.max_heart_rate} bpm</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* メモ */}
            {workout.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">メモ</h2>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{workout.notes}</p>
              </div>
            )}
          </div>

          {/* 詳細情報 */}
          <div className="space-y-6">
            {/* セッション情報 */}
            {workout.extended_data?.session_period && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">セッション情報</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">時間帯</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {workout.extended_data.session_period === 'morning' && '朝練 (6:00-9:00)'}
                    {workout.extended_data.session_period === 'afternoon' && '午後練 (13:00-16:00)'}
                    {workout.extended_data.session_period === 'evening' && '夕練 (16:00-19:00)'}
                    {workout.extended_data.session_period === 'night' && '夜練 (19:00-22:00)'}
                  </p>
                </div>
              </div>
            )}

            {/* 構成要素 */}
            {(workout.extended_data?.warmup_distance || workout.extended_data?.main_distance || workout.extended_data?.cooldown_distance) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">構成要素</h2>
                <div className="space-y-4">
                  {workout.extended_data?.warmup_distance && (
                    <div>
                      <h3 className="font-medium text-gray-800">ウォームアップ</h3>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm text-gray-600">
                          距離: {formatDistance(workout.extended_data.warmup_distance)}
                        </p>
                        {workout.extended_data.warmup_time && (
                          <p className="text-sm text-gray-600">
                            時間: {formatTime(workout.extended_data.warmup_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {workout.extended_data?.main_distance && (
                    <div>
                      <h3 className="font-medium text-gray-800">メイン</h3>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm text-gray-600">
                          距離: {formatDistance(workout.extended_data.main_distance)}
                        </p>
                        {workout.extended_data.main_time && (
                          <p className="text-sm text-gray-600">
                            時間: {formatTime(workout.extended_data.main_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {workout.extended_data?.cooldown_distance && (
                    <div>
                      <h3 className="font-medium text-gray-800">クールダウン</h3>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm text-gray-600">
                          距離: {formatDistance(workout.extended_data.cooldown_distance)}
                        </p>
                        {workout.extended_data.cooldown_time && (
                          <p className="text-sm text-gray-600">
                            時間: {formatTime(workout.extended_data.cooldown_time)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 統計情報 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">統計情報</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">作成日時</span>
                  <span className="text-sm text-gray-900">
                    {new Date(workout.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">更新日時</span>
                  <span className="text-sm text-gray-900">
                    {new Date(workout.updated_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
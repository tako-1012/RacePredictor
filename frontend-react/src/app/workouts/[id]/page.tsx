'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Workout, WorkoutType, WorkoutFormData } from '@/types'
import { WorkoutForm } from '../components/WorkoutForm'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'

export default function EditWorkoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      loadData()
    }
  }, [isAuthenticated, workoutId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [workoutData, typesData] = await Promise.all([
        apiClient.getWorkout(workoutId),
        apiClient.getWorkoutTypes()
      ])
      setWorkout(workoutData)
      setWorkoutTypes(typesData)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: WorkoutFormData) => {
    try {
      setIsSubmitting(true)
      const updatedWorkout = await apiClient.updateWorkout(workoutId, data)
      setWorkout(updatedWorkout)
      setToast({ message: '練習記録を更新しました', type: 'success' })
      router.push('/workouts')
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/workouts')
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
            onClick={loadData}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">練習記録を編集</h1>
          <p className="mt-2 text-gray-600">練習の詳細を修正してください</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <WorkoutForm
            workout={workout}
            workoutTypes={workoutTypes}
            onSubmit={handleSubmit}
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

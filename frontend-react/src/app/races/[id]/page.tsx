'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { Race, RaceType } from '@/types'
import { DetailedRaceForm } from '../components/DetailedRaceForm'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { formatDistance, formatPace, formatTime } from '@/lib/utils'

export default function RaceDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const raceId = params.id as string

  const [race, setRace] = useState<Race | null>(null)
  const [raceTypes, setRaceTypes] = useState<RaceType[]>([])
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
    if (isAuthenticated && raceId) {
      loadRace()
      loadRaceTypes()
    }
  }, [isAuthenticated, raceId])

  const loadRace = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const raceData = await apiClient.getRace(raceId)
      setRace(raceData)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRaceTypes = async () => {
    try {
      const types = await apiClient.getRaceTypes()
      setRaceTypes(types)
    } catch (err) {
      console.error('Failed to load race types:', err)
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      setIsSubmitting(true)
      const updatedRace = await apiClient.updateRace(raceId, data)
      setRace(updatedRace)
      setIsEditing(false)
      setToast({ message: 'レース結果を更新しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このレース結果を削除しますか？この操作は取り消せません。')) return

    try {
      await apiClient.deleteRace(raceId)
      setToast({ message: 'レース結果を削除しました', type: 'success' })
      router.push('/races')
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
            onClick={loadRace}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">レース結果が見つかりません</h2>
          <button
            onClick={() => router.push('/races')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            レース結果一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">レース結果を編集</h1>
            <p className="mt-2 text-gray-600">レースの詳細を修正してください</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <DetailedRaceForm
              race={race}
              raceTypes={raceTypes}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">レース結果詳細</h1>
              <p className="mt-2 text-gray-600">
                {new Date(race.race_date).toLocaleDateString('ja-JP')} - {race.race_name}
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
                    {new Date(race.race_date).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">大会名</label>
                  <p className="mt-1 text-sm text-gray-900">{race.race_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">レース種目</label>
                  <p className="mt-1 text-sm text-gray-900">{race.race_type?.name || '不明'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">距離</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDistance(race.distance_meters)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">タイム</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTime(race.time_seconds)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ペース</label>
                  <p className="mt-1 text-sm text-gray-900">{formatPace(race.pace_seconds)}</p>
                </div>
                {race.place && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">順位</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {race.place}位
                      {race.total_participants && ` / ${race.total_participants}人`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 駅伝情報 */}
            {race.is_relay && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">駅伝情報</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {race.relay_segment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">区間番号</label>
                      <p className="mt-1 text-sm text-gray-900">{race.relay_segment}区</p>
                    </div>
                  )}
                  {race.team_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">チーム名</label>
                      <p className="mt-1 text-sm text-gray-900">{race.team_name}</p>
                    </div>
                  )}
                  {race.relay_time && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">襷時刻</label>
                      <p className="mt-1 text-sm text-gray-900">{race.relay_time}</p>
                    </div>
                  )}
                  {race.segment_place && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">区間順位</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {race.segment_place}位
                        {race.segment_total_participants && ` / ${race.segment_total_participants}人`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 詳細情報 */}
            {(race.weather || race.course_type || race.splits?.length || race.strategy_notes) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">詳細情報</h2>
                <div className="space-y-4">
                  {race.weather && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">天気</label>
                      <p className="mt-1 text-sm text-gray-900">{race.weather}</p>
                    </div>
                  )}
                  {race.course_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">コースタイプ</label>
                      <p className="mt-1 text-sm text-gray-900">{race.course_type}</p>
                    </div>
                  )}
                  {race.splits && race.splits.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">スプリットタイム</label>
                      <div className="mt-1 space-y-1">
                        {race.splits.map((split, index) => (
                          <p key={index} className="text-sm text-gray-900">
                            {index + 1}km: {formatTime(split)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {race.strategy_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">戦略メモ</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{race.strategy_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* メモ */}
            {race.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">メモ</h2>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{race.notes}</p>
              </div>
            )}
          </div>

          {/* 統計情報 */}
          <div className="space-y-6">
            {/* 記録情報 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">記録情報</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">距離</span>
                  <span className="text-sm font-medium text-gray-900">{formatDistance(race.distance_meters)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">タイム</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(race.time_seconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ペース</span>
                  <span className="text-sm font-medium text-gray-900">{formatPace(race.pace_seconds)}</span>
                </div>
                {race.place && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">順位</span>
                    <span className="text-sm font-medium text-gray-900">
                      {race.place}位
                      {race.total_participants && ` / ${race.total_participants}人`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 統計情報 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">統計情報</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">作成日時</span>
                  <span className="text-sm text-gray-900">
                    {new Date(race.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">更新日時</span>
                  <span className="text-sm text-gray-900">
                    {new Date(race.updated_at).toLocaleString('ja-JP')}
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
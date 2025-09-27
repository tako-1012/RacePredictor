'use client'

import { useState } from 'react'
import { RaceSchedule } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { ConfirmDialog } from '@/components/UI/ConfirmDialog'

interface RaceScheduleListProps {
  raceSchedules: RaceSchedule[]
  isLoading: boolean
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onConvertToResult: (schedule: RaceSchedule) => void
  onRefresh: () => void
  onAddSchedule?: () => void
}

export function RaceScheduleList({ 
  raceSchedules, 
  isLoading, 
  onDelete, 
  onComplete, 
  onConvertToResult,
  onRefresh,
  onAddSchedule 
}: RaceScheduleListProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
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

  const isPastDate = (dateString: string) => {
    const raceDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return raceDate < today
  }

  const getDistanceDisplay = (schedule: RaceSchedule) => {
    if (schedule.custom_distance_m) {
      return `${schedule.custom_distance_m}m`
    }
    return schedule.distance
  }

  const formatDistance = (schedule: RaceSchedule) => {
    if (schedule.custom_distance_m) {
      return `${schedule.custom_distance_m}m`
    }
    return schedule.distance
  }

  const getRaceTypeLabel = (raceType: string) => {
    switch (raceType) {
      case 'track': return 'トラック'
      case 'road': return 'ロード'
      case 'relay': return '駅伝'
      default: return raceType
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return '予定'
      case 'completed': return '完了'
      case 'cancelled': return 'キャンセル'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateDaysUntil = (raceDate: string) => {
    const today = new Date()
    const race = new Date(raceDate)
    const diffTime = race.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCountdownText = (raceDate: string) => {
    const days = calculateDaysUntil(raceDate)
    if (days < 0) {
      return `${Math.abs(days)}日前（終了）`
    } else if (days === 0) {
      return '今日'
    } else if (days === 1) {
      return '明日'
    } else {
      return `${days}日後`
    }
  }

  const getCountdownColor = (raceDate: string) => {
    const days = calculateDaysUntil(raceDate)
    if (days < 0) {
      return 'text-gray-500'
    } else if (days <= 7) {
      return 'text-red-600 font-semibold'
    } else if (days <= 30) {
      return 'text-orange-600'
    } else {
      return 'text-gray-600'
    }
  }

  // フィルタリング
  const filteredSchedules = raceSchedules.filter(schedule => {
    if (showCompleted) {
      return schedule.status === 'completed'
    } else {
      return schedule.status === 'scheduled'
    }
  })

  // 日付順にソート（予定は昇順、完了は降順）
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    if (showCompleted) {
      return new Date(b.race_date).getTime() - new Date(a.race_date).getTime()
    } else {
      return new Date(a.race_date).getTime() - new Date(b.race_date).getTime()
    }
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (raceSchedules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">レース予定がありません</h3>
        <p className="text-gray-500 mb-4">最初のレース予定を追加しましょう</p>
        <button
          onClick={onAddSchedule || onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          レース予定を追加
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCompleted(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !showCompleted
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            予定中のレース
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              showCompleted
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            完了したレース
          </button>
        </div>
        
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          更新
        </button>
      </div>

      {/* レース予定一覧 */}
      <div className="grid gap-4">
        {sortedSchedules.map((schedule) => (
          <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {schedule.race_name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                    {getStatusLabel(schedule.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getRaceTypeLabel(schedule.race_type)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">レース日</span>
                    <p className="text-sm text-gray-900">{formatDate(schedule.race_date)}</p>
                    {schedule.status === 'scheduled' && (
                      <p className={`text-sm ${getCountdownColor(schedule.race_date)}`}>
                        {getCountdownText(schedule.race_date)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">距離</span>
                    <p className="text-sm text-gray-900">{formatDistance(schedule)}</p>
                  </div>
                  
                  {schedule.target_time_seconds && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">目標タイム</span>
                      <p className="text-sm text-gray-900">{formatTime(schedule.target_time_seconds)}</p>
                    </div>
                  )}
                </div>
                
                {schedule.location && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">会場:</span> {schedule.location}
                  </div>
                )}
              </div>
              
              {schedule.status === 'scheduled' && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onComplete(schedule.id)}
                    className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50"
                  >
                    完了
                  </button>
                  {isPastDate(schedule.race_date) && (
                    <button
                      onClick={() => onConvertToResult(schedule)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      レース結果に変換
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(schedule.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedSchedules.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {showCompleted ? '完了したレースがありません' : '予定中のレースがありません'}
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="レース予定を削除"
        message="このレース予定を削除しますか？この操作は取り消せません。"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="削除"
        cancelText="キャンセル"
        type="danger"
      />
    </div>
  )
}

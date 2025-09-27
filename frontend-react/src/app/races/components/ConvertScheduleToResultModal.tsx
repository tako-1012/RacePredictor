'use client'

import { useState, useEffect } from 'react'
import { RaceSchedule } from '@/types'
import { formatDateToSlash, formatDateFromSlash } from '@/utils/dateFormat'

interface ConvertScheduleToResultModalProps {
  isOpen: boolean
  schedule: RaceSchedule | null
  onClose: () => void
  onSubmit: (raceData: any) => void
}

export function ConvertScheduleToResultModal({
  isOpen,
  schedule,
  onClose,
  onSubmit
}: ConvertScheduleToResultModalProps) {
  const [formData, setFormData] = useState({
    race_name: '',
    race_date: '',
    race_type: 'track',
    distance_meters: 0,
    time_seconds: 0,
    pace_seconds: 0,
    place: null as number | null,
    total_participants: null as number | null,
    notes: '',
    target_time_seconds: 0,
    target_pace_seconds: 0
  })

  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    if (schedule && isOpen) {
      const distance = schedule.custom_distance_m || parseFloat(schedule.distance) || 0
      setFormData({
        race_name: schedule.race_name,
        race_date: schedule.race_date,
        race_type: schedule.race_type,
        distance_meters: distance,
        time_seconds: 0,
        pace_seconds: 0,
        place: null,
        total_participants: null,
        notes: `目標タイム: ${schedule.target_time_seconds ? formatTime(schedule.target_time_seconds) : '未設定'}`,
        target_time_seconds: schedule.target_time_seconds || 0,
        target_pace_seconds: schedule.target_time_seconds && distance > 0 ? schedule.target_time_seconds / (distance / 1000) : 0
      })
      setTimeString('')
    }
  }, [schedule, isOpen])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
    } else {
      return `${minutes}:${secs.toFixed(2).padStart(5, '0')}`
    }
  }

  const parseTimeInput = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  const handleTimeChange = (value: string) => {
    setTimeString(value)
    const timeSeconds = parseTimeInput(value)
    setFormData(prev => ({
      ...prev,
      time_seconds: timeSeconds,
      pace_seconds: timeSeconds > 0 && prev.distance_meters > 0 ? timeSeconds / (prev.distance_meters / 1000) : 0
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.time_seconds <= 0) {
      alert('レースタイムを入力してください')
      return
    }
    onSubmit(formData)
  }

  if (!isOpen || !schedule) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">レース結果に変換</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">元のレース予定情報</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><span className="font-medium">レース名:</span> {schedule.race_name}</p>
              <p><span className="font-medium">日付:</span> {schedule.race_date}</p>
              <p><span className="font-medium">距離:</span> {schedule.custom_distance_m ? `${schedule.custom_distance_m}m` : schedule.distance}</p>
              <p><span className="font-medium">種目:</span> {schedule.race_type === 'track' ? 'トラック' : schedule.race_type === 'road' ? 'ロード' : '駅伝'}</p>
              {schedule.target_time_seconds && (
                <p><span className="font-medium">目標タイム:</span> {formatTime(schedule.target_time_seconds)}</p>
              )}
              {schedule.location && (
                <p><span className="font-medium">会場:</span> {schedule.location}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* レースタイム入力 */}
            <div>
              <label htmlFor="time_seconds" className="block text-sm font-medium text-gray-700 mb-2">
                レースタイム *
              </label>
              <input
                type="text"
                id="time_seconds"
                value={timeString}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 15:30.50 または 1:15:30"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                形式: MM:SS.SS または HH:MM:SS
              </p>
            </div>

            {/* 順位 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="place" className="block text-sm font-medium text-gray-700 mb-2">
                  順位
                </label>
                <input
                  type="number"
                  id="place"
                  min="1"
                  value={formData.place || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, place: parseInt(e.target.value) || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 3"
                />
              </div>
              <div>
                <label htmlFor="total_participants" className="block text-sm font-medium text-gray-700 mb-2">
                  参加者数
                </label>
                <input
                  type="number"
                  id="total_participants"
                  min="1"
                  value={formData.total_participants || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_participants: parseInt(e.target.value) || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 100"
                />
              </div>
            </div>

            {/* メモ */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                メモ
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="レースの感想やコメントを入力してください"
              />
            </div>

            {/* 目標タイムとの比較 */}
            {formData.target_time_seconds > 0 && formData.time_seconds > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">目標タイムとの比較</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">目標タイム:</span> {formatTime(formData.target_time_seconds)}</p>
                  <p><span className="font-medium">実際のタイム:</span> {formatTime(formData.time_seconds)}</p>
                  <p><span className="font-medium">差:</span> 
                    <span className={`ml-1 ${formData.time_seconds <= formData.target_time_seconds ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.time_seconds <= formData.target_time_seconds ? '-' : '+'}{formatTime(Math.abs(formData.time_seconds - formData.target_time_seconds))}
                    </span>
                  </p>
                  <p><span className="font-medium">目標ペース:</span> {formatTime(formData.target_pace_seconds)}/km</p>
                  <p><span className="font-medium">実際のペース:</span> {formatTime(formData.pace_seconds)}/km</p>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                レース結果として保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

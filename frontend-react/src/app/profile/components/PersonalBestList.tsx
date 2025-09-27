'use client'

import { useState } from 'react'
import { PersonalBest, PersonalBestFormData } from '@/types'
import { PersonalBestForm } from './PersonalBestForm'

interface PersonalBestListProps {
  personalBests: PersonalBest[]
  onUpdate: (id: string, data: PersonalBestFormData) => void
  onDelete: (id: string) => void
}

export function PersonalBestList({ personalBests, onUpdate, onDelete }: PersonalBestListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (personalBest: PersonalBest) => {
    if (personalBest.custom_distance_m) {
      return `${personalBest.custom_distance_m}m`
    }
    return personalBest.distance
  }

  const getRaceTypeLabel = (raceType: string) => {
    switch (raceType) {
      case 'track': return 'トラック'
      case 'road': return 'ロード'
      case 'relay': return '駅伝'
      default: return raceType
    }
  }

  const calculatePace = (distance: number, timeSeconds: number) => {
    if (distance === 0) return '0:00'
    const paceSeconds = timeSeconds / (distance / 1000)
    const minutes = Math.floor(paceSeconds / 60)
    const seconds = Math.floor(paceSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setShowAddForm(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleUpdate = async (id: string, data: PersonalBestFormData) => {
    await onUpdate(id, data)
    setEditingId(null)
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingId(null)
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
  }

  const handleAdd = async (data: PersonalBestFormData) => {
    // 親コンポーネントで処理される
    setShowAddForm(false)
  }

  // 種目別にグループ化
  const groupedBests = personalBests.reduce((acc, best) => {
    if (!acc[best.race_type]) {
      acc[best.race_type] = []
    }
    acc[best.race_type].push(best)
    return acc
  }, {} as Record<string, PersonalBest[]>)

  // 各グループ内でタイム順にソート
  Object.keys(groupedBests).forEach(raceType => {
    groupedBests[raceType].sort((a, b) => a.time_seconds - b.time_seconds)
  })

  if (personalBests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">自己ベストがありません</h3>
        <p className="text-gray-500 mb-4">最初の自己ベストを追加しましょう</p>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          自己ベストを追加
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">新しい自己ベストを追加</h3>
          <PersonalBestForm
            onSubmit={handleAdd}
            onCancel={handleCancelAdd}
          />
        </div>
      )}

      {/* 自己ベスト一覧 */}
      {Object.entries(groupedBests).map(([raceType, bests]) => (
        <div key={raceType} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {getRaceTypeLabel(raceType)}
          </h3>
          
          <div className="grid gap-4">
            {bests.map((best) => (
              <div key={best.id} className="bg-white border border-gray-200 rounded-lg p-4">
                {editingId === best.id ? (
                  <PersonalBestForm
                    initialData={best}
                    onSubmit={(data) => handleUpdate(best.id, data)}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {formatDistance(best)}
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatTime(best.time_seconds)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {calculatePace(
                            best.custom_distance_m || 
                            (best.distance.includes('km') ? parseFloat(best.distance) * 1000 : 
                             best.distance.includes('m') ? parseInt(best.distance) : 0),
                            best.time_seconds
                          )}/km
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">達成日:</span> {new Date(best.achieved_date).toLocaleDateString('ja-JP')}
                        </div>
                        {best.race_name && (
                          <div>
                            <span className="font-medium">レース名:</span> {best.race_name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(best.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => onDelete(best.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 追加ボタン */}
      {!showAddForm && (
        <div className="text-center">
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新しい自己ベストを追加
          </button>
        </div>
      )}
    </div>
  )
}

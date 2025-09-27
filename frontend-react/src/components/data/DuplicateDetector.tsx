'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface DuplicateRecord {
  id: string
  date: string
  distance_km: number
  time_minutes: number
  pace_per_km: number
  workout_name?: string
  similarity_score: number
}

interface DuplicateGroup {
  id: string
  records: DuplicateRecord[]
  similarity_type: 'exact' | 'similar' | 'potential'
  suggested_action: 'merge' | 'keep_all' | 'delete_duplicates'
}

interface DuplicateDetectorProps {
  records: DuplicateRecord[]
  onMerge?: (group: DuplicateGroup) => void
  onDelete?: (recordIds: string[]) => void
  onKeepAll?: (group: DuplicateGroup) => void
}

export function DuplicateDetector({ 
  records, 
  onMerge, 
  onDelete, 
  onKeepAll 
}: DuplicateDetectorProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (records.length > 0) {
      scanForDuplicates()
    }
  }, [records])

  const scanForDuplicates = async () => {
    setIsScanning(true)
    
    // 重複検出ロジック（実際の実装では、より高度なアルゴリズムを使用）
    const groups = detectDuplicates(records)
    setDuplicateGroups(groups)
    
    setIsScanning(false)
  }

  const detectDuplicates = (records: DuplicateRecord[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = []
    const processed = new Set<string>()

    for (let i = 0; i < records.length; i++) {
      if (processed.has(records[i].id)) continue

      const group: DuplicateRecord[] = [records[i]]
      processed.add(records[i].id)

      for (let j = i + 1; j < records.length; j++) {
        if (processed.has(records[j].id)) continue

        const similarity = calculateSimilarity(records[i], records[j])
        
        if (similarity > 0.8) { // 80%以上の類似度
          group.push(records[j])
          processed.add(records[j].id)
        }
      }

      if (group.length > 1) {
        const similarityType = determineSimilarityType(group)
        const suggestedAction = determineSuggestedAction(group, similarityType)
        
        groups.push({
          id: `group_${i}`,
          records: group,
          similarity_type: similarityType,
          suggested_action: suggestedAction
        })
      }
    }

    return groups
  }

  const calculateSimilarity = (record1: DuplicateRecord, record2: DuplicateRecord): number => {
    const dateDiff = Math.abs(new Date(record1.date).getTime() - new Date(record2.date).getTime())
    const distanceDiff = Math.abs(record1.distance_km - record2.distance_km)
    const timeDiff = Math.abs(record1.time_minutes - record2.time_minutes)
    const paceDiff = Math.abs(record1.pace_per_km - record2.pace_per_km)

    // 日付の重みを高く設定（同日の記録は重複の可能性が高い）
    const dateScore = dateDiff < 24 * 60 * 60 * 1000 ? 1 : 0 // 24時間以内
    const distanceScore = distanceDiff < 0.1 ? 1 : Math.max(0, 1 - distanceDiff / 5) // 5km以内
    const timeScore = timeDiff < 1 ? 1 : Math.max(0, 1 - timeDiff / 60) // 60分以内
    const paceScore = paceDiff < 0.1 ? 1 : Math.max(0, 1 - paceDiff / 2) // 2分/km以内

    return (dateScore * 0.4 + distanceScore * 0.2 + timeScore * 0.2 + paceScore * 0.2)
  }

  const determineSimilarityType = (group: DuplicateRecord[]): 'exact' | 'similar' | 'potential' => {
    const firstRecord = group[0]
    const isExact = group.every(record => 
      record.date === firstRecord.date &&
      Math.abs(record.distance_km - firstRecord.distance_km) < 0.01 &&
      Math.abs(record.time_minutes - firstRecord.time_minutes) < 0.01
    )

    if (isExact) return 'exact'
    
    const isSimilar = group.every(record => 
      record.date === firstRecord.date &&
      Math.abs(record.distance_km - firstRecord.distance_km) < 0.5 &&
      Math.abs(record.time_minutes - firstRecord.time_minutes) < 5
    )

    return isSimilar ? 'similar' : 'potential'
  }

  const determineSuggestedAction = (
    group: DuplicateRecord[], 
    similarityType: 'exact' | 'similar' | 'potential'
  ): 'merge' | 'keep_all' | 'delete_duplicates' => {
    switch (similarityType) {
      case 'exact':
        return 'delete_duplicates'
      case 'similar':
        return 'merge'
      case 'potential':
        return 'keep_all'
      default:
        return 'keep_all'
    }
  }

  const handleGroupAction = (group: DuplicateGroup, action: 'merge' | 'delete' | 'keep') => {
    switch (action) {
      case 'merge':
        onMerge?.(group)
        break
      case 'delete':
        const duplicateIds = group.records.slice(1).map(r => r.id)
        onDelete?.(duplicateIds)
        break
      case 'keep':
        onKeepAll?.(group)
        break
    }
    
    // グループを処理済みとしてマーク
    setSelectedGroups(prev => new Set([...prev, group.id]))
  }

  const getSimilarityColor = (type: string) => {
    switch (type) {
      case 'exact':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'similar':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'potential':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSimilarityText = (type: string) => {
    switch (type) {
      case 'exact':
        return '完全一致'
      case 'similar':
        return '類似'
      case 'potential':
        return '可能性'
      default:
        return '不明'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'merge':
        return '統合'
      case 'delete_duplicates':
        return '重複削除'
      case 'keep_all':
        return 'すべて保持'
      default:
        return '不明'
    }
  }

  if (isScanning) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">重複をスキャン中...</span>
        </div>
      </div>
    )
  }

  if (duplicateGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <Icons.CheckCircle size="xl" className="mx-auto text-green-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          重複は見つかりませんでした
        </h3>
        <p className="text-gray-600">
          すべての記録が一意です。データの品質が良好です。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            重複検出結果
          </h3>
          <p className="text-sm text-gray-600">
            {duplicateGroups.length} グループの重複を検出しました
          </p>
        </div>
        <button
          onClick={scanForDuplicates}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          再スキャン
        </button>
      </div>

      {/* 重複グループ一覧 */}
      <div className="space-y-4">
        {duplicateGroups.map(group => (
          <div
            key={group.id}
            className={`rounded-lg border p-4 ${
              selectedGroups.has(group.id) ? 'opacity-50' : ''
            }`}
          >
            {/* グループヘッダー */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Icons.Users size="sm" className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {group.records.length} 件の類似記録
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(group.similarity_type)}`}>
                  {getSimilarityText(group.similarity_type)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  推奨: {getActionText(group.suggested_action)}
                </span>
                {!selectedGroups.has(group.id) && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleGroupAction(group, 'merge')}
                      className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      統合
                    </button>
                    <button
                      onClick={() => handleGroupAction(group, 'delete')}
                      className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      重複削除
                    </button>
                    <button
                      onClick={() => handleGroupAction(group, 'keep')}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      保持
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 記録一覧 */}
            <div className="space-y-2">
              {group.records.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {record.workout_name || '無題の練習'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(record.date).toLocaleDateString('ja-JP')} - 
                        {record.distance_km}km - 
                        {Math.floor(record.time_minutes / 60)}:{(record.time_minutes % 60).toString().padStart(2, '0')} - 
                        {record.pace_per_km.toFixed(1)}分/km
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    類似度: {(record.similarity_score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 一括操作 */}
      {duplicateGroups.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            一括操作
          </h4>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
              すべて統合
            </button>
            <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
              重複をすべて削除
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
              すべて保持
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

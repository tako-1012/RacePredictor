'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface ResponsiveTableColumn {
  key: string
  label: string
  mobileLabel?: string
  priority: 'high' | 'medium' | 'low'
  render?: (value: any, row: any) => React.ReactNode
  className?: string
}

interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[]
  data: any[]
  className?: string
  mobileCardRender?: (row: any) => React.ReactNode
  emptyMessage?: string
  loading?: boolean
}

export function ResponsiveTable({
  columns,
  data,
  className = '',
  mobileCardRender,
  emptyMessage = 'データがありません',
  loading = false
}: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const getHighPriorityColumns = () => {
    return columns.filter(col => col.priority === 'high')
  }

  const getMediumPriorityColumns = () => {
    return columns.filter(col => col.priority === 'medium')
  }

  const getLowPriorityColumns = () => {
    return columns.filter(col => col.priority === 'low')
  }

  const renderMobileCard = (row: any, index: number) => {
    if (mobileCardRender) {
      return mobileCardRender(row)
    }

    const highPriorityCols = getHighPriorityColumns()
    const mediumPriorityCols = getMediumPriorityColumns()
    const lowPriorityCols = getLowPriorityColumns()
    const isExpanded = expandedRows.has(`row-${index}`)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
        {/* 高優先度カラム（常に表示） */}
        <div className="space-y-2">
          {highPriorityCols.map((column) => (
            <div key={column.key} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                {column.mobileLabel || column.label}
              </span>
              <span className="text-sm text-gray-900">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </span>
            </div>
          ))}
        </div>

        {/* 中優先度カラム（展開時のみ表示） */}
        {isExpanded && mediumPriorityCols.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {mediumPriorityCols.map((column) => (
              <div key={column.key} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {column.mobileLabel || column.label}
                </span>
                <span className="text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 低優先度カラム（展開時のみ表示） */}
        {isExpanded && lowPriorityCols.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {lowPriorityCols.map((column) => (
              <div key={column.key} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {column.mobileLabel || column.label}
                </span>
                <span className="text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 展開/折りたたみボタン */}
        {(mediumPriorityCols.length > 0 || lowPriorityCols.length > 0) && (
          <button
            onClick={() => toggleRowExpansion(`row-${index}`)}
            className="mt-3 w-full flex items-center justify-center space-x-2 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <span>{isExpanded ? '詳細を隠す' : '詳細を表示'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <EyeOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* デスクトップ表示 */}
      <div className={`hidden lg:block ${className}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* モバイル表示 */}
      <div className={`lg:hidden ${className}`}>
        <div className="space-y-3">
          {data.map((row, index) => (
            <div key={index}>
              {renderMobileCard(row, index)}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// よく使用されるカラム定義のヘルパー関数
export const createTableColumns = {
  workout: (): ResponsiveTableColumn[] => [
    {
      key: 'date',
      label: '日付',
      mobileLabel: '日付',
      priority: 'high',
      render: (value) => new Date(value).toLocaleDateString('ja-JP')
    },
    {
      key: 'workout_type',
      label: '種別',
      mobileLabel: '種別',
      priority: 'high',
      render: (value) => typeof value === 'object' ? value?.name || 'その他' : value || 'その他'
    },
    {
      key: 'distance_meters',
      label: '距離',
      mobileLabel: '距離',
      priority: 'high',
      render: (value) => value ? `${(value / 1000).toFixed(1)}km` : '--'
    },
    {
      key: 'duration_seconds',
      label: '時間',
      mobileLabel: '時間',
      priority: 'high',
      render: (value) => {
        if (!value) return '--'
        const hours = Math.floor(value / 3600)
        const minutes = Math.floor((value % 3600) / 60)
        const seconds = Math.floor(value % 60)
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    },
    {
      key: 'avg_pace_seconds',
      label: 'ペース',
      mobileLabel: 'ペース',
      priority: 'medium',
      render: (value) => {
        if (!value) return '--'
        const minutes = Math.floor(value / 60)
        const seconds = Math.floor(value % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
      }
    },
    {
      key: 'intensity',
      label: '強度',
      mobileLabel: '強度',
      priority: 'medium',
      render: (value) => value ? `${value}/10` : '--'
    },
    {
      key: 'notes',
      label: 'メモ',
      mobileLabel: 'メモ',
      priority: 'low',
      render: (value) => value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : '--'
    }
  ],

  race: (): ResponsiveTableColumn[] => [
    {
      key: 'race_date',
      label: '日付',
      mobileLabel: '日付',
      priority: 'high',
      render: (value) => new Date(value).toLocaleDateString('ja-JP')
    },
    {
      key: 'race_name',
      label: '大会名',
      mobileLabel: '大会名',
      priority: 'high',
      render: (value) => value || '--'
    },
    {
      key: 'distance_meters',
      label: '距離',
      mobileLabel: '距離',
      priority: 'high',
      render: (value) => value ? `${(value / 1000).toFixed(1)}km` : '--'
    },
    {
      key: 'time_seconds',
      label: 'タイム',
      mobileLabel: 'タイム',
      priority: 'high',
      render: (value) => {
        if (!value) return '--'
        const hours = Math.floor(value / 3600)
        const minutes = Math.floor((value % 3600) / 60)
        const seconds = Math.floor(value % 60)
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    },
    {
      key: 'pace_seconds',
      label: 'ペース',
      mobileLabel: 'ペース',
      priority: 'medium',
      render: (value) => {
        if (!value) return '--'
        const minutes = Math.floor(value / 60)
        const seconds = Math.floor(value % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
      }
    },
    {
      key: 'place',
      label: '順位',
      mobileLabel: '順位',
      priority: 'medium',
      render: (value, row) => {
        if (!value) return '--'
        const total = row.total_participants
        return total ? `${value}位 / ${total}人` : `${value}位`
      }
    },
    {
      key: 'weather',
      label: '天気',
      mobileLabel: '天気',
      priority: 'low',
      render: (value) => value || '--'
    }
  ]
}

'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

// インタラクティブな統計表示用のコンポーネント
interface InteractiveChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  onDataPointClick?: (dataPoint: any) => void
  type?: 'bar' | 'line' | 'pie'
  title?: string
}

export function InteractiveChart({ 
  data, 
  onDataPointClick, 
  type = 'bar', 
  title 
}: InteractiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const maxValue = Math.max(...data.map(d => d.value))

  const handleDataPointClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index)
    if (onDataPointClick) {
      onDataPointClick(data[index])
    }
  }

  const renderBarChart = () => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 relative">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all duration-300 ${
                  hoveredIndex === index ? 'opacity-80' : ''
                } ${
                  selectedIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#3b82f6'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleDataPointClick(index)}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => (
    <div className="relative h-64">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 400
          const y = 200 - (item.value / maxValue) * 200
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r={hoveredIndex === index ? 8 : 4}
                fill={item.color || '#3b82f6'}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleDataPointClick(index)}
              />
              {hoveredIndex === index && (
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {item.label}: {item.value}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )

  const renderPieChart = () => {
    let cumulativePercentage = 0
    
    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {data.map((item, index) => {
            const percentage = (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100
            const startAngle = (cumulativePercentage / 100) * 360
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360
            
            cumulativePercentage += percentage
            
            const startAngleRad = (startAngle * Math.PI) / 180
            const endAngleRad = (endAngle * Math.PI) / 180
            
            const x1 = 100 + 80 * Math.cos(startAngleRad)
            const y1 = 100 + 80 * Math.sin(startAngleRad)
            const x2 = 100 + 80 * Math.cos(endAngleRad)
            const y2 = 100 + 80 * Math.sin(endAngleRad)
            
            const largeArcFlag = percentage > 50 ? 1 : 0
            
            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color || '#3b82f6'}
                className={`cursor-pointer transition-all duration-200 ${
                  hoveredIndex === index ? 'opacity-80' : ''
                } ${
                  selectedIndex === index ? 'stroke-2 stroke-blue-500' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleDataPointClick(index)}
              />
            )
          })}
        </svg>
        
        {/* 凡例 */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center space-x-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-sm"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || '#3b82f6' }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
      
      {selectedIndex !== null && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            選択中: {data[selectedIndex].label} - {data[selectedIndex].value}
          </p>
        </div>
      )}
    </div>
  )
}

// 期間指定での動的集計コンポーネント
interface DynamicAggregationProps {
  data: any[]
  onAggregationChange: (aggregatedData: any[]) => void
}

export function DynamicAggregation({ data, onAggregationChange }: DynamicAggregationProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
  const [aggregationType, setAggregationType] = useState<'sum' | 'avg' | 'count'>('sum')
  const [field, setField] = useState<string>('distance_km')

  useEffect(() => {
    const aggregated = aggregateData(data, period, aggregationType, field)
    onAggregationChange(aggregated)
  }, [data, period, aggregationType, field, onAggregationChange])

  const aggregateData = (data: any[], period: string, type: string, field: string) => {
    const groups = new Map<string, any[]>()

    data.forEach(item => {
      const date = new Date(item.date)
      let key: string

      switch (period) {
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
        default:
          key = item.date
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })

    return Array.from(groups.entries()).map(([key, items]) => {
      const values = items.map(item => item[field]).filter(val => val != null)
      
      let aggregatedValue: number
      switch (type) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + Number(val), 0)
          break
        case 'avg':
          aggregatedValue = values.length > 0 
            ? values.reduce((sum, val) => sum + Number(val), 0) / values.length 
            : 0
          break
        case 'count':
          aggregatedValue = values.length
          break
        default:
          aggregatedValue = 0
      }

      return {
        period: key,
        value: aggregatedValue,
        count: items.length
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">集計設定</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">週</option>
            <option value="month">月</option>
            <option value="year">年</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">集計方法</label>
          <select
            value={aggregationType}
            onChange={(e) => setAggregationType(e.target.value as 'sum' | 'avg' | 'count')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sum">合計</option>
            <option value="avg">平均</option>
            <option value="count">件数</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">フィールド</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="distance_km">距離</option>
            <option value="time_minutes">時間</option>
            <option value="pace_per_km">ペース</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// カスタマイズ可能ダッシュボードコンポーネント
interface CustomizableDashboardProps {
  widgets: Array<{
    id: string
    title: string
    component: React.ReactNode
    enabled: boolean
    position: number
  }>
  onWidgetToggle: (widgetId: string) => void
  onWidgetReorder: (fromIndex: number, toIndex: number) => void
  layout: 'grid' | 'list'
  onLayoutChange: (layout: 'grid' | 'list') => void
}

export function CustomizableDashboard({
  widgets,
  onWidgetToggle,
  onWidgetReorder,
  layout,
  onLayoutChange
}: CustomizableDashboardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const enabledWidgets = widgets
    .filter(widget => widget.enabled)
    .sort((a, b) => a.position - b.position)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onWidgetReorder(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* ダッシュボード設定 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onLayoutChange('grid')}
              className={`p-2 rounded-md ${
                layout === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Icons.Grid size="sm" />
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={`p-2 rounded-md ${
                layout === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Icons.List size="sm" />
            </button>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Icons.Settings size="sm" />
            <span>{isEditing ? '完了' : '編集'}</span>
          </button>
        </div>
      </div>

      {/* ウィジェット設定 */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ウィジェット設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map(widget => (
              <div
                key={widget.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md"
              >
                <input
                  type="checkbox"
                  checked={widget.enabled}
                  onChange={() => onWidgetToggle(widget.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">{widget.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ウィジェット表示 */}
      <div className={`${
        layout === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-6'
      }`}>
        {enabledWidgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable={isEditing}
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`${
              isEditing ? 'cursor-move' : ''
            } ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            {widget.component}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface HeatmapChartProps {
  data: Array<{
    date: string
    value: number
  }>
  year?: number
}

export function HeatmapChart({ data, year = new Date().getFullYear() }: HeatmapChartProps) {
  const [selectedYear, setSelectedYear] = useState(year)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getIntensityColor = (value: number, maxValue: number) => {
    if (value === 0) return 'bg-gray-100'
    
    const intensity = value / maxValue
    if (intensity >= 0.8) return 'bg-green-600'
    if (intensity >= 0.6) return 'bg-green-500'
    if (intensity >= 0.4) return 'bg-green-400'
    if (intensity >= 0.2) return 'bg-green-300'
    return 'bg-green-200'
  }

  const getMaxValue = () => {
    return Math.max(...data.map(d => d.value), 1)
  }

  const generateCalendarData = () => {
    const calendarData: Array<Array<{ date: string; value: number; isCurrentMonth: boolean }>> = []
    const startDate = new Date(selectedYear, 0, 1)
    const endDate = new Date(selectedYear, 11, 31)
    
    // データを日付でマップ
    const dataMap = new Map(data.map(d => [d.date, d.value]))
    
    let currentDate = new Date(startDate)
    let week: Array<{ date: string; value: number; isCurrentMonth: boolean }> = []
    
    // 年の最初の日曜日まで移動
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]
      const value = dataMap.get(dateString) || 0
      const isCurrentMonth = currentDate.getFullYear() === selectedYear
      
      week.push({
        date: dateString,
        value,
        isCurrentMonth
      })
      
      if (week.length === 7) {
        calendarData.push([...week])
        week = []
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (week.length > 0) {
      calendarData.push(week)
    }
    
    return calendarData
  }

  const calendarData = generateCalendarData()
  const maxValue = getMaxValue()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">活動ヒートマップ</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            ←
          </button>
          <span className="px-2 py-1 text-sm font-medium">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            →
          </button>
        </div>
      </div>

      {/* カレンダー */}
      <div className="space-y-1">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="text-center py-1">{day}</div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="space-y-1">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(day.value, maxValue)} ${
                    !day.isCurrentMonth ? 'opacity-30' : ''
                  }`}
                  title={`${formatDate(day.date)}: ${day.value}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>少ない</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
        </div>
        <span>多い</span>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.filter(d => d.value > 0).length}
          </div>
          <div className="text-xs text-gray-600">活動日数</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, d) => sum + d.value, 0)}
          </div>
          <div className="text-xs text-gray-600">総活動量</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.max(...data.map(d => d.value))}
          </div>
          <div className="text-xs text-gray-600">最大活動量</div>
        </div>
      </div>
    </div>
  )
}

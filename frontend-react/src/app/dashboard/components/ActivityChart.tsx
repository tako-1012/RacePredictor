'use client'

import { useState, memo, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ActivityChartProps {
  data?: number[]
  labels?: string[]
  weeklyData?: {
    distance_km: number
    workout_count: number
    time_minutes: number
  }
}

export const ActivityChart = memo(function ActivityChart({ data, labels, weeklyData }: ActivityChartProps) {
  const [chartHeight, setChartHeight] = useState('280px')
  
  // dataがundefinedまたは空の場合はデフォルト値を設定
  const safeData = data || [0, 0, 0, 0, 0, 0, 0]
  const maxDistance = Math.max(...safeData, 1)
  
  // バックエンドから送られてくるラベルを使用、なければデフォルトの曜日を生成
  const weekLabels = labels ? labels.map((label, index) => {
    // ラベルが "MM/DD" 形式の場合、日付部分を抽出
    const dateMatch = label.match(/(\d+)\/(\d+)/)
    if (dateMatch) {
      const month = parseInt(dateMatch[1])
      const day = parseInt(dateMatch[2])
      const weeks = ['月', '火', '水', '木', '金', '土', '日']
      return {
        day: weeks[index] || '',
        date: day
      }
    }
    return {
      day: '',
      date: label
    }
  }) : (() => {
    // フォールバック: 現在の週の日付を計算
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    
    const weeks = ['月', '火', '水', '木', '金', '土', '日']
    return weeks.map((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return {
        day,
        date: date.getDate()
      }
    })
  })()

  // レスポンシブ高さの計算（最適化）
  const getOptimalChartHeight = () => {
    if (typeof window === 'undefined') return '280px'
    
    if (window.innerWidth < 640) {
      return '240px'  // スマートフォン
    } else if (window.innerWidth < 1024) {
      return '260px'  // タブレット
    } else {
      return '280px'  // デスクトップ
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setChartHeight(getOptimalChartHeight())
    }

    setChartHeight(getOptimalChartHeight())
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Y軸の最大値を動的に計算
  const calculateYAxisMax = (data: number[]) => {
    const maxValue = Math.max(...data);
    const buffer = maxValue * 0.2; // 20%のバッファ
    return Math.ceil((maxValue + buffer) / 3) * 3; // 3の倍数に丸める
  };

  const yAxisMax = calculateYAxisMax(safeData);

  // Chart.jsの設定
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    
    layout: {
      padding: {
        top: 20,      // 上部余白増加
        right: 20,    
        bottom: 15,   // 下部余白増加
        left: 40      // Y軸ラベル用の左側余白拡大
      }
    },
    
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#e5e7eb',
          drawBorder: false,
          drawTicks: true
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 13  // フォントサイズ拡大
          },
          padding: 12,
          callback: function(value: any, index: number) {
            const label = weekLabels[index]
            return `${label.day}\n${label.date}`
          }
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: yAxisMax, // 動的に設定
        ticks: {
          stepSize: yAxisMax / 4, // 4つの目盛りに分割
          color: '#6b7280',
          font: {
            size: 12  // Y軸フォント拡大
          },
          callback: function(value: any) {
            return value.toFixed(1);
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        }
      }
    },
    
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = weekLabels[context.dataIndex]
            return `${label.day}(${label.date}日): ${context.parsed.y.toFixed(1)} km`
          }
        }
      }
    }
  }

  // Chart.js用のデータ
  const chartData = {
    labels: weekLabels.map(label => `${label.day}\n${label.date}`),
    datasets: [
      {
        data: safeData,
        backgroundColor: safeData.map((value, index) => 
          value > 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(156, 163, 175, 0.3)'
        ),
        borderColor: safeData.map((value, index) => 
          value > 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(156, 163, 175, 0.5)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }
  
  const formatDistance = (distanceKm: number) => {
    return `${distanceKm.toFixed(1)} km`
  }

  const formatPace = (distanceKm: number, timeMinutes: number) => {
    if (distanceKm === 0 || timeMinutes === 0) return '--:--'
    const paceMinutes = timeMinutes / distanceKm
    const minutes = Math.floor(paceMinutes)
    const seconds = Math.round((paceMinutes - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      {/* グラフエリアを大幅拡大 */}
      <div 
        className="chart-container mb-6" 
        style={{ 
          height: chartHeight,
          position: 'relative'
        }}
      >
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* 統計情報を下部に大きく間隔を空けて配置 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-4 mt-6 border-t-2 border-gray-100">
        <div className="stat-item">
          <div className="stat-number text-blue-600">
            {weeklyData ? weeklyData.distance_km.toFixed(1) : safeData.reduce((sum, d) => sum + d, 0).toFixed(1)}
          </div>
          <div className="stat-label text-gray-700 font-medium">週間合計</div>
          <div className="stat-unit">km</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-green-600">
            {weeklyData ? weeklyData.workout_count : safeData.filter(d => d > 0).length}
          </div>
          <div className="stat-label text-gray-700 font-medium">練習回数</div>
          <div className="stat-unit">回</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-orange-600">
            {weeklyData ? Math.round(weeklyData.time_minutes) : Math.round(safeData.reduce((sum, d) => sum + d, 0) / 7)}
          </div>
          <div className="stat-label text-gray-700 font-medium">練習時間</div>
          <div className="stat-unit">分</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-purple-600">
            {weeklyData ? formatPace(weeklyData.distance_km, weeklyData.time_minutes) : '--:--'}
          </div>
          <div className="stat-label text-gray-700 font-medium">平均ペース</div>
          <div className="stat-unit">/km</div>
        </div>
      </div>
    </div>
  )
})

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

interface MonthlyActivityChartProps {
  data?: number[]
  monthlyData?: {
    distance_km: number
    workout_count: number
    time_minutes: number
  }
}

export const MonthlyActivityChart = memo(function MonthlyActivityChart({ data, monthlyData }: MonthlyActivityChartProps) {
  const [chartHeight, setChartHeight] = useState('280px')
  
  // dataがundefinedまたは空の場合はデフォルト値を設定
  const safeData = data || new Array(30).fill(0)
  const maxDistance = Math.max(...safeData, 1)
  
  // 今月の日付を計算する関数
  const getMonthDates = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    // 今月の日数を取得
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const monthDates = []
    for (let day = 1; day <= daysInMonth; day++) {
      monthDates.push(day)
    }
    
    return monthDates
  }
  
  const monthDates = getMonthDates()
  
  // レスポンシブ高さの計算
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
        top: 20,
        right: 20,
        bottom: 15,
        left: 40
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
            size: 11
          },
          padding: 8,
          maxTicksLimit: 15, // 最大15個の目盛り
          callback: function(value: any, index: number) {
            // 5日おきに表示
            if (index % 5 === 0) {
              return monthDates[index]?.toString() || ''
            }
            return ''
          }
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: yAxisMax,
        ticks: {
          stepSize: yAxisMax / 4,
          color: '#6b7280',
          font: {
            size: 12
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
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#22c55e',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const day = monthDates[context.dataIndex]
            return `${day}日: ${context.parsed.y.toFixed(1)} km`
          }
        }
      }
    }
  }

  // Chart.js用のデータ
  const chartData = {
    labels: monthDates.map(day => day.toString()),
    datasets: [
      {
        data: safeData,
        backgroundColor: safeData.map((value, index) => 
          value > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(156, 163, 175, 0.3)'
        ),
        borderColor: safeData.map((value, index) => 
          value > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(156, 163, 175, 0.5)'
        ),
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
      }
    ]
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
      {/* グラフエリア */}
      <div 
        className="chart-container mb-6" 
        style={{ 
          height: chartHeight,
          position: 'relative'
        }}
      >
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-4 mt-6 border-t-2 border-gray-100">
        <div className="stat-item">
          <div className="stat-number text-green-600">
            {monthlyData ? monthlyData.distance_km.toFixed(1) : safeData.reduce((sum, d) => sum + d, 0).toFixed(1)}
          </div>
          <div className="stat-label text-gray-700 font-medium">月間合計</div>
          <div className="stat-unit">km</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-green-600">
            {monthlyData ? monthlyData.workout_count : safeData.filter(d => d > 0).length}
          </div>
          <div className="stat-label text-gray-700 font-medium">練習回数</div>
          <div className="stat-unit">回</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-green-600">
            {monthlyData ? Math.round(monthlyData.time_minutes) : Math.round(safeData.reduce((sum, d) => sum + d, 0) / 30)}
          </div>
          <div className="stat-label text-gray-700 font-medium">練習時間</div>
          <div className="stat-unit">分</div>
        </div>
        <div className="stat-item">
          <div className="stat-number text-green-600">
            {monthlyData ? formatPace(monthlyData.distance_km, monthlyData.time_minutes) : '--:--'}
          </div>
          <div className="stat-label text-gray-700 font-medium">平均ペース</div>
          <div className="stat-unit">/km</div>
        </div>
      </div>
    </div>
  )
})

'use client'

import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'
import { DashboardStats } from '@/types'
import { ActivityChart } from './ActivityChart'
import { DistanceChart } from './DistanceChart'
import { PaceChart } from './PaceChart'
import { HeatmapChart } from './HeatmapChart'

interface AdvancedDashboardProps {
  stats: DashboardStats
}

export function AdvancedDashboard({ stats }: AdvancedDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'comparison'>('overview')
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [isLoadingComparison, setIsLoadingComparison] = useState(false)

  const loadComparisonData = async () => {
    try {
      setIsLoadingComparison(true)
      // 前月・前年の比較データを取得
      const currentDate = new Date()
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      const lastYear = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)
      
      // 実際のAPI呼び出しは後で実装
      setComparisonData({
        lastMonth: { distance: 120, workouts: 15, avgPace: 4.5 },
        lastYear: { distance: 150, workouts: 18, avgPace: 4.3 },
        current: { distance: stats.total_distance, workouts: stats.total_workouts, avgPace: stats.avg_pace }
      })
    } catch (err) {
      console.error('Failed to load comparison data:', err)
    } finally {
      setIsLoadingComparison(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'comparison') {
      loadComparisonData()
    }
  }, [activeTab])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const formatPercentage = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0
    }
  }

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            詳細分析
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            期間比較
          </button>
        </nav>
      </div>

      {/* 概要タブ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">総距離</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.total_distance)}km
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">練習回数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.total_workouts)}回
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">平均ペース</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.avg_pace ? `${Math.floor(stats.avg_pace / 60)}:${String(Math.floor(stats.avg_pace % 60)).padStart(2, '0')}/km` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">レース回数</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stats.total_races)}回
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 週間活動チャート */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">週間活動</h3>
            <ActivityChart data={stats.weekly_distance} />
          </div>

          {/* 距離分布チャート */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">距離分布</h3>
            <DistanceChart data={stats.distance_distribution} />
          </div>
        </div>
      )}

      {/* 詳細分析タブ */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* ペース分析 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ペース分析</h3>
            <PaceChart data={stats.pace_distribution} />
          </div>

          {/* 活動ヒートマップ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">活動ヒートマップ</h3>
            <HeatmapChart data={stats.activity_heatmap} />
          </div>

          {/* 練習種別分析 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">練習種別分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.workout_type_distribution?.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-600">{item.count}回</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(item.count / Math.max(...stats.workout_type_distribution.map(w => w.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 期間比較タブ */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {isLoadingComparison ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">比較データを読み込み中...</p>
            </div>
          ) : comparisonData ? (
            <>
              {/* 前月比較 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">前月比較</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">総距離</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatNumber(comparisonData.current.distance)}km
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.distance, comparisonData.lastMonth.distance).isPositive 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.distance, comparisonData.lastMonth.distance).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.distance, comparisonData.lastMonth.distance).value}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">練習回数</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatNumber(comparisonData.current.workouts)}回
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.workouts, comparisonData.lastMonth.workouts).isPositive 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.workouts, comparisonData.lastMonth.workouts).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.workouts, comparisonData.lastMonth.workouts).value}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">平均ペース</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.floor(comparisonData.current.avgPace / 60)}:{String(Math.floor(comparisonData.current.avgPace % 60)).padStart(2, '0')}/km
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.avgPace, comparisonData.lastMonth.avgPace).isNegative 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.avgPace, comparisonData.lastMonth.avgPace).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.avgPace, comparisonData.lastMonth.avgPace).value}%
                    </p>
                  </div>
                </div>
              </div>

              {/* 前年比較 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">前年同月比較</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">総距離</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatNumber(comparisonData.current.distance)}km
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.distance, comparisonData.lastYear.distance).isPositive 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.distance, comparisonData.lastYear.distance).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.distance, comparisonData.lastYear.distance).value}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">練習回数</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatNumber(comparisonData.current.workouts)}回
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.workouts, comparisonData.lastYear.workouts).isPositive 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.workouts, comparisonData.lastYear.workouts).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.workouts, comparisonData.lastYear.workouts).value}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">平均ペース</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.floor(comparisonData.current.avgPace / 60)}:{String(Math.floor(comparisonData.current.avgPace % 60)).padStart(2, '0')}/km
                    </p>
                    <p className={`text-sm ${
                      formatPercentage(comparisonData.current.avgPace, comparisonData.lastYear.avgPace).isNegative 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(comparisonData.current.avgPace, comparisonData.lastYear.avgPace).isPositive ? '+' : '-'}
                      {formatPercentage(comparisonData.current.avgPace, comparisonData.lastYear.avgPace).value}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">比較データがありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'

interface AIDataStats {
  totalWorkouts: number
  totalUsers: number
  dataCollectionDays: number
}

export default function AIPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<AIDataStats>({
    totalWorkouts: 0,
    totalUsers: 0,
    dataCollectionDays: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>('1500m')
  const [selectedCategory, setSelectedCategory] = useState<string>('track')
  const [showEventSelection, setShowEventSelection] = useState(false)

  // 全種目のデータ
  const trackEvents = [
    { event: '800m', time: '1:58.5' },
    { event: '1500m', time: '3:52.8' },
    { event: '3000m', time: '8:45.2' },
    { event: '5000m', time: '14:35.2' },
    { event: '10000m', time: '30:15.7' }
  ]

  const roadEvents = [
    { event: '5km', time: '15:45' },
    { event: '10km', time: '32:30' },
    { event: 'ハーフマラソン', time: '1:08:45' },
    { event: 'マラソン', time: '2:25:30' }
  ]

  const getAllEvents = () => {
    return selectedCategory === 'track' ? trackEvents : roadEvents
  }

  const getCurrentEventTime = () => {
    const events = getAllEvents()
    const currentEvent = events.find(e => e.event === selectedEvent)
    return currentEvent ? currentEvent.time : '--:--'
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadStats()
    }
  }, [isAuthenticated])

  const loadStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // AI統計APIから実際のデータを取得
      const aiStats = await apiClient.getAIStats()
      
      setStats({
        totalWorkouts: aiStats.total_workouts || 0,
        totalUsers: aiStats.total_users || 0,
        dataCollectionDays: aiStats.data_collection_days || 0
      })
      
      console.log('実際のAI統計データを取得:', aiStats)
      
    } catch (error) {
      console.error('Failed to load AI stats:', error)
      // エラー時はデフォルト値を表示
      setStats({
        totalWorkouts: 0,
        totalUsers: 0,
        dataCollectionDays: 0
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <p className="text-gray-600">AI機能を利用するにはログインしてください。</p>
        </div>
      </div>
    )
  }

  const handleFeatureClick = async (feature: string) => {
    setSelectedFeature(feature)
    setIsAnalyzing(true)
    
    try {
      if (feature === 'time-prediction') {
        // レースタイム予測のデモ
        const response = await apiClient.predictRacePerformance({
          age: 25,
          gender: 'male',
          height: 175,
          weight: 68,
          experience_years: 3
        })
        
        setPredictionResult({
          type: 'race-prediction',
          predictions: response.predictions
        })
        setShowPredictionModal(true)
      } else {
        // その他の機能は開発中メッセージ
        alert(`${feature}機能は現在開発中です。ベータ版ではレースタイム予測、練習メニュー提案、パフォーマンス分析が利用可能です。`)
      }
    } catch (error) {
      console.error('AI予測エラー:', error)
      alert('AI予測中にエラーが発生しました。しばらく時間をおいて再度お試しください。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダーセクション */}
        <div className="text-center mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 animate-pulse"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-500/10 rounded-full animate-ping"></div>
          
          <div className="relative z-10 p-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-5xl">🤖</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-sm">✨</span>
                </div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6 animate-pulse">
              AI ランニングアシスタント
            </h1>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xl font-bold shadow-lg animate-pulse">
                <span className="w-4 h-4 bg-white rounded-full mr-3 animate-spin"></span>
                デモモード - 次世代AI機能を体験
              </div>
            </div>
            
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 text-center leading-relaxed">
              最先端の機械学習技術で、あなたのランニングパフォーマンスを革命的に向上させます。
              <br />
              <span className="text-yellow-400 font-semibold">現在はデモンストレーション段階</span> - 実際のAI機能は開発中です。
            </p>
            
            <div className="flex justify-center space-x-6 mb-8">
              <div className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300 font-medium">機械学習</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-purple-400/30">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-300 font-medium">リアルタイム分析</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm rounded-full border border-cyan-400/30">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 font-medium">個別最適化</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* レースタイム予測 */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl p-6 border border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/25 transition-all cursor-pointer group relative overflow-hidden"
               onClick={() => setShowEventSelection(true)}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-cyan-500/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg relative">
                  <span className="text-3xl">🏃‍♂️</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
             <div>
               <h3 className="text-xl font-bold text-white">レースタイム予測</h3>
               <p className="text-blue-300 text-sm">種目を選択して予測タイムを表示</p>
             </div>
              </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-300">予測精度</span>
                <span className="text-lg font-bold text-white">95%</span>
              </div>
              <div className="w-full bg-blue-800/30 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          
            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">対応種目</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCategory('track')
                    setSelectedEvent('1500m')
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === 'track'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  }`}
                >
                  トラック
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCategory('road')
                    setSelectedEvent('5km')
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === 'road'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  }`}
                >
                  ロード
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500/30 to-blue-600/30 backdrop-blur-sm border border-blue-400/50 text-blue-200 rounded-lg text-sm font-medium">
                  {selectedEvent}
                </span>
                <span className="text-xs text-blue-300">クリックして変更</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">予測タイム例</h4>
              <div className="bg-blue-800/20 rounded-lg p-3 border border-blue-400/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {getCurrentEventTime()}
                  </div>
                  <div className="text-xs text-blue-300">予測タイム</div>
                </div>
              </div>
            </div>
          
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-300">種目選択可能</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs text-green-400 font-medium">準備完了</span>
              </div>
            </div>
            </div>
          </div>

          {/* 練習メニュー提案 */}
          <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 rounded-2xl p-6 border border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/25 transition-all cursor-pointer group relative overflow-hidden"
               onClick={() => handleFeatureClick('training-plan')}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg relative">
                  <span className="text-3xl">📋</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">練習メニュー提案（デモ）</h3>
                  <p className="text-purple-300 text-sm">AI機能のデモンストレーション</p>
                </div>
              </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-300">最適化レベル</span>
                <span className="text-lg font-bold text-white">98%</span>
              </div>
              <div className="w-full bg-purple-800/30 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          
            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">提案内容</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 rounded-full text-xs font-medium hover:bg-purple-500/30 transition-colors">インターバル</span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 rounded-full text-xs font-medium hover:bg-purple-500/30 transition-colors">テンポ走</span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 rounded-full text-xs font-medium hover:bg-purple-500/30 transition-colors">ロング走</span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 text-purple-300 rounded-full text-xs font-medium hover:bg-purple-500/30 transition-colors">筋力</span>
              </div>
            </div>
          
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300">個別最適化</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs text-green-400 font-medium">準備完了</span>
              </div>
            </div>
            </div>
          </div>

          {/* パフォーマンス分析 */}
          <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 rounded-2xl p-6 border border-green-500/30 hover:shadow-2xl hover:shadow-green-500/25 transition-all cursor-pointer group relative overflow-hidden"
               onClick={() => handleFeatureClick('performance-analysis')}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-500/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg relative">
                  <span className="text-3xl">📊</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">パフォーマンス分析（デモ）</h3>
                  <p className="text-green-300 text-sm">AI機能のデモンストレーション</p>
                </div>
              </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-300">分析精度</span>
                <span className="text-lg font-bold text-white">92%</span>
              </div>
              <div className="w-full bg-green-800/30 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          
            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">分析項目</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 text-green-300 rounded-full text-xs font-medium hover:bg-green-500/30 transition-colors">ペース分析</span>
                <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 text-green-300 rounded-full text-xs font-medium hover:bg-green-500/30 transition-colors">心拍分析</span>
                <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 text-green-300 rounded-full text-xs font-medium hover:bg-green-500/30 transition-colors">疲労度</span>
                <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 text-green-300 rounded-full text-xs font-medium hover:bg-green-500/30 transition-colors">回復</span>
              </div>
            </div>
          
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-300">リアルタイム</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs text-green-400 font-medium">準備完了</span>
              </div>
            </div>
            </div>
          </div>

          {/* AIコーチング */}
          <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-orange-700 rounded-2xl p-6 border border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/25 transition-all cursor-pointer group relative overflow-hidden"
               onClick={() => handleFeatureClick('ai-coaching')}>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-500/10 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg relative">
                  <span className="text-3xl">🎯</span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AIコーチング（デモ）</h3>
                  <p className="text-orange-300 text-sm">AI機能のデモンストレーション</p>
                </div>
              </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-300">指導精度</span>
                <span className="text-lg font-bold text-white">89%</span>
              </div>
              <div className="w-full bg-orange-800/30 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-red-400 h-3 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          
            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">コーチング内容</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-400/30 text-orange-300 rounded-full text-xs font-medium hover:bg-orange-500/30 transition-colors">フォーム</span>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-400/30 text-orange-300 rounded-full text-xs font-medium hover:bg-orange-500/30 transition-colors">戦略</span>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-400/30 text-orange-300 rounded-full text-xs font-medium hover:bg-orange-500/30 transition-colors">メンタル</span>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-400/30 text-orange-300 rounded-full text-xs font-medium hover:bg-orange-500/30 transition-colors">栄養</span>
              </div>
            </div>
          
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-300">24時間対応</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs text-green-400 font-medium">準備完了</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* 分析中の表示 */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI分析中...</h3>
              <p className="text-gray-600 mb-4">
                {selectedFeature === 'time-prediction' && 'レースタイムを予測しています'}
                {selectedFeature === 'training-plan' && '最適な練習計画を生成しています'}
                {selectedFeature === 'performance-analysis' && 'パフォーマンスを分析しています'}
                {selectedFeature === 'condition-management' && 'コンディションを評価しています'}
                {selectedFeature === 'race-strategy' && '競技戦略を立案しています'}
                {selectedFeature === 'ai-coaching' && 'AIコーチングを準備しています'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* ベータテスター向けメッセージ */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12 border border-blue-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 ベータテスターの皆さまへ</h2>
            <p className="text-gray-700">
              AI機能の精度向上には、良質な練習データが不可欠です。現在ご協力いただいているデータ入力により、より精確な予測・分析が可能になります。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-blue-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {isLoadingStats ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  stats.totalWorkouts.toLocaleString()
                )}
              </div>
              <div className="text-gray-600 font-medium">練習記録</div>
              <div className="text-xs text-gray-500 mt-1">実際のデータ</div>
            </div>
            <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-green-100">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {isLoadingStats ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  stats.totalUsers.toLocaleString()
                )}
              </div>
              <div className="text-gray-600 font-medium">登録ユーザー</div>
              <div className="text-xs text-gray-500 mt-1">現在のユーザー</div>
            </div>
            <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-purple-100">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {isLoadingStats ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  stats.dataCollectionDays
                )}
              </div>
              <div className="text-gray-600 font-medium">データ蓄積期間（日）</div>
              <div className="text-xs text-gray-500 mt-1">最初の記録から</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎁</span>
              <div>
                <h3 className="font-semibold text-gray-900">ベータテスター特典</h3>
                <p className="text-gray-600">AI機能リリース時に3ヶ月無料でご利用いただけます</p>
              </div>
            </div>
          </div>
        </div>

        {/* 種目選択モーダル */}
        {showEventSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">種目選択</h2>
                <button
                  onClick={() => setShowEventSelection(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  種目を選択すると、その種目の予測タイムが表示されます。800mから10000m、ロードレースは5kmからマラソンまで対応しています。
                </p>
                
                {/* カテゴリ選択 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedCategory('track')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === 'track'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    トラック種目
                  </button>
                  <button
                    onClick={() => setSelectedCategory('road')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === 'road'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ロード種目
                  </button>
                </div>
                
                {/* 種目選択 */}
                <div className="grid grid-cols-2 gap-3">
                  {getAllEvents().map(({ event, time }) => (
                    <button
                      key={event}
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventSelection(false)
                        handleFeatureClick('time-prediction')
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedEvent === event
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">{event}</div>
                        <div className="text-sm text-gray-600 mt-1">{time}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventSelection(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    setShowEventSelection(false)
                    handleFeatureClick('time-prediction')
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  この種目で予測を表示
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 予測結果モーダル */}
        {showPredictionModal && predictionResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">AI予測結果（デモ）</h2>
                <button
                  onClick={() => setShowPredictionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {predictionResult.type === 'race-prediction' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      <p className="text-yellow-800 text-sm">
                        これはデモ機能です。実際のAI予測機能は開発中です。データ収集段階では機能の紹介を提供しています。
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {selectedEvent} レースタイム予測（デモ）
                    </h3>
                    
                    {/* 選択された種目の予測結果 */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-blue-600 mb-2">予測タイム</div>
                        <div className="text-4xl font-bold text-blue-800 mb-2">
                          {getCurrentEventTime()}
                        </div>
                        <div className="text-sm text-blue-600 mb-4">{selectedEvent}</div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-600">信頼度</div>
                            <div className="font-bold text-green-600">95%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-gray-600">種目</div>
                            <div className="font-bold text-blue-600">{selectedEvent}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 他の種目との比較 */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {selectedCategory === 'track' ? 'トラック種目' : 'ロード種目'}との比較
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {getAllEvents().map(({ event, time }) => (
                          <div key={event} className={`p-3 rounded-lg border ${
                            selectedEvent === event 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="text-center">
                              <div className="font-medium text-gray-800">{event}</div>
                              <div className="text-lg font-bold text-gray-700">{time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPredictionModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
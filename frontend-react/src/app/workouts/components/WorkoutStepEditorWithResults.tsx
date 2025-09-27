'use client'

import { useState, useEffect } from 'react'
import { DetailedWorkoutStep } from '@/types'
import { WorkoutStepEditor } from './WorkoutStepEditor'
import { formatSecondsToMinutes, parseMinutesToSeconds, calculatePace } from '@/lib/timeUtils'

interface WorkoutStepEditorWithResultsProps {
  step: DetailedWorkoutStep
  onUpdate: (updates: Partial<DetailedWorkoutStep>) => void
  onClose: () => void
}

export function WorkoutStepEditorWithResults({ step, onUpdate, onClose }: WorkoutStepEditorWithResultsProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'results'>('edit')
  const [resultsData, setResultsData] = useState({
    actual_time_seconds: step.workout_results?.actual_time_seconds || undefined,
    actual_distance_meters: step.workout_results?.actual_distance_meters || undefined,
    actual_pace: step.workout_results?.actual_pace || '',
    avg_heart_rate: step.workout_results?.avg_heart_rate || undefined,
    max_heart_rate: step.workout_results?.max_heart_rate || undefined,
    rpe: step.workout_results?.rpe || undefined,
    notes: step.workout_results?.notes || '',
    weather: step.workout_results?.weather || '',
    temperature: step.workout_results?.temperature || undefined,
    humidity: step.workout_results?.humidity || undefined
  })

  const handleResultsChange = (field: string, value: any) => {
    const newResultsData = { ...resultsData, [field]: value }
    setResultsData(newResultsData)

    // 時間と距離が両方入力された場合、ペースを自動計算
    if (field === 'actual_time_seconds' || field === 'actual_distance_meters') {
      const timeSeconds = field === 'actual_time_seconds' ? value : newResultsData.actual_time_seconds
      const distanceMeters = field === 'actual_distance_meters' ? value : newResultsData.actual_distance_meters
      
      if (timeSeconds && distanceMeters) {
        const calculatedPace = calculatePace(distanceMeters, timeSeconds)
        if (calculatedPace) {
          newResultsData.actual_pace = calculatedPace
          setResultsData(newResultsData)
        }
      }
    }

    // 結果データを親コンポーネントに送信
    onUpdate({
      workout_results: newResultsData
    })
  }

  const handleTimeInput = (value: string) => {
    // 秒数入力を自動的に分:秒形式に変換
    const formattedTime = value.includes(':') ? value : formatSecondsToMinutes(parseInt(value) || 0)
    const seconds = parseMinutesToSeconds(formattedTime)
    handleResultsChange('actual_time_seconds', seconds)
  }

  const getWorkoutTypeLabel = (type: string): string => {
    const labelMap: Record<string, string> = {
      easy_run: 'イージーラン',
      jogging: 'ジョギング',
      long_run: 'ロング走',
      medium_run: 'ミディアムラン',
      tempo_run: 'テンポ走',
      interval_run: 'インターバル走',
      repetition: 'レペティション',
      build_up: 'ビルドアップ走',
      fartlek: 'ファルトレク',
      pace_change: '変化走',
      hill_run: '坂道練習',
      stair_run: '階段練習',
      sand_run: '砂浜・芝生走',
      dynamic_stretch: '動的ストレッチ',
      flow_run: '流し',
      walking: 'ウォーキング',
      cooldown: 'クールダウン'
    }
    return labelMap[type] || type
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {getWorkoutTypeLabel(step.type)} - {step.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* タブ */}
          <div className="mt-4 flex space-x-1">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'edit'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              📝 編集
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'results'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 結果記入
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {activeTab === 'edit' ? (
            <WorkoutStepEditor
              step={step}
              onUpdate={onUpdate}
              onClose={onClose}
            />
          ) : (
            <div className="space-y-6">
              {/* 結果記入セクション */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-900 mb-4">📊 練習結果</h4>
                
                {/* 基本データ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">実際の時間</label>
                    <input
                      type="text"
                      value={resultsData.actual_time_seconds ? formatSecondsToMinutes(resultsData.actual_time_seconds) : ''}
                      onChange={(e) => handleTimeInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 1:18 または 78（秒数）"
                    />
                    <p className="text-xs text-gray-500 mt-1">秒数入力は自動で分:秒に変換されます</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">実際の距離 (m)</label>
                    <input
                      type="number"
                      value={resultsData.actual_distance_meters || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const distance = value === '' ? undefined : parseInt(value)
                        handleResultsChange('actual_distance_meters', distance)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 1000"
                    />
                  </div>
                </div>

                {/* ペース（自動計算） */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">実際のペース</label>
                  <input
                    type="text"
                    value={resultsData.actual_pace}
                    onChange={(e) => handleResultsChange('actual_pace', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例: 4:30/km"
                  />
                  <p className="text-xs text-gray-500 mt-1">時間と距離を入力すると自動計算されます</p>
                </div>

                {/* 心拍数 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">平均心拍数 (bpm)</label>
                    <input
                      type="number"
                      value={resultsData.avg_heart_rate || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const hr = value === '' ? undefined : parseInt(value)
                        handleResultsChange('avg_heart_rate', hr)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 150"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最大心拍数 (bpm)</label>
                    <input
                      type="number"
                      value={resultsData.max_heart_rate || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const hr = value === '' ? undefined : parseInt(value)
                        handleResultsChange('max_heart_rate', hr)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 170"
                    />
                  </div>
                </div>

                {/* 体感強度 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">体感強度 (RPE 1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={resultsData.rpe || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const rpe = value === '' ? undefined : parseInt(value)
                      handleResultsChange('rpe', rpe)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例: 7"
                  />
                </div>

                {/* 環境条件 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">天気</label>
                    <select
                      value={resultsData.weather}
                      onChange={(e) => handleResultsChange('weather', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      <option value="晴れ">晴れ</option>
                      <option value="曇り">曇り</option>
                      <option value="雨">雨</option>
                      <option value="雪">雪</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">気温 (°C)</label>
                    <input
                      type="number"
                      value={resultsData.temperature || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const temp = value === '' ? undefined : parseInt(value)
                        handleResultsChange('temperature', temp)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">湿度 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={resultsData.humidity || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const humidity = value === '' ? undefined : parseInt(value)
                        handleResultsChange('humidity', humidity)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例: 60"
                    />
                  </div>
                </div>

                {/* メモ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">練習メモ・感想</label>
                  <textarea
                    value={resultsData.notes}
                    onChange={(e) => handleResultsChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    placeholder="例: 体調が良く、目標ペースで走れた。最後の1kmでペースアップできた。"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

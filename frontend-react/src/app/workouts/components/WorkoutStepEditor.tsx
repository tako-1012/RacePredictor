'use client'

import { useState, useEffect } from 'react'
import { DetailedWorkoutStep, DetailedWorkoutType, DetailedWarmupType } from '@/types'

interface WorkoutStepEditorProps {
  step: DetailedWorkoutStep
  onUpdate: (updates: Partial<DetailedWorkoutStep>) => void
  onClose: () => void
}

// 練習種別のラベルと説明
const DETAILED_WORKOUT_LABELS = {
  // 持久系練習
  easy_run: { label: 'イージーラン', description: '楽なペースでのジョギング', icon: '🏃‍♂️' },
  long_run: { label: 'ロング走', description: '長距離・長時間の持久走', icon: '🏃‍♂️' },
  medium_run: { label: 'ミディアムラン', description: '中程度の強度でのランニング', icon: '🏃‍♂️' },
  tempo_run: { label: 'テンポ走', description: '閾値ペースでの持続走', icon: '⚡' },
  
  // スピード・強度系練習
  interval_run: { label: 'インターバル走', description: '高強度と休息を繰り返す', icon: '🔥' },
  repetition: { label: 'レペティション', description: '完全回復での高強度走', icon: '💨' },
  build_up: { label: 'ビルドアップ走', description: '段階的にペースを上げる', icon: '📈' },
  fartlek: { label: 'ファルトレク', description: '自由な強度変化走', icon: '🎯' },
  pace_change: { label: '変化走', description: '複数ペースの組み合わせ', icon: '🔄' },
  
  // 特殊練習
  hill_run: { label: '坂道練習', description: '上り坂・下り坂での練習', icon: '⛰️' },
  stair_run: { label: '階段練習', description: '階段を使った強度練習', icon: '🪜' },
  sand_run: { label: '砂浜・芝生走', description: '特殊な路面での練習', icon: '🏖️' }
} as const

const DETAILED_WARMUP_LABELS = {
  // 基本的な準備運動
  jogging: { label: 'ジョギング', description: '楽なペースでのランニング', icon: '🏃‍♂️' },
  walking: { label: 'ウォーキング', description: '歩行でのウォームアップ', icon: '🚶‍♂️' },
  marching: { label: 'その場足踏み', description: 'その場での足踏み運動', icon: '🦵' },
  
  // 動き作り系
  movement_prep: { label: '動き作り', description: 'もも上げ・お尻キック・スキップ等', icon: '🤸‍♂️' },
  ladder: { label: 'ラダートレーニング', description: 'ラダーを使った敏捷性練習', icon: '🪜' },
  flow_run: { label: '流し', description: '短距離の加速走', icon: '💨' },
  wind_sprint: { label: 'ウィンドスプリント', description: '短距離の全力走', icon: '⚡' },
  
  // ストレッチ・体操系
  dynamic_stretch: { label: '動的ストレッチ', description: '動きながらのストレッチ', icon: '🤸‍♀️' },
  brazil_warmup: { label: 'ブラジル体操', description: 'ブラジル式の準備体操', icon: '🇧🇷' },
  joint_mobility: { label: '関節体操', description: '関節の可動域を広げる', icon: '🦴' },
  balance_coordination: { label: 'バランス・コーディネーション', description: 'バランスと協調性の練習', icon: '⚖️' },
  
  // 筋活性化系
  muscle_activation: { label: '筋活性化エクササイズ', description: '筋肉を活性化する運動', icon: '💪' },
  plyometrics: { label: 'プライオメトリクス', description: '爆発的な筋力発揮練習', icon: '💥' },
  core_training: { label: 'コアトレーニング', description: '体幹の強化練習', icon: '🏋️‍♂️' }
} as const

export function WorkoutStepEditor({ step, onUpdate, onClose }: WorkoutStepEditorProps) {
  const [formData, setFormData] = useState<DetailedWorkoutStep>(step)

  // 距離と時間からペースを自動計算する関数
  const calculatePace = (distanceMeters: number | undefined, durationSeconds: number | undefined): string => {
    if (!distanceMeters || !durationSeconds || distanceMeters === 0 || durationSeconds === 0) {
      return ''
    }
    
    const distanceKm = distanceMeters / 1000
    const paceSecondsPerKm = durationSeconds / distanceKm
    const minutes = Math.floor(paceSecondsPerKm / 60)
    const seconds = Math.floor(paceSecondsPerKm % 60)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  useEffect(() => {
    setFormData(step)
  }, [step])

  const handleSave = () => {
    onUpdate(formData)
  }

  const handleFieldChange = (field: keyof DetailedWorkoutStep, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleIntervalConfigChange = (field: keyof NonNullable<DetailedWorkoutStep['interval_config']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      interval_config: {
        ...prev.interval_config,
        [field]: value
      } as NonNullable<DetailedWorkoutStep['interval_config']>
    }))
  }

  const handleIntervalResultsChange = (field: keyof NonNullable<DetailedWorkoutStep['interval_results']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      interval_results: {
        ...prev.interval_results,
        [field]: value
      } as NonNullable<DetailedWorkoutStep['interval_results']>
    }))
  }

  const handleBuildUpConfigChange = (field: keyof NonNullable<DetailedWorkoutStep['build_up_config']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      build_up_config: {
        ...prev.build_up_config,
        [field]: value
      } as NonNullable<DetailedWorkoutStep['build_up_config']>
    }))
  }

  const handleFlowConfigChange = (field: keyof NonNullable<DetailedWorkoutStep['flow_config']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      flow_config: {
        ...prev.flow_config,
        [field]: value
      } as NonNullable<DetailedWorkoutStep['flow_config']>
    }))
  }

  const addBuildUpSegment = () => {
    const newSegment = {
      distance_meters: 1000,
      target_pace: '5:00/km',
      intensity_rpe: 6
    }
    
    setFormData(prev => ({
      ...prev,
      build_up_config: {
        ...prev.build_up_config,
        segments: [...(prev.build_up_config?.segments || []), newSegment]
      } as NonNullable<DetailedWorkoutStep['build_up_config']>
    }))
  }

  const removeBuildUpSegment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      build_up_config: {
        ...prev.build_up_config,
        segments: prev.build_up_config?.segments?.filter((_, i) => i !== index) || []
      } as NonNullable<DetailedWorkoutStep['build_up_config']>
    }))
  }

  const updateBuildUpSegment = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      build_up_config: {
        ...prev.build_up_config,
        segments: prev.build_up_config?.segments?.map((segment, i) => 
          i === index ? { ...segment, [field]: value } : segment
        ) || []
      } as NonNullable<DetailedWorkoutStep['build_up_config']>
    }))
  }

  // 種別ごとの入力項目をレンダリング
  const renderTypeSpecificInputs = () => {
    switch (formData.type) {
      case 'interval_run':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">🔥 インターバル走設定</h4>
              
              {/* 基本設定 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">距離 (m)</label>
                  <input
                    type="number"
                    value={formData.interval_config?.distance || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const distance = value === '' ? undefined : parseInt(value)
                      handleIntervalConfigChange('distance', distance)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本数</label>
                  <input
                    type="number"
                    value={formData.interval_config?.reps || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const reps = value === '' ? undefined : parseInt(value)
                      handleIntervalConfigChange('reps', reps)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6"
                  />
                </div>
              </div>

              {/* セット数 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">セット数 (オプション)</label>
                <input
                  type="number"
                  value={formData.interval_config?.sets || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const sets = value === '' ? undefined : parseInt(value)
                    handleIntervalConfigChange('sets', sets)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>

              {/* 目標ペース */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">目標ペース</label>
                <input
                  type="text"
                  value={formData.interval_config?.target_pace_min || ''}
                  onChange={(e) => handleIntervalConfigChange('target_pace_min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1:15"
                />
              </div>

              {/* レスト設定 */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h5 className="text-md font-semibold text-gray-900 mb-3">レスト設定</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">レスト種類</label>
                    <select
                      value={formData.interval_config?.rest_type || 'complete_rest'}
                      onChange={(e) => handleIntervalConfigChange('rest_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="complete_rest">完全休息</option>
                      <option value="jog">ジョグ</option>
                      <option value="walk">ウォーク</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">レスト時間 (秒)</label>
                    <input
                      type="number"
                      value={formData.interval_config?.rest_duration_seconds || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const duration = value === '' ? undefined : parseInt(value)
                        handleIntervalConfigChange('rest_duration_seconds', duration)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">レスト距離 (m) - オプション</label>
                    <input
                      type="number"
                      value={formData.interval_config?.rest_distance_meters || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const distance = value === '' ? undefined : parseInt(value)
                        handleIntervalConfigChange('rest_distance_meters', distance)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="200"
                    />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">目標心拍回復 (bpm)</label>
                  <input
                    type="number"
                    value={formData.interval_config?.target_heart_rate_recovery || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const heartRate = value === '' ? undefined : parseInt(value)
                      handleIntervalConfigChange('target_heart_rate_recovery', heartRate)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="120"
                  />
                </div>
              </div>

              {/* セット間レスト */}
              {formData.interval_config?.sets && formData.interval_config.sets > 1 && (
                <div className="bg-white rounded-lg p-4">
                  <h5 className="text-md font-semibold text-gray-900 mb-3">セット間レスト</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">セット間レスト時間 (分)</label>
                      <input
                        type="number"
                        value={formData.interval_config?.set_rest_duration_seconds ? Math.floor(formData.interval_config.set_rest_duration_seconds / 60) : ''}
                        onChange={(e) => {
                          const value = e.target.value
                          const durationSeconds = value === '' ? undefined : parseInt(value) * 60
                          handleIntervalConfigChange('set_rest_duration_seconds', durationSeconds)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">セット間レスト距離 (m)</label>
                      <input
                        type="number"
                        value={formData.interval_config?.set_rest_distance_meters || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          const distance = value === '' ? undefined : parseInt(value)
                          handleIntervalConfigChange('set_rest_distance_meters', distance)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* インターバル走結果 */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-900 mb-4">📊 インターバル走結果</h4>
              
              {/* 実際のタイム記録 */}
              <div className="mb-4">
                <h5 className="text-md font-semibold text-green-800 mb-3">実際のタイム</h5>
                <div className="space-y-2">
                  {Array.from({ length: formData.interval_config?.reps || 1 }, (_, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 w-16">{index + 1}本目:</span>
                      <input
                        type="text"
                        value={formData.interval_results?.times?.[index] || ''}
                        onChange={(e) => {
                          const times = [...(formData.interval_results?.times || [])]
                          times[index] = e.target.value
                          handleIntervalResultsChange('times', times)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="例: 1:15.2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 心拍数記録 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">平均心拍数 (bpm)</label>
                  <input
                    type="number"
                    value={formData.interval_results?.avg_heart_rate || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const avgHr = value === '' ? undefined : parseInt(value)
                      handleIntervalResultsChange('avg_heart_rate', avgHr)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例: 165"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大心拍数 (bpm)</label>
                  <input
                    type="number"
                    value={formData.interval_results?.max_heart_rate || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const maxHr = value === '' ? undefined : parseInt(value)
                      handleIntervalResultsChange('max_heart_rate', maxHr)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例: 175"
                  />
                </div>
              </div>

              {/* 体感・メモ */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体感強度 (RPE 1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.interval_results?.rpe || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const rpe = value === '' ? undefined : parseInt(value)
                      handleIntervalResultsChange('rpe', rpe)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例: 8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">練習メモ</label>
                  <textarea
                    value={formData.interval_results?.notes || ''}
                    onChange={(e) => handleIntervalResultsChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="例: 最後の2本がきつかった。ペースが上がった。"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'build_up':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-900 mb-4">📈 ビルドアップ走設定</h4>
              
              <div className="space-y-4">
                {formData.build_up_config?.segments?.map((segment, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-semibold text-gray-900">区間 {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeBuildUpSegment(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">距離 (m)</label>
                        <input
                          type="number"
                          value={segment.distance_meters}
                          onChange={(e) => {
                            const value = e.target.value
                            const distance = value === '' ? 0 : parseInt(value)
                            updateBuildUpSegment(index, 'distance_meters', distance)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ペース</label>
                        <input
                          type="text"
                          value={segment.target_pace}
                          onChange={(e) => updateBuildUpSegment(index, 'target_pace', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5:00/km"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">強度 (RPE)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={segment.intensity_rpe}
                          onChange={(e) => {
                            const value = e.target.value
                            const intensity = value === '' ? 5 : parseInt(value)
                            updateBuildUpSegment(index, 'intensity_rpe', intensity)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addBuildUpSegment}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  + 区間を追加
                </button>
              </div>
            </div>
          </div>
        )

      case 'flow_run':
      case 'wind_sprint':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-orange-900 mb-4">
                {formData.type === 'flow_run' ? '💨 流し設定' : '⚡ ウィンドスプリント設定'}
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">距離 (m)</label>
                  <input
                    type="number"
                    value={formData.distance_meters || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const distance = value === '' ? undefined : parseInt(value)
                      handleFieldChange('distance_meters', distance)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本数</label>
                  <input
                    type="number"
                    value={formData.duration_seconds ? Math.floor(formData.duration_seconds / 60) : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const durationSeconds = value === '' ? undefined : parseInt(value) * 60
                      handleFieldChange('duration_seconds', durationSeconds)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">強度</label>
                  <select
                    value={formData.flow_config?.intensity_percent || 80}
                    onChange={(e) => {
                      const value = e.target.value
                      const intensity = value === '' ? 80 : parseInt(value)
                      handleFlowConfigChange('intensity_percent', intensity)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={70}>70%</option>
                    <option value={80}>80%</option>
                    <option value={90}>90%</option>
                    <option value={100}>100%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">加速パターン</label>
                  <select
                    value={formData.flow_config?.acceleration_pattern || 'gradual'}
                    onChange={(e) => handleFlowConfigChange('acceleration_pattern', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gradual">徐々に加速</option>
                    <option value="constant">一定ペース</option>
                    <option value="final_sprint">最後だけ加速</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">レスト種類</label>
                  <select
                    value={formData.flow_config?.rest_type || 'full_recovery'}
                    onChange={(e) => handleFlowConfigChange('rest_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full_recovery">完全回復まで</option>
                    <option value="time_based">時間指定</option>
                  </select>
                </div>
                {formData.flow_config?.rest_type === 'time_based' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">レスト時間 (分)</label>
                    <input
                      type="number"
                      value={formData.flow_config?.rest_duration_seconds ? Math.floor(formData.flow_config.rest_duration_seconds / 60) : ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const durationSeconds = value === '' ? undefined : parseInt(value) * 60
                        handleFlowConfigChange('rest_duration_seconds', durationSeconds)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">距離 (m)</label>
                <input
                  type="number"
                  value={formData.distance_meters || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const distance = value === '' ? undefined : parseInt(value)
                    handleFieldChange('distance_meters', distance)
                    // 距離と時間からペースを自動計算
                    if (distance && formData.duration_seconds) {
                      const calculatedPace = calculatePace(distance, formData.duration_seconds)
                      if (calculatedPace) {
                        handleFieldChange('target_pace', calculatedPace)
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">時間 (分)</label>
                  <input
                    type="number"
                    value={formData.duration_seconds ? Math.floor(formData.duration_seconds / 60) : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const durationSeconds = value === '' ? undefined : parseInt(value) * 60
                      handleFieldChange('duration_seconds', durationSeconds)
                      // 距離と時間からペースを自動計算
                      if (durationSeconds && formData.distance_meters) {
                        const calculatedPace = calculatePace(formData.distance_meters, durationSeconds)
                        if (calculatedPace) {
                          handleFieldChange('target_pace', calculatedPace)
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ペース</label>
              <input
                type="text"
                value={formData.target_pace || ''}
                onChange={(e) => handleFieldChange('target_pace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="4:00/km"
              />
              <p className="text-xs text-gray-500 mt-1">
                距離と時間を入力すると自動計算されます
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">ステップ詳細設定</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">練習名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 400mインターバル"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">練習種別</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="持久系練習">
                      <option value="easy_run">イージーラン</option>
                      <option value="long_run">ロング走</option>
                      <option value="medium_run">ミディアムラン</option>
                      <option value="tempo_run">テンポ走</option>
                    </optgroup>
                    <optgroup label="スピード・強度系練習">
                      <option value="interval_run">インターバル走</option>
                      <option value="repetition">レペティション</option>
                      <option value="build_up">ビルドアップ走</option>
                      <option value="fartlek">ファルトレク</option>
                      <option value="pace_change">変化走</option>
                    </optgroup>
                    <optgroup label="特殊練習">
                      <option value="hill_run">坂道練習</option>
                      <option value="stair_run">階段練習</option>
                      <option value="sand_run">砂浜・芝生走</option>
                    </optgroup>
                    <optgroup label="ウォームアップ">
                      <option value="jogging">ジョギング</option>
                      <option value="walking">ウォーキング</option>
                      <option value="marching">その場足踏み</option>
                      <option value="movement_prep">動き作り</option>
                      <option value="ladder">ラダートレーニング</option>
                      <option value="flow_run">流し</option>
                      <option value="wind_sprint">ウィンドスプリント</option>
                      <option value="dynamic_stretch">動的ストレッチ</option>
                      <option value="brazil_warmup">ブラジル体操</option>
                      <option value="joint_mobility">関節体操</option>
                      <option value="balance_coordination">バランス・コーディネーション</option>
                      <option value="muscle_activation">筋活性化エクササイズ</option>
                      <option value="plyometrics">プライオメトリクス</option>
                      <option value="core_training">コアトレーニング</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="練習の詳細説明..."
                />
              </div>
            </div>

            {/* 種別ごとの詳細設定 */}
            {renderTypeSpecificInputs()}

            {/* 共通設定 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">共通設定</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">強度 (RPE 1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.intensity_rpe || 5}
                    onChange={(e) => {
                      const value = e.target.value
                      const intensity = value === '' ? 5 : parseInt(value)
                      handleFieldChange('intensity_rpe', intensity)
                    }}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 text-center">{formData.intensity_rpe || 5}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">心拍ゾーン</label>
                  <input
                    type="text"
                    value={formData.heart_rate_zone || ''}
                    onChange={(e) => handleFieldChange('heart_rate_zone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="85-90%"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ・備考</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="練習の感想や気づきを記録..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">意識ポイント</label>
                <input
                  type="text"
                  value={formData.focus_points?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('focus_points', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ピッチ意識, フォーム確認, 呼吸リズム"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

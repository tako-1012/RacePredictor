'use client'

import { DetailedWorkoutData } from '@/types'

interface WorkoutPreviewProps {
  workoutData: DetailedWorkoutData
  onMoveStep?: (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string, direction: 'up' | 'down') => void
  onEditStep?: (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string) => void
  onRemoveStep?: (sessionIndex: number, sectionType: 'warmup' | 'main' | 'cooldown', stepId: string) => void
}

export function WorkoutPreview({ workoutData, onMoveStep, onEditStep, onRemoveStep }: WorkoutPreviewProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}時間${mins}分`
    }
    return `${mins}分`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case 'morning': return '朝練'
      case 'afternoon': return '午後練'
      case 'evening': return '夜練'
      default: return period
    }
  }

  const getSectionLabel = (sectionType: string) => {
    switch (sectionType) {
      case 'warmup': return 'ウォームアップ'
      case 'main': return 'メイン練習'
      case 'cooldown': return 'クールダウン'
      default: return sectionType
    }
  }

  const getWorkoutTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      // 持久系練習
      easy_run: '🏃‍♂️',
      long_run: '🏃‍♂️',
      medium_run: '🏃‍♂️',
      tempo_run: '⚡',
      
      // スピード・強度系練習
      interval_run: '🔥',
      repetition: '💨',
      build_up: '📈',
      fartlek: '🎯',
      pace_change: '🔄',
      
      // 特殊練習
      hill_run: '⛰️',
      stair_run: '🪜',
      sand_run: '🏖️',
      
      // ウォームアップ
      jogging: '🏃‍♂️',
      walking: '🚶‍♂️',
      marching: '🦵',
      movement_prep: '🤸‍♂️',
      ladder: '🪜',
      flow_run: '💨',
      wind_sprint: '⚡',
      dynamic_stretch: '🤸‍♀️',
      brazil_warmup: '🇧🇷',
      joint_mobility: '🦴',
      balance_coordination: '⚖️',
      muscle_activation: '💪',
      plyometrics: '💥',
      core_training: '🏋️‍♂️',
      
      // クールダウン
      cooldown: '🧘'
    }
    return iconMap[type] || '⚡'
  }

  const getWorkoutTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      // 持久系練習
      easy_run: 'イージーラン',
      long_run: 'ロング走',
      medium_run: 'ミディアムラン',
      tempo_run: 'テンポ走',
      
      // スピード・強度系練習
      interval_run: 'インターバル走',
      repetition: 'レペティション',
      build_up: 'ビルドアップ走',
      fartlek: 'ファルトレク',
      pace_change: '変化走',
      
      // 特殊練習
      hill_run: '坂道練習',
      stair_run: '階段練習',
      sand_run: '砂浜・芝生走',
      
      // ウォームアップ
      jogging: 'ジョギング',
      walking: 'ウォーキング',
      marching: 'その場足踏み',
      movement_prep: '動き作り',
      ladder: 'ラダートレーニング',
      flow_run: '流し',
      wind_sprint: 'ウィンドスプリント',
      dynamic_stretch: '動的ストレッチ',
      brazil_warmup: 'ブラジル体操',
      joint_mobility: '関節体操',
      balance_coordination: 'バランス・コーディネーション',
      muscle_activation: '筋活性化エクササイズ',
      plyometrics: 'プライオメトリクス',
      core_training: 'コアトレーニング',
      
      // クールダウン
      cooldown: 'クールダウン'
    }
    return labelMap[type] || type
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 設定プレビュー</h3>
      
      {/* 全体サマリー */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <h4 className="text-md font-semibold text-gray-900 mb-3">全体サマリー</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatDuration(workoutData.total_estimated_duration_minutes)}</div>
            <div className="text-sm text-gray-600">推定時間</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatDistance(workoutData.total_estimated_distance_meters)}</div>
            <div className="text-sm text-gray-600">推定距離</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{workoutData.session_count}</div>
            <div className="text-sm text-gray-600">部練数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {workoutData.sessions.reduce((total, session) => 
                total + Object.values(session.sections).reduce((sectionTotal, section) => 
                  sectionTotal + section.steps.length, 0
                ), 0
              )}
            </div>
            <div className="text-sm text-gray-600">総ステップ数</div>
          </div>
        </div>
      </div>

      {/* セッション別詳細 */}
      <div className="space-y-4">
        {workoutData.sessions.map((session, sessionIndex) => (
          <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">
                セッション{session.session_number} ({getTimePeriodLabel(session.time_period)})
              </h4>
              <div className="text-sm text-gray-600">
                {formatDuration(session.total_estimated_duration_minutes)} / {formatDistance(session.total_estimated_distance_meters)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['warmup', 'main', 'cooldown'] as const).map(sectionType => {
                const section = session.sections[sectionType]
                return (
                  <div key={sectionType} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-800">
                        {getSectionLabel(sectionType)}
                      </h5>
                      <div className="text-xs text-gray-600">
                        {formatDuration(section.estimated_duration_minutes)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {section.steps.length === 0 ? (
                        <div className="text-xs text-gray-500 italic">ステップなし</div>
                      ) : (
                        section.steps.map((step, stepIndex) => (
                          <div key={step.id} className="flex items-center justify-between group hover:bg-gray-50 rounded-lg p-2 transition-colors">
                            <div className="flex items-center space-x-2 text-xs">
                              <span>{getWorkoutTypeIcon(step.type)}</span>
                              <span className="font-medium">{step.name || getWorkoutTypeLabel(step.type)}</span>
                              {step.distance_meters && (
                                <span className="text-gray-500">({formatDistance(step.distance_meters)})</span>
                              )}
                              {step.target_pace && (
                                <span className="text-gray-500">({step.target_pace})</span>
                              )}
                            </div>
                            
                            {/* 順番変更ボタン */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onMoveStep?.(sessionIndex, sectionType as 'warmup' | 'main' | 'cooldown', step.id, 'up')}
                                disabled={stepIndex === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="上に移動"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onMoveStep?.(sessionIndex, sectionType as 'warmup' | 'main' | 'cooldown', step.id, 'down')}
                                disabled={stepIndex === section.steps.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="下に移動"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onEditStep?.(sessionIndex, sectionType as 'warmup' | 'main' | 'cooldown', step.id)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="編集"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onRemoveStep?.(sessionIndex, sectionType as 'warmup' | 'main' | 'cooldown', step.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="削除"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* メモ */}
      {workoutData.notes && (
        <div className="bg-white rounded-lg p-4 mt-4 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 mb-3">練習メモ</h4>
          <div className="text-sm text-gray-600">{workoutData.notes}</div>
        </div>
      )}

      {/* セクション別心拍数サマリー */}
      {workoutData.sessions.some(session => 
        Object.values(session.sections).some(section => 
          section.avg_heart_rate || section.max_heart_rate
        )
      ) && (
        <div className="bg-white rounded-lg p-4 mt-4 shadow-sm">
          <h4 className="text-md font-semibold text-gray-900 mb-3">心拍数データ</h4>
          <div className="space-y-3">
            {workoutData.sessions.map((session, sessionIndex) => (
              <div key={session.id}>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  セッション{session.session_number} ({getTimePeriodLabel(session.time_period)})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['warmup', 'main', 'cooldown'] as const).map(sectionType => {
                    const section = session.sections[sectionType]
                    if (!section.avg_heart_rate && !section.max_heart_rate) return null
                    
                    return (
                      <div key={sectionType} className="bg-gray-50 rounded-md p-3">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {getSectionLabel(sectionType)}
                        </div>
                        <div className="space-y-1">
                          {section.avg_heart_rate && (
                            <div className="text-sm">
                              <span className="text-gray-500">平均: </span>
                              <span className="font-medium">{section.avg_heart_rate}bpm</span>
                            </div>
                          )}
                          {section.max_heart_rate && (
                            <div className="text-sm">
                              <span className="text-gray-500">最大: </span>
                              <span className="font-medium">{section.max_heart_rate}bpm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

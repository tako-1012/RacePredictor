'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface FeatureTooltipProps {
  feature: {
    id: string
    title: string
    description: string
    icon?: React.ReactNode
    benefits?: string[]
    tips?: string[]
  }
  isVisible: boolean
  onClose: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function FeatureTooltip({ 
  feature, 
  isVisible, 
  onClose, 
  position = 'bottom' 
}: FeatureTooltipProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsActive(true)
      // 3秒後に自動で閉じる
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      setIsActive(false)
    }
  }, [isVisible, onClose])

  if (!isActive) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* ツールチップ */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {feature.icon && (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {feature.icon}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icons.X size="sm" />
          </button>
        </div>

        {/* 説明 */}
        <p className="text-gray-600 mb-4 leading-relaxed">
          {feature.description}
        </p>

        {/* メリット */}
        {feature.benefits && feature.benefits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              この機能のメリット
            </h4>
            <ul className="space-y-1">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <Icons.Check size="sm" className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ヒント */}
        {feature.tips && feature.tips.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              使い方のヒント
            </h4>
            <ul className="space-y-1">
              {feature.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <Icons.Lightbulb size="sm" className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* フッター */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

// 機能説明データ
export const featureData = {
  dashboard: {
    id: 'dashboard',
    title: 'ダッシュボード',
    description: '練習記録の統計情報と週間目標の進捗を一目で確認できます。',
    icon: <Icons.BarChart3 size="sm" className="text-blue-600" />,
    benefits: [
      '練習の継続状況を視覚的に把握',
      '週間目標の達成度を確認',
      'AI予測による目標タイムの提案'
    ],
    tips: [
      '週間目標は現実的な設定を心がけましょう',
      '定期的にダッシュボードを確認してモチベーション維持'
    ]
  },
  workoutRecord: {
    id: 'workout-record',
    title: '練習記録',
    description: 'セッション分割機能で、ウォームアップ・メイン練習・クールダウンを詳細に記録できます。',
    icon: <Icons.Activity size="sm" className="text-green-600" />,
    benefits: [
      '練習内容の詳細な記録',
      'セッション別の分析が可能',
      'CSVインポートで既存データを活用'
    ],
    tips: [
      '練習種別を正確に選択することでAI予測の精度が向上',
      '心拍数データがあるとより詳細な分析が可能'
    ]
  },
  raceResults: {
    id: 'race-results',
    title: 'レース結果',
    description: 'レース結果を記録し、AI予測で次のレースの目標タイムを設定できます。',
    icon: <Icons.Trophy size="sm" className="text-yellow-600" />,
    benefits: [
      'レース結果の履歴管理',
      'AI予測による目標タイム設定',
      'レース予定の管理'
    ],
    tips: [
      'レース結果は正確な記録を心がけましょう',
      'レース予定を登録して目標設定に活用'
    ]
  },
  profile: {
    id: 'profile',
    title: 'プロフィール',
    description: '基本情報や自己ベストを設定し、より正確なAI予測を受けられます。',
    icon: <Icons.User size="sm" className="text-purple-600" />,
    benefits: [
      '個人に最適化されたAI予測',
      '自己ベストの管理',
      'プロフィール情報の一元管理'
    ],
    tips: [
      '身長・体重・年齢は正確に入力しましょう',
      '自己ベストは最新の記録を反映'
    ]
  },
  csvImport: {
    id: 'csv-import',
    title: 'CSVインポート',
    description: 'Garmin Connectなどの既存データを簡単にインポートできます。',
    icon: <Icons.Upload size="sm" className="text-indigo-600" />,
    benefits: [
      '既存データの簡単移行',
      'Garmin Connect形式に対応',
      'データの一括インポート'
    ],
    tips: [
      'CSVファイルはUTF-8エンコーディングで保存',
      'インポート前にデータの形式を確認'
    ]
  }
}

// 機能説明フック
export function useFeatureTooltip() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const showFeatureTooltip = (featureId: string) => {
    setActiveFeature(featureId)
  }

  const hideFeatureTooltip = () => {
    setActiveFeature(null)
  }

  const getFeatureData = (featureId: string) => {
    return featureData[featureId as keyof typeof featureData]
  }

  return {
    activeFeature,
    showFeatureTooltip,
    hideFeatureTooltip,
    getFeatureData
  }
}

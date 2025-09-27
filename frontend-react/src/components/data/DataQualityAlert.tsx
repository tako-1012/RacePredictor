'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface DataQualityIssue {
  id: string
  level: 'excellent' | 'good' | 'warning' | 'error'
  title: string
  description: string
  suggestion: string
  field?: string
  value?: any
  expected_range?: [number, number]
}

interface DataQualityReport {
  overall_score: number
  level: 'excellent' | 'good' | 'warning' | 'error'
  issues: DataQualityIssue[]
  total_records: number
  valid_records: number
  generated_at: string
}

interface DataQualityAlertProps {
  report: DataQualityReport
  onDismiss?: () => void
  onFix?: (issue: DataQualityIssue) => void
  showDetails?: boolean
}

export function DataQualityAlert({ 
  report, 
  onDismiss, 
  onFix, 
  showDetails = false 
}: DataQualityAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set())

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return <Icons.CheckCircle size="sm" className="text-green-600" />
      case 'good':
        return <Icons.Info size="sm" className="text-blue-600" />
      case 'warning':
        return <Icons.AlertTriangle size="sm" className="text-yellow-600" />
      case 'error':
        return <Icons.XCircle size="sm" className="text-red-600" />
      default:
        return <Icons.Info size="sm" className="text-gray-600" />
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case 'excellent':
        return '優秀'
      case 'good':
        return '良好'
      case 'warning':
        return '警告'
      case 'error':
        return 'エラー'
      default:
        return '不明'
    }
  }

  const dismissIssue = (issueId: string) => {
    setDismissedIssues(prev => new Set([...prev, issueId]))
  }

  const visibleIssues = report.issues.filter(issue => !dismissedIssues.has(issue.id))

  if (report.level === 'excellent' && !showDetails) {
    return null
  }

  return (
    <div className={`rounded-lg border p-4 ${getLevelColor(report.level)}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getLevelIcon(report.level)}
          <h3 className="font-medium">
            データ品質レポート
          </h3>
          <span className="text-sm font-medium">
            {getLevelText(report.level)} ({report.overall_score.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icons.X size="sm" />
            </button>
          )}
          {visibleIssues.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <Icons.ChevronUp size="sm" />
              ) : (
                <Icons.ChevronDown size="sm" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* サマリー */}
      <div className="mb-3">
        <p className="text-sm">
          {report.valid_records} / {report.total_records} 件の記録が有効です
        </p>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                report.level === 'excellent' ? 'bg-green-500' :
                report.level === 'good' ? 'bg-blue-500' :
                report.level === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${report.overall_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* 問題の詳細 */}
      {isExpanded && visibleIssues.length > 0 && (
        <div className="space-y-3">
          {visibleIssues.map(issue => (
            <div
              key={issue.id}
              className="bg-white bg-opacity-50 rounded-md p-3 border border-white border-opacity-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getLevelIcon(issue.level)}
                    <h4 className="font-medium text-sm">
                      {issue.title}
                    </h4>
                  </div>
                  <p className="text-sm mb-2">
                    {issue.description}
                  </p>
                  <p className="text-sm font-medium">
                    💡 {issue.suggestion}
                  </p>
                  {issue.expected_range && (
                    <p className="text-xs text-gray-600 mt-1">
                      推奨範囲: {issue.expected_range[0]} - {issue.expected_range[1]}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {onFix && (
                    <button
                      onClick={() => onFix(issue)}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      修正
                    </button>
                  )}
                  <button
                    onClick={() => dismissIssue(issue.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Icons.X size="sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フッター */}
      <div className="mt-3 pt-3 border-t border-white border-opacity-50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            最終更新: {new Date(report.generated_at).toLocaleString('ja-JP')}
          </p>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            データ品質のヒントを見る
          </button>
        </div>
      </div>
    </div>
  )
}

// データ品質ヒントコンポーネント
export function DataQualityTips() {
  const tips = [
    "練習記録は練習直後に記録することをお勧めします",
    "距離と時間は正確に測定してください",
    "心拍数データがあるとより詳細な分析が可能です",
    "異常に速いペースは記録ミスの可能性があります",
    "長時間の練習は複数セッションに分割して記録してください"
  ]

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center space-x-2 mb-3">
        <Icons.Lightbulb size="sm" className="text-blue-600" />
        <h3 className="font-medium text-blue-900">
          データ品質向上のヒント
        </h3>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
            <Icons.Check size="sm" className="text-blue-600 mt-0.5 flex-shrink-0" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// データ品質統計コンポーネント
export function DataQualityStats({ report }: { report: DataQualityReport }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 75) return 'bg-blue-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 総合スコア */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">総合スコア</h3>
          <Icons.BarChart3 size="sm" className="text-gray-400" />
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(report.overall_score)}`}>
          {report.overall_score.toFixed(1)}%
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getScoreBgColor(report.overall_score)} ${getScoreColor(report.overall_score)}`}>
          {getLevelText(report.level)}
        </div>
      </div>

      {/* 有効記録数 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">有効記録</h3>
          <Icons.CheckCircle size="sm" className="text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-600">
          {report.valid_records}
        </div>
        <div className="text-xs text-gray-600">
          / {report.total_records} 件
        </div>
      </div>

      {/* 問題数 */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">問題数</h3>
          <Icons.AlertTriangle size="sm" className="text-yellow-500" />
        </div>
        <div className="text-2xl font-bold text-yellow-600">
          {report.issues.length}
        </div>
        <div className="text-xs text-gray-600">
          件の問題を検出
        </div>
      </div>
    </div>
  )
}

function getLevelText(level: string): string {
  switch (level) {
    case 'excellent':
      return '優秀'
    case 'good':
      return '良好'
    case 'warning':
      return '警告'
    case 'error':
      return 'エラー'
    default:
      return '不明'
  }
}

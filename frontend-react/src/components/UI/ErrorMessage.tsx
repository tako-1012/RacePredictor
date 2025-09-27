'use client'

import React from 'react'
import { AlertTriangle, XCircle, Info, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface ErrorMessageProps {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  details?: string
  suggestion?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }
  onClose?: () => void
  className?: string
  showDetails?: boolean
  onToggleDetails?: () => void
}

export function ErrorMessage({
  type,
  title,
  message,
  details,
  suggestion,
  action,
  onClose,
  className = '',
  showDetails = false,
  onToggleDetails
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      case 'success':
        return 'text-green-800'
      default:
        return 'text-gray-800'
    }
  }

  const getActionButtonStyle = () => {
    if (!action) return ''
    
    switch (action.variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700'
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700'
      case 'secondary':
      default:
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {title}
          </h3>
          <div className={`mt-1 text-sm ${getTextColor()}`}>
            <p>{message}</p>
          </div>

          {suggestion && (
            <div className={`mt-2 text-sm ${getTextColor()}`}>
              <p className="font-medium">推奨対処法:</p>
              <p>{suggestion}</p>
            </div>
          )}

          {details && (
            <div className="mt-2">
              <button
                onClick={onToggleDetails}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {showDetails ? '詳細を隠す' : '詳細を表示'}
              </button>
              {showDetails && (
                <div className={`mt-2 p-3 rounded-md bg-white bg-opacity-50 ${getTextColor()}`}>
                  <pre className="text-xs whitespace-pre-wrap">{details}</pre>
                </div>
              )}
            </div>
          )}

          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${getActionButtonStyle()}`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getTextColor()} hover:bg-white hover:bg-opacity-50 transition-colors`}
            >
              <span className="sr-only">閉じる</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 技術的エラーメッセージを分かりやすい日本語に変換する関数
export function convertTechnicalError(error: any): {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  suggestion?: string
  details?: string
} {
  if (typeof error === 'string') {
    return {
      type: 'error',
      title: 'エラーが発生しました',
      message: error,
      suggestion: 'しばらく時間をおいてから再試行してください。'
    }
  }

  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail
    
    if (typeof detail === 'string') {
      return {
        type: 'error',
        title: 'エラーが発生しました',
        message: detail,
        suggestion: '入力内容を確認してから再試行してください。'
      }
    }

    if (typeof detail === 'object') {
      return {
        type: 'error',
        title: detail.error_type || 'エラーが発生しました',
        message: detail.message || 'エラーが発生しました',
        suggestion: detail.suggestion,
        details: detail.details
      }
    }
  }

  if (error?.message) {
    const message = error.message.toLowerCase()
    
    // ネットワークエラー
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'error',
        title: 'ネットワークエラー',
        message: 'インターネット接続を確認してください',
        suggestion: 'Wi-Fiやモバイルデータの接続状況を確認し、接続が安定していることを確認してください。'
      }
    }

    // 認証エラー
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        type: 'error',
        title: '認証エラー',
        message: 'ログインが必要です',
        suggestion: '再度ログインしてください。セッションが期限切れの可能性があります。'
      }
    }

    // 権限エラー
    if (message.includes('forbidden') || message.includes('403')) {
      return {
        type: 'error',
        title: 'アクセス権限エラー',
        message: 'この操作を実行する権限がありません',
        suggestion: '管理者にお問い合わせください。'
      }
    }

    // サーバーエラー
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return {
        type: 'error',
        title: 'サーバーエラー',
        message: 'サーバーでエラーが発生しました',
        suggestion: 'しばらく時間をおいてから再試行してください。問題が続く場合はサポートにお問い合わせください。'
      }
    }

    // バリデーションエラー
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'warning',
        title: '入力エラー',
        message: '入力内容に問題があります',
        suggestion: '入力内容を確認して修正してください。'
      }
    }

    // タイムアウトエラー
    if (message.includes('timeout')) {
      return {
        type: 'warning',
        title: 'タイムアウトエラー',
        message: '処理に時間がかかりすぎています',
        suggestion: 'ネットワーク接続を確認してから再試行してください。'
      }
    }

    return {
      type: 'error',
      title: 'エラーが発生しました',
      message: error.message,
      suggestion: 'しばらく時間をおいてから再試行してください。'
    }
  }

  return {
    type: 'error',
    title: '予期しないエラーが発生しました',
    message: 'システムでエラーが発生しました',
    suggestion: 'しばらく時間をおいてから再試行してください。問題が続く場合はサポートにお問い合わせください。'
  }
}

// ローディング状態の統一コンポーネント
interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = '読み込み中...', 
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'md':
        return 'w-6 h-6'
      case 'lg':
        return 'w-8 h-8'
      default:
        return 'w-6 h-6'
    }
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <div className={`inline-block animate-spin rounded-full border-b-2 border-blue-600 ${getSizeClasses()}`}></div>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// スケルトンローディングコンポーネント
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded mb-2"
          style={{
            width: `${Math.random() * 40 + 60}%` // 60-100%のランダムな幅
          }}
        />
      ))}
    </div>
  )
}

// 空状態コンポーネント
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

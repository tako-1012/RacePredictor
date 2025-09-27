'use client'

import React, { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface ProgressBarProps {
  progress: number // 0-100
  message?: string
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ 
  progress, 
  message, 
  className = '',
  showPercentage = true 
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  )
}

interface TimeoutDisplayProps {
  timeout: number // 秒
  onTimeout?: () => void
  message?: string
  className?: string
}

export function TimeoutDisplay({ 
  timeout, 
  onTimeout,
  message = 'タイムアウトまで',
  className = ''
}: TimeoutDisplayProps) {
  const [remainingTime, setRemainingTime] = useState(timeout)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (remainingTime <= 0) {
      setIsExpired(true)
      onTimeout?.()
      return
    }

    const timer = setTimeout(() => {
      setRemainingTime(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [remainingTime, onTimeout])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isExpired) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">タイムアウトしました</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center text-gray-600 ${className}`}>
      <Clock className="w-4 h-4 mr-2" />
      <span className="text-sm">
        {message}: {formatTime(remainingTime)}
      </span>
    </div>
  )
}

interface LoadingWithTimeoutProps {
  timeout: number
  onTimeout?: () => void
  loadingMessage?: string
  timeoutMessage?: string
  className?: string
}

export function LoadingWithTimeout({
  timeout,
  onTimeout,
  loadingMessage = '読み込み中...',
  timeoutMessage = 'タイムアウトまで',
  className = ''
}: LoadingWithTimeoutProps) {
  const [progress, setProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState(timeout)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1
        const newProgress = ((timeout - newTime) / timeout) * 100
        setProgress(newProgress)
        
        if (newTime <= 0) {
          onTimeout?.()
          clearInterval(interval)
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeout, onTimeout])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-sm text-gray-600 mb-2">{loadingMessage}</p>
      <ProgressBar 
        progress={progress} 
        className="mb-2"
        showPercentage={false}
      />
      <p className="text-xs text-gray-500">
        {timeoutMessage}: {formatTime(remainingTime)}
      </p>
    </div>
  )
}

interface RetryableErrorProps {
  error: any
  onRetry: () => void
  maxRetries?: number
  retryCount?: number
  className?: string
}

export function RetryableError({
  error,
  onRetry,
  maxRetries = 3,
  retryCount = 0,
  className = ''
}: RetryableErrorProps) {
  const canRetry = retryCount < maxRetries
  const remainingRetries = maxRetries - retryCount

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            エラーが発生しました
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {typeof error === 'string' ? error : error?.message || '予期しないエラーが発生しました'}
          </p>
          
          {canRetry && (
            <div className="mt-3">
              <p className="text-sm text-red-600 mb-2">
                残り再試行回数: {remainingRetries}回
              </p>
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
              >
                再試行
              </button>
            </div>
          )}
          
          {!canRetry && (
            <div className="mt-3">
              <p className="text-sm text-red-600 mb-2">
                最大再試行回数に達しました
              </p>
              <p className="text-sm text-red-600">
                サポートにお問い合わせください: support@runmaster.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

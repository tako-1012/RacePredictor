'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <Loader2 className={`animate-spin text-primary-500 ${sizeClasses[size]}`} />
        <div className={`absolute inset-0 animate-pulse ${sizeClasses[size]}`}>
          <div className="w-full h-full rounded-full bg-gradient-primary opacity-20"></div>
        </div>
      </div>
      {text && (
        <p className="mt-4 text-sm font-medium text-neutral-600 animate-fade-in">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-white via-primary-50/30 to-white backdrop-blur-sm flex items-center justify-center z-50">
        <div className="card-elevated max-w-sm w-full mx-4 text-center">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

// ページ全体のローディング
export function PageLoadingSpinner({ text = '読み込み中...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      <div className="card-elevated max-w-md w-full mx-4 text-center">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  )
}

// ボタン用のローディング
export function ButtonLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
}

// カード用のローディング
export function CardLoadingSpinner() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// テーブル用のローディング
export function TableLoadingSpinner({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="animate-pulse">
        {/* ヘッダー */}
        <div className="h-12 bg-gray-200 mb-4"></div>
        {/* 行 */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 mb-2"></div>
        ))}
      </div>
    </div>
  )
}

// スケルトンローダー
export function SkeletonLoader({ 
  className = '',
  children 
}: { 
  className?: string
  children?: React.ReactNode 
}) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  )
}
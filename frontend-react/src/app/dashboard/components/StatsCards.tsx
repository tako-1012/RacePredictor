'use client'

import { memo } from 'react'
import { DashboardStats, StatsCard } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps) {
  const formatNumber = (value: number | string | undefined | null): string => {
    if (value === null || value === undefined) {
      return '0'
    }
    
    // 文字列の場合は数値に変換を試行
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) {
      return '0'
    }
    
    return numValue.toLocaleString('ja-JP')
  }

  const getIconComponent = (iconName: string) => {
    const iconClass = "w-5 h-5 text-white"
    
    switch (iconName) {
      case 'activity':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'map-pin':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'clock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  const getCardGradient = (iconName: string) => {
    switch (iconName) {
      case 'activity':
        return 'bg-gradient-primary'
      case 'map-pin':
        return 'bg-gradient-secondary'
      case 'clock':
        return 'bg-gradient-accent'
      case 'calendar':
        return 'bg-gradient-to-r from-warning-500 to-warning-600'
      default:
        return 'bg-gradient-to-r from-neutral-500 to-neutral-600'
    }
  }

  const getCardAccent = (iconName: string) => {
    switch (iconName) {
      case 'activity':
        return 'border-primary-200 bg-primary-50/30'
      case 'map-pin':
        return 'border-secondary-200 bg-secondary-50/30'
      case 'clock':
        return 'border-accent-200 bg-accent-50/30'
      case 'calendar':
        return 'border-warning-200 bg-warning-50/30'
      default:
        return 'border-neutral-200 bg-neutral-50/30'
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.stats_cards.map((card: StatsCard, index: number) => (
        <div 
          key={index} 
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${getCardGradient(card.icon)} rounded-lg flex items-center justify-center`}>
              {getIconComponent(card.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">{card.title}</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatNumber(card.value)}{card.unit && card.unit}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

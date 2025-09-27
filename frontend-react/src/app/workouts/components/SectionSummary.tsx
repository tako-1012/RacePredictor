'use client'

import { DetailedWorkoutSection } from '@/types'

interface SectionSummaryProps {
  section: DetailedWorkoutSection
  sectionType: 'warmup' | 'main' | 'cooldown'
}

export function SectionSummary({ section, sectionType }: SectionSummaryProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  const getSectionConfig = (type: string) => {
    switch (type) {
      case 'warmup':
        return {
          title: 'ウォームアップ',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          icon: '🏃‍♂️'
        }
      case 'main':
        return {
          title: 'メイン練習',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          icon: '⚡'
        }
      case 'cooldown':
        return {
          title: 'クールダウン',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-900',
          iconColor: 'text-purple-600',
          icon: '🧘‍♂️'
        }
      default:
        return {
          title: 'セクション',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          iconColor: 'text-gray-600',
          icon: '📋'
        }
    }
  }

  const config = getSectionConfig(sectionType)

  return (
    <div className={`rounded-lg border-2 p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center space-x-2 mb-3">
        <span className={`text-lg ${config.iconColor}`}>{config.icon}</span>
        <h3 className={`font-semibold ${config.textColor}`}>
          {config.title}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className={`${config.bgColor} rounded-lg p-3`}>
          <div className={`text-xs ${config.textColor} opacity-75 mb-1`}>距離</div>
          <div className={`text-lg font-bold ${config.textColor}`}>
            {formatDistance(section.estimated_distance_meters)}
          </div>
        </div>
        
        <div className={`${config.bgColor} rounded-lg p-3`}>
          <div className={`text-xs ${config.textColor} opacity-75 mb-1`}>時間</div>
          <div className={`text-lg font-bold ${config.textColor}`}>
            {formatTime(section.estimated_duration_minutes * 60)}
          </div>
        </div>
      </div>

      {section.avg_heart_rate && (
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className={`${config.bgColor} rounded-lg p-3`}>
            <div className={`text-xs ${config.textColor} opacity-75 mb-1`}>平均心拍</div>
            <div className={`text-sm font-bold ${config.textColor}`}>
              {section.avg_heart_rate} bpm
            </div>
          </div>
          
          {section.max_heart_rate && (
            <div className={`${config.bgColor} rounded-lg p-3`}>
              <div className={`text-xs ${config.textColor} opacity-75 mb-1`}>最大心拍</div>
              <div className={`text-sm font-bold ${config.textColor}`}>
                {section.max_heart_rate} bpm
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`text-xs ${config.textColor} opacity-75`}>
        {section.steps.length}ステップ
      </div>
    </div>
  )
}

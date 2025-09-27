'use client'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: string
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow'
  trend?: {
    value: number
    label: string
  }
}

export function StatCard({ 
  title, 
  value, 
  unit = '', 
  icon, 
  color = 'blue',
  trend 
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    orange: 'bg-orange-50 text-orange-900 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600'
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && (
              <div className={`text-lg ${iconColorClasses[color]}`}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium opacity-75">
              {title}
            </h3>
          </div>
          
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold">
              {value}
            </span>
            {unit && (
              <span className="text-sm opacity-75">
                {unit}
              </span>
            )}
          </div>
          
          {trend && (
            <div className="mt-2 text-xs opacity-75">
              <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.value >= 0 ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-1">{trend.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

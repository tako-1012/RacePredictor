'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/UI/Icons'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

// パスに基づいてパンくずアイテムを生成する関数
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  // ホームを常に最初に追加
  items.push({
    label: 'ホーム',
    href: '/dashboard',
    icon: <Icons.Home size="sm" color="secondary" />
  })

  // パスセグメントを処理
  let currentPath = ''
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    
    // セグメントに基づいてラベルを決定
    let label = segment
    let href = currentPath
    
    // 特別なケースの処理
    switch (segment) {
      case 'workouts':
        label = '練習記録'
        break
      case 'races':
        label = 'レース結果'
        break
      case 'dashboard':
        label = 'ダッシュボード'
        break
      case 'import':
        label = 'CSVインポート'
        break
      case 'profile':
        label = 'プロフィール'
        break
      case 'settings':
        label = '設定'
        break
      case 'new':
        label = '新規作成'
        break
      case 'create':
        label = '作成'
        break
      case 'edit':
        label = '編集'
        break
      default:
        // UUIDやIDの場合は特別な処理
        if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // 前のセグメントに基づいてラベルを決定
          const prevSegment = segments[i - 1]
          if (prevSegment === 'workouts') {
            label = '詳細'
          } else if (prevSegment === 'races') {
            label = '詳細'
          } else {
            label = '詳細'
          }
          // IDの場合はリンクにしない
          href = undefined
        }
        break
    }
    
    items.push({
      label,
      href: href === currentPath ? undefined : href
    })
  }

  return items
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname()
  
  // itemsが提供されていない場合は、パスから自動生成
  const breadcrumbItems = items || generateBreadcrumbItems(pathname)

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="パンくずナビゲーション"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <div className="flex items-center justify-center w-6 h-6 mx-2">
                <Icons.ChevronRight size="sm" color="muted" />
              </div>
            )}
            
            {item.href ? (
              <Link
                href={item.href}
                className="group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:shadow-sm"
              >
                {item.icon && (
                  <div className="w-5 h-5 bg-gray-100 group-hover:bg-gray-200 rounded-md flex items-center justify-center transition-all duration-200">
                    {item.icon}
                  </div>
                )}
                <span className="font-medium">{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50">
                {item.icon && (
                  <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center">
                    {item.icon}
                  </div>
                )}
                <span className="font-semibold">{item.label}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// 特定のページ用のカスタムパンくず
export function CustomBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return <Breadcrumb items={items} />
}

// よく使用されるパンくずのプリセット
export const BreadcrumbPresets = {
  home: () => <Breadcrumb items={[{ label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> }]} />,
  
  workouts: () => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: '練習記録', href: '/workouts' }
  ]} />,
  
  workoutsDetail: (workoutId: string, workoutName?: string) => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: '練習記録', href: '/workouts' },
    { label: workoutName || '詳細', href: undefined }
  ]} />,
  
  workoutsEdit: (workoutId: string, workoutName?: string) => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: '練習記録', href: '/workouts' },
    { label: workoutName || '詳細', href: `/workouts/${workoutId}` },
    { label: '編集', href: undefined }
  ]} />,
  
  races: () => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: 'レース結果', href: '/races' }
  ]} />,
  
  racesDetail: (raceId: string, raceName?: string) => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: 'レース結果', href: '/races' },
    { label: raceName || '詳細', href: undefined }
  ]} />,
  
  racesEdit: (raceId: string, raceName?: string) => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: 'レース結果', href: '/races' },
    { label: raceName || '詳細', href: `/races/${raceId}` },
    { label: '編集', href: undefined }
  ]} />,
  
  import: () => <Breadcrumb items={[
    { label: 'ホーム', href: '/dashboard', icon: <Icons.Home size="sm" color="secondary" /> },
    { label: 'CSVインポート', href: '/import' }
  ]} />
}

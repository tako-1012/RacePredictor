'use client'

import { useRouter, usePathname } from 'next/navigation'
import { User } from '@/types'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navigation: Array<{
    name: string
    href: string
    icon: React.ReactNode
  }>
  user: User | null
  onLogout: () => void
}

export function MobileNav({ isOpen, onClose, navigation, user, onLogout }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  if (!isOpen) return null

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden" id="mobile-menu" role="navigation" aria-label="モバイルメニュー">
      <div className="px-4 pt-4 pb-6 space-y-2 bg-white/95 backdrop-blur-sm border-t border-neutral-200/50 shadow-large">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href)
                onClose()
              }}
              className={`flex items-center space-x-4 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 group ${
                active 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label={`${item.name}ページに移動`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`flex items-center justify-center w-7 h-7 group-hover:scale-110 transition-transform duration-200 ${active ? 'scale-110' : ''}`} aria-hidden="true">
                {item.icon}
              </span>
              <span className={active ? 'font-semibold' : ''}>{item.name}</span>
              {active && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          )
        })}
        
        <div className="border-t border-neutral-200 pt-4 mt-4">
          <div className="px-4 py-3 mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-700">
                  {user?.email}
                </div>
                <div className="text-xs text-neutral-500">
                  ログイン中
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>ログアウト</span>
          </button>
        </div>
      </div>
    </div>
  )
}

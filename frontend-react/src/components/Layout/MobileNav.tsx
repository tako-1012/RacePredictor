'use client'

import { User } from '@/types'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navigation: Array<{
    name: string
    href: string
    icon: string
  }>
  user: User | null
  onLogout: () => void
}

export function MobileNav({ isOpen, onClose, navigation, user, onLogout }: MobileNavProps) {
  if (!isOpen) return null

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              onClose()
              // ナビゲーションは親コンポーネントで処理
            }}
            className="flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
        
        <div className="border-t border-gray-200 pt-4">
          <div className="px-3 py-2">
            <div className="text-sm text-gray-600">
              こんにちは、{user?.email}さん
            </div>
          </div>
          <button
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}

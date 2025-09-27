'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MobileNav } from './MobileNav'

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navigation = [
    { 
      name: 'ダッシュボード', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: '練習記録', 
      href: '/workouts', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      name: 'AI', 
      href: '/ai', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      name: 'コンディション', 
      href: '/daily-metrics', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    { 
      name: 'レース', 
      href: '/races', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    { 
      name: 'プロフィール', 
      href: '/profile', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm shadow-gray-100/50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center min-h-20 py-4">
          {/* ロゴ */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 group"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">RM</span>
                </div>
                {/* 光る効果 */}
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                  RunMaster
                </span>
                <span className="text-xs text-gray-500 font-medium -mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  AI Running App
                </span>
              </div>
            </button>
          </div>

          {/* 中央のナビゲーションとユーザーメニューを統合 */}
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-4xl mx-8">
              {/* ナビゲーション */}
              <nav className="flex items-center space-x-2" role="navigation" aria-label="メインナビゲーション">
                {navigation.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`group relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        active 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-label={`${item.name}ページに移動`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {/* アイコン */}
                      <div className="flex items-center justify-center w-4 h-4 mr-2">
                        {item.icon}
                      </div>
                      
                      {/* テキスト */}
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                      
                      {/* アクティブインジケーター */}
                      {active && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          ) : (
            <nav className="hidden lg:flex space-x-8" role="navigation" aria-label="ランディングページナビゲーション">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                機能
              </a>
              <a href="#beta" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                ベータテスト
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                利用者の声
              </a>
            </nav>
          )}

          {/* 右側のユーザーメニュー */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {/* ユーザー情報 */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 shadow-sm hover:shadow-md hover:shadow-blue-100/50 transition-all duration-300">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-xs">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* オンラインインジケーター */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">
                      {user?.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.email?.split('@')[1]}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* ログアウトボタン */}
              <button
                onClick={handleLogout}
                className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4 text-gray-500 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline font-medium">ログアウト</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/login')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                ログイン
              </button>
              <button
                onClick={() => router.push('/register')}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                新規登録
              </button>
            </div>
          )}

          {/* モバイルメニューボタン */}
          {isAuthenticated && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
              aria-label="メニューを開く"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* モバイルメニュー */}
      {isAuthenticated && (
        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigation={navigation}
          user={user}
          onLogout={handleLogout}
        />
      )}

    </header>
  )
}

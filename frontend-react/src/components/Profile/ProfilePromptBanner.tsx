'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfilePromptBannerProps {
  onDismiss?: () => void
  variant?: 'banner' | 'modal'
}

export function ProfilePromptBanner({ onDismiss, variant = 'banner' }: ProfilePromptBannerProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  if (isDismissed) {
    return null
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">プロフィールを完成させましょう</h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              より良いトレーニング体験のために、プロフィール情報を登録してください。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">登録するとできること：</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• より正確なAI予測</li>
                <li>• 個人に最適化されたトレーニング提案</li>
                <li>• 詳細なパフォーマンス分析</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGoToProfile}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              プロフィールを登録
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              後で
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">プロフィールを完成させましょう！</h3>
            <p className="text-blue-100 text-sm">
              より良いトレーニング体験のために、プロフィール情報を登録してください
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoToProfile}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 font-medium"
          >
            今すぐ登録
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-100 hover:text-white focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

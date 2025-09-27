'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, handleApiError } from '@/lib/api'
import { UserProfile, PersonalBest, UserProfileFormData, PersonalBestFormData } from '@/types'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { UserProfileForm } from './components/UserProfileForm'
import { PersonalBestForm } from './components/PersonalBestForm'
import { PersonalBestList } from './components/PersonalBestList'
import { PersonalBestSummary } from '@/components/Profile/PersonalBestSummary'
import { EmailChangeForm } from './components/EmailChangeForm'
import { PasswordChangeForm } from './components/PasswordChangeForm'

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'personal-bests' | 'account'>('profile')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUserProfile()
      loadPersonalBests()
    }
  }, [isAuthenticated, authLoading])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profile = await apiClient.getUserProfile()
      setUserProfile(profile)
    } catch (err) {
      const apiError = handleApiError(err)
      if (apiError.status_code !== 404) {
        setError(apiError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadPersonalBests = async () => {
    try {
      const response = await apiClient.getPersonalBests()
      setPersonalBests(response.items || response.data || response)
    } catch (err) {
      console.error('Failed to load personal bests:', err)
    }
  }

  const handleProfileSubmit = async (data: UserProfileFormData) => {
    try {
      let profile: UserProfile
      if (userProfile) {
        profile = await apiClient.updateUserProfile(data)
      } else {
        profile = await apiClient.createUserProfile(data)
      }
      setUserProfile(profile)
      setToast({ message: 'プロフィールを保存しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handlePersonalBestSubmit = async (data: PersonalBestFormData) => {
    try {
      await apiClient.createPersonalBest(data)
      await loadPersonalBests()
      setToast({ message: '自己ベストを追加しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handlePersonalBestUpdate = async (id: string, data: PersonalBestFormData) => {
    try {
      await apiClient.updatePersonalBest(id, data)
      await loadPersonalBests()
      setToast({ message: '自己ベストを更新しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  const handlePersonalBestDelete = async (id: string) => {
    if (!confirm('この自己ベストを削除しますか？')) return

    try {
      await apiClient.deletePersonalBest(id)
      await loadPersonalBests()
      setToast({ message: '自己ベストを削除しました', type: 'success' })
    } catch (err) {
      const apiError = handleApiError(err)
      setToast({ message: apiError.message, type: 'error' })
    }
  }

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error.message || 'エラーが発生しました'}</p>
          {error.suggestion && (
            <p className="text-sm text-gray-500 mb-4">{error.suggestion}</p>
          )}
          <button
            onClick={loadUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>基本情報</span>
            </button>
            <button
              onClick={() => setActiveTab('personal-bests')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'personal-bests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>自己ベスト</span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>アカウント設定</span>
            </button>
          </nav>
        </div>

        {/* 自己ベスト概要（常に表示） */}
        <PersonalBestSummary personalBests={personalBests} />

        {/* タブコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
              <UserProfileForm
                initialData={userProfile}
                onSubmit={handleProfileSubmit}
              />
            </div>
          )}

          {activeTab === 'personal-bests' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">自己ベスト</h2>
                <button
                  onClick={() => {
                    // モーダルでフォームを開く処理を追加予定
                    console.log('Add personal best')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  新しい自己ベストを追加
                </button>
              </div>
              
              <PersonalBestList
                personalBests={personalBests}
                onUpdate={handlePersonalBestUpdate}
                onDelete={handlePersonalBestDelete}
              />
            </div>
          )}

          {/* アカウント設定タブ */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">アカウント設定</h2>
              
              <div className="space-y-8">
                {/* メールアドレス変更 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">メールアドレス変更</h3>
                  <EmailChangeForm onSuccess={() => setToast({ message: 'メールアドレスが変更されました', type: 'success' })} />
                </div>

                {/* パスワード変更 */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">パスワード変更</h3>
                  <PasswordChangeForm onSuccess={() => setToast({ message: 'パスワードが変更されました', type: 'success' })} />
                </div>
              </div>
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}

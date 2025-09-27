'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfileStatus } from '@/hooks/useProfileStatus'

interface ProfileContextType {
  hasProfile: boolean
  isLoading: boolean
  error: string | null
  refreshProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { isAuthenticated } = useAuth()
  const { hasProfile, isLoading, error } = useProfileStatus()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshProfile = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // プロフィールが更新された時にリフレッシュ
  useEffect(() => {
    if (refreshTrigger > 0) {
      // プロフィール状態を再チェック
      window.location.reload()
    }
  }, [refreshTrigger])

  const value: ProfileContextType = {
    hasProfile,
    isLoading,
    error,
    refreshProfile
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

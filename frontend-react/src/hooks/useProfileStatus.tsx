'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { apiClient, handleApiError } from '@/lib/api'

interface ProfileStatus {
  hasProfile: boolean
  isLoading: boolean
  error: string | null
}

export function useProfileStatus() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    hasProfile: false,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!isAuthenticated || authLoading) {
        setProfileStatus({
          hasProfile: false,
          isLoading: authLoading,
          error: null
        })
        return
      }

      try {
        setProfileStatus(prev => ({ ...prev, isLoading: true, error: null }))
        
        const profile = await apiClient.getUserProfile()
        
        // プロフィールが存在し、基本的な情報が入力されているかチェック
        const hasBasicInfo = profile && (
          profile.age > 0 ||
          profile.height_cm > 0 ||
          profile.weight_kg > 0 ||
          profile.gender
        )
        
        setProfileStatus({
          hasProfile: hasBasicInfo,
          isLoading: false,
          error: null
        })
      } catch (err: any) {
        const apiError = handleApiError(err)
        setProfileStatus({
          hasProfile: false,
          isLoading: false,
          error: apiError.message
        })
      }
    }

    checkProfileStatus()
  }, [isAuthenticated, authLoading])

  return profileStatus
}

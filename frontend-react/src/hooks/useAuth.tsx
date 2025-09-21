'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { apiClient } from '@/lib/api'
import { User, LoginFormData, RegisterFormData } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginFormData) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // 初期化時にユーザー情報を取得
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        // トークンが存在する場合のみユーザー情報を取得
        const token = localStorage.getItem('access_token')
        if (token) {
          const currentUser = await apiClient.getCurrentUser()
          if (isMounted) {
            setUser(currentUser)
          }
        }
      } catch (error) {
        // トークンが無効な場合はクリア
        if (isMounted) {
          apiClient.clearToken()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (data: LoginFormData) => {
    try {
      const response = await apiClient.login(data)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterFormData) => {
    try {
      const response = await apiClient.register(data)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await apiClient.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
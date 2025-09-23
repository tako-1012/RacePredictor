'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { apiClient, api } from '@/lib/api'
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
          const currentUser = await api.users.getProfile()
          if (isMounted) {
            setUser(currentUser.data)
          }
        }
      } catch (error) {
        // トークンが無効な場合はクリア
        if (isMounted) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
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
      console.log('🔐 useAuth login開始:', data);
      const response = await api.auth.login(data)
      console.log('✅ useAuth login成功:', response.data);
      
      // トークンを保存
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        console.log('🎫 アクセストークン保存完了');
      }
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
        console.log('🔄 リフレッシュトークン保存完了');
      }
      
      setUser(response.data.user)
      console.log('👤 ユーザー状態更新完了');
    } catch (error) {
      console.error('❌ useAuth loginエラー:', error);
      throw error
    }
  }

  const register = async (data: RegisterFormData) => {
    try {
      const response = await api.auth.register(data)
      setUser(response.data.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await api.users.getProfile()
      setUser(currentUser.data)
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
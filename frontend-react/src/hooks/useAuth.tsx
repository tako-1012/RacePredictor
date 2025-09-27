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
        console.log('🔍 認証状態初期化開始')
        // トークンが存在する場合のみユーザー情報を取得
        const token = localStorage.getItem('access_token')
        console.log('🎫 トークン存在確認:', !!token)
        
        if (token) {
          console.log('📡 ユーザー情報取得中...')
          const currentUser = await apiClient.getCurrentUser()
          console.log('👤 ユーザー情報取得成功:', currentUser)
          if (isMounted) {
            setUser(currentUser)
            console.log('✅ 認証状態: 認証済み')
          }
        } else {
          console.log('❌ 認証状態: 未認証（トークンなし）')
        }
      } catch (error) {
        console.error('❌ 認証状態確認エラー:', error)
        // トークンが無効な場合はクリア
        if (isMounted) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          console.log('🧹 無効なトークンをクリア')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          console.log('🏁 認証状態初期化完了')
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
      const response = await apiClient.login(data)
      console.log('✅ useAuth login成功:', response);
      
      // トークンを保存
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        console.log('🎫 アクセストークン保存完了');
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
        console.log('🔄 リフレッシュトークン保存完了');
      }
      
      // ユーザー情報を設定（レスポンスにuserが含まれている場合）
      if (response.user) {
        setUser(response.user)
        console.log('👤 ユーザー状態更新完了');
      } else {
        // ユーザー情報がレスポンスに含まれていない場合は取得
        console.log('📡 ユーザー情報を取得中...');
        const currentUser = await apiClient.getCurrentUser()
        setUser(currentUser)
        console.log('👤 ユーザー情報取得・設定完了');
      }
      
      // 認証状態を確実に更新
      setIsLoading(false)
    } catch (error) {
      console.error('❌ useAuth loginエラー:', error);
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
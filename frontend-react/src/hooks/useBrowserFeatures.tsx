'use client'

import { useEffect, useState } from 'react'

// ブラウザ通知API用のフック
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('通知許可の要求に失敗:', error)
      return false
    }
  }

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })

      // 5秒後に自動で閉じる
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (error) {
      console.error('通知の表示に失敗:', error)
    }
  }

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification
  }
}

// ページタブでの進捗表示用のフック
export function useTabProgress() {
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState('')

  useEffect(() => {
    const updateFavicon = (progress: number) => {
      if (typeof window === 'undefined') return

      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      // 背景
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, 32, 32)

      // プログレスバー
      if (progress > 0) {
        ctx.fillStyle = progress === 100 ? '#10b981' : '#3b82f6'
        ctx.fillRect(0, 28, (progress / 100) * 32, 4)
      }

      // アイコン（簡単な円）
      ctx.fillStyle = progress === 100 ? '#10b981' : '#6b7280'
      ctx.beginPath()
      ctx.arc(16, 16, 12, 0, 2 * Math.PI)
      ctx.fill()

      // 進捗テキスト
      if (progress > 0 && progress < 100) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${progress}%`, 16, 16)
      }

      // faviconを更新
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = canvas.toDataURL('image/x-icon')
      document.getElementsByTagName('head')[0].appendChild(link)
    }

    updateFavicon(progress)
  }, [progress])

  const setTabProgress = (newProgress: number, newTitle?: string) => {
    setProgress(Math.max(0, Math.min(100, newProgress)))
    
    if (newTitle) {
      setTitle(newTitle)
      document.title = newTitle
    }
  }

  const resetTabProgress = () => {
    setProgress(0)
    if (title) {
      document.title = title
    }
  }

  return {
    progress,
    setTabProgress,
    resetTabProgress
  }
}

// ブックマーク可能な個別ページURL用のフック
export function useBookmarkableURL() {
  const updateURL = (path: string, params?: Record<string, string>) => {
    if (typeof window === 'undefined') return

    const url = new URL(path, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    window.history.pushState({}, '', url.toString())
  }

  const getCurrentParams = () => {
    if (typeof window === 'undefined') return {}
    
    const params = new URLSearchParams(window.location.search)
    const result: Record<string, string> = {}
    
    params.forEach((value, key) => {
      result[key] = value
    })
    
    return result
  }

  const shareURL = async (title: string, text?: string) => {
    if (typeof window === 'undefined') return false

    const shareData = {
      title,
      text: text || title,
      url: window.location.href
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return true
      } catch (error) {
        console.error('共有に失敗:', error)
        return false
      }
    } else {
      // フォールバック: クリップボードにコピー
      try {
        await navigator.clipboard.writeText(window.location.href)
        return true
      } catch (error) {
        console.error('URLのコピーに失敗:', error)
        return false
      }
    }
  }

  return {
    updateURL,
    getCurrentParams,
    shareURL
  }
}

// ページの可視性API用のフック
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isVisible,
    isOnline
  }
}

// 記録リマインダー用のフック
export function useWorkoutReminder() {
  const { showNotification } = useBrowserNotifications()
  const [reminders, setReminders] = useState<Array<{
    id: string
    time: string
    message: string
    enabled: boolean
  }>>([])

  useEffect(() => {
    // ローカルストレージからリマインダー設定を読み込み
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workout_reminders')
      if (saved) {
        try {
          setReminders(JSON.parse(saved))
        } catch {
          // デフォルトのリマインダーを設定
          setReminders([
            { id: 'morning', time: '06:00', message: '朝練の時間です！', enabled: false },
            { id: 'evening', time: '18:00', message: '夕練の時間です！', enabled: false }
          ])
        }
      } else {
        setReminders([
          { id: 'morning', time: '06:00', message: '朝練の時間です！', enabled: false },
          { id: 'evening', time: '18:00', message: '夕練の時間です！', enabled: false }
        ])
      }
    }
  }, [])

  const updateReminder = (id: string, updates: Partial<{
    time: string
    message: string
    enabled: boolean
  }>) => {
    setReminders(prev => {
      const updated = prev.map(reminder => 
        reminder.id === id ? { ...reminder, ...updates } : reminder
      )
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('workout_reminders', JSON.stringify(updated))
      }
      
      return updated
    })
  }

  const checkReminders = () => {
    const now = new Date()
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0')

    reminders.forEach(reminder => {
      if (reminder.enabled && reminder.time === currentTime) {
        showNotification(reminder.message, {
          body: 'RunMasterで練習記録を確認しましょう！',
          tag: 'workout-reminder'
        })
      }
    })
  }

  useEffect(() => {
    // 毎分リマインダーをチェック
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [reminders])

  return {
    reminders,
    updateReminder,
    checkReminders
  }
}

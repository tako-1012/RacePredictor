'use client'

import { useState, useEffect, useCallback } from 'react'

// Clipboard API用のフック
export function useClipboard() {
  const [isSupported, setIsSupported] = useState(false)
  const [lastCopied, setLastCopied] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      setIsSupported(true)
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupported) {
      // フォールバック: 古いブラウザ用
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          setLastCopied(text)
          return true
        }
        return false
      } catch (err) {
        console.error('クリップボードへのコピーに失敗:', err)
        return false
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setLastCopied(text)
      return true
    } catch (err) {
      console.error('クリップボードへのコピーに失敗:', err)
      return false
    }
  }, [isSupported])

  const copyWorkoutData = useCallback(async (workout: any): Promise<boolean> => {
    const workoutText = `
練習記録: ${workout.workout_name || '無題'}
日付: ${workout.date}
距離: ${workout.distance_km || 0}km
時間: ${workout.time_minutes || 0}分
ペース: ${workout.pace_per_km || 'N/A'}
${workout.notes ? `メモ: ${workout.notes}` : ''}
    `.trim()

    return await copyToClipboard(workoutText)
  }, [copyToClipboard])

  const copyRaceData = useCallback(async (race: any): Promise<boolean> => {
    const raceText = `
レース結果: ${race.race_name || '無題'}
日付: ${race.date}
距離: ${race.distance_km || 0}km
記録: ${race.time_minutes || 0}分
ペース: ${race.pace_per_km || 'N/A'}
順位: ${race.rank || 'N/A'}
${race.notes ? `メモ: ${race.notes}` : ''}
    `.trim()

    return await copyToClipboard(raceText)
  }, [copyToClipboard])

  return {
    isSupported,
    lastCopied,
    copyToClipboard,
    copyWorkoutData,
    copyRaceData
  }
}

// Web Share API用のフック
export function useWebShare() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.share) {
      setIsSupported(true)
    }
  }, [])

  const share = useCallback(async (data: {
    title: string
    text?: string
    url?: string
  }): Promise<boolean> => {
    if (!isSupported) {
      // フォールバック: URLをクリップボードにコピー
      const { copyToClipboard } = await import('./useBrowserFeatures')
      const text = data.url || `${data.title}\n${data.text || ''}`
      return await copyToClipboard(text)
    }

    try {
      await navigator.share(data)
      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('共有に失敗:', err)
      }
      return false
    }
  }, [isSupported])

  const shareWorkout = useCallback(async (workout: any): Promise<boolean> => {
    return await share({
      title: `練習記録: ${workout.workout_name || '無題'}`,
      text: `${workout.distance_km || 0}kmを${workout.time_minutes || 0}分で走りました！`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/workouts/${workout.id}` : undefined
    })
  }, [share])

  const shareRace = useCallback(async (race: any): Promise<boolean> => {
    return await share({
      title: `レース結果: ${race.race_name || '無題'}`,
      text: `${race.distance_km || 0}kmを${race.time_minutes || 0}分で走りました！順位: ${race.rank || 'N/A'}`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/races/${race.id}` : undefined
    })
  }, [share])

  return {
    isSupported,
    share,
    shareWorkout,
    shareRace
  }
}

// Service Worker用のフック
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true)
      
      // オンライン/オフライン状態の監視
      setIsOnline(navigator.onLine)
      
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const registerServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      setIsRegistered(true)
      console.log('Service Worker登録成功:', registration)
      return true
    } catch (err) {
      console.error('Service Worker登録失敗:', err)
      return false
    }
  }, [isSupported])

  const unregisterServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
      setIsRegistered(false)
      console.log('Service Worker登録解除成功')
      return true
    } catch (err) {
      console.error('Service Worker登録解除失敗:', err)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    isRegistered,
    isOnline,
    registerServiceWorker,
    unregisterServiceWorker
  }
}

// オフライン基本対応用のフック
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineData, setOfflineData] = useState<any[]>([])
  const [pendingActions, setPendingActions] = useState<any[]>([])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      // オンライン復帰時に保留中のアクションを実行
      processPendingActions()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const processPendingActions = useCallback(async () => {
    if (pendingActions.length === 0) return

    try {
      // 保留中のアクションを順次実行
      for (const action of pendingActions) {
        await action.execute()
      }
      
      // 成功したアクションをクリア
      setPendingActions([])
      console.log('保留中のアクションを処理完了')
    } catch (error) {
      console.error('保留中のアクション処理に失敗:', error)
    }
  }, [pendingActions])

  const addOfflineAction = useCallback((action: {
    type: string
    data: any
    execute: () => Promise<void>
  }) => {
    setPendingActions(prev => [...prev, action])
  }, [])

  const saveOfflineData = useCallback((key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data))
    }
  }, [])

  const loadOfflineData = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`offline_${key}`)
      return saved ? JSON.parse(saved) : null
    }
    return null
  }, [])

  return {
    isOnline,
    offlineData,
    pendingActions,
    addOfflineAction,
    saveOfflineData,
    loadOfflineData
  }
}

// カスタマイズ可能ダッシュボード用のフック
export function useCustomizableDashboard() {
  const [dashboardConfig, setDashboardConfig] = useState({
    widgets: [
      { id: 'stats', enabled: true, position: 0 },
      { id: 'chart', enabled: true, position: 1 },
      { id: 'recent', enabled: true, position: 2 },
      { id: 'goals', enabled: true, position: 3 }
    ],
    layout: 'grid' as 'grid' | 'list',
    theme: 'light' as 'light' | 'dark'
  })

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_config')
      if (saved) {
        try {
          setDashboardConfig(JSON.parse(saved))
        } catch {
          // デフォルト設定を使用
        }
      }
    }
  }, [])

  const updateWidget = useCallback((widgetId: string, updates: Partial<{
    enabled: boolean
    position: number
  }>) => {
    setDashboardConfig(prev => {
      const updated = {
        ...prev,
        widgets: prev.widgets.map(widget => 
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      }
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_config', JSON.stringify(updated))
      }
      
      return updated
    })
  }, [])

  const updateLayout = useCallback((layout: 'grid' | 'list') => {
    setDashboardConfig(prev => {
      const updated = { ...prev, layout }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_config', JSON.stringify(updated))
      }
      
      return updated
    })
  }, [])

  const updateTheme = useCallback((theme: 'light' | 'dark') => {
    setDashboardConfig(prev => {
      const updated = { ...prev, theme }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard_config', JSON.stringify(updated))
      }
      
      return updated
    })
  }, [])

  return {
    dashboardConfig,
    updateWidget,
    updateLayout,
    updateTheme
  }
}

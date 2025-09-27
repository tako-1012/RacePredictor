'use client'

import { useState, useEffect, useCallback } from 'react'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  hasSeenFeatureTooltip: Record<string, boolean>
  lastOnboardingDate: string | null
  userLevel: 'beginner' | 'intermediate' | 'advanced'
}

interface OnboardingProgress {
  completedSteps: string[]
  currentStep: number
  totalSteps: number
  progressPercentage: number
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    hasSeenFeatureTooltip: {},
    lastOnboardingDate: null,
    userLevel: 'beginner'
  })

  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({
    completedSteps: [],
    currentStep: 0,
    totalSteps: 5,
    progressPercentage: 0
  })

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showFeatureTooltip, setShowFeatureTooltip] = useState<string | null>(null)

  // ローカルストレージからオンボーディング状態を読み込み
  useEffect(() => {
    const savedState = localStorage.getItem('onboarding_state')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setOnboardingState(parsedState)
        
        // 初回ユーザーの場合はオンボーディングを表示
        if (!parsedState.hasCompletedOnboarding) {
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('オンボーディング状態の読み込みに失敗:', error)
      }
    } else {
      // 初回ユーザーの場合はオンボーディングを表示
      setShowOnboarding(true)
    }
  }, [])

  // オンボーディング状態をローカルストレージに保存
  const saveOnboardingState = useCallback((newState: Partial<OnboardingState>) => {
    const updatedState = { ...onboardingState, ...newState }
    setOnboardingState(updatedState)
    localStorage.setItem('onboarding_state', JSON.stringify(updatedState))
  }, [onboardingState])

  // オンボーディング完了
  const completeOnboarding = useCallback(() => {
    saveOnboardingState({
      hasCompletedOnboarding: true,
      lastOnboardingDate: new Date().toISOString()
    })
    setShowOnboarding(false)
  }, [saveOnboardingState])

  // オンボーディングスキップ
  const skipOnboarding = useCallback(() => {
    saveOnboardingState({
      hasCompletedOnboarding: true,
      lastOnboardingDate: new Date().toISOString()
    })
    setShowOnboarding(false)
  }, [saveOnboardingState])

  // オンボーディングリセット
  const resetOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: false,
      hasSeenFeatureTooltip: {},
      lastOnboardingDate: null,
      userLevel: 'beginner'
    }
    setOnboardingState(newState)
    setOnboardingProgress({
      completedSteps: [],
      currentStep: 0,
      totalSteps: 5,
      progressPercentage: 0
    })
    localStorage.setItem('onboarding_state', JSON.stringify(newState))
    setShowOnboarding(true)
  }, [])

  // ステップ完了
  const completeStep = useCallback((stepId: string) => {
    setOnboardingProgress(prev => {
      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId)
      }
      
      const newCurrentStep = newCompletedSteps.length
      const newProgressPercentage = (newCurrentStep / prev.totalSteps) * 100
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: newCurrentStep,
        progressPercentage: newProgressPercentage
      }
    })
  }, [])

  // 機能ツールチップ表示
  const showFeatureTooltipForFeature = useCallback((featureId: string) => {
    setShowFeatureTooltip(featureId)
    
    // 機能ツールチップを見たことを記録
    saveOnboardingState({
      hasSeenFeatureTooltip: {
        ...onboardingState.hasSeenFeatureTooltip,
        [featureId]: true
      }
    })
  }, [onboardingState.hasSeenFeatureTooltip, saveOnboardingState])

  // 機能ツールチップ非表示
  const hideFeatureTooltip = useCallback(() => {
    setShowFeatureTooltip(null)
  }, [])

  // ユーザーレベル更新
  const updateUserLevel = useCallback((level: 'beginner' | 'intermediate' | 'advanced') => {
    saveOnboardingState({ userLevel: level })
  }, [saveOnboardingState])

  // オンボーディングが必要かどうかを判定
  const needsOnboarding = useCallback(() => {
    return !onboardingState.hasCompletedOnboarding
  }, [onboardingState.hasCompletedOnboarding])

  // 機能ツールチップが必要かどうかを判定
  const needsFeatureTooltip = useCallback((featureId: string) => {
    return !onboardingState.hasSeenFeatureTooltip[featureId]
  }, [onboardingState.hasSeenFeatureTooltip])

  // オンボーディング統計
  const getOnboardingStats = useCallback(() => {
    const totalFeatures = Object.keys(onboardingState.hasSeenFeatureTooltip).length
    const seenFeatures = Object.values(onboardingState.hasSeenFeatureTooltip).filter(Boolean).length
    
    return {
      totalFeatures,
      seenFeatures,
      completionRate: totalFeatures > 0 ? (seenFeatures / totalFeatures) * 100 : 0,
      userLevel: onboardingState.userLevel,
      lastOnboardingDate: onboardingState.lastOnboardingDate
    }
  }, [onboardingState])

  return {
    // 状態
    onboardingState,
    onboardingProgress,
    showOnboarding,
    showFeatureTooltip,
    
    // アクション
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    completeStep,
    showFeatureTooltipForFeature,
    hideFeatureTooltip,
    updateUserLevel,
    
    // 判定
    needsOnboarding,
    needsFeatureTooltip,
    
    // 統計
    getOnboardingStats
  }
}

// オンボーディング設定
export const onboardingConfig = {
  steps: [
    {
      id: 'welcome',
      title: 'RunMasterへようこそ！',
      description: 'ランニング記録を効率的に管理し、AI予測でパフォーマンス向上を目指しましょう。',
      target: 'body',
      position: 'top' as const
    },
    {
      id: 'dashboard',
      title: 'ダッシュボード',
      description: '練習記録の統計や週間目標の進捗を確認できます。',
      target: '[data-onboarding="dashboard"]',
      position: 'bottom' as const
    },
    {
      id: 'workout-record',
      title: '練習記録',
      description: '練習の詳細を記録し、セッション分割で効率的に管理できます。',
      target: '[data-onboarding="workout-record"]',
      position: 'bottom' as const,
      action: {
        label: '練習記録を見る',
        onClick: () => {
          window.location.href = '/workouts'
        }
      }
    },
    {
      id: 'race-results',
      title: 'レース結果',
      description: 'レース結果を記録し、AI予測で目標タイムを設定できます。',
      target: '[data-onboarding="race-results"]',
      position: 'bottom' as const
    },
    {
      id: 'profile',
      title: 'プロフィール',
      description: '基本情報や自己ベストを設定し、より正確な予測を受けられます。',
      target: '[data-onboarding="profile"]',
      position: 'bottom' as const
    }
  ],
  
  features: [
    'dashboard',
    'workout-record',
    'race-results',
    'profile',
    'csv-import'
  ],
  
  userLevels: {
    beginner: {
      name: '初心者',
      description: 'ランニングを始めたばかりの方',
      features: ['dashboard', 'workout-record', 'profile']
    },
    intermediate: {
      name: '中級者',
      description: '定期的にランニングをしている方',
      features: ['dashboard', 'workout-record', 'race-results', 'profile']
    },
    advanced: {
      name: '上級者',
      description: 'レースを意識した練習をしている方',
      features: ['dashboard', 'workout-record', 'race-results', 'profile', 'csv-import']
    }
  }
}

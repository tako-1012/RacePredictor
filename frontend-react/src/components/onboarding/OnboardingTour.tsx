'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/UI/Icons'

interface OnboardingStep {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingTourProps {
  isVisible: boolean
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ isVisible, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'RunMasterへようこそ！',
      description: 'ランニング記録を効率的に管理し、AI予測でパフォーマンス向上を目指しましょう。',
      target: 'body',
      position: 'top'
    },
    {
      id: 'dashboard',
      title: 'ダッシュボード',
      description: '練習記録の統計や週間目標の進捗を確認できます。',
      target: '[data-onboarding="dashboard"]',
      position: 'bottom'
    },
    {
      id: 'workout-record',
      title: '練習記録',
      description: '練習の詳細を記録し、セッション分割で効率的に管理できます。',
      target: '[data-onboarding="workout-record"]',
      position: 'bottom',
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
      position: 'bottom'
    },
    {
      id: 'profile',
      title: 'プロフィール',
      description: '基本情報や自己ベストを設定し、より正確な予測を受けられます。',
      target: '[data-onboarding="profile"]',
      position: 'bottom'
    }
  ]

  useEffect(() => {
    if (isVisible) {
      setIsActive(true)
      // 最初のステップを表示
      setTimeout(() => {
        showStep(0)
      }, 500)
    }
  }, [isVisible])

  const showStep = (stepIndex: number) => {
    if (stepIndex >= onboardingSteps.length) {
      completeTour()
      return
    }

    const step = onboardingSteps[stepIndex]
    const targetElement = document.querySelector(step.target)
    
    if (targetElement) {
      // ターゲット要素をハイライト
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // ツールチップを表示
      showTooltip(targetElement, step)
    }
  }

  const showTooltip = (targetElement: Element, step: OnboardingStep) => {
    // 既存のツールチップを削除
    const existingTooltip = document.querySelector('.onboarding-tooltip')
    if (existingTooltip) {
      existingTooltip.remove()
    }

    const tooltip = document.createElement('div')
    tooltip.className = 'onboarding-tooltip'
    tooltip.innerHTML = `
      <div class="onboarding-tooltip-content">
        <div class="onboarding-tooltip-header">
          <h3>${step.title}</h3>
          <button class="onboarding-tooltip-close" onclick="window.onboardingTour?.closeTooltip()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/>
            </svg>
          </button>
        </div>
        <p>${step.description}</p>
        <div class="onboarding-tooltip-footer">
          <div class="onboarding-progress">
            <span>${currentStep + 1} / ${onboardingSteps.length}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${((currentStep + 1) / onboardingSteps.length) * 100}%"></div>
            </div>
          </div>
          <div class="onboarding-actions">
            <button class="btn-skip" onclick="window.onboardingTour?.skipTour()">スキップ</button>
            ${step.action ? `<button class="btn-action" onclick="window.onboardingTour?.performAction()">${step.action.label}</button>` : ''}
            <button class="btn-next" onclick="window.onboardingTour?.nextStep()">
              ${currentStep === onboardingSteps.length - 1 ? '完了' : '次へ'}
            </button>
          </div>
        </div>
      </div>
    `

    // スタイルを追加
    const style = document.createElement('style')
    style.textContent = `
      .onboarding-tooltip {
        position: fixed;
        z-index: 10000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e5e7eb;
        max-width: 320px;
        animation: onboarding-fade-in 0.3s ease-out;
      }
      
      .onboarding-tooltip-content {
        padding: 20px;
      }
      
      .onboarding-tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .onboarding-tooltip-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
      
      .onboarding-tooltip-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .onboarding-tooltip-close:hover {
        background-color: #f3f4f6;
      }
      
      .onboarding-tooltip p {
        margin: 0 0 16px 0;
        color: #6b7280;
        line-height: 1.5;
      }
      
      .onboarding-tooltip-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .onboarding-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #6b7280;
      }
      
      .progress-bar {
        flex: 1;
        height: 4px;
        background-color: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background-color: #3b82f6;
        transition: width 0.3s ease;
      }
      
      .onboarding-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .onboarding-actions button {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-skip {
        background: none;
        border: 1px solid #d1d5db;
        color: #6b7280;
      }
      
      .btn-skip:hover {
        background-color: #f9fafb;
      }
      
      .btn-action {
        background-color: #10b981;
        border: 1px solid #10b981;
        color: white;
      }
      
      .btn-action:hover {
        background-color: #059669;
      }
      
      .btn-next {
        background-color: #3b82f6;
        border: 1px solid #3b82f6;
        color: white;
      }
      
      .btn-next:hover {
        background-color: #2563eb;
      }
      
      @keyframes onboarding-fade-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .onboarding-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        animation: onboarding-overlay-fade-in 0.3s ease-out;
      }
      
      @keyframes onboarding-overlay-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `
    document.head.appendChild(style)

    // オーバーレイを追加
    const overlay = document.createElement('div')
    overlay.className = 'onboarding-overlay'
    document.body.appendChild(overlay)

    // ツールチップを配置
    const rect = targetElement.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    
    let top = rect.top + window.scrollY
    let left = rect.left + window.scrollX

    switch (step.position) {
      case 'top':
        top = rect.top + window.scrollY - tooltipRect.height - 10
        left = rect.left + window.scrollX + (rect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = rect.bottom + window.scrollY + 10
        left = rect.left + window.scrollX + (rect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = rect.top + window.scrollY + (rect.height - tooltipRect.height) / 2
        left = rect.left + window.scrollX - tooltipRect.width - 10
        break
      case 'right':
        top = rect.top + window.scrollY + (rect.height - tooltipRect.height) / 2
        left = rect.right + window.scrollX + 10
        break
    }

    tooltip.style.top = `${Math.max(10, top)}px`
    tooltip.style.left = `${Math.max(10, left)}px`
    
    document.body.appendChild(tooltip)

    // グローバル関数を設定
    window.onboardingTour = {
      nextStep: () => {
        setCurrentStep(prev => {
          const next = prev + 1
          showStep(next)
          return next
        })
      },
      skipTour: () => {
        closeTooltip()
        onSkip()
      },
      completeTour: () => {
        closeTooltip()
        onComplete()
      },
      performAction: () => {
        if (step.action) {
          step.action.onClick()
        }
      },
      closeTooltip: () => {
        closeTooltip()
      }
    }
  }

  const closeTooltip = () => {
    const tooltip = document.querySelector('.onboarding-tooltip')
    const overlay = document.querySelector('.onboarding-overlay')
    
    if (tooltip) tooltip.remove()
    if (overlay) overlay.remove()
    
    setIsActive(false)
  }

  const completeTour = () => {
    closeTooltip()
    onComplete()
  }

  const skipTour = () => {
    closeTooltip()
    onSkip()
  }

  if (!isVisible || !isActive) {
    return null
  }

  return null
}

// オンボーディング管理フック
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // ローカルストレージからオンボーディング完了状態を確認
    const completed = localStorage.getItem('onboarding_completed')
    if (completed === 'true') {
      setHasCompletedOnboarding(true)
    } else {
      // 初回ユーザーの場合はオンボーディングを表示
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
  }

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed')
    setHasCompletedOnboarding(false)
    setShowOnboarding(true)
  }

  return {
    hasCompletedOnboarding,
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  }
}

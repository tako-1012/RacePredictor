'use client'

import React, { useEffect, useRef, KeyboardEvent } from 'react'
import { Icons } from './Icons'

// キーボードナビゲーション用のフック
export function useKeyboardNavigation() {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
      if (!containerRef.current) return

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element)
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          const nextIndex = (currentIndex + 1) % focusableElements.length
          ;(focusableElements[nextIndex] as HTMLElement)?.focus()
          break
          
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
          ;(focusableElements[prevIndex] as HTMLElement)?.focus()
          break
          
        case 'Home':
          e.preventDefault()
          ;(focusableElements[0] as HTMLElement)?.focus()
          break
          
        case 'End':
          e.preventDefault()
          ;(focusableElements[focusableElements.length - 1] as HTMLElement)?.focus()
          break
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown as any)
      return () => container.removeEventListener('keydown', handleKeyDown as any)
    }
  }, [])

  return containerRef
}

// アクセシブルなボタンコンポーネント
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      ) : leftIcon ? (
        <span className="mr-2" aria-hidden="true">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>
      
      {rightIcon && !loading && (
        <span className="ml-2" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  )
}

// アクセシブルなリンクコンポーネント
interface AccessibleLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

export function AccessibleLink({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}: AccessibleLinkProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  }

  return (
    <a
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {leftIcon && (
        <span className="mr-2" aria-hidden="true">{leftIcon}</span>
      )}
      
      <span>{children}</span>
      
      {rightIcon && (
        <span className="ml-2" aria-hidden="true">{rightIcon}</span>
      )}
    </a>
  )
}

// アクセシブルなモーダルコンポーネント
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
      
      // ESCキーでモーダルを閉じる
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    } else {
      // モーダルが閉じられた時、前の要素にフォーカスを戻す
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden ${className}`}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="モーダルを閉じる"
          >
            <Icons.X size="sm" />
          </AccessibleButton>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// アクセシブルなドロップダウンコンポーネント
interface AccessibleDropdownProps {
  isOpen: boolean
  onClose: () => void
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AccessibleDropdown({
  isOpen,
  onClose,
  trigger,
  children,
  className = ''
}: AccessibleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // ESCキーでドロップダウンを閉じる
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      // 外部クリックでドロップダウンを閉じる
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {trigger}
      
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </div>
      )}
    </div>
  )
}

// カラーアクセシビリティ用のユーティリティ
export const ACCESSIBLE_COLORS = {
  // 十分なコントラスト比を確保した色
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    error: 'text-red-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  },
  
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    muted: 'bg-gray-100',
    error: 'bg-red-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  },
  
  border: {
    primary: 'border-gray-200',
    secondary: 'border-gray-300',
    error: 'border-red-200',
    success: 'border-green-200',
    warning: 'border-yellow-200',
    info: 'border-blue-200'
  },
  
  // ボタン用のアクセシブルな色
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
  }
} as const

// 色のみに依存しない情報表示のためのヘルパー
export function ColorIndependentInfo({ 
  children, 
  icon, 
  className = '' 
}: { 
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

// スクリーンリーダー用のテキスト
export function ScreenReaderText({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// フォーカス表示の統一
export const FOCUS_STYLES = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  visible: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-opacity-75'
} as const

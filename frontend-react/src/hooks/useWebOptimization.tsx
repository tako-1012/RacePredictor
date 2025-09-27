'use client'

import React, { useEffect, useRef, KeyboardEvent, useState } from 'react'

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

// 数値入力用のキーボードショートカット
export function useNumericInputShortcuts() {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        const currentValue = parseFloat(input.value) || 0
        const step = parseFloat(input.step) || 1
        input.value = (currentValue + step).toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
        break
        
      case 'ArrowDown':
        e.preventDefault()
        const currentValueDown = parseFloat(input.value) || 0
        const stepDown = parseFloat(input.step) || 1
        input.value = Math.max(0, currentValueDown - stepDown).toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
        break
        
      case 'PageUp':
        e.preventDefault()
        const currentValuePgUp = parseFloat(input.value) || 0
        const stepPgUp = (parseFloat(input.step) || 1) * 10
        input.value = (currentValuePgUp + stepPgUp).toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
        break
        
      case 'PageDown':
        e.preventDefault()
        const currentValuePgDown = parseFloat(input.value) || 0
        const stepPgDown = (parseFloat(input.step) || 1) * 10
        input.value = Math.max(0, currentValuePgDown - stepPgDown).toString()
        input.dispatchEvent(new Event('input', { bubbles: true }))
        break
    }
  }

  return handleKeyDown
}

// フォーム間の自動フォーカス移動
export function useAutoFocus() {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const fieldRefs = useRef<(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]>([])

  const registerField = (ref: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    if (ref && !fieldRefs.current.includes(ref)) {
      fieldRefs.current.push(ref)
    }
  }

  const focusNextField = () => {
    const nextIndex = (currentFieldIndex + 1) % fieldRefs.current.length
    setCurrentFieldIndex(nextIndex)
    fieldRefs.current[nextIndex]?.focus()
  }

  const focusPreviousField = () => {
    const prevIndex = currentFieldIndex === 0 ? fieldRefs.current.length - 1 : currentFieldIndex - 1
    setCurrentFieldIndex(prevIndex)
    fieldRefs.current[prevIndex]?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      focusNextField()
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      focusPreviousField()
    }
  }

  return {
    registerField,
    focusNextField,
    focusPreviousField,
    handleKeyDown
  }
}

// よく使う値のドロップダウン候補表示
interface SmartInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  type?: 'text' | 'number'
  className?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function SmartInput({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  type = 'text',
  className = '',
  onKeyDown
}: SmartInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const numericShortcuts = useNumericInputShortcuts()

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 数値入力のショートカット
    if (type === 'number') {
      numericShortcuts(e)
    }

    // カスタムキーハンドラー
    if (onKeyDown) {
      onKeyDown(e)
    }

    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          )
          break
          
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          )
          break
          
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            onChange(filteredSuggestions[selectedIndex])
            setShowSuggestions(false)
            setSelectedIndex(-1)
          }
          break
          
        case 'Escape':
          setShowSuggestions(false)
          setSelectedIndex(-1)
          break
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleBlur = () => {
    // 少し遅延させてクリックイベントを処理
    setTimeout(() => setShowSuggestions(false), 150)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 入力状態の保存・復元用フック
export function useFormPersistence<T>(key: string, initialValue: T) {
  const [formData, setFormData] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return initialValue
        }
      }
    }
    return initialValue
  })

  const updateFormData = (newData: T | ((prev: T) => T)) => {
    const updatedData = typeof newData === 'function' ? (newData as (prev: T) => T)(formData) : newData
    setFormData(updatedData)
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(updatedData))
    }
  }

  const clearFormData = () => {
    setFormData(initialValue)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }

  // ページリロード時の復元
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(formData))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formData, key])

  return {
    formData,
    updateFormData,
    clearFormData
  }
}

// 下書き保存機能
export function useDraftSave<T>(key: string, data: T, interval: number = 30000) {
  useEffect(() => {
    const saveDraft = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${key}_draft`, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      }
    }

    const intervalId = setInterval(saveDraft, interval)
    
    // コンポーネントアンマウント時にも保存
    return () => {
      clearInterval(intervalId)
      saveDraft()
    }
  }, [data, key, interval])

  const loadDraft = (): T | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${key}_draft`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // 24時間以内の下書きのみ有効
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed.data
          }
        } catch {
          return null
        }
      }
    }
    return null
  }

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${key}_draft`)
    }
  }

  return {
    loadDraft,
    clearDraft
  }
}

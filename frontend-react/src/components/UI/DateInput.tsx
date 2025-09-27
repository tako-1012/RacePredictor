import React, { useState, useEffect, useRef } from 'react'

interface DateInputProps {
  value: string // スラッシュ区切りの日付（例: "2024/1/1"）
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  showCalendarIcon?: boolean // カレンダーアイコンを表示するかどうか
}

/**
 * スラッシュ区切りで日付を入力・表示するカスタムコンポーネント
 */
export const DateInput: React.FC<DateInputProps> = ({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'YYYY/M/D',
  showCalendarIcon = true
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // 数字とスラッシュのみ許可
    inputValue = inputValue.replace(/[^0-9/]/g, '')
    
    // スラッシュの位置を制限（YYYY/M/D形式）
    const parts = inputValue.split('/')
    if (parts.length > 3) {
      inputValue = parts.slice(0, 3).join('/')
    }
    
    // 年（4桁）、月（2桁）、日（2桁）の長さ制限
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4)
    }
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2)
    }
    if (parts[2] && parts[2].length > 2) {
      parts[2] = parts[2].slice(0, 2)
    }
    
    // 年の妥当性チェック（1900年から現在年+1年まで、ただし100歳を超えない範囲）
    if (parts[0] && parts[0].length === 4) {
      const year = parseInt(parts[0])
      const currentYear = new Date().getFullYear()
      const minYear = currentYear - 100  // 100歳を超えない範囲
      const maxYear = currentYear + 1
      
      if (year < minYear || year > maxYear) {
        // 無効な年の場合は入力を受け付けない
        return
      }
    }
    
    // 月の妥当性チェック（1-12）
    if (parts[1] && parts[1].length === 2) {
      const month = parseInt(parts[1])
      if (month < 1 || month > 12) {
        // 無効な月の場合は入力を受け付けない
        return
      }
    }
    
    // 日の妥当性チェック（1-31）
    if (parts[2] && parts[2].length === 2) {
      const day = parseInt(parts[2])
      if (day < 1 || day > 31) {
        // 無効な日の場合は入力を受け付けない
        return
      }
    }
    
    inputValue = parts.join('/')
    
    setDisplayValue(inputValue)
    onChange(inputValue)
  }

  const handleBlur = () => {
    // フォーカスが外れた時に日付の妥当性をチェック
    const parts = displayValue.split('/')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1])
      const day = parseInt(parts[2])
      const currentYear = new Date().getFullYear()
      
      // より厳密な妥当性チェック（100歳を超えない範囲）
      const minYear = currentYear - 100
      if (year >= minYear && year <= currentYear + 1 && 
          month >= 1 && month <= 12 && 
          day >= 1 && day <= 31) {
        
        // 実際の日付として有効かチェック
        const date = new Date(year, month - 1, day)
        if (date.getFullYear() === year && 
            date.getMonth() === month - 1 && 
            date.getDate() === day) {
          // 妥当な日付の場合、ゼロパディングを削除
          const formattedValue = `${year}/${month}/${day}`
          setDisplayValue(formattedValue)
          onChange(formattedValue)
        } else {
          // 無効な日付（例：2月30日）の場合はリセット
          setDisplayValue('')
          onChange('')
        }
      } else {
        // 範囲外の場合はリセット
        setDisplayValue('')
        onChange('')
      }
    }
  }

  const handleCalendarClick = () => {
    console.log('カレンダーアイコンクリック:', displayValue)
    
    // より簡単な方法：隠しinput要素を作成してカレンダーを開く
    const tempInput = document.createElement('input')
    tempInput.type = 'date'
    tempInput.style.position = 'fixed'
    tempInput.style.top = '-1000px'
    tempInput.style.left = '-1000px'
    tempInput.style.opacity = '0'
    tempInput.style.pointerEvents = 'none'
    
    // 現在の日付を設定（空の場合は今日の日付）
    if (displayValue && displayValue.includes('/')) {
      const parts = displayValue.split('/')
      if (parts.length === 3) {
        const year = parts[0].padStart(4, '0')
        const month = parts[1].padStart(2, '0')
        const day = parts[2].padStart(2, '0')
        tempInput.value = `${year}-${month}-${day}`
      }
    }
    
    document.body.appendChild(tempInput)
    
    // 日付が選択された時の処理
    tempInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      console.log('カレンダーで選択された日付:', target.value)
      
      if (target.value) {
        const [year, month, day] = target.value.split('-')
        const formattedValue = `${parseInt(year)}/${parseInt(month)}/${parseInt(day)}`
        console.log('フォーマットされた日付:', formattedValue)
        setDisplayValue(formattedValue)
        onChange(formattedValue)
      }
      
      // 一時的なinputを削除
      document.body.removeChild(tempInput)
    })
    
    // カレンダーを開く
    tempInput.focus()
    tempInput.click()
    
    // フォーカスが外れた場合のクリーンアップ
    setTimeout(() => {
      if (document.body.contains(tempInput)) {
        document.body.removeChild(tempInput)
      }
    }, 1000)
  }

  return (
    <div className="relative">
      <input
        ref={dateInputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${showCalendarIcon ? 'pr-10' : ''} ${className}`}
      />
      {showCalendarIcon && (
        <button
          type="button"
          onClick={handleCalendarClick}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          title="カレンダーから選択"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  )
}

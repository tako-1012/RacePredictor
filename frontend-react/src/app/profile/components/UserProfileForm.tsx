'use client'

import { useState, useEffect } from 'react'
import { UserProfile, UserProfileFormData } from '@/types'
import { calculateAge, validateBirthDate, formatBirthDateJapanese } from '@/utils/ageCalculation'

interface UserProfileFormProps {
  initialData?: UserProfile | null
  onSubmit: (data: UserProfileFormData) => void
}

export function UserProfileForm({ initialData, onSubmit }: UserProfileFormProps) {
  const [formData, setFormData] = useState<UserProfileFormData>({
    age: initialData?.age || 0,
    birth_date: initialData?.birth_date || '2000/1/1',
    gender: initialData?.gender || 'M',
    height_cm: initialData?.height_cm || 0,
    weight_kg: initialData?.weight_kg || 0,
    resting_hr: initialData?.resting_hr || undefined,
    max_hr: initialData?.max_hr || undefined,
    vo2_max: initialData?.vo2_max || undefined,
  })

  const [bmi, setBmi] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [birthDateError, setBirthDateError] = useState<string>('')

  useEffect(() => {
    if (formData.height_cm > 0 && formData.weight_kg > 0) {
      const heightM = formData.height_cm / 100
      const calculatedBmi = formData.weight_kg / (heightM * heightM)
      setBmi(Math.round(calculatedBmi * 10) / 10)
    } else {
      setBmi(null)
    }
  }, [formData.height_cm, formData.weight_kg])

  // 生年月日から年齢を自動計算
  useEffect(() => {
    if (formData.birth_date) {
      const validation = validateBirthDate(formData.birth_date)
      if (validation.isValid) {
        const calculatedAge = calculateAge(formData.birth_date)
        setFormData(prev => ({ ...prev, age: calculatedAge }))
        setBirthDateError('')
      } else {
        setBirthDateError(validation.error || '')
      }
    }
  }, [formData.birth_date])

  const handleInputChange = (field: keyof UserProfileFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 生年月日の妥当性チェック
    if (!formData.birth_date) {
      setBirthDateError('生年月日を入力してください')
      return
    }
    
    const validation = validateBirthDate(formData.birth_date)
    if (!validation.isValid) {
      setBirthDateError(validation.error || '')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 生年月日 */}
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
            生年月日 *
          </label>
          <input
            type="date"
            id="birth_date"
            value={formData.birth_date || ''}
            onChange={(e) => handleInputChange('birth_date', e.target.value)}
            min={`${new Date().getFullYear() - 100}-01-01`}
            max={`${new Date().getFullYear() + 1}-12-31`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              birthDateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {birthDateError && (
            <p className="mt-1 text-sm text-red-600">{birthDateError}</p>
          )}
        </div>

        {/* 年齢（自動計算・読み取り専用） */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            年齢（自動計算）
          </label>
          <input
            type="text"
            id="age"
            value={formData.age > 0 ? `${formData.age}歳` : '生年月日を入力してください'}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* 性別 */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            性別 *
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value as 'M' | 'F' | 'Other')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="M">男性</option>
            <option value="F">女性</option>
            <option value="Other">その他</option>
          </select>
        </div>

        {/* 身長 */}
        <div>
          <label htmlFor="height_cm" className="block text-sm font-medium text-gray-700 mb-2">
            身長 (cm) *
          </label>
          <input
            type="number"
            id="height_cm"
            min="100"
            max="250"
            step="0.1"
            value={formData.height_cm || ''}
            onChange={(e) => handleInputChange('height_cm', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 体重 */}
        <div>
          <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-2">
            体重 (kg) *
          </label>
          <input
            type="number"
            id="weight_kg"
            min="20"
            max="200"
            step="0.1"
            value={formData.weight_kg || ''}
            onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* BMI表示 */}
        {bmi !== null && (
          <div className="md:col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">BMI: {bmi}</span>
                    {bmi < 18.5 && ' (低体重)'}
                    {bmi >= 18.5 && bmi < 25 && ' (標準体重)'}
                    {bmi >= 25 && bmi < 30 && ' (肥満度1)'}
                    {bmi >= 30 && ' (肥満度2以上)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 安静時心拍数 */}
        <div>
          <label htmlFor="resting_hr" className="block text-sm font-medium text-gray-700 mb-2">
            安静時心拍数 (bpm)
          </label>
          <input
            type="number"
            id="resting_hr"
            min="30"
            max="120"
            value={formData.resting_hr || ''}
            onChange={(e) => handleInputChange('resting_hr', parseInt(e.target.value) || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 60"
          />
        </div>

        {/* 最大心拍数 */}
        <div>
          <label htmlFor="max_hr" className="block text-sm font-medium text-gray-700 mb-2">
            最大心拍数 (bpm)
          </label>
          <input
            type="number"
            id="max_hr"
            min="120"
            max="220"
            value={formData.max_hr || ''}
            onChange={(e) => handleInputChange('max_hr', parseInt(e.target.value) || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 180"
          />
        </div>

        {/* VO2Max */}
        <div className="md:col-span-2">
          <label htmlFor="vo2_max" className="block text-sm font-medium text-gray-700 mb-2">
            VO2Max (ml/kg/min)
          </label>
          <input
            type="number"
            id="vo2_max"
            min="20"
            max="80"
            step="0.1"
            value={formData.vo2_max || ''}
            onChange={(e) => handleInputChange('vo2_max', parseFloat(e.target.value) || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 45.5"
          />
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !formData.birth_date || birthDateError !== ''}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

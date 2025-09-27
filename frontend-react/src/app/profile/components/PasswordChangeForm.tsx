'use client'

import { useState } from 'react'
import { apiClient, handleApiError } from '@/lib/api'

interface PasswordChangeFormProps {
  onSuccess: () => void
}

export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'パスワードは8文字以上である必要があります'
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'パスワードには英字を含める必要があります'
    }
    if (!/\d/.test(password)) {
      return 'パスワードには数字を含める必要があります'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // バリデーション
      if (formData.new_password !== formData.confirm_password) {
        setError('新しいパスワードと確認パスワードが一致しません')
        return
      }

      const passwordError = validatePassword(formData.new_password)
      if (passwordError) {
        setError(passwordError)
        return
      }

      await apiClient.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      })
      
      setFormData({ current_password: '', new_password: '', confirm_password: '' })
      onSuccess()
    } catch (err: any) {
      const apiError = handleApiError(err)
      setError(apiError.message || 'パスワードの変更に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
          現在のパスワード
        </label>
        <input
          type="password"
          id="current_password"
          value={formData.current_password}
          onChange={(e) => handleInputChange('current_password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="現在のパスワードを入力"
          required
        />
      </div>

      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
          新しいパスワード
        </label>
        <input
          type="password"
          id="new_password"
          value={formData.new_password}
          onChange={(e) => handleInputChange('new_password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="新しいパスワードを入力（8文字以上、英数字混合）"
          required
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
          新しいパスワード（確認）
        </label>
        <input
          type="password"
          id="confirm_password"
          value={formData.confirm_password}
          onChange={(e) => handleInputChange('confirm_password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="新しいパスワードを再入力"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !formData.current_password || !formData.new_password || !formData.confirm_password}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '変更中...' : 'パスワードを変更'}
      </button>
    </form>
  )
}

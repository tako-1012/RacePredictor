'use client'

import { useState } from 'react'
import { apiClient, handleApiError } from '@/lib/api'

interface EmailChangeFormProps {
  onSuccess: () => void
}

export function EmailChangeForm({ onSuccess }: EmailChangeFormProps) {
  const [formData, setFormData] = useState({
    new_email: '',
    password: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await apiClient.changeEmail(formData)
      setFormData({ new_email: '', password: '' })
      onSuccess()
    } catch (err: any) {
      const apiError = handleApiError(err)
      setError(apiError.message || 'メールアドレスの変更に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new_email" className="block text-sm font-medium text-gray-700 mb-1">
          新しいメールアドレス
        </label>
        <input
          type="email"
          id="new_email"
          value={formData.new_email}
          onChange={(e) => handleInputChange('new_email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="新しいメールアドレスを入力"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          現在のパスワード
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="現在のパスワードを入力"
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
        disabled={isSubmitting || !formData.new_email || !formData.password}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '変更中...' : 'メールアドレスを変更'}
      </button>
    </form>
  )
}

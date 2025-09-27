'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/UI/Icons'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'

interface ContactFormData {
  name: string
  email: string
  subject: string
  category: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  attachments?: File[]
}

const categories = [
  { value: 'general', label: '一般的な質問' },
  { value: 'bug', label: 'バグレポート' },
  { value: 'feature', label: '機能要望' },
  { value: 'data', label: 'データ関連' },
  { value: 'account', label: 'アカウント関連' },
  { value: 'technical', label: '技術的な問題' },
  { value: 'other', label: 'その他' }
]

const priorities = [
  { value: 'low', label: '低', color: 'text-gray-600' },
  { value: 'normal', label: '通常', color: 'text-blue-600' },
  { value: 'high', label: '高', color: 'text-yellow-600' },
  { value: 'urgent', label: '緊急', color: 'text-red-600' }
]

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'normal',
    attachments: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})

  const handleInputChange = (field: keyof ContactFormData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'お名前を入力してください'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = '件名を入力してください'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'メッセージを入力してください'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'メッセージは10文字以上で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // 実際の実装では、APIに送信
      await new Promise(resolve => setTimeout(resolve, 2000)) // シミュレーション
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('送信エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleInputChange('attachments', files)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Breadcrumb />
          </div>
          
          <div className="text-center py-12">
            <Icons.CheckCircle size="xl" className="mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              お問い合わせを受け付けました
            </h1>
            <p className="text-gray-600 mb-6">
              ご質問・ご要望をありがとうございます。内容を確認の上、2営業日以内にご返信いたします。
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                新しいお問い合わせ
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors ml-2"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
          <p className="text-gray-600">
            ご質問・ご要望・バグレポートなど、お気軽にお問い合わせください。
          </p>
        </div>

        {/* お問い合わせフォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="山田太郎"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* 件名 */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                件名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="お問い合わせの件名を入力してください"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            {/* カテゴリーと優先度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリー
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* メッセージ */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                rows={6}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.message ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="ご質問・ご要望の詳細を入力してください"
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-600">
                {formData.message.length} / 1000文字
              </p>
            </div>

            {/* ファイル添付 */}
            <div>
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                ファイル添付（任意）
              </label>
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.csv"
              />
              <p className="mt-1 text-sm text-gray-600">
                画像、PDF、テキストファイルを添付できます（最大10MB）
              </p>
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">添付ファイル:</p>
                  <ul className="mt-1 text-sm text-gray-600">
                    {formData.attachments.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>送信中...</span>
                  </div>
                ) : (
                  '送信'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* お問い合わせ情報 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            お問い合わせについて
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <Icons.Clock size="sm" className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span>通常2営業日以内にご返信いたします</span>
            </div>
            <div className="flex items-start space-x-2">
              <Icons.Mail size="sm" className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span>緊急の場合は、優先度を「緊急」に設定してください</span>
            </div>
            <div className="flex items-start space-x-2">
              <Icons.Shield size="sm" className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span>個人情報は適切に管理され、第三者に提供されることはありません</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

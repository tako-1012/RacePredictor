'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/UI/Icons'

interface BugReportData {
  title: string
  description: string
  steps: string
  expected: string
  actual: string
  environment: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  attachments?: File[]
  userAgent: string
  url: string
}

const severityLevels = [
  { value: 'low', label: '低', color: 'text-gray-600', description: '軽微な問題' },
  { value: 'medium', label: '中', color: 'text-yellow-600', description: '一般的な問題' },
  { value: 'high', label: '高', color: 'text-orange-600', description: '重要な問題' },
  { value: 'critical', label: '緊急', color: 'text-red-600', description: '致命的な問題' }
]

interface BugReportProps {
  onClose?: () => void
  onSubmit?: (data: BugReportData) => void
}

export function BugReport({ onClose, onSubmit }: BugReportProps) {
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    environment: '',
    severity: 'medium',
    attachments: [],
    userAgent: navigator.userAgent,
    url: window.location.href
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<BugReportData>>({})

  const handleInputChange = (field: keyof BugReportData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<BugReportData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルを入力してください'
    }

    if (!formData.description.trim()) {
      newErrors.description = '問題の説明を入力してください'
    } else if (formData.description.trim().length < 20) {
      newErrors.description = '問題の説明は20文字以上で入力してください'
    }

    if (!formData.steps.trim()) {
      newErrors.steps = '再現手順を入力してください'
    }

    if (!formData.expected.trim()) {
      newErrors.expected = '期待される動作を入力してください'
    }

    if (!formData.actual.trim()) {
      newErrors.actual = '実際の動作を入力してください'
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
      
      onSubmit?.(formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error('バグレポート送信エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleInputChange('attachments', files)
  }

  const getSeverityColor = (severity: string) => {
    const level = severityLevels.find(s => s.value === severity)
    return level?.color || 'text-gray-600'
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <Icons.CheckCircle size="xl" className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              バグレポートを送信しました
            </h3>
            <p className="text-gray-600 mb-4">
              ご報告ありがとうございます。問題を確認の上、修正いたします。
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icons.Bug size="md" className="text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">バグレポート</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icons.X size="md" />
            </button>
          )}
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="問題のタイトルを入力してください"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 重要度 */}
          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
              重要度
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) => handleInputChange('severity', e.target.value as 'low' | 'medium' | 'high' | 'critical')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {severityLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          {/* 問題の説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              問題の説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="問題の詳細を説明してください"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* 再現手順 */}
          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-2">
              再現手順 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="steps"
              rows={4}
              value={formData.steps}
              onChange={(e) => handleInputChange('steps', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.steps ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="1. ページを開く&#10;2. ボタンをクリック&#10;3. エラーが発生"
            />
            {errors.steps && (
              <p className="mt-1 text-sm text-red-600">{errors.steps}</p>
            )}
          </div>

          {/* 期待される動作と実際の動作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="expected" className="block text-sm font-medium text-gray-700 mb-2">
                期待される動作 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="expected"
                rows={3}
                value={formData.expected}
                onChange={(e) => handleInputChange('expected', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.expected ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="本来はこのように動作するはず"
              />
              {errors.expected && (
                <p className="mt-1 text-sm text-red-600">{errors.expected}</p>
              )}
            </div>

            <div>
              <label htmlFor="actual" className="block text-sm font-medium text-gray-700 mb-2">
                実際の動作 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="actual"
                rows={3}
                value={formData.actual}
                onChange={(e) => handleInputChange('actual', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.actual ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="実際にはこのように動作した"
              />
              {errors.actual && (
                <p className="mt-1 text-sm text-red-600">{errors.actual}</p>
              )}
            </div>
          </div>

          {/* 環境情報 */}
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
              環境情報
            </label>
            <textarea
              id="environment"
              rows={3}
              value={formData.environment}
              onChange={(e) => handleInputChange('environment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="OS: Windows 10&#10;ブラウザ: Chrome 120&#10;デバイス: PC"
            />
          </div>

          {/* ファイル添付 */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
              スクリーンショット・ログファイル（任意）
            </label>
            <input
              type="file"
              id="attachments"
              multiple
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept=".jpg,.jpeg,.png,.gif,.txt,.log"
            />
            <p className="mt-1 text-sm text-gray-600">
              エラーのスクリーンショットやログファイルを添付してください
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

          {/* 自動収集情報 */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">自動収集情報</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>URL: {formData.url}</div>
              <div>ブラウザ: {formData.userAgent}</div>
              <div>時刻: {new Date().toLocaleString('ja-JP')}</div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>送信中...</span>
                </div>
              ) : (
                'バグレポートを送信'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// バグレポートボタンコンポーネント
export function BugReportButton() {
  const [showBugReport, setShowBugReport] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowBugReport(true)}
        className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
      >
        <Icons.Bug size="sm" />
        <span>バグレポート</span>
      </button>

      {showBugReport && (
        <BugReport
          onClose={() => setShowBugReport(false)}
          onSubmit={(data) => {
            console.log('バグレポート送信:', data)
            setShowBugReport(false)
          }}
        />
      )}
    </>
  )
}

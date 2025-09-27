'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface SectionTemplate {
  id: string
  name: string
  description?: string
  section_type: 'warmup' | 'main' | 'cooldown'
  steps: any[]
  created_at: string
}

interface SectionTemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: SectionTemplate) => void
  sectionType: 'warmup' | 'main' | 'cooldown'
}

export function SectionTemplateSelector({ 
  isOpen, 
  onClose, 
  onSelectTemplate, 
  sectionType 
}: SectionTemplateSelectorProps) {
  const [templates, setTemplates] = useState<SectionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadSectionTemplates()
    }
  }, [isOpen, sectionType])

  const loadSectionTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // セクションテンプレートを取得
      const response = await apiClient.getCustomWorkoutTemplates({ 
        template_type: 'section',
        section_type: sectionType 
      })
      const sectionTemplates = response || []
      
      setTemplates(sectionTemplates)
    } catch (err) {
      console.error('セクションテンプレートの読み込みエラー:', err)
      setError('セクションテンプレートの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplate = (template: SectionTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const getSectionTypeLabel = (type: string) => {
    const labels = {
      warmup: 'ウォームアップ',
      main: 'メイン',
      cooldown: 'クールダウン'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getSectionTypeIcon = (type: string) => {
    const icons = {
      warmup: '🔥',
      main: '💪',
      cooldown: '🧘'
    }
    return icons[type as keyof typeof icons] || '⚡'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {getSectionTypeIcon(sectionType)} {getSectionTypeLabel(sectionType)}テンプレートを選択
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={loadSectionTemplates}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                再試行
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {getSectionTypeLabel(sectionType)}のテンプレートがありません
              </div>
              <p className="text-sm text-gray-400">
                まずセクションテンプレートを作成してください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {template.steps.length}ステップ
                    </span>
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getSectionTypeLabel(template.section_type)}</span>
                    <span>
                      {new Date(template.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  
                  {/* ステップのプレビュー */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">含まれるステップ:</div>
                    <div className="space-y-1">
                      {template.steps.slice(0, 3).map((step, index) => (
                        <div key={index} className="text-xs text-gray-600 truncate">
                          • {step.type === 'run' ? 'ランニング' : 
                             step.type === 'rest' ? 'レスト' :
                             step.type === 'recovery' ? 'リカバリー' :
                             step.type === 'warmup' ? 'ウォームアップ' :
                             step.type === 'cooldown' ? 'クールダウン' :
                             step.type === 'strength' ? '筋力' :
                             step.type === 'stretch' ? 'ストレッチ' : 'その他'}
                          {step.distance && ` (${step.distance}m)`}
                          {step.duration && ` (${Math.floor(step.duration / 60)}分)`}
                        </div>
                      ))}
                      {template.steps.length > 3 && (
                        <div className="text-xs text-gray-400">
                          ...他{template.steps.length - 3}ステップ
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

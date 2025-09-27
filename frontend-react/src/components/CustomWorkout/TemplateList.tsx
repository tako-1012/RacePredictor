'use client'

import { CustomWorkoutTemplate } from '@/types/customWorkout'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'

interface TemplateListProps {
  templates: CustomWorkoutTemplate[]
  onEdit: (template: CustomWorkoutTemplate) => void
  onDelete: (templateId: string) => void
  isLoading?: boolean
}

export function TemplateList({ templates, onEdit, onDelete, isLoading = false }: TemplateListProps) {
  const handleDeleteClick = (templateId: string, templateName: string) => {
    if (confirm(`「${templateName}」を削除しますか？`)) {
      onDelete(templateId)
    }
  }

  const getTemplateTypeIcon = (templateType: string) => {
    switch (templateType) {
      case 'daily':
        return '🏃‍♂️'
      case 'set':
        return '🎯'
      case 'section':
        return '⚡'
      default:
        return '📝'
    }
  }

  const getTemplateTypeLabel = (templateType: string) => {
    switch (templateType) {
      case 'daily':
        return '一日用'
      case 'set':
        return 'セット'
      case 'section':
        return 'セクション'
      default:
        return 'その他'
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">テンプレートがありません</h3>
        <p className="text-gray-500">新しいテンプレートを作成してください</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group"
          >
            {/* 編集・削除ボタン */}
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(template)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="編集"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteClick(template.id, template.name)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* テンプレート情報 */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTemplateTypeIcon(template.template_type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {getTemplateTypeLabel(template.template_type)}
                    </span>
                  </div>
                </div>
              </div>

              {template.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
              )}

              {/* テンプレート詳細情報 */}
              <div className="space-y-2 text-sm text-gray-500">
                {template.sessions && template.sessions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{template.sessions.length}セッション</span>
                  </div>
                )}
                
                {template.steps && template.steps.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{template.steps.length}ステップ</span>
                  </div>
                )}

                {template.usage_count > 0 && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{template.usage_count}回使用</span>
                  </div>
                )}

                {template.is_favorite && (
                  <div className="flex items-center space-x-2 text-yellow-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>お気に入り</span>
                  </div>
                )}
              </div>

              {/* 作成日時 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  作成: {new Date(template.created_at).toLocaleDateString('ja-JP')}
                </div>
                {template.last_used && (
                  <div className="text-xs text-gray-400">
                    最終使用: {new Date(template.last_used).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

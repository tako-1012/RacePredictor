'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { CustomWorkoutTemplate } from '@/types/customWorkout'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { ConfirmModal } from '@/components/UI/ConfirmModal'

interface CustomWorkoutTemplateListProps {
  templates: CustomWorkoutTemplate[]
  onEdit: (template: CustomWorkoutTemplate) => void
  onDelete: (templateId: string) => void
  onBulkDelete?: (templateIds: string[]) => void
  isLoading?: boolean
}

type ViewMode = 'table' | 'card'
type SortField = 'name' | 'usage_count' | 'created_at' | 'last_used'
type SortOrder = 'asc' | 'desc'

export function CustomWorkoutTemplateList({ 
  templates, 
  onEdit, 
  onDelete, 
  onBulkDelete,
  isLoading = false 
}: CustomWorkoutTemplateListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('usage_count')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // 表示設定の永続化
  useEffect(() => {
    const savedViewMode = localStorage.getItem('template-view-mode') as ViewMode
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('template-view-mode', viewMode)
  }, [viewMode])

  // 検索クエリのdebounce処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // フィルタリング・ソート処理
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // 検索クエリフィルター
      if (debouncedSearchQuery && !template.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false
      }
      
      // タイプフィルター
      if (filterType !== 'all' && template.template_type !== filterType) {
        return false
      }
      
      return true
    })

    // ソート処理
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'usage_count':
          aValue = a.usage_count || 0
          bValue = b.usage_count || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'last_used':
          aValue = a.last_used ? new Date(a.last_used).getTime() : 0
          bValue = b.last_used ? new Date(b.last_used).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [templates, debouncedSearchQuery, filterType, sortField, sortOrder])

  const handleDeleteClick = (templateId: string, templateName: string) => {
    setDeletingTemplateId(templateId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingTemplateId) {
      onDelete(deletingTemplateId)
      setShowDeleteModal(false)
      setDeletingTemplateId(null)
    }
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedTemplates.size > 0) {
      onBulkDelete(Array.from(selectedTemplates))
      setSelectedTemplates(new Set())
      setShowBulkDeleteModal(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredAndSortedTemplates.length) {
      setSelectedTemplates(new Set())
    } else {
      setSelectedTemplates(new Set(filteredAndSortedTemplates.map(t => t.id)))
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId)
    } else {
      newSelected.add(templateId)
    }
    setSelectedTemplates(newSelected)
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
    <div className="space-y-6">
      {/* ヘッダーエリア */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* 検索バー */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="テンプレート名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* フィルター・ソート */}
          <div className="flex gap-3 items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべてのタイプ</option>
              <option value="daily">一日用</option>
              <option value="set">セット</option>
              <option value="section">セクション</option>
            </select>

            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortField(field as SortField)
                setSortOrder(order as SortOrder)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="usage_count-desc">使用回数順</option>
              <option value="usage_count-asc">使用回数順（昇順）</option>
              <option value="created_at-desc">作成日順（新着）</option>
              <option value="created_at-asc">作成日順（古い）</option>
              <option value="name-asc">名前順（A-Z）</option>
              <option value="name-desc">名前順（Z-A）</option>
            </select>

            {/* 表示モード切り替え */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="テーブル表示"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 text-sm ${viewMode === 'card' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="カード表示"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 結果件数・一括操作 */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {filteredAndSortedTemplates.length}件のテンプレート
            {selectedTemplates.size > 0 && (
              <span className="ml-2 text-blue-600">
                ({selectedTemplates.size}件選択中)
              </span>
            )}
          </div>
          
          {selectedTemplates.size > 0 && onBulkDelete && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
              >
                選択したテンプレートを削除 ({selectedTemplates.size}件)
              </button>
              <button
                onClick={() => setSelectedTemplates(new Set())}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
              >
                選択解除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* テーブル表示 */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.size === filteredAndSortedTemplates.length && filteredAndSortedTemplates.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    テンプレート名
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステップ数
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('usage_count')}
                  >
                    使用回数
                    {sortField === 'usage_count' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_used')}
                  >
                    最終使用日
                    {sortField === 'last_used' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    作成日
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTemplates.map((template, index) => (
                  <tr 
                    key={template.id} 
                    className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.has(template.id)}
                        onChange={() => handleSelectTemplate(template.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{getTemplateTypeIcon(template.template_type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {template.name}
                            {template.is_favorite && (
                              <svg className="w-4 h-4 text-yellow-500 ml-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )}
                          </div>
                          {template.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getTemplateTypeLabel(template.template_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(template.steps?.length || 0) + (template.sessions?.length || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {template.usage_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.last_used ? formatDate(template.last_used) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(template)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="編集"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(template.id, template.name)}
                          className="text-red-600 hover:text-red-900"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* カード表示 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedTemplates.map((template) => (
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
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{getTemplateTypeIcon(template.template_type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{template.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {getTemplateTypeLabel(template.template_type)}
                    </span>
                  </div>
                </div>

                {template.description && (
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>ステップ数:</span>
                    <span>{(template.steps?.length || 0) + (template.sessions?.length || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>使用回数:</span>
                    <span>{template.usage_count || 0}</span>
                  </div>
                  {template.is_favorite && (
                    <div className="flex items-center text-yellow-500">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>お気に入り</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="テンプレートを削除"
        message="このテンプレートを削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeletingTemplateId(null)
        }}
        isLoading={false}
      />

      {/* 一括削除確認モーダル */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="複数テンプレートを削除"
        message={`選択した${selectedTemplates.size}件のテンプレートを削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        isLoading={false}
      />
    </div>
  )
}

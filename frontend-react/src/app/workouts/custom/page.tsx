'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CustomWorkoutBuilder } from '@/components/CustomWorkout/CustomWorkoutBuilder'
import { CustomWorkoutTemplateList } from '@/components/CustomWorkout/CustomWorkoutTemplateList'
import { CustomWorkoutTemplate, WorkoutStep, RepeatBlock } from '@/types/customWorkout'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { Toast } from '@/components/UI/Toast'
import { apiClient } from '@/lib/api'

type TemplateType = 'daily' | 'set' | 'section'

type PageMode = 'list' | 'create' | 'edit'

export default function CustomWorkoutsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<CustomWorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentSteps, setCurrentSteps] = useState<(WorkoutStep | RepeatBlock)[]>([])
  const [currentSessions, setCurrentSessions] = useState<any[]>([])
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | null>(null)
  
  // 新しい状態管理
  const [pageMode, setPageMode] = useState<PageMode>('list')
  const [editingTemplate, setEditingTemplate] = useState<CustomWorkoutTemplate | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadTemplates()
    }
  }, [isAuthenticated])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const templates = await apiClient.getCustomWorkoutTemplates()
      setTemplates(templates)
    } catch (err) {
      console.error('テンプレート読み込みエラー:', err)
      setError('テンプレートの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepsChange = (steps: (WorkoutStep | RepeatBlock)[]) => {
    setCurrentSteps(steps)
  }

  const handleSessionsChange = (sessions: any[]) => {
    setCurrentSessions(sessions)
  }

  // テンプレート編集
  const handleEditTemplate = (template: CustomWorkoutTemplate) => {
    setEditingTemplate(template)
    setSelectedTemplateType(template.template_type as TemplateType)
    setCurrentSteps(template.steps || [])
    setCurrentSessions(template.sessions || [])
    setPageMode('edit')
  }

  // テンプレート削除
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await apiClient.deleteCustomWorkoutTemplate(templateId)
      setTemplates(templates.filter(t => t.id !== templateId))
      setToast({ message: 'テンプレートを削除しました', type: 'success' })
    } catch (error) {
      console.error('テンプレート削除エラー:', error)
      setToast({ message: '削除に失敗しました', type: 'error' })
    }
  }


  // 一括削除
  const handleBulkDelete = async (templateIds: string[]) => {
    try {
      // 一括削除APIを使用
      const result = await apiClient.bulkDeleteCustomWorkoutTemplates(templateIds)
      setTemplates(templates.filter(t => !templateIds.includes(t.id)))
      setToast({ 
        message: `${result.deleted_count}件のテンプレートを削除しました`, 
        type: 'success' 
      })
    } catch (error) {
      console.error('一括削除エラー:', error)
      setToast({ message: '一括削除に失敗しました', type: 'error' })
    }
  }


  // 新規作成モードに切り替え
  const handleCreateNew = () => {
    setEditingTemplate(null)
    setSelectedTemplateType(null)
    setCurrentSteps([])
    setCurrentSessions([])
    setPageMode('create')
  }

  // 一覧に戻る
  const handleBackToList = () => {
    setPageMode('list')
    setEditingTemplate(null)
    setSelectedTemplateType(null)
    setCurrentSteps([])
    setCurrentSessions([])
  }

  const handleSave = async (workoutName: string, workoutMemo: string) => {
    try {
      setIsSubmitting(true)
      
      const templateData = {
        name: workoutName || '新しいワークアウト',
        description: workoutMemo,
        template_type: selectedTemplateType || 'daily',
        section_type: selectedTemplateType === 'section' ? 'warmup' : null,
        sessions: currentSessions,
        steps: currentSteps
      }
      
      if (pageMode === 'edit' && editingTemplate) {
        // 編集モード：既存テンプレートを更新
        await apiClient.updateCustomWorkoutTemplate(editingTemplate.id, templateData)
        setToast({ message: 'テンプレートを更新しました', type: 'success' })
        
        // テンプレート一覧を更新
        await loadTemplates()
      } else {
        // 新規作成モード：新しいテンプレートを作成
        await apiClient.createCustomWorkoutTemplate(templateData)
        setToast({ message: 'カスタムワークアウトを保存しました', type: 'success' })
        
        // テンプレート一覧を更新
        await loadTemplates()
      }
      
      // 少し待ってから一覧に戻る
      setTimeout(() => {
        handleBackToList()
      }, 1500)
      
    } catch (err: any) {
      console.error('テンプレート保存エラー:', err)
      
      // エラーメッセージを詳細に表示
      let errorMessage = '保存に失敗しました'
      
      if (err.response?.status === 400) {
        if (err.response?.data?.detail === 'Template with this name already exists') {
          errorMessage = 'この名前のテンプレートは既に存在します。別の名前を入力してください。'
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        }
      } else if (err.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (pageMode === 'edit') {
      handleBackToList()
    } else {
      router.push('/workouts/new')
    }
  }

  if (authLoading || isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error.message || 'エラーが発生しました'}</div>
          {error.suggestion && (
            <div className="text-sm text-gray-500 mb-4">{error.suggestion}</div>
          )}
          <button
            onClick={() => loadTemplates()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {pageMode === 'list' && 'カスタムワークアウトテンプレート'}
                {pageMode === 'create' && 'テンプレート作成'}
                {pageMode === 'edit' && 'テンプレート編集'}
              </h1>
              <p className="text-gray-600 mt-2">
                {pageMode === 'list' && 'よく使う練習メニューをテンプレートとして管理'}
                {pageMode === 'create' && 'よく使う練習メニューをテンプレートとして保存'}
                {pageMode === 'edit' && 'テンプレートを編集'}
              </p>
            </div>
            <div className="flex space-x-3">
              {pageMode === 'list' ? (
                <>
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + 新規作成
                  </button>
                  <button
                    onClick={() => router.push('/workouts/new')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ← 練習を記録に戻る
                  </button>
                </>
              ) : (
                <button
                  onClick={handleBackToList}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  ← 一覧に戻る
                </button>
              )}
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        {pageMode === 'list' ? (
          // テンプレート一覧表示
          <CustomWorkoutTemplateList
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onBulkDelete={handleBulkDelete}
            isLoading={isLoading}
          />
        ) : (
          // テンプレート作成・編集
          <>
            {/* テンプレートタイプ選択 */}
            {!selectedTemplateType ? (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">テンプレートの種類を選択</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 一日用テンプレート */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => setSelectedTemplateType('daily')}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🏃‍♂️</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">一日用テンプレート</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        一日の練習メニュー（ウォームアップ・メイン・クールダウン）を作成
                      </p>
                      <div className="text-xs text-gray-500">
                        • 複数セッション対応<br/>
                        • 全体の練習構成<br/>
                        • 練習メニュー選択で使用
                      </div>
                    </div>
                  </div>

                  {/* セットテンプレート */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    onClick={() => setSelectedTemplateType('set')}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">セットテンプレート</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        アップ・メイン・ダウンをセットで登録するテンプレートを作成
                      </p>
                      <div className="text-xs text-gray-500">
                        • 3セクションセット<br/>
                        • 一括で適用可能<br/>
                        • セクション内で使用
                      </div>
                    </div>
                  </div>

                  {/* セクション用テンプレート */}
                  <div 
                    className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                    onClick={() => setSelectedTemplateType('section')}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">セクションテンプレート</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        ウォームアップ、メイン、クールダウンのいずれかのセクション用テンプレートを作成
                      </p>
                      <div className="text-xs text-gray-500">
                        • セクション別のテンプレート<br/>
                        • セクションテンプレートで使用<br/>
                        • 個別セクションの調整
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTemplateType === 'daily' && '🏃‍♂️ 一日用テンプレート作成'}
                      {selectedTemplateType === 'set' && '🎯 セットテンプレート作成'}
                      {selectedTemplateType === 'section' && '⚡ セクションテンプレート作成'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTemplateType === 'daily' && '一日の練習メニューを作成します'}
                      {selectedTemplateType === 'set' && 'アップ・メイン・ダウンをセットで作成します'}
                      {selectedTemplateType === 'section' && 'セクション用のテンプレートを作成します'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplateType(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    種類を変更
                  </button>
                </div>

                <CustomWorkoutBuilder
                  initialSteps={currentSteps}
                  onStepsChange={handleStepsChange}
                  onSessionsChange={handleSessionsChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                  templateType={selectedTemplateType}
                  isEditMode={pageMode === 'edit'}
                  editingTemplate={editingTemplate}
                />
              </div>
            )}
          </>
        )}
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
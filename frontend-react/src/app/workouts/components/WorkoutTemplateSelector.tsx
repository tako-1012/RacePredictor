'use client'

import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'
import { WorkoutTemplate } from '@/types'

interface WorkoutTemplateSelectorProps {
  onSelectTemplate: (template: WorkoutTemplate) => void
  onClose: () => void
}

export function WorkoutTemplateSelector({ onSelectTemplate, onClose }: WorkoutTemplateSelectorProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Try to load custom workout templates from API
      const response = await apiClient.getCustomWorkoutTemplates()
      setTemplates(response)
    } catch (err) {
      console.error('Template loading error:', err)
      setError('テンプレートの読み込みに失敗しました')
      
      // Fallback: Show default templates
      const defaultTemplates: WorkoutTemplate[] = [
        {
          id: 'easy_run_template',
          name: 'イージーランテンプレート',
          description: '軽いジョギング用のテンプレート',
          session_count: 1,
          sessions: [
            {
              id: 'session_1',
              session_number: 1,
              time_period: 'morning',
              sections: {
                warmup: {
                  type: 'warmup',
                  steps: [
                    {
                      id: 'warmup_1',
                      workout_type_id: '1',
                      distance_meters: 2000,
                      time_seconds: 600,
                      intensity: 3
                    }
                  ]
                },
                main: {
                  type: 'main',
                  steps: [
                    {
                      id: 'main_1',
                      workout_type_id: '1',
                      distance_meters: 5000,
                      time_seconds: 1500,
                      intensity: 4
                    }
                  ]
                },
                cooldown: {
                  type: 'cooldown',
                  steps: [
                    {
                      id: 'cooldown_1',
                      workout_type_id: '7',
                      distance_meters: 1000,
                      time_seconds: 600,
                      intensity: 2
                    }
                  ]
                }
              }
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'interval_template',
          name: 'インターバルテンプレート',
          description: '高強度インターバル練習用',
          session_count: 1,
          sessions: [
            {
              id: 'session_1',
              session_number: 1,
              time_period: 'morning',
              sections: {
                warmup: {
                  type: 'warmup',
                  steps: [
                    {
                      id: 'warmup_1',
                      workout_type_id: '1',
                      distance_meters: 2000,
                      time_seconds: 600,
                      intensity: 3
                    }
                  ]
                },
                main: {
                  type: 'main',
                  steps: [
                    {
                      id: 'main_1',
                      workout_type_id: '4',
                      distance_meters: 1600,
                      time_seconds: 360,
                      intensity: 8
                    }
                  ]
                },
                cooldown: {
                  type: 'cooldown',
                  steps: [
                    {
                      id: 'cooldown_1',
                      workout_type_id: '1',
                      distance_meters: 2000,
                      time_seconds: 600,
                      intensity: 2
                    }
                  ]
                }
              }
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setTemplates(defaultTemplates)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              ワークアウトテンプレートを選択
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">テンプレートを読み込み中...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="text-xs text-gray-500">
                      {template.session_count === 1 ? '1部練' : `${template.session_count}部練`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

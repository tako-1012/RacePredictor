'use client'

import { CustomWorkoutTemplate } from '@/types/customWorkout'

// テストデータ生成用のユーティリティ
export function generateTestTemplates(count: number): CustomWorkoutTemplate[] {
  const templates: CustomWorkoutTemplate[] = []
  const templateTypes = ['daily', 'set', 'section']
  const categories = ['ランニング', '筋力トレーニング', 'ストレッチ', 'その他']
  
  for (let i = 1; i <= count; i++) {
    const templateType = templateTypes[Math.floor(Math.random() * templateTypes.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    templates.push({
      id: `test_template_${i}`,
      name: `テストテンプレート ${i}`,
      description: `これはテスト用のテンプレート ${i} です。パフォーマンステスト用に生成されました。`,
      template_type: templateType,
      section_type: templateType === 'section' ? 'warmup' : null,
      sessions: generateTestSessions(templateType),
      steps: generateTestSteps(templateType),
      is_favorite: Math.random() > 0.7,
      usage_count: Math.floor(Math.random() * 50),
      last_used: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return templates
}

function generateTestSessions(templateType: string) {
  if (templateType === 'daily') {
    return [
      {
        id: `session_${Date.now()}`,
        session_number: 1,
        time_period: 'morning',
        sections: {
          warmup: {
            steps: generateTestSteps('warmup'),
            avg_heart_rate: null,
            max_heart_rate: null
          },
          main: {
            steps: generateTestSteps('main'),
            avg_heart_rate: null,
            max_heart_rate: null
          },
          cooldown: {
            steps: generateTestSteps('cooldown'),
            avg_heart_rate: null,
            max_heart_rate: null
          }
        }
      }
    ]
  }
  return []
}

function generateTestSteps(type: string) {
  const stepTypes = ['run', 'rest', 'recovery', 'warmup', 'strength', 'stretch', 'other']
  const steps = []
  
  const stepCount = Math.floor(Math.random() * 5) + 1
  
  for (let i = 0; i < stepCount; i++) {
    const stepType = stepTypes[Math.floor(Math.random() * stepTypes.length)]
    steps.push({
      id: `step_${Date.now()}_${i}`,
      type: stepType,
      name: `${stepType} ${i + 1}`,
      distance_meters: Math.floor(Math.random() * 5000) + 1000,
      duration_seconds: Math.floor(Math.random() * 1800) + 300,
      target_pace: `${Math.floor(Math.random() * 3) + 4}:00/km`,
      intensity_rpe: Math.floor(Math.random() * 10) + 1,
      notes: `テスト用の${stepType}ステップ ${i + 1}`
    })
  }
  
  return steps
}

// パフォーマンス測定用のユーティリティ
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

// 大量データでのフィルタリング性能テスト
export function testFilteringPerformance(templates: CustomWorkoutTemplate[], searchQuery: string) {
  return measurePerformance('フィルタリング', () => {
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
}

// 大量データでのソート性能テスト
export function testSortingPerformance(templates: CustomWorkoutTemplate[], sortField: string, sortOrder: string) {
  return measurePerformance('ソート', () => {
    return [...templates].sort((a, b) => {
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
  })
}

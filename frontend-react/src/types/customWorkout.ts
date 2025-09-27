export type WorkoutStepType = 'run' | 'rest' | 'recovery' | 'warmup' | 'cooldown' | 'strength' | 'stretch' | 'other'

export interface WorkoutStep {
  id: string
  type: WorkoutStepType
  duration: number // 秒
  distance?: number // メートル
  intensity: number // 1-10
  notes: string
  estimatedTime: number // 秒
  estimatedDistance?: number // メートル
  
  // 種別ごとの専用フィールド
  // ラン用
  targetPace?: string // 目標ペース
  heartRateZone?: string // 心拍ゾーン
  
  // 休息用
  restFormat?: 'complete_rest' | 'sitting' | 'standing' // 休息形式
  
  // 回復用
  recoveryFormat?: 'walking' | 'light_jog' // 回復形式
  maxHeartRate?: number // 心拍上限
  
  // ウォームアップ/クールダウン用
  warmupType?: 'jogging' | 'stretching' | 'gymnastics' // 種類
  
  // 筋トレ用
  exerciseName?: string // エクササイズ名
  sets?: number // セット数
  reps?: number // レップ数
  restTime?: number // 休息時間（秒）
  
  // ストレッチ用
  stretchType?: 'static' | 'dynamic' | 'pnf' // ストレッチ種類
  targetBodyPart?: string // 対象部位
}

export interface RepeatBlock {
  id: string
  type: 'repeat'
  repeatCount: number
  steps: WorkoutStep[]
}

export interface CustomWorkoutTemplate {
  id: string
  name: string
  description?: string
  category: string
  steps: (WorkoutStep | RepeatBlock)[]
  totalDistance: number
  totalTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  isFavorite: boolean
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
  // 新機能: ワークアウト名とメモ
  workoutName?: string // ワークアウト名
  workoutMemo?: string // ワークアウトメモ
}

export interface CustomWorkoutPlan {
  id: string
  name: string
  description?: string
  planType: 'weekly' | 'monthly' | 'custom'
  durationWeeks: number
  targetDistanceKm: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  isActive: boolean
  templates: CustomWorkoutTemplate[]
  createdAt: Date
  updatedAt: Date
}

// ステップタイプごとの色設定（視認性を向上）
export const STEP_TYPE_COLORS = {
  run: 'bg-blue-500',
  rest: 'bg-gray-600',
  recovery: 'bg-green-500',
  warmup: 'bg-orange-500',
  cooldown: 'bg-purple-500',
  strength: 'bg-red-500',
  stretch: 'bg-indigo-500',
  other: 'bg-yellow-500'
} as const

// ステップタイプの日本語名
export const STEP_TYPE_LABELS = {
  run: 'ラン',
  rest: '休息',
  recovery: '回復',
  warmup: 'ウォームアップ',
  cooldown: 'クールダウン',
  strength: '筋トレ',
  stretch: 'ストレッチ',
  other: 'その他'
} as const

// ステップタイプのアイコン
export const STEP_TYPE_ICONS = {
  run: '🏃',
  rest: '⏸️',
  recovery: '🚶',
  warmup: '🔥',
  cooldown: '❄️',
  strength: '💪',
  stretch: '🧘',
  other: '⚡'
} as const

// ステップタイプの説明
export const STEP_TYPE_DESCRIPTIONS = {
  run: 'メインのランニング',
  rest: '完全休息・立ち止まり',
  recovery: 'ウォーキング・軽いジョグ',
  warmup: '準備運動',
  cooldown: '整理運動',
  strength: '筋力トレーニング',
  stretch: '静的・動的ストレッチ',
  other: 'カスタム種別'
} as const

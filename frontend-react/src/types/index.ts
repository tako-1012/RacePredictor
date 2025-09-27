// ユーザー関連の型定義
export interface User {
  id: string
  email: string
  name?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  user_type?: 'athlete' | 'serious_runner' | 'casual_runner'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  user: User
}

// 練習種別の型定義
export interface WorkoutType {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

// 練習記録の型定義
export interface Workout {
  id: string
  user_id: string
  date: string
  workout_type_id: string
  workout_type?: WorkoutType
  workout_type_name?: string
  
  // 目標値（計画された練習内容）
  target_distance_meters?: number
  target_times_seconds?: number[]
  
  // 実際の値（実行された練習内容）
  actual_distance_meters?: number
  actual_times_seconds?: number[]
  
  // 練習の完了状況
  completed?: boolean
  completion_rate?: number  // 0-100 (完了率)
  
  // その他の設定
  intensity: number
  notes?: string
  avg_heart_rate?: number
  max_heart_rate?: number
  avg_pace_seconds?: number
  estimated_type?: string
  estimated_intensity?: number
  extended_data?: Record<string, any>
  created_at: string
  updated_at: string
  
  // 後方互換性のためのプロパティ
  distance_meters?: number  // actual_distance_meters または target_distance_meters
  times_seconds?: number[]  // actual_times_seconds または target_times_seconds
  distances_meters?: number[]  // 複数の距離データ
  duration_seconds?: number  // 総練習時間
}

// レース種目の型定義
export interface RaceType {
  id: string
  name: string
  category: 'track' | 'road' | 'relay'
  default_distance_meters: number
  is_customizable: boolean
  min_distance_meters: number
  max_distance_meters: number
  description?: string
  created_at: string
  updated_at: string
}

// 駅伝区間の型定義
export interface RelaySegment {
  segment_number: number
  distance_meters: number
  name: string
  description?: string
}

// レース結果の型定義
export interface Race {
  id: string
  user_id: string
  race_date: string
  race_name: string
  race_type_id?: string | null
  race_type?: string
  distance_meters: number
  time_seconds: number
  pace_seconds?: number
  place?: number
  total_participants?: number
  notes?: string
  // 駅伝専用フィールド
  is_relay?: boolean
  relay_segment?: number
  team_name?: string
  relay_time?: string
  segment_place?: number
  segment_total_participants?: number
  // 詳細情報
  splits?: number[]
  weather?: string
  course_type?: string
  strategy_notes?: string
  custom_distance_m?: number
  prediction_id?: string
  created_at: string
  updated_at: string
}

// 予測結果の型定義
export interface Prediction {
  id: string
  user_id: string
  race_type: string
  distance_meters: number
  predicted_time_seconds: number
  confidence: number
  factors: string[]
  created_at: string
  updated_at: string
}

// API レスポンスの型定義
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  warnings?: string[]
  timestamp?: string
  processing_time_ms?: number
}

export interface ApiError {
  error_type: string
  message: string
  suggestion?: string
  details?: Record<string, any>
}

// CSV インポート関連の型定義
export interface CSVImportPreview {
  data: Workout[]
  statistics: {
    total_rows: number
    valid_rows: number
    invalid_rows: number
    detected_encoding: string
    detected_format: string
    columns_count: number
    processing_time_ms: number
  }
  lap_analysis: Array<{
    lap_number: string
    time: string
    distance: string
    pace: string
    heart_rate: string
    judgment: string
  }>
  dash_count: number
  estimated_workout_type?: string
  warnings: Array<string | {
    type: string
    message: string
    affected_columns?: string[]
    severity: string
    invalid_count?: number
    total_count?: number
  }>
}

export interface CSVImportResult {
  workouts: string[]
  failed_workouts: string[]
  statistics: {
    total_processed: number
    successful_imports: number
    failed_imports: number
    workout_date: string
    workout_type: string
    intensity: number
  }
  warnings: string[]
}

// ダッシュボード統計の型定義
export interface StatsCard {
  title: string
  value: string
  unit: string
  icon: string
}

export interface ChartData {
  labels: string[]
  values: number[]
}

export interface WorkoutSummary {
  id: string
  date: string
  workout_type_name: string
  distance_km: number
  time_minutes: number
  pace_per_km?: string
}

export interface WeeklyData {
  distance_km: number
  workout_count: number
  time_minutes: number
}

export interface DashboardStats {
  stats_cards: StatsCard[]
  weekly_chart: ChartData
  monthly_chart?: ChartData
  recent_workouts: WorkoutSummary[]
  weekly_data?: WeeklyData
  monthly_data?: WeeklyData
}

// フォーム関連の型定義
export interface WorkoutFormData {
  date: string
  time?: string  // 時刻
  workout_type_id: string
  
  // 目標値（計画された練習内容）
  target_distance_meters?: number
  target_times_seconds?: number[]
  
  // 実際の値（実行された練習内容）
  actual_distance_meters?: number
  actual_times_seconds?: number[]
  
  // 練習の完了状況
  completed?: boolean
  completion_rate?: number  // 0-100 (完了率)
  
  // その他の設定
  intensity: number
  notes?: string
  avg_heart_rate?: number
  max_heart_rate?: number
  
  // 新しいフィールド
  session_count?: number  // 部練習数 (1部練/2部練/3部練)
  session_period?: string  // 時間帯選択
  warmup_distance?: number  // ウォームアップ距離
  warmup_time?: number  // ウォームアップ時間
  main_distance?: number  // メイン距離
  main_time?: number  // メイン時間
  cooldown_distance?: number  // クールダウン距離
  cooldown_time?: number  // クールダウン時間
  
  // 後方互換性のためのプロパティ
  distance_meters?: number  // actual_distance_meters または target_distance_meters
  times_seconds?: number[]  // actual_times_seconds または target_times_seconds
}

export interface RaceFormData {
  race_date: string
  race_name: string
  race_type_id?: string | null
  distance_meters: number
  time_seconds: number
  pace_seconds?: number
  place?: number
  total_participants?: number
  notes?: string
  // 駅伝専用フィールド
  is_relay?: boolean
  relay_segment?: number
  team_name?: string
  relay_time?: string
  segment_place?: number
  segment_total_participants?: number
  // 詳細情報
  splits?: number[]
  weather?: string
  course_type?: string
  strategy_notes?: string
  custom_distance_m?: number
  race_type?: string
}

// 認証関連の型定義
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirm_password: string
}

// チャート関連の型定義
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

// フィルター関連の型定義
export interface WorkoutFilter {
  date_from?: string
  date_to?: string
  workout_type_id?: string
  intensity_min?: number
  intensity_max?: number
  distance_min?: number
  distance_max?: number
}

// ページネーション関連の型定義
export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// カスタムワークアウト関連の型定義
export interface CustomWorkoutTemplate {
  id: string
  user_id: string
  name: string
  description?: string
  category: 'warmup' | 'main' | 'cooldown' | 'full'
  created_from: 'manual' | 'workout_session' | 'pattern_analysis'
  workout_type_id: string
  distance_meters?: number
  times_seconds?: number[]
  repetitions?: number
  rest_type?: string
  rest_duration?: number
  intensity?: number
  session_period?: string
  warmup_distance?: number
  warmup_time?: number
  main_distance?: number
  main_time?: number
  cooldown_distance?: number
  cooldown_time?: number
  is_favorite: boolean
  usage_count: number
  last_used?: string
  created_at: string
  updated_at: string
}

export interface CustomWorkoutPlan {
  id: string
  user_id: string
  name: string
  description?: string
  plan_type?: string
  duration_weeks?: number
  target_distance_km?: number
  difficulty_level?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomWorkoutPlanItem {
  id: string
  plan_id: string
  template_id: string
  day_of_week: number
  week_number: number
  order_in_day: number
  distance_override?: number
  intensity_override?: number
  notes?: string
  created_at: string
}

export interface CustomWorkoutPlanWithItems extends CustomWorkoutPlan {
  plan_items: CustomWorkoutPlanItem[]
}

export interface CustomWorkoutTemplateFormData {
  name: string
  description?: string
  category?: string
  workout_type_id: string
  distance_meters?: number
  times_seconds?: number[]
  repetitions?: number
  rest_type?: string
  rest_duration?: number
  intensity?: number
  session_period?: string
  warmup_distance?: number
  warmup_time?: number
  main_distance?: number
  main_time?: number
  cooldown_distance?: number
  cooldown_time?: number
  is_favorite?: boolean
}

export interface CustomWorkoutPlanFormData {
  name: string
  description?: string
  plan_type?: string
  duration_weeks?: number
  target_distance_km?: number
  difficulty_level?: string
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// 検索・フィルタ関連の型定義
export interface SearchFilter {
  query: string
  dateFrom: string
  dateTo: string
  distanceMin: string
  distanceMax: string
  paceMin: string
  paceMax: string
  workoutTypes: string[]
  raceTypes: string[]
  isRelay?: boolean
  weather: string
  courseType: string
  intensityMin: string
  intensityMax: string
  heartRateMin: string
  heartRateMax: string
  tags: string[]
}

export interface SavedFilter {
  id: string
  name: string
  filters: SearchFilter
  type: 'workouts' | 'races'
  created_at: string
}

// Phase 3: ユーザープロフィール関連の型定義
export interface UserProfile {
  id: string
  user_id: string
  age: number
  birth_date?: string  // 生年月日 (YYYY-MM-DD形式)
  gender: 'M' | 'F' | 'Other'
  height_cm: number
  weight_kg: number
  bmi?: number
  resting_hr?: number
  max_hr?: number
  vo2_max?: number
  updated_at: string
}

export interface PersonalBest {
  id: string
  user_id: string
  race_type: 'track' | 'road' | 'relay'
  distance: string
  custom_distance_m?: number
  time_seconds: number
  achieved_date: string
  race_name?: string
  created_at: string
}

export interface RaceSchedule {
  id: string
  user_id: string
  race_name: string
  race_date: string
  location: string
  race_type: 'track' | 'road' | 'relay'
  distance: string
  custom_distance_m?: number
  target_time_seconds?: number
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

// フォーム用の型定義
export interface UserProfileFormData {
  age: number
  birth_date?: string  // 生年月日 (YYYY-MM-DD形式)
  gender: 'M' | 'F' | 'Other'
  height_cm: number
  weight_kg: number
  resting_hr?: number
  max_hr?: number
  vo2_max?: number
}

export interface PersonalBestFormData {
  race_type: 'track' | 'road' | 'relay'
  distance: string
  custom_distance_m?: number
  time_seconds: number
  achieved_date: string
  race_name?: string
}

export interface RaceScheduleFormData {
  race_name: string
  race_date: string
  location: string
  race_type: 'track' | 'road' | 'relay'
  distance: string
  custom_distance_m?: number
  target_time_seconds?: number
}

// 新しいセッション分割型練習記録の型定義
export interface WorkoutStep {
  id: string
  workout_type_id: string
  distance_meters?: number
  time_seconds?: number
  pace_per_km?: number
  intensity?: number
  notes?: string
  // インターバル練習用の詳細設定
  sets?: number
  reps?: number
  rest_type?: 'full_rest' | 'jog' | 'walk'
  rest_time_seconds?: number
  rest_distance_meters?: number
}

export interface WorkoutSection {
  type: 'warmup' | 'main' | 'cooldown'
  steps: WorkoutStep[]
}

export interface WorkoutSession {
  id: string
  session_number: number
  time_period: 'morning' | 'afternoon' | 'evening'
  sections: {
    warmup: WorkoutSection
    main: WorkoutSection
    cooldown: WorkoutSection
  }
}

export interface SessionBasedWorkoutData {
  // 基本情報
  date: string
  session_count: 1 | 2 | 3
  workout_name?: string
  
  // セッション配列
  sessions: WorkoutSession[]
  
  // 全体のメタデータ
  notes?: string
  avg_heart_rate?: number
  max_heart_rate?: number
}

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  session_count: 1 | 2 | 3
  sessions: WorkoutSession[]
  created_at: string
  updated_at: string
}

// 詳細練習記録用の型定義
export type DetailedWorkoutType = 
  // 持久系練習
  | 'easy_run' | 'jogging' | 'long_run' | 'medium_run' | 'tempo_run'
  // スピード・強度系練習
  | 'interval_run' | 'repetition' | 'build_up' | 'fartlek' | 'pace_change'
  // 特殊練習
  | 'pyramid_run' | 'hill_run' | 'stair_run' | 'sand_run' | 'other'

export type DetailedWarmupType =
  // 基本的な準備運動
  | 'jogging' | 'walking' | 'marching'
  // 動き作り系
  | 'movement_prep' | 'ladder' | 'flow_run' | 'wind_sprint'
  // ストレッチ・体操系
  | 'dynamic_stretch' | 'brazil_warmup' | 'joint_mobility' | 'balance_coordination'
  // 筋活性化系
  | 'muscle_activation' | 'plyometrics' | 'core_training'
  // その他
  | 'other'

export interface DetailedWorkoutStep {
  id: string
  type: DetailedWorkoutType | DetailedWarmupType | 'cooldown'
  
  // 基本情報
  name: string
  description?: string
  
  // 距離・時間
  distance_meters?: number
  duration_seconds?: number
  
  // 強度設定
  intensity_rpe?: number // 1-10
  heart_rate_zone?: string // 例: "85-90%"
  target_pace?: string // 例: "4:00/km"
  
  // インターバル練習用
  interval_config?: {
    distance: number
    reps: number
    sets?: number
    target_pace_min: string
    rest_type: 'complete_rest' | 'jog' | 'walk'
    rest_duration_seconds?: number
    rest_distance_meters?: number
    target_heart_rate_recovery?: number
    set_rest_duration_seconds?: number
    set_rest_distance_meters?: number
  }
  
  // インターバル練習結果用
  interval_results?: {
    times?: string[] // 各本の実際のタイム（例: ["1:15.2", "1:16.1", "1:14.8"]）
    avg_heart_rate?: number // 平均心拍数
    max_heart_rate?: number // 最大心拍数
    rpe?: number // 体感強度（1-10）
    notes?: string // 練習メモ
  }
  
  // 全練習種別共通の結果記録用
  workout_results?: {
    actual_time_seconds?: number // 実際の時間（秒）
    actual_distance_meters?: number // 実際の距離（メートル）
    actual_pace?: string // 実際のペース（例: "4:30/km"）
    avg_heart_rate?: number // 平均心拍数
    max_heart_rate?: number // 最大心拍数
    rpe?: number // 体感強度（1-10）
    notes?: string // 練習メモ・感想
    weather?: string // 天気
    temperature?: number // 気温
    humidity?: number // 湿度
  }
  
  // インターバル詳細設定（簡易版）
  sets?: number
  reps?: number
  rest_time?: number
  rest_type?: 'complete' | 'jog' | 'walk'
  
  // ビルドアップ走用
  build_up_config?: {
    segments: {
      distance_meters: number
      target_pace: string
      intensity_rpe: number
    }[]
  }
  
  // ファルトレク用
  fartlek_config?: {
    pattern: 'free' | 'structured'
    segments?: {
      duration_seconds: number
      intensity_rpe: number
      description: string
    }[]
  }
  
  // 坂道練習用
  hill_config?: {
    gradient_percent?: number
    surface_type: 'road' | 'trail' | 'track'
    direction: 'uphill' | 'downhill' | 'mixed'
  }
  
  // 流し・ウィンドスプリント用
  flow_config?: {
    intensity_percent: number // 70%, 80%, 90%, 100%
    acceleration_pattern: 'gradual' | 'constant' | 'final_sprint'
    rest_type: 'full_recovery' | 'time_based'
    rest_duration_seconds?: number
  }
  
  // メモ・備考
  notes?: string
  focus_points?: string[] // 意識すべきポイント
}

export interface DetailedWorkoutSection {
  type: 'warmup' | 'main' | 'cooldown'
  steps: DetailedWorkoutStep[]
  estimated_duration_minutes: number
  estimated_distance_meters: number
  avg_heart_rate?: number
  max_heart_rate?: number
}

export interface DetailedWorkoutSession {
  id: string
  session_number: number
  time_period: 'morning' | 'afternoon' | 'evening' | 'night' | 'other'
  sections: {
    warmup: DetailedWorkoutSection
    main: DetailedWorkoutSection
    cooldown: DetailedWorkoutSection
  }
  total_estimated_duration_minutes: number
  total_estimated_distance_meters: number
}

export interface DetailedWorkoutData {
  // 基本情報
  date: string
  session_count: 1 | 2 | 3
  workout_name?: string
  
  // セッション配列
  sessions: DetailedWorkoutSession[]
  
  // 全体のメタデータ
  notes?: string
  avg_heart_rate?: number
  max_heart_rate?: number
  
  // 総計
  total_estimated_duration_minutes: number
  total_estimated_distance_meters: number
}

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
  distance_meters: number
  times_seconds: number[]
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
  race_type_id: string
  race_type?: RaceType
  distance_meters: number
  time_seconds: number
  pace_seconds: number
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
  warnings: string[]
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

export interface DashboardStats {
  stats_cards: StatsCard[]
  weekly_chart: ChartData
  recent_workouts: WorkoutSummary[]
}

// フォーム関連の型定義
export interface WorkoutFormData {
  date: string
  time?: string  // 時刻
  workout_type_id: string
  distance_meters: number
  times_seconds: number[]
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
}

export interface RaceFormData {
  race_date: string
  race_name: string
  race_type_id: string
  distance_meters: number
  time_seconds: number
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

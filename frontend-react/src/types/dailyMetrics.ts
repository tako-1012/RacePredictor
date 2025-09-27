export interface DailyMetricsBase {
  date: string
  
  // 身体データ
  weight_kg?: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  
  // 睡眠データ
  sleep_duration_hours?: number
  sleep_quality_score?: number
  bedtime?: string
  wake_time?: string
  
  // コンディション評価
  fatigue_level?: number
  motivation_level?: number
  stress_level?: number
  energy_level?: number
  
  // 運動関連
  training_readiness?: number
  recovery_status?: 'excellent' | 'good' | 'fair' | 'poor'
  
  // 健康指標
  resting_heart_rate?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  
  // メモ・その他
  notes?: string
  mood_tags?: string[]
}

export interface DailyMetricsCreate extends DailyMetricsBase {}

export interface DailyMetricsUpdate {
  weight_kg?: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  sleep_duration_hours?: number
  sleep_quality_score?: number
  bedtime?: string
  wake_time?: string
  fatigue_level?: number
  motivation_level?: number
  stress_level?: number
  energy_level?: number
  training_readiness?: number
  recovery_status?: 'excellent' | 'good' | 'fair' | 'poor'
  resting_heart_rate?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  notes?: string
  mood_tags?: string[]
}

export interface DailyMetricsResponse extends DailyMetricsBase {
  id: string
  user_id: string
  is_estimated: boolean
  data_source?: string
  created_at: string
  updated_at: string
}

export interface WeeklyMetricsSummaryResponse {
  id: string
  user_id: string
  week_start_date: string
  week_end_date: string
  
  // 週間平均値
  avg_weight_kg?: number
  avg_sleep_duration_hours?: number
  avg_fatigue_level?: number
  avg_motivation_level?: number
  avg_stress_level?: number
  avg_energy_level?: number
  avg_training_readiness?: number
  avg_resting_heart_rate?: number
  
  // 週間トレンド
  weight_trend?: string
  sleep_trend?: string
  fatigue_trend?: string
  motivation_trend?: string
  
  // データ品質
  data_completeness?: number
  days_recorded?: number
  
  created_at: string
  updated_at: string
}

export interface MonthlyMetricsSummaryResponse {
  id: string
  user_id: string
  year: number
  month: number
  
  // 月間平均値
  avg_weight_kg?: number
  avg_sleep_duration_hours?: number
  avg_fatigue_level?: number
  avg_motivation_level?: number
  avg_stress_level?: number
  avg_energy_level?: number
  avg_training_readiness?: number
  avg_resting_heart_rate?: number
  
  // 月間統計
  weight_change_kg?: number
  sleep_consistency_score?: number
  stress_peak_days?: number
  low_energy_days?: number
  
  // データ品質
  data_completeness?: number
  days_recorded?: number
  
  created_at: string
  updated_at: string
}

export interface DailyMetricsListResponse {
  items: DailyMetricsResponse[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface MetricsTrendResponse {
  dates: string[]
  weight_kg: (number | null)[]
  sleep_duration_hours: (number | null)[]
  fatigue_level: (number | null)[]
  motivation_level: (number | null)[]
  stress_level: (number | null)[]
  energy_level: (number | null)[]
  training_readiness: (number | null)[]
  resting_heart_rate: (number | null)[]
}

export interface HealthInsightsResponse {
  overall_health_score: number
  sleep_quality_score: number
  stress_management_score: number
  recovery_score: number
  recommendations: string[]
  trends: Record<string, any>
  alerts: string[]
}

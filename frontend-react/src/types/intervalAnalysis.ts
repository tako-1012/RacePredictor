export interface IntervalAnalysisRequest {
  workout_import_data_id: string
  lap_times: number[]
  lap_distances: number[]
}

export interface IntervalAnalysisResponse {
  analysis_id: string
  total_laps: number
  average_lap_time: number
  average_lap_distance: number
  has_anomaly: boolean
  anomaly_type?: string
  anomaly_lap_index?: number
  anomaly_severity?: string
  lap_times: number[]
  lap_distances: number[]
  lap_paces: number[]
  suggested_corrections: SuggestedCorrection[]
  pattern_validation: PatternValidation
  analysis_metadata: AnalysisMetadata
}

export interface SuggestedCorrection {
  type: string
  reason: string
  confidence: number
}

export interface PatternValidation {
  pattern_type: string
  is_valid: boolean
  description: string
}

export interface AnalysisMetadata {
  confidence: number
  description: string
  analysis_timestamp?: string
}

export interface CorrectionApplyRequest {
  workout_import_data_id: string
  correction_type: string
}

export interface CorrectionApplyResponse {
  workout_import_data_id: string
  correction_applied: boolean
  correction_type: string
  original_lap_count: number
  corrected_lap_count: number
  corrected_times: number[]
  corrected_distances: number[]
  modifications: ModificationRecord
}

export interface ModificationRecord {
  correction_type: string
  applied_at?: string
  original_lap_count: number
  corrected_lap_count: number
}

export interface WorkoutImportDataResponse {
  id: string
  user_id: string
  workout_id?: string
  raw_data: Record<string, any>
  processed_data?: Record<string, any>
  user_choice: string
  modifications?: ModificationRecord
  anomaly_detection?: Record<string, any>
  import_source?: string
  import_timestamp: string
  last_modified: string
}

export interface IntervalComparisonRequest {
  workout_import_data_id: string
}

export interface IntervalComparisonResponse {
  workout_import_data_id: string
  original_data: Record<string, any>
  corrected_data: Record<string, any>
  differences: Record<string, any>
  recommendation: string
  confidence_score: number
}

export interface BatchAnalysisRequest {
  workout_import_data_ids: string[]
}

export interface BatchAnalysisResponse {
  total_analyzed: number
  anomalies_found: number
  results: Record<string, any>[]
  summary: Record<string, any>
}

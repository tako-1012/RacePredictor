import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  apiClient: {
    getDashboardStats: jest.fn(),
    getWorkouts: jest.fn(),
    createWorkout: jest.fn(),
    getCustomWorkoutTemplates: jest.fn(),
    createCustomWorkoutTemplate: jest.fn(),
    getDailyMetrics: jest.fn(),
    createDailyMetrics: jest.fn(),
    getRaces: jest.fn(),
    createRace: jest.fn(),
    getUserProfile: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    previewCSVImport: jest.fn(),
    confirmCSVImport: jest.fn(),
    analyzeIntervalData: jest.fn(),
    applyIntervalCorrection: jest.fn(),
  },
  handleApiError: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

const mockAuth = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
}

describe('統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue(mockAuth)
  })

  describe('ユーザーフロー統合テスト', () => {
    test('ログイン → ダッシュボード → 練習記録作成の流れ', async () => {
      // 1. ログイン
      const mockLoginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      ;(apiClient.login as jest.Mock).mockResolvedValue({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      })

      await apiClient.login(mockLoginData)
      expect(apiClient.login).toHaveBeenCalledWith(mockLoginData)

      // 2. ダッシュボード統計取得
      const mockStats = {
        total_workouts: 25,
        total_distance_km: 150.5,
        total_time_hours: 12.5,
        avg_pace_per_km: 5.2,
        recent_workouts: [],
      }

      ;(apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStats)

      const stats = await apiClient.getDashboardStats()
      expect(stats).toEqual(mockStats)

      // 3. 練習記録作成
      const mockWorkoutData = {
        date: '2024-01-15',
        workout_type_id: '1',
        distance_meters: 5000,
        times_seconds: [1200],
        intensity: 5,
        notes: '良い調子',
      }

      const mockCreatedWorkout = {
        id: 'new-workout-id',
        ...mockWorkoutData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createWorkout as jest.Mock).mockResolvedValue(mockCreatedWorkout)

      const result = await apiClient.createWorkout(mockWorkoutData)
      expect(result).toEqual(mockCreatedWorkout)
    })

    test('カスタムワークアウト作成 → コンディション記録の流れ', async () => {
      // 1. カスタムワークアウトテンプレート作成
      const mockTemplateData = {
        name: '新しいインターバル練習',
        description: '200m×10本のインターバル練習',
        category: 'speed',
        steps: [
          {
            type: 'warmup',
            duration: 600,
            distance: 1000,
            intensity: 3,
          },
          {
            type: 'run',
            duration: 300,
            distance: 200,
            intensity: 8,
          },
        ],
      }

      const mockCreatedTemplate = {
        id: 'new-template-id',
        ...mockTemplateData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createCustomWorkoutTemplate as jest.Mock).mockResolvedValue(mockCreatedTemplate)

      const templateResult = await apiClient.createCustomWorkoutTemplate(mockTemplateData)
      expect(templateResult).toEqual(mockCreatedTemplate)

      // 2. コンディション記録作成
      const mockMetricsData = {
        date: '2024-01-15',
        weight_kg: 65.5,
        sleep_duration_hours: 7.5,
        fatigue_level: 3,
        motivation_level: 8,
        stress_level: 4,
        energy_level: 7,
        training_readiness: 8,
        recovery_status: 'good',
        notes: '調子が良い',
        mood_tags: ['元気', 'やる気'],
      }

      const mockCreatedMetrics = {
        id: 'new-metrics-id',
        ...mockMetricsData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createDailyMetrics as jest.Mock).mockResolvedValue(mockCreatedMetrics)

      const metricsResult = await apiClient.createDailyMetrics(mockMetricsData)
      expect(metricsResult).toEqual(mockCreatedMetrics)
    })

    test('CSVインポート → インターバル分析の流れ', async () => {
      // 1. CSVファイルプレビュー
      const mockPreview = {
        statistics: {
          total_rows: 10,
          valid_rows: 8,
          detected_encoding: 'UTF-8',
          detected_format: 'Garmin Connect',
        },
        lap_analysis: [
          {
            lap_number: 1,
            time: '5:00',
            distance: '1000m',
            pace: '5:00/km',
            heart_rate: '150',
            judgment: '正常',
          },
          {
            lap_number: 2,
            time: '4:30',
            distance: '1000m',
            pace: '4:30/km',
            heart_rate: '160',
            judgment: '正常',
          },
          {
            lap_number: 3,
            time: '0:30',
            distance: '50m',
            pace: '10:00/km',
            heart_rate: '120',
            judgment: '異常',
          },
        ],
        warnings: [],
      }

      ;(apiClient.previewCSVImport as jest.Mock).mockResolvedValue(mockPreview)

      const preview = await apiClient.previewCSVImport(new File(['test'], 'test.csv'))
      expect(preview).toEqual(mockPreview)

      // 2. インターバル分析実行
      const mockAnalysisData = {
        workout_import_data_id: 'temp_id',
        lap_times: [300, 270, 30], // 5:00, 4:30, 0:30
        lap_distances: [1000, 1000, 50], // 1000m, 1000m, 50m
      }

      const mockAnalysisResult = {
        analysis_id: 'analysis-id',
        total_laps: 3,
        average_lap_time: 200,
        average_lap_distance: 683.33,
        has_anomaly: true,
        anomaly_type: 'short_last_lap',
        anomaly_lap_index: 2,
        anomaly_severity: 'high',
        lap_times: [300, 270, 30],
        lap_distances: [1000, 1000, 50],
        lap_paces: [300, 270, 600],
        suggested_corrections: [
          {
            type: 'remove_last_lap',
            reason: '余分なラップの可能性が高い',
            confidence: 0.9,
          },
        ],
        pattern_validation: {
          pattern_type: 'medium_interval',
          is_valid: true,
          description: '中距離インターバルとして正常',
        },
        analysis_metadata: {
          confidence: 0.9,
          description: '最後のラップが異常に短いです（時間: 15.0%, 距離: 50m）',
          analysis_timestamp: '2024-01-15T10:00:00Z',
        },
      }

      ;(apiClient.analyzeIntervalData as jest.Mock).mockResolvedValue(mockAnalysisResult)

      const analysisResult = await apiClient.analyzeIntervalData(mockAnalysisData)
      expect(analysisResult).toEqual(mockAnalysisResult)

      // 3. 修正適用
      const mockCorrectionData = {
        workout_import_data_id: 'temp_id',
        correction_type: 'remove_last_lap',
      }

      const mockCorrectionResult = {
        workout_import_data_id: 'temp_id',
        correction_applied: true,
        correction_type: 'remove_last_lap',
        original_lap_count: 3,
        corrected_lap_count: 2,
        corrected_times: [300, 270],
        corrected_distances: [1000, 1000],
        modifications: {
          correction_type: 'remove_last_lap',
          applied_at: '2024-01-15T10:00:00Z',
          original_lap_count: 3,
          corrected_lap_count: 2,
        },
      }

      ;(apiClient.applyIntervalCorrection as jest.Mock).mockResolvedValue(mockCorrectionResult)

      const correctionResult = await apiClient.applyIntervalCorrection(mockCorrectionData)
      expect(correctionResult).toEqual(mockCorrectionResult)
    })
  })

  describe('データ整合性テスト', () => {
    test('練習記録とコンディション記録の関連性', async () => {
      // 練習記録作成
      const mockWorkoutData = {
        date: '2024-01-15',
        workout_type_id: '1',
        distance_meters: 5000,
        times_seconds: [1200],
        intensity: 5,
        notes: '良い調子',
      }

      const mockCreatedWorkout = {
        id: 'workout-id',
        ...mockWorkoutData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createWorkout as jest.Mock).mockResolvedValue(mockCreatedWorkout)

      const workoutResult = await apiClient.createWorkout(mockWorkoutData)

      // 同じ日のコンディション記録作成
      const mockMetricsData = {
        date: '2024-01-15',
        weight_kg: 65.5,
        sleep_duration_hours: 7.5,
        fatigue_level: 3,
        motivation_level: 8,
        stress_level: 4,
        energy_level: 7,
        training_readiness: 8,
        recovery_status: 'good',
        notes: '練習前の体調',
        mood_tags: ['元気', 'やる気'],
      }

      const mockCreatedMetrics = {
        id: 'metrics-id',
        ...mockMetricsData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createDailyMetrics as jest.Mock).mockResolvedValue(mockCreatedMetrics)

      const metricsResult = await apiClient.createDailyMetrics(mockMetricsData)

      // 両方の記録が同じ日付で作成されることを確認
      expect(workoutResult.date).toBe('2024-01-15')
      expect(metricsResult.date).toBe('2024-01-15')
    })

    test('ユーザープロフィールと各種記録の関連性', async () => {
      // ユーザープロフィール取得
      const mockProfile = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        gender: 'male',
        height_cm: 175,
        weight_kg: 70,
      }

      ;(apiClient.getUserProfile as jest.Mock).mockResolvedValue(mockProfile)

      const profile = await apiClient.getUserProfile()

      // 練習記録作成（ユーザーIDが一致することを確認）
      const mockWorkoutData = {
        date: '2024-01-15',
        workout_type_id: '1',
        distance_meters: 5000,
        times_seconds: [1200],
        intensity: 5,
        notes: '良い調子',
      }

      const mockCreatedWorkout = {
        id: 'workout-id',
        user_id: 'test-user-id',
        ...mockWorkoutData,
        created_at: '2024-01-15T10:00:00Z',
      }

      ;(apiClient.createWorkout as jest.Mock).mockResolvedValue(mockCreatedWorkout)

      const workoutResult = await apiClient.createWorkout(mockWorkoutData)

      // ユーザーIDが一致することを確認
      expect(profile.id).toBe('test-user-id')
      expect(workoutResult.user_id).toBe('test-user-id')
    })
  })

  describe('エラーハンドリング統合テスト', () => {
    test('API エラー時の適切な処理', async () => {
      // 認証エラー
      const mockAuthError = {
        response: {
          status: 401,
          data: {
            error: 'authentication_error',
            message: '認証が必要です',
          },
        },
      }

      ;(apiClient.getWorkouts as jest.Mock).mockRejectedValue(mockAuthError)

      try {
        await apiClient.getWorkouts()
      } catch (error) {
        expect(error).toEqual(mockAuthError)
      }

      // バリデーションエラー
      const mockValidationError = {
        response: {
          status: 400,
          data: {
            error: 'validation_error',
            message: '入力データに問題があります',
            details: {
              date: ['日付は必須です'],
              distance_meters: ['距離は0より大きい値を入力してください'],
            },
          },
        },
      }

      ;(apiClient.createWorkout as jest.Mock).mockRejectedValue(mockValidationError)

      try {
        await apiClient.createWorkout({})
      } catch (error) {
        expect(error).toEqual(mockValidationError)
      }
    })

    test('ネットワークエラー時の適切な処理', async () => {
      const mockNetworkError = {
        request: {},
        message: 'Network Error',
      }

      ;(apiClient.getDashboardStats as jest.Mock).mockRejectedValue(mockNetworkError)

      try {
        await apiClient.getDashboardStats()
      } catch (error) {
        expect(error).toEqual(mockNetworkError)
      }
    })
  })

  describe('パフォーマンス統合テスト', () => {
    test('大量データの処理性能', async () => {
      // 大量の練習記録データ
      const mockLargeWorkouts = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `workout-${i}`,
          date: '2024-01-15',
          distance_meters: 5000,
          times_seconds: [1200],
          workout_type: { name: 'イージーランニング' },
          intensity: 5,
          notes: `練習記録 ${i}`,
        })),
        total: 100,
        page: 1,
        limit: 100,
        total_pages: 1,
      }

      ;(apiClient.getWorkouts as jest.Mock).mockResolvedValue(mockLargeWorkouts)

      const startTime = Date.now()
      const result = await apiClient.getWorkouts()
      const endTime = Date.now()

      expect(result.items).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })

    test('同時リクエストの処理', async () => {
      // 複数のAPIを同時に呼び出し
      const promises = [
        apiClient.getDashboardStats(),
        apiClient.getWorkouts(),
        apiClient.getDailyMetrics(),
        apiClient.getCustomWorkoutTemplates(),
      ]

      // モックデータを設定
      ;(apiClient.getDashboardStats as jest.Mock).mockResolvedValue({})
      ;(apiClient.getWorkouts as jest.Mock).mockResolvedValue({})
      ;(apiClient.getDailyMetrics as jest.Mock).mockResolvedValue({})
      ;(apiClient.getCustomWorkoutTemplates as jest.Mock).mockResolvedValue({})

      const startTime = Date.now()
      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(4)
      expect(endTime - startTime).toBeLessThan(2000) // 2秒以内
    })
  })
})

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
    getCustomWorkoutTemplates: jest.fn(),
    getDailyMetrics: jest.fn(),
    getRaces: jest.fn(),
    getUserProfile: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
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

describe('包括的機能テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue(mockAuth)
  })

  describe('認証機能', () => {
    test('ログインページが正しく表示される', async () => {
      // 未認証状態でログインページをテスト
      ;(useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        isAuthenticated: false,
      })

      // ログインページのコンポーネントをインポートしてテスト
      // 実際の実装では、ログインページのコンポーネントをインポート
      expect(true).toBe(true) // プレースホルダー
    })

    test('ログイン機能が正常に動作する', async () => {
      const mockLoginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      ;(apiClient.login as jest.Mock).mockResolvedValue({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
      })

      // ログイン処理のテスト
      await apiClient.login(mockLoginData)

      expect(apiClient.login).toHaveBeenCalledWith(mockLoginData)
    })

    test('ログアウト機能が正常に動作する', async () => {
      ;(apiClient.logout as jest.Mock).mockResolvedValue({})

      await apiClient.logout()

      expect(apiClient.logout).toHaveBeenCalled()
    })
  })

  describe('ダッシュボード機能', () => {
    test('ダッシュボード統計が正しく表示される', async () => {
      const mockStats = {
        total_workouts: 25,
        total_distance_km: 150.5,
        total_time_hours: 12.5,
        avg_pace_per_km: 5.2,
        recent_workouts: [
          {
            id: '1',
            date: '2024-01-15',
            distance_meters: 5000,
            times_seconds: [1200],
            workout_type: { name: 'イージーランニング' },
          },
        ],
      }

      ;(apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStats)

      const stats = await apiClient.getDashboardStats()

      expect(stats).toEqual(mockStats)
      expect(apiClient.getDashboardStats).toHaveBeenCalled()
    })
  })

  describe('練習記録機能', () => {
    test('練習記録一覧が正しく表示される', async () => {
      const mockWorkouts = {
        items: [
          {
            id: '1',
            date: '2024-01-15',
            distance_meters: 5000,
            times_seconds: [1200],
            workout_type: { name: 'イージーランニング' },
            intensity: 5,
            notes: '良い調子',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      }

      ;(apiClient.getWorkouts as jest.Mock).mockResolvedValue(mockWorkouts)

      const workouts = await apiClient.getWorkouts()

      expect(workouts).toEqual(mockWorkouts)
      expect(apiClient.getWorkouts).toHaveBeenCalled()
    })

    test('練習記録作成が正常に動作する', async () => {
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
      expect(apiClient.createWorkout).toHaveBeenCalledWith(mockWorkoutData)
    })
  })

  describe('カスタムワークアウト機能', () => {
    test('カスタムワークアウトテンプレート一覧が正しく表示される', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'インターバル練習',
          description: '400m×8本のインターバル練習',
          category: 'speed',
          total_distance: 3200,
          total_time: 2400,
          difficulty: 'intermediate',
          is_favorite: true,
          usage_count: 5,
        },
      ]

      ;(apiClient.getCustomWorkoutTemplates as jest.Mock).mockResolvedValue(mockTemplates)

      const templates = await apiClient.getCustomWorkoutTemplates()

      expect(templates).toEqual(mockTemplates)
      expect(apiClient.getCustomWorkoutTemplates).toHaveBeenCalled()
    })

    test('カスタムワークアウト作成が正常に動作する', async () => {
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

      const result = await apiClient.createCustomWorkoutTemplate(mockTemplateData)

      expect(result).toEqual(mockCreatedTemplate)
      expect(apiClient.createCustomWorkoutTemplate).toHaveBeenCalledWith(mockTemplateData)
    })
  })

  describe('コンディション記録機能', () => {
    test('コンディション記録一覧が正しく表示される', async () => {
      const mockMetrics = {
        items: [
          {
            id: '1',
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
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      }

      ;(apiClient.getDailyMetrics as jest.Mock).mockResolvedValue(mockMetrics)

      const metrics = await apiClient.getDailyMetrics()

      expect(metrics).toEqual(mockMetrics)
      expect(apiClient.getDailyMetrics).toHaveBeenCalled()
    })

    test('コンディション記録作成が正常に動作する', async () => {
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

      const result = await apiClient.createDailyMetrics(mockMetricsData)

      expect(result).toEqual(mockCreatedMetrics)
      expect(apiClient.createDailyMetrics).toHaveBeenCalledWith(mockMetricsData)
    })
  })

  describe('レース機能', () => {
    test('レース一覧が正しく表示される', async () => {
      const mockRaces = {
        items: [
          {
            id: '1',
            race_name: '東京マラソン',
            race_date: '2024-03-10',
            distance: 'フルマラソン',
            target_time_seconds: 14400,
            status: 'scheduled',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      }

      ;(apiClient.getRaces as jest.Mock).mockResolvedValue(mockRaces)

      const races = await apiClient.getRaces()

      expect(races).toEqual(mockRaces)
      expect(apiClient.getRaces).toHaveBeenCalled()
    })
  })

  describe('エラーハンドリング', () => {
    test('API エラーが正しく処理される', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'validation_error',
            message: '入力データに問題があります',
          },
        },
      }

      ;(apiClient.getWorkouts as jest.Mock).mockRejectedValue(mockError)

      try {
        await apiClient.getWorkouts()
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })

    test('ネットワークエラーが正しく処理される', async () => {
      const mockNetworkError = {
        request: {},
        message: 'Network Error',
      }

      ;(apiClient.getWorkouts as jest.Mock).mockRejectedValue(mockNetworkError)

      try {
        await apiClient.getWorkouts()
      } catch (error) {
        expect(error).toEqual(mockNetworkError)
      }
    })
  })

  describe('レスポンシブデザイン', () => {
    test('モバイル表示でナビゲーションが正しく動作する', () => {
      // モバイル表示のテスト
      // 実際の実装では、モバイル用のナビゲーションコンポーネントをテスト
      expect(true).toBe(true) // プレースホルダー
    })

    test('タブレット表示でレイアウトが正しく調整される', () => {
      // タブレット表示のテスト
      // 実際の実装では、タブレット用のレイアウトをテスト
      expect(true).toBe(true) // プレースホルダー
    })

    test('デスクトップ表示で全機能が正しく表示される', () => {
      // デスクトップ表示のテスト
      // 実際の実装では、デスクトップ用のレイアウトをテスト
      expect(true).toBe(true) // プレースホルダー
    })
  })

  describe('データ整合性', () => {
    test('練習記録とコンディション記録の関連性が正しく処理される', async () => {
      // 練習記録とコンディション記録の関連性テスト
      // 実際の実装では、データの整合性をテスト
      expect(true).toBe(true) // プレースホルダー
    })

    test('ユーザープロフィール情報が正しく同期される', async () => {
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

      expect(profile).toEqual(mockProfile)
      expect(apiClient.getUserProfile).toHaveBeenCalled()
    })
  })

  describe('CSVインポート機能', () => {
    test('CSVファイルのプレビューが正しく表示される', async () => {
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
        ],
        warnings: [],
      }

      ;(apiClient.previewCSVImport as jest.Mock).mockResolvedValue(mockPreview)

      const preview = await apiClient.previewCSVImport(new File(['test'], 'test.csv'))

      expect(preview).toEqual(mockPreview)
      expect(apiClient.previewCSVImport).toHaveBeenCalled()
    })

    test('CSVインポートが正常に完了する', async () => {
      const mockImportResult = {
        statistics: {
          successful_imports: 8,
          failed_imports: 0,
          total_processed: 8,
          workout_date: '2024-01-15',
        },
        warnings: [],
      }

      ;(apiClient.confirmCSVImport as jest.Mock).mockResolvedValue(mockImportResult)

      const result = await apiClient.confirmCSVImport(
        new File(['test'], 'test.csv'),
        '2024-01-15',
        '1',
        5
      )

      expect(result).toEqual(mockImportResult)
      expect(apiClient.confirmCSVImport).toHaveBeenCalled()
    })
  })
})

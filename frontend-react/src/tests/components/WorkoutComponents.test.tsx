/**
 * Phase 1: 練習記録コンポーネントテスト
 * - 一覧・詳細・フォーム
 * - CRUD操作・フィルタリング・ソート
 * - バリデーション・エラーハンドリング
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import WorkoutList from '@/app/workouts/components/WorkoutList';
import DetailedWorkoutForm from '@/app/workouts/components/DetailedWorkoutForm';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    getWorkouts: jest.fn(),
    createWorkout: jest.fn(),
    updateWorkout: jest.fn(),
    deleteWorkout: jest.fn(),
    getWorkoutTypes: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockUseAuth = {
  user: { id: '1', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
};

const mockWorkouts = [
  {
    id: '1',
    date: '2024-01-15',
    workout_type_name: 'ジョギング',
    distance_km: 5.0,
    time_minutes: 30.0,
    intensity: 5,
    heart_rate_avg: 140,
    heart_rate_max: 160,
    notes: 'テスト練習1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    date: '2024-01-16',
    workout_type_name: 'インターバル',
    distance_km: 8.0,
    time_minutes: 45.0,
    intensity: 8,
    heart_rate_avg: 160,
    heart_rate_max: 180,
    notes: 'テスト練習2',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
];

const mockWorkoutTypes = [
  { id: '1', name: 'ジョギング', description: 'ゆっくりとしたペースでの走行' },
  { id: '2', name: 'インターバル', description: '高強度と低強度を交互に繰り返す' },
];

describe('WorkoutComponents', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
    jest.clearAllMocks();
  });

  describe('WorkoutList', () => {
    const mockProps = {
      workouts: mockWorkouts,
      pagination: {
        page: 1,
        size: 10,
        total: 2,
        totalPages: 1,
      },
      onPageChange: jest.fn(),
      onSort: jest.fn(),
      onFilter: jest.fn(),
      onDelete: jest.fn(),
    };

    it('renders workout list correctly', () => {
      render(<WorkoutList {...mockProps} />);
      
      expect(screen.getByText('テスト練習1')).toBeInTheDocument();
      expect(screen.getByText('テスト練習2')).toBeInTheDocument();
      expect(screen.getByText('5.0 km')).toBeInTheDocument();
      expect(screen.getByText('8.0 km')).toBeInTheDocument();
    });

    it('displays workout details correctly', () => {
      render(<WorkoutList {...mockProps} />);
      
      // 日付表示
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-16')).toBeInTheDocument();
      
      // 練習種別表示
      expect(screen.getByText('ジョギング')).toBeInTheDocument();
      expect(screen.getByText('インターバル')).toBeInTheDocument();
      
      // 距離・時間表示
      expect(screen.getByText('5.0 km')).toBeInTheDocument();
      expect(screen.getByText('8.0 km')).toBeInTheDocument();
      expect(screen.getByText('30.0分')).toBeInTheDocument();
      expect(screen.getByText('45.0分')).toBeInTheDocument();
    });

    it('handles empty workout list', () => {
      const emptyProps = {
        ...mockProps,
        workouts: [],
      };
      
      render(<WorkoutList {...emptyProps} />);
      
      expect(screen.getByText(/練習記録がありません/i)).toBeInTheDocument();
    });

    it('handles pagination correctly', () => {
      const paginationProps = {
        ...mockProps,
        pagination: {
          page: 1,
          size: 1,
          total: 2,
          totalPages: 2,
        },
      };
      
      render(<WorkoutList {...paginationProps} />);
      
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByText('次へ')).toBeInTheDocument();
    });

    it('handles sorting', () => {
      render(<WorkoutList {...mockProps} />);
      
      const sortButton = screen.getByText('日付');
      fireEvent.click(sortButton);
      
      expect(mockProps.onSort).toHaveBeenCalledWith('date', 'desc');
    });

    it('handles filtering', () => {
      render(<WorkoutList {...mockProps} />);
      
      const filterInput = screen.getByPlaceholderText(/検索/i);
      fireEvent.change(filterInput, { target: { value: 'ジョギング' } });
      
      expect(mockProps.onFilter).toHaveBeenCalledWith('ジョギング');
    });

    it('handles workout deletion', async () => {
      render(<WorkoutList {...mockProps} />);
      
      const deleteButton = screen.getAllByText('削除')[0];
      fireEvent.click(deleteButton);
      
      // 確認ダイアログが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/削除しますか？/i)).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('削除');
      fireEvent.click(confirmButton);
      
      expect(mockProps.onDelete).toHaveBeenCalledWith('1');
    });

    it('handles workout editing', () => {
      render(<WorkoutList {...mockProps} />);
      
      const editButton = screen.getAllByText('編集')[0];
      fireEvent.click(editButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/workouts/1');
    });

    it('displays intensity with color coding', () => {
      render(<WorkoutList {...mockProps} />);
      
      // 強度5（低強度）
      const intensity5 = screen.getByText('5');
      expect(intensity5).toHaveClass('bg-green-100', 'text-green-800');
      
      // 強度8（高強度）
      const intensity8 = screen.getByText('8');
      expect(intensity8).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('DetailedWorkoutForm', () => {
    const mockProps = {
      workoutTypes: mockWorkoutTypes,
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      initialData: null,
      isLoading: false,
    };

    it('renders form correctly', () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      expect(screen.getByText('基本情報')).toBeInTheDocument();
      expect(screen.getByText('詳細設定')).toBeInTheDocument();
      expect(screen.getByLabelText(/日付/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/練習種別/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/日付を入力してください/i)).toBeInTheDocument();
        expect(screen.getByText(/練習種別を選択してください/i)).toBeInTheDocument();
      });
    });

    it('validates distance input', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const distanceInput = screen.getByLabelText(/総距離/i);
      fireEvent.change(distanceInput, { target: { value: '-5' } });
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/距離は0より大きい値を入力してください/i)).toBeInTheDocument();
      });
    });

    it('validates time input', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const timeInput = screen.getByLabelText(/総時間/i);
      fireEvent.change(timeInput, { target: { value: '0' } });
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/時間は0より大きい値を入力してください/i)).toBeInTheDocument();
      });
    });

    it('validates heart rate range', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const avgHeartRateInput = screen.getByLabelText(/平均心拍数/i);
      const maxHeartRateInput = screen.getByLabelText(/最大心拍数/i);
      
      fireEvent.change(avgHeartRateInput, { target: { value: '200' } });
      fireEvent.change(maxHeartRateInput, { target: { value: '150' } });
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/最大心拍数は平均心拍数より大きい値を入力してください/i)).toBeInTheDocument();
      });
    });

    it('calculates pace automatically', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const distanceInput = screen.getByLabelText(/総距離/i);
      const timeInput = screen.getByLabelText(/総時間/i);
      
      fireEvent.change(distanceInput, { target: { value: '10' } });
      fireEvent.change(timeInput, { target: { value: '60' } });
      
      await waitFor(() => {
        expect(screen.getByText('6:00 /km')).toBeInTheDocument();
      });
    });

    it('handles session count selection', () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const sessionCountSelect = screen.getByLabelText(/部練習数/i);
      fireEvent.change(sessionCountSelect, { target: { value: '2' } });
      
      // 2部練の設定が表示されることを確認
      expect(screen.getByText('1部練目')).toBeInTheDocument();
      expect(screen.getByText('2部練目')).toBeInTheDocument();
    });

    it('handles detailed session configuration', () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      // 詳細設定タブに切り替え
      const detailTab = screen.getByText('詳細設定');
      fireEvent.click(detailTab);
      
      expect(screen.getByText('セッション情報')).toBeInTheDocument();
      expect(screen.getByText('構成要素')).toBeInTheDocument();
      expect(screen.getByText('ウォームアップ')).toBeInTheDocument();
      expect(screen.getByText('メイン')).toBeInTheDocument();
      expect(screen.getByText('クールダウン')).toBeInTheDocument();
    });

    it('calculates total distance from components', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      // 詳細設定タブに切り替え
      const detailTab = screen.getByText('詳細設定');
      fireEvent.click(detailTab);
      
      const warmupDistanceInput = screen.getByLabelText(/ウォームアップ距離/i);
      const mainDistanceInput = screen.getByLabelText(/メイン距離/i);
      const cooldownDistanceInput = screen.getByLabelText(/クールダウン距離/i);
      
      fireEvent.change(warmupDistanceInput, { target: { value: '2' } });
      fireEvent.change(mainDistanceInput, { target: { value: '5' } });
      fireEvent.change(cooldownDistanceInput, { target: { value: '1' } });
      
      await waitFor(() => {
        expect(screen.getByText('合計: 8.0 km')).toBeInTheDocument();
      });
    });

    it('handles form submission', async () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      // 基本情報入力
      const dateInput = screen.getByLabelText(/日付/i);
      const workoutTypeSelect = screen.getByLabelText(/練習種別/i);
      const distanceInput = screen.getByLabelText(/総距離/i);
      const timeInput = screen.getByLabelText(/総時間/i);
      
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      fireEvent.change(workoutTypeSelect, { target: { value: '1' } });
      fireEvent.change(distanceInput, { target: { value: '10' } });
      fireEvent.change(timeInput, { target: { value: '60' } });
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          date: '2024-01-15',
          workout_type_id: '1',
          distance_km: 10,
          time_minutes: 60,
          intensity: 5,
          heart_rate_avg: null,
          heart_rate_max: null,
          times_seconds: [],
          notes: '',
          session_count: 1,
          session_period: 'morning',
          warmup_distance: null,
          warmup_time: null,
          main_distance: null,
          main_time: null,
          cooldown_distance: null,
          cooldown_time: null,
        });
      });
    });

    it('handles form cancellation', () => {
      render(<DetailedWorkoutForm {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      fireEvent.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('shows loading state', () => {
      const loadingProps = {
        ...mockProps,
        isLoading: true,
      };
      
      render(<DetailedWorkoutForm {...loadingProps} />);
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/保存中.../i)).toBeInTheDocument();
    });

    it('loads initial data for editing', () => {
      const initialData = {
        id: '1',
        date: '2024-01-15',
        workout_type_id: '1',
        distance_km: 10,
        time_minutes: 60,
        intensity: 7,
        heart_rate_avg: 150,
        heart_rate_max: 170,
        notes: '編集用データ',
      };
      
      const editProps = {
        ...mockProps,
        initialData,
      };
      
      render(<DetailedWorkoutForm {...editProps} />);
      
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      expect(screen.getByDisplayValue('編集用データ')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile screen size', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const mockProps = {
        workouts: mockWorkouts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
        },
        onPageChange: jest.fn(),
        onSort: jest.fn(),
        onFilter: jest.fn(),
        onDelete: jest.fn(),
      };
      
      render(<WorkoutList {...mockProps} />);
      
      // モバイル表示ではカード形式になることを確認
      const workoutCards = screen.getAllByTestId('workout-card');
      expect(workoutCards).toHaveLength(2);
    });

    it('adapts to desktop screen size', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      const mockProps = {
        workouts: mockWorkouts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
        },
        onPageChange: jest.fn(),
        onSort: jest.fn(),
        onFilter: jest.fn(),
        onDelete: jest.fn(),
      };
      
      render(<WorkoutList {...mockProps} />);
      
      // デスクトップ表示ではテーブル形式になることを確認
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const mockProps = {
        workouts: mockWorkouts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
        },
        onPageChange: jest.fn(),
        onSort: jest.fn(),
        onFilter: jest.fn(),
        onDelete: jest.fn(),
      };
      
      render(<WorkoutList {...mockProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', '練習記録一覧');
    });

    it('supports keyboard navigation', () => {
      const mockProps = {
        workouts: mockWorkouts,
        pagination: {
          page: 1,
          size: 10,
          total: 2,
          totalPages: 1,
        },
        onPageChange: jest.fn(),
        onSort: jest.fn(),
        onFilter: jest.fn(),
        onDelete: jest.fn(),
      };
      
      render(<WorkoutList {...mockProps} />);
      
      const editButton = screen.getAllByText('編集')[0];
      editButton.focus();
      expect(editButton).toHaveFocus();
      
      fireEvent.keyDown(editButton, { key: 'Enter' });
      expect(mockRouter.push).toHaveBeenCalledWith('/workouts/1');
    });
  });
});

/**
 * 練習記録コンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import WorkoutList from '@/app/workouts/components/WorkoutList';
import WorkoutForm from '@/app/workouts/components/WorkoutForm';
import DetailedWorkoutForm from '@/app/workouts/components/DetailedWorkoutForm';

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// API クライアントのモック
jest.mock('@/lib/api', () => ({
  api: {
    workouts: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('練習記録コンポーネントテスト', () => {
  const mockPush = jest.fn();
  const mockApi = require('@/lib/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('WorkoutList', () => {
    const mockWorkouts = [
      {
        id: '1',
        date: '2024-01-15',
        workout_type: 'easy_run',
        distance_meters: 5000,
        duration_seconds: 1800,
        pace_per_km: 360,
        heart_rate_avg: 140,
        notes: 'テスト練習1'
      },
      {
        id: '2',
        date: '2024-01-16',
        workout_type: 'interval',
        distance_meters: 8000,
        duration_seconds: 2400,
        pace_per_km: 300,
        heart_rate_avg: 150,
        notes: 'テスト練習2'
      }
    ];

    it('練習記録一覧が正しくレンダリングされる', async () => {
      mockApi.workouts.getAll.mockResolvedValue({
        data: {
          items: mockWorkouts,
          total: 2,
          page: 1,
          size: 20
        }
      });

      render(<WorkoutList />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト練習1')).toBeInTheDocument();
        expect(screen.getByText('テスト練習2')).toBeInTheDocument();
        expect(screen.getByText('5.0 km')).toBeInTheDocument();
        expect(screen.getByText('8.0 km')).toBeInTheDocument();
      });
    });

    it('空の練習記録一覧が正しく表示される', async () => {
      mockApi.workouts.getAll.mockResolvedValue({
        data: {
          items: [],
          total: 0,
          page: 1,
          size: 20
        }
      });

      render(<WorkoutList />);
      
      await waitFor(() => {
        expect(screen.getByText(/練習記録がありません/i)).toBeInTheDocument();
      });
    });

    it('練習記録の詳細表示が正しく動作する', async () => {
      mockApi.workouts.getAll.mockResolvedValue({
        data: {
          items: mockWorkouts,
          total: 2,
          page: 1,
          size: 20
        }
      });

      render(<WorkoutList />);
      
      await waitFor(() => {
        const detailButton = screen.getAllByText(/詳細/i)[0];
        fireEvent.click(detailButton);
        expect(mockPush).toHaveBeenCalledWith('/workouts/1');
      });
    });

    it('練習記録の削除が正しく動作する', async () => {
      mockApi.workouts.getAll.mockResolvedValue({
        data: {
          items: mockWorkouts,
          total: 2,
          page: 1,
          size: 20
        }
      });
      mockApi.workouts.delete.mockResolvedValue({});

      render(<WorkoutList />);
      
      await waitFor(() => {
        const deleteButton = screen.getAllByText(/削除/i)[0];
        fireEvent.click(deleteButton);
      });

      // 確認ダイアログのモック
      global.confirm = jest.fn(() => true);

      await waitFor(() => {
        expect(mockApi.workouts.delete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('WorkoutForm', () => {
    it('練習記録フォームが正しくレンダリングされる', () => {
      render(<WorkoutForm />);
      
      expect(screen.getByLabelText(/日付/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/練習種別/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/距離/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/時間/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
    });

    it('バリデーションエラーが表示される', async () => {
      render(<WorkoutForm />);
      
      const submitButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/日付は必須です/i)).toBeInTheDocument();
        expect(screen.getByText(/練習種別は必須です/i)).toBeInTheDocument();
        expect(screen.getByText(/距離は必須です/i)).toBeInTheDocument();
      });
    });

    it('練習記録作成が正しく動作する', async () => {
      mockApi.workouts.create.mockResolvedValue({
        data: { id: '1', ...mockWorkouts[0] }
      });

      render(<WorkoutForm />);
      
      const dateInput = screen.getByLabelText(/日付/i);
      const workoutTypeSelect = screen.getByLabelText(/練習種別/i);
      const distanceInput = screen.getByLabelText(/距離/i);
      const durationInput = screen.getByLabelText(/時間/i);
      const submitButton = screen.getByRole('button', { name: /保存/i });
      
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      fireEvent.change(workoutTypeSelect, { target: { value: 'easy_run' } });
      fireEvent.change(distanceInput, { target: { value: '5.0' } });
      fireEvent.change(durationInput, { target: { value: '30:00' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.workouts.create).toHaveBeenCalledWith({
          date: '2024-01-15',
          workout_type: 'easy_run',
          distance_meters: 5000,
          duration_seconds: 1800
        });
        expect(mockPush).toHaveBeenCalledWith('/workouts');
      });
    });

    it('練習記録更新が正しく動作する', async () => {
      const workoutId = '1';
      mockApi.workouts.getById.mockResolvedValue({
        data: mockWorkouts[0]
      });
      mockApi.workouts.update.mockResolvedValue({
        data: { ...mockWorkouts[0], distance_meters: 10000 }
      });

      render(<WorkoutForm workoutId={workoutId} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('5.0')).toBeInTheDocument();
      });
      
      const distanceInput = screen.getByLabelText(/距離/i);
      const submitButton = screen.getByRole('button', { name: /更新/i });
      
      fireEvent.change(distanceInput, { target: { value: '10.0' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.workouts.update).toHaveBeenCalledWith(workoutId, {
          distance_meters: 10000
        });
        expect(mockPush).toHaveBeenCalledWith('/workouts');
      });
    });
  });

  describe('DetailedWorkoutForm', () => {
    it('詳細練習記録フォームが正しくレンダリングされる', () => {
      render(<DetailedWorkoutForm />);
      
      expect(screen.getByText(/部練習数/i)).toBeInTheDocument();
      expect(screen.getByText(/セッション1/i)).toBeInTheDocument();
      expect(screen.getByText(/ウォームアップ/i)).toBeInTheDocument();
      expect(screen.getByText(/メイン練習/i)).toBeInTheDocument();
      expect(screen.getByText(/クールダウン/i)).toBeInTheDocument();
    });

    it('部練習数の変更が正しく動作する', () => {
      render(<DetailedWorkoutForm />);
      
      const sessionCountSelect = screen.getByLabelText(/部練習数/i);
      fireEvent.change(sessionCountSelect, { target: { value: '2' } });
      
      expect(screen.getByText(/セッション2/i)).toBeInTheDocument();
    });

    it('インターバル練習の詳細入力が正しく動作する', () => {
      render(<DetailedWorkoutForm />);
      
      const workoutTypeSelect = screen.getByLabelText(/練習種別/i);
      fireEvent.change(workoutTypeSelect, { target: { value: 'interval' } });
      
      expect(screen.getByText(/セット数/i)).toBeInTheDocument();
      expect(screen.getByText(/レスト時間/i)).toBeInTheDocument();
    });

    it('詳細練習記録の保存が正しく動作する', async () => {
      mockApi.workouts.create.mockResolvedValue({
        data: { id: '1' }
      });

      render(<DetailedWorkoutForm />);
      
      const dateInput = screen.getByLabelText(/日付/i);
      const sessionCountSelect = screen.getByLabelText(/部練習数/i);
      const submitButton = screen.getByRole('button', { name: /保存/i });
      
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      fireEvent.change(sessionCountSelect, { target: { value: '1' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.workouts.create).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/workouts');
      });
    });
  });
});
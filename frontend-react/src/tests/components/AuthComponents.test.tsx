/**
 * 認証コンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// API クライアントのモック
jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
    },
  },
}));

describe('認証コンポーネントテスト', () => {
  const mockPush = jest.fn();
  const mockApi = require('@/lib/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('LoginForm', () => {
    it('ログインフォームが正しくレンダリングされる', () => {
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
    });

    it('バリデーションエラーが表示される', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /ログイン/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスは必須です/i)).toBeInTheDocument();
        expect(screen.getByText(/パスワードは必須です/i)).toBeInTheDocument();
      });
    });

    it('無効なメールアドレスでエラーが表示される', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
      });
    });

    it('ログイン成功時にダッシュボードにリダイレクトされる', async () => {
      mockApi.auth.login.mockResolvedValue({
        data: {
          access_token: 'test-token',
          user: { email: 'test@example.com', name: 'テストユーザー' }
        }
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.auth.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('ログイン失敗時にエラーメッセージが表示される', async () => {
      mockApi.auth.login.mockRejectedValue({
        response: { data: { detail: '認証に失敗しました' } }
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const submitButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/認証に失敗しました/i)).toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    it('登録フォームが正しくレンダリングされる', () => {
      render(<RegisterForm />);
      
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /新規登録/i })).toBeInTheDocument();
    });

    it('パスワード不一致でエラーが表示される', async () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const submitButton = screen.getByRole('button', { name: /新規登録/i });
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument();
      });
    });

    it('弱いパスワードでエラーが表示される', async () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const submitButton = screen.getByRole('button', { name: /新規登録/i });
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードは8文字以上である必要があります/i)).toBeInTheDocument();
      });
    });

    it('登録成功時にダッシュボードにリダイレクトされる', async () => {
      mockApi.auth.register.mockResolvedValue({
        data: {
          access_token: 'test-token',
          user: { email: 'test@example.com', name: 'テストユーザー' }
        }
      });

      render(<RegisterForm />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const nameInput = screen.getByLabelText(/名前/i);
      const submitButton = screen.getByRole('button', { name: /新規登録/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.auth.register).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password123',
          name: 'テストユーザー'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('登録失敗時にエラーメッセージが表示される', async () => {
      mockApi.auth.register.mockRejectedValue({
        response: { data: { detail: 'このメールアドレスは既に登録されています' } }
      });

      render(<RegisterForm />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const nameInput = screen.getByLabelText(/名前/i);
      const submitButton = screen.getByRole('button', { name: /新規登録/i });
      
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(nameInput, { target: { value: 'テストユーザー' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/このメールアドレスは既に登録されています/i)).toBeInTheDocument();
      });
    });
  });
});
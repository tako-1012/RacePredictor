/**
 * Phase 1: 認証コンポーネントテスト
 * - ログインフォーム・登録フォーム
 * - バリデーション・エラーハンドリング
 * - ユーザーインタラクション
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
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
    login: jest.fn(),
    register: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockUseAuth = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

describe('AuthComponents', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
    jest.clearAllMocks();
  });

  describe('LoginPage', () => {
    it('renders login form correctly', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
      expect(screen.getByText(/アカウントをお持ちでない方は/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<LoginPage />);
      
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument();
        expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/有効なメールアドレスを入力してください/i)).toBeInTheDocument();
      });
    });

    it('handles successful login', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      (useAuth as jest.Mock).mockReturnValue({
        ...mockUseAuth,
        login: mockLogin,
      });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('handles login error', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('ログインに失敗しました'));
      (useAuth as jest.Mock).mockReturnValue({
        ...mockUseAuth,
        login: mockLogin,
      });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during login', async () => {
      const mockLogin = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      (useAuth as jest.Mock).mockReturnValue({
        ...mockUseAuth,
        login: mockLogin,
        isLoading: true,
      });
      
      render(<LoginPage />);
      
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      expect(loginButton).toBeDisabled();
    });
  });

  describe('RegisterPage', () => {
    it('renders register form correctly', () => {
      render(<RegisterPage />);
      
      expect(screen.getByLabelText(/フルネーム/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /登録/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<RegisterPage />);
      
      const registerButton = screen.getByRole('button', { name: /登録/i });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText(/フルネームを入力してください/i)).toBeInTheDocument();
        expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument();
        expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      render(<RegisterPage />);
      
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const registerButton = screen.getByRole('button', { name: /登録/i });
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument();
      });
    });

    it('validates password strength', async () => {
      render(<RegisterPage />);
      
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const registerButton = screen.getByRole('button', { name: /登録/i });
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードは8文字以上で入力してください/i)).toBeInTheDocument();
      });
    });

    it('handles successful registration', async () => {
      const mockRegister = jest.fn().mockResolvedValue({ success: true });
      (useAuth as jest.Mock).mockReturnValue({
        ...mockUseAuth,
        register: mockRegister,
      });
      
      render(<RegisterPage />);
      
      const fullNameInput = screen.getByLabelText(/フルネーム/i);
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const registerButton = screen.getByRole('button', { name: /登録/i });
      
      fireEvent.change(fullNameInput, { target: { value: 'テストユーザー' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          full_name: 'テストユーザー',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles registration error', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('このメールアドレスは既に登録されています'));
      (useAuth as jest.Mock).mockReturnValue({
        ...mockUseAuth,
        register: mockRegister,
      });
      
      render(<RegisterPage />);
      
      const fullNameInput = screen.getByLabelText(/フルネーム/i);
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i);
      const registerButton = screen.getByRole('button', { name: /登録/i });
      
      fireEvent.change(fullNameInput, { target: { value: 'テストユーザー' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText(/このメールアドレスは既に登録されています/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('has proper labels and accessibility attributes', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('supports keyboard navigation', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      
      // Tab navigation
      emailInput.focus();
      expect(emailInput).toHaveFocus();
      
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();
      
      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      expect(loginButton).toHaveFocus();
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
      
      render(<LoginPage />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('w-full', 'max-w-md'); // Mobile-first classes
    });

    it('adapts to desktop screen size', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<LoginPage />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('w-full', 'max-w-md'); // Responsive classes
    });
  });
});

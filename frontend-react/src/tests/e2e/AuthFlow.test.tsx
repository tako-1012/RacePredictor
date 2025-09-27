/**
 * E2Eテスト: 認証フロー
 */
import { test, expect } from '@playwright/test';

test.describe('認証フローテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にアプリケーションにアクセス
    await page.goto('/');
  });

  test('新規ユーザー登録フロー', async ({ page }) => {
    // 1. ホームページから新規登録ページへ
    await page.click('text=新規登録');
    await expect(page).toHaveURL('/register');

    // 2. フォームバリデーション確認
    await page.click('button[type="submit"]');
    await expect(page.locator('text=必須項目です')).toBeVisible();

    // 3. ユーザー登録フォーム入力
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="confirm_password"]', 'testpassword123');
    await page.fill('input[name="name"]', 'テストユーザー');

    // 4. 登録実行
    await page.click('button[type="submit"]');

    // 5. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=テストユーザー')).toBeVisible();
  });

  test('ログインフロー', async ({ page }) => {
    // 1. ログインページへ
    await page.click('text=ログイン');
    await expect(page).toHaveURL('/login');

    // 2. フォームバリデーション確認
    await page.click('button[type="submit"]');
    await expect(page.locator('text=必須項目です')).toBeVisible();

    // 3. ログイン情報入力
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // 4. ログイン実行
    await page.click('button[type="submit"]');

    // 5. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=テストユーザー')).toBeVisible();
  });

  test('ログアウトフロー', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 2. ダッシュボードにいることを確認
    await expect(page).toHaveURL('/dashboard');

    // 3. ログアウト実行
    await page.click('text=ログアウト');

    // 4. ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=新規登録')).toBeVisible();
  });

  test('認証エラーハンドリング', async ({ page }) => {
    // 1. 無効なログイン情報でログイン試行
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 2. エラーメッセージが表示されることを確認
    await expect(page.locator('text=認証に失敗しました')).toBeVisible();

    // 3. パスワード不一致での登録試行
    await page.goto('/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'differentpassword');
    await page.fill('input[name="name"]', 'テストユーザー');
    await page.click('button[type="submit"]');

    // 4. エラーメッセージが表示されることを確認
    await expect(page.locator('text=パスワードが一致しません')).toBeVisible();
  });

  test('認証状態の永続化', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 2. ダッシュボードにいることを確認
    await expect(page).toHaveURL('/dashboard');

    // 3. ページをリロード
    await page.reload();

    // 4. ログイン状態が維持されることを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=テストユーザー')).toBeVisible();
  });
});

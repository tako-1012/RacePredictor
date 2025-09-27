/**
 * E2Eテスト: 練習記録管理
 */
import { test, expect } from '@playwright/test';

test.describe('練習記録管理テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('練習記録一覧表示', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. ページタイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('練習記録');

    // 3. 新規作成ボタンが表示されることを確認
    await expect(page.locator('text=新規作成')).toBeVisible();

    // 4. フィルター機能が表示されることを確認
    await expect(page.locator('select[name="workout_type"]')).toBeVisible();
    await expect(page.locator('input[name="date_from"]')).toBeVisible();
    await expect(page.locator('input[name="date_to"]')).toBeVisible();
  });

  test('新規練習記録作成', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 新規作成ボタンをクリック
    await page.click('text=新規作成');
    await expect(page).toHaveURL('/workouts/new');

    // 3. フォームバリデーション確認
    await page.click('button[type="submit"]');
    await expect(page.locator('text=必須項目です')).toBeVisible();

    // 4. 練習記録フォーム入力
    await page.fill('input[name="date"]', '2024-01-15');
    await page.selectOption('select[name="workout_type"]', 'easy_run');
    await page.fill('input[name="distance"]', '5.0');
    await page.fill('input[name="duration"]', '30:00');
    await page.fill('textarea[name="notes"]', 'テスト練習記録');

    // 5. 保存実行
    await page.click('button[type="submit"]');

    // 6. 練習記録一覧に戻ることを確認
    await expect(page).toHaveURL('/workouts');
    await expect(page.locator('text=テスト練習記録')).toBeVisible();
  });

  test('練習記録編集', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 既存の練習記録をクリック（最初の記録を想定）
    await page.click('tbody tr:first-child');
    await expect(page).toHaveURL(/\/workouts\/\d+\/edit/);

    // 3. フォーム内容を編集
    await page.fill('textarea[name="notes"]', '編集されたテスト練習記録');

    // 4. 保存実行
    await page.click('button[type="submit"]');

    // 5. 練習記録一覧に戻ることを確認
    await expect(page).toHaveURL('/workouts');
    await expect(page.locator('text=編集されたテスト練習記録')).toBeVisible();
  });

  test('練習記録削除', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 削除ボタンをクリック（最初の記録を想定）
    await page.click('tbody tr:first-child button[aria-label="削除"]');

    // 3. 削除確認ダイアログが表示されることを確認
    await expect(page.locator('text=削除しますか？')).toBeVisible();

    // 4. 削除を確認
    await page.click('text=削除');

    // 5. 削除完了メッセージが表示されることを確認
    await expect(page.locator('text=削除しました')).toBeVisible();
  });

  test('練習記録フィルター機能', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. ワークアウトタイプでフィルター
    await page.selectOption('select[name="workout_type"]', 'easy_run');
    await page.click('text=フィルター');

    // 3. フィルター結果が表示されることを確認
    await expect(page.locator('tbody tr')).toBeVisible();

    // 4. 日付範囲でフィルター
    await page.fill('input[name="date_from"]', '2024-01-01');
    await page.fill('input[name="date_to"]', '2024-01-31');
    await page.click('text=フィルター');

    // 5. フィルター結果が表示されることを確認
    await expect(page.locator('tbody tr')).toBeVisible();

    // 6. フィルターをクリア
    await page.click('text=クリア');
    await expect(page.locator('input[name="date_from"]')).toHaveValue('');
    await expect(page.locator('input[name="date_to"]')).toHaveValue('');
  });

  test('練習記録検索機能', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 検索ボックスにキーワードを入力
    await page.fill('input[name="search"]', 'テスト');

    // 3. 検索実行
    await page.click('text=検索');

    // 4. 検索結果が表示されることを確認
    await expect(page.locator('tbody tr')).toBeVisible();

    // 5. 検索をクリア
    await page.fill('input[name="search"]', '');
    await page.click('text=検索');
  });

  test('練習記録の詳細表示', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 練習記録の詳細をクリック
    await page.click('tbody tr:first-child td:first-child');
    await expect(page).toHaveURL(/\/workouts\/\d+/);

    // 3. 詳細情報が表示されることを確認
    await expect(page.locator('h1')).toContainText('練習記録詳細');
    await expect(page.locator('text=日付')).toBeVisible();
    await expect(page.locator('text=距離')).toBeVisible();
    await expect(page.locator('text=時間')).toBeVisible();
    await expect(page.locator('text=メモ')).toBeVisible();

    // 4. 編集ボタンが表示されることを確認
    await expect(page.locator('text=編集')).toBeVisible();

    // 5. 削除ボタンが表示されることを確認
    await expect(page.locator('text=削除')).toBeVisible();
  });

  test('練習記録の統計表示', async ({ page }) => {
    // 1. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. 統計情報が表示されることを確認
    await expect(page.locator('text=総練習回数')).toBeVisible();
    await expect(page.locator('text=総走行距離')).toBeVisible();
    await expect(page.locator('text=総練習時間')).toBeVisible();
    await expect(page.locator('text=平均ペース')).toBeVisible();

    // 3. グラフが表示されることを確認
    await expect(page.locator('canvas')).toBeVisible();
  });
});

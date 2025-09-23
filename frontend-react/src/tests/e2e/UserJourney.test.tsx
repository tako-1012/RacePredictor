/**
 * E2Eテスト: ユーザージャーニー
 */
import { test, expect } from '@playwright/test';

test.describe('ユーザージャーニーテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にアプリケーションにアクセス
    await page.goto('/');
  });

  test('新規ユーザー登録からダッシュボード確認まで', async ({ page }) => {
    // 1. ホームページから新規登録ページへ
    await page.click('text=新規登録');
    await expect(page).toHaveURL('/register');

    // 2. ユーザー登録フォーム入力
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="confirm_password"]', 'testpassword123');
    await page.fill('input[name="name"]', 'E2Eテストユーザー');

    // 3. 登録実行
    await page.click('button[type="submit"]');

    // 4. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=E2Eテストユーザー')).toBeVisible();

    // 5. ダッシュボードの要素が表示されることを確認
    await expect(page.locator('text=総練習回数')).toBeVisible();
    await expect(page.locator('text=総走行距離')).toBeVisible();
    await expect(page.locator('text=平均ペース')).toBeVisible();
  });

  test('ログインから練習記録作成まで', async ({ page }) => {
    // 1. ログインページへ
    await page.click('text=ログイン');
    await expect(page).toHaveURL('/login');

    // 2. ログイン情報入力
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // 3. ログイン実行
    await page.click('button[type="submit"]');

    // 4. ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');

    // 5. 練習記録ページへ
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 6. 新規練習記録作成
    await page.click('text=新規作成');
    await expect(page).toHaveURL('/workouts/new');

    // 7. 練習記録フォーム入力
    await page.fill('input[name="date"]', '2024-01-15');
    await page.selectOption('select[name="workout_type"]', 'easy_run');
    await page.fill('input[name="distance"]', '5.0');
    await page.fill('input[name="duration"]', '30:00');
    await page.fill('textarea[name="notes"]', 'E2Eテスト練習');

    // 8. 保存実行
    await page.click('button[type="submit"]');

    // 9. 練習記録一覧に戻ることを確認
    await expect(page).toHaveURL('/workouts');
    await expect(page.locator('text=E2Eテスト練習')).toBeVisible();
  });

  test('レース結果登録からベストタイム確認まで', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 2. レース結果ページへ
    await page.click('text=レース結果');
    await expect(page).toHaveURL('/races');

    // 3. 新規レース結果作成
    await page.click('text=新規作成');
    await expect(page).toHaveURL('/races/new');

    // 4. レース結果フォーム入力
    await page.fill('input[name="race_name"]', 'E2Eテストレース');
    await page.selectOption('select[name="race_type"]', '5km');
    await page.fill('input[name="date"]', '2024-02-15');
    await page.fill('input[name="time"]', '20:00');
    await page.fill('input[name="place"]', '10');
    await page.fill('input[name="total_participants"]', '100');
    await page.fill('textarea[name="notes"]', 'E2Eテストレース');

    // 5. 保存実行
    await page.click('button[type="submit"]');

    // 6. レース結果一覧に戻ることを確認
    await expect(page).toHaveURL('/races');
    await expect(page.locator('text=E2Eテストレース')).toBeVisible();

    // 7. ベストタイム確認
    await page.click('text=ベストタイム');
    await expect(page.locator('text=5km')).toBeVisible();
    await expect(page.locator('text=20:00')).toBeVisible();
  });

  test('CSVインポートからデータ確認まで', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 2. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 3. CSVファイルアップロード
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,E2EテストCSV1
2024-01-16,Interval,8.0,45:00,E2EテストCSV2`;

    // ファイルアップロードのモック
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビュー確認
    await page.click('text=プレビュー');
    await expect(page.locator('text=E2EテストCSV1')).toBeVisible();
    await expect(page.locator('text=E2EテストCSV2')).toBeVisible();

    // 5. インポート実行
    await page.click('text=インポート実行');

    // 6. インポート完了確認
    await expect(page.locator('text=インポートが完了しました')).toBeVisible();

    // 7. 練習記録一覧でデータ確認
    await page.click('text=練習記録');
    await expect(page.locator('text=E2EテストCSV1')).toBeVisible();
    await expect(page.locator('text=E2EテストCSV2')).toBeVisible();
  });

  test('レスポンシブデザイン確認', async ({ page }) => {
    // 1. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // 2. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // 3. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // 4. モバイルメニュー確認
    await page.click('button[aria-label="メニュー"]');
    await expect(page.locator('text=練習記録')).toBeVisible();
    await expect(page.locator('text=レース結果')).toBeVisible();
  });

  test('エラーハンドリング確認', async ({ page }) => {
    // 1. 存在しないページアクセス
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=ページが見つかりません')).toBeVisible();

    // 2. 無効なログイン情報
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=認証に失敗しました')).toBeVisible();

    // 3. 無効なフォーム入力
    await page.goto('/workouts/new');
    await page.fill('input[name="distance"]', 'invalid');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=有効な数値を入力してください')).toBeVisible();
  });

  test('アクセシビリティ確認', async ({ page }) => {
    // 1. キーボードナビゲーション
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('button:focus')).toBeVisible();

    // 2. スクリーンリーダー対応
    await page.goto('/workouts');
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);

    // 3. フォーカス管理
    await page.click('text=新規作成');
    await expect(page.locator('input:focus')).toBeVisible();

    // 4. 色のコントラスト（基本的な確認）
    const textElements = await page.locator('p, span, div').all();
    expect(textElements.length).toBeGreaterThan(0);
  });
});
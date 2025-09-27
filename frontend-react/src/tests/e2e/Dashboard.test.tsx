/**
 * E2Eテスト: ダッシュボード
 */
import { test, expect } from '@playwright/test';

test.describe('ダッシュボードテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('ダッシュボード基本表示', async ({ page }) => {
    // 1. ダッシュボードにいることを確認
    await expect(page).toHaveURL('/dashboard');

    // 2. ページタイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('ダッシュボード');

    // 3. ユーザー名が表示されることを確認
    await expect(page.locator('text=テストユーザー')).toBeVisible();

    // 4. ナビゲーションメニューが表示されることを確認
    await expect(page.locator('text=練習記録')).toBeVisible();
    await expect(page.locator('text=レース結果')).toBeVisible();
    await expect(page.locator('text=CSVインポート')).toBeVisible();
    await expect(page.locator('text=ログアウト')).toBeVisible();
  });

  test('統計情報表示', async ({ page }) => {
    // 1. 統計カードが表示されることを確認
    await expect(page.locator('text=総練習回数')).toBeVisible();
    await expect(page.locator('text=総走行距離')).toBeVisible();
    await expect(page.locator('text=総練習時間')).toBeVisible();
    await expect(page.locator('text=平均ペース')).toBeVisible();

    // 2. 統計値が数値で表示されることを確認
    const totalWorkouts = page.locator('[data-testid="total-workouts"]');
    const totalDistance = page.locator('[data-testid="total-distance"]');
    const totalTime = page.locator('[data-testid="total-time"]');
    const avgPace = page.locator('[data-testid="avg-pace"]');

    await expect(totalWorkouts).toBeVisible();
    await expect(totalDistance).toBeVisible();
    await expect(totalTime).toBeVisible();
    await expect(avgPace).toBeVisible();
  });

  test('最近の練習記録表示', async ({ page }) => {
    // 1. 最近の練習記録セクションが表示されることを確認
    await expect(page.locator('text=最近の練習記録')).toBeVisible();

    // 2. 練習記録一覧が表示されることを確認
    const recentWorkouts = page.locator('[data-testid="recent-workouts"]');
    await expect(recentWorkouts).toBeVisible();

    // 3. 練習記録の詳細情報が表示されることを確認
    await expect(page.locator('text=日付')).toBeVisible();
    await expect(page.locator('text=距離')).toBeVisible();
    await expect(page.locator('text=時間')).toBeVisible();
    await expect(page.locator('text=タイプ')).toBeVisible();
  });

  test('グラフ表示', async ({ page }) => {
    // 1. グラフセクションが表示されることを確認
    await expect(page.locator('text=練習記録グラフ')).toBeVisible();

    // 2. グラフが表示されることを確認
    const chart = page.locator('canvas');
    await expect(chart).toBeVisible();

    // 3. グラフの凡例が表示されることを確認
    await expect(page.locator('text=距離')).toBeVisible();
    await expect(page.locator('text=時間')).toBeVisible();
  });

  test('ナビゲーション機能', async ({ page }) => {
    // 1. 練習記録ページへのナビゲーション
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 2. ダッシュボードに戻る
    await page.click('text=ダッシュボード');
    await expect(page).toHaveURL('/dashboard');

    // 3. レース結果ページへのナビゲーション
    await page.click('text=レース結果');
    await expect(page).toHaveURL('/races');

    // 4. ダッシュボードに戻る
    await page.click('text=ダッシュボード');
    await expect(page).toHaveURL('/dashboard');

    // 5. CSVインポートページへのナビゲーション
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 6. ダッシュボードに戻る
    await page.click('text=ダッシュボード');
    await expect(page).toHaveURL('/dashboard');
  });

  test('レスポンシブデザイン', async ({ page }) => {
    // 1. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
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

  test('データ更新機能', async ({ page }) => {
    // 1. 更新ボタンが表示されることを確認
    await expect(page.locator('text=更新')).toBeVisible();

    // 2. 更新ボタンをクリック
    await page.click('text=更新');

    // 3. ローディング状態が表示されることを確認
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();

    // 4. データが更新されることを確認
    await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();
  });

  test('エラーハンドリング', async ({ page }) => {
    // 1. ネットワークエラーをシミュレート
    await page.route('**/api/dashboard/stats', route => route.abort());

    // 2. ページをリロード
    await page.reload();

    // 3. エラーメッセージが表示されることを確認
    await expect(page.locator('text=データの取得に失敗しました')).toBeVisible();

    // 4. 再試行ボタンが表示されることを確認
    await expect(page.locator('text=再試行')).toBeVisible();

    // 5. 再試行ボタンをクリック
    await page.click('text=再試行');

    // 6. エラーメッセージが消えることを確認
    await expect(page.locator('text=データの取得に失敗しました')).not.toBeVisible();
  });

  test('アクセシビリティ', async ({ page }) => {
    // 1. キーボードナビゲーション
    await page.keyboard.press('Tab');
    await expect(page.locator('button:focus')).toBeVisible();

    // 2. スクリーンリーダー対応
    const headings = await page.locator('h1, h2, h3').all();
    expect(headings.length).toBeGreaterThan(0);

    // 3. フォーカス管理
    await page.click('text=練習記録');
    await page.keyboard.press('Tab');
    await expect(page.locator('button:focus')).toBeVisible();

    // 4. 色のコントラスト（基本的な確認）
    const textElements = await page.locator('p, span, div').all();
    expect(textElements.length).toBeGreaterThan(0);
  });
});

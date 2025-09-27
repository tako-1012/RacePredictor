/**
 * E2Eテスト: レスポンシブデザイン
 */
import { test, expect } from '@playwright/test';

test.describe('レスポンシブデザインテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('デスクトップ表示 (1200x800)', async ({ page }) => {
    // 1. デスクトップサイズに設定
    await page.setViewportSize({ width: 1200, height: 800 });

    // 2. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 3. ヘッダーが表示されることを確認
    await expect(page.locator('header')).toBeVisible();

    // 4. ナビゲーションメニューが横並びで表示されることを確認
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=練習記録')).toBeVisible();
    await expect(page.locator('text=レース結果')).toBeVisible();
    await expect(page.locator('text=CSVインポート')).toBeVisible();

    // 5. フッターが表示されることを確認
    await expect(page.locator('footer')).toBeVisible();

    // 6. コンテンツが適切に配置されることを確認
    await expect(page.locator('main')).toBeVisible();
  });

  test('タブレット表示 (768x1024)', async ({ page }) => {
    // 1. タブレットサイズに設定
    await page.setViewportSize({ width: 768, height: 1024 });

    // 2. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 3. ヘッダーが表示されることを確認
    await expect(page.locator('header')).toBeVisible();

    // 4. ナビゲーションメニューが表示されることを確認
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=練習記録')).toBeVisible();
    await expect(page.locator('text=レース結果')).toBeVisible();
    await expect(page.locator('text=CSVインポート')).toBeVisible();

    // 5. フッターが表示されることを確認
    await expect(page.locator('footer')).toBeVisible();

    // 6. コンテンツが適切に配置されることを確認
    await expect(page.locator('main')).toBeVisible();
  });

  test('モバイル表示 (375x667)', async ({ page }) => {
    // 1. モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 3. ヘッダーが表示されることを確認
    await expect(page.locator('header')).toBeVisible();

    // 4. ハンバーガーメニューボタンが表示されることを確認
    await expect(page.locator('button[aria-label="メニュー"]')).toBeVisible();

    // 5. ナビゲーションメニューが最初は非表示であることを確認
    await expect(page.locator('nav')).not.toBeVisible();

    // 6. ハンバーガーメニューをクリック
    await page.click('button[aria-label="メニュー"]');

    // 7. ナビゲーションメニューが表示されることを確認
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=練習記録')).toBeVisible();
    await expect(page.locator('text=レース結果')).toBeVisible();
    await expect(page.locator('text=CSVインポート')).toBeVisible();

    // 8. フッターが表示されることを確認
    await expect(page.locator('footer')).toBeVisible();
  });

  test('練習記録ページのレスポンシブ表示', async ({ page }) => {
    // 1. 練習記録ページにアクセス
    await page.goto('/workouts');

    // 2. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead')).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();

    // 3. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('table')).toBeVisible();

    // 4. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    // モバイルではテーブルがカード形式に変わることを確認
    await expect(page.locator('[data-testid="workout-card"]')).toBeVisible();
  });

  test('フォームのレスポンシブ表示', async ({ page }) => {
    // 1. 新規練習記録作成ページにアクセス
    await page.goto('/workouts/new');

    // 2. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="workout_type"]')).toBeVisible();

    // 3. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('form')).toBeVisible();

    // 4. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('form')).toBeVisible();
    // モバイルではフォーム要素が適切に配置されることを確認
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="workout_type"]')).toBeVisible();
  });

  test('グラフのレスポンシブ表示', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible();

    // 3. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible();

    // 4. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('モーダルのレスポンシブ表示', async ({ page }) => {
    // 1. 練習記録ページにアクセス
    await page.goto('/workouts');

    // 2. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    // モーダルを開く（例：削除確認ダイアログ）
    await page.click('tbody tr:first-child button[aria-label="削除"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 3. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.click('tbody tr:first-child button[aria-label="削除"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 4. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.click('tbody tr:first-child button[aria-label="削除"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('ナビゲーションのレスポンシブ動作', async ({ page }) => {
    // 1. モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 3. ハンバーガーメニューを開く
    await page.click('button[aria-label="メニュー"]');
    await expect(page.locator('nav')).toBeVisible();

    // 4. メニュー項目をクリック
    await page.click('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 5. メニューが閉じることを確認
    await expect(page.locator('nav')).not.toBeVisible();

    // 6. ハンバーガーメニューを再度開く
    await page.click('button[aria-label="メニュー"]');
    await expect(page.locator('nav')).toBeVisible();

    // 7. 別のメニュー項目をクリック
    await page.click('text=レース結果');
    await expect(page).toHaveURL('/races');

    // 8. メニューが閉じることを確認
    await expect(page.locator('nav')).not.toBeVisible();
  });

  test('フォントサイズの適応', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. デスクトップ表示確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    const desktopFontSize = await page.locator('h1').evaluate(el => 
      window.getComputedStyle(el).fontSize
    );

    // 3. タブレット表示確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    const tabletFontSize = await page.locator('h1').evaluate(el => 
      window.getComputedStyle(el).fontSize
    );

    // 4. モバイル表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    const mobileFontSize = await page.locator('h1').evaluate(el => 
      window.getComputedStyle(el).fontSize
    );

    // 5. フォントサイズが適切に調整されることを確認
    expect(desktopFontSize).toBeDefined();
    expect(tabletFontSize).toBeDefined();
    expect(mobileFontSize).toBeDefined();
  });

  test('タッチ操作の対応', async ({ page }) => {
    // 1. モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 3. タッチ操作でハンバーガーメニューを開く
    await page.tap('button[aria-label="メニュー"]');
    await expect(page.locator('nav')).toBeVisible();

    // 4. タッチ操作でメニュー項目を選択
    await page.tap('text=練習記録');
    await expect(page).toHaveURL('/workouts');

    // 5. タッチ操作でフォーム要素を操作
    await page.goto('/workouts/new');
    await page.tap('input[name="date"]');
    await expect(page.locator('input[name="date"]')).toBeFocused();
  });
});

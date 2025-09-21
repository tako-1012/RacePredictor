/**
 * Phase 3: E2Eテスト - ユーザージャーニーテスト
 * - 新規ユーザー登録→初回ログイン→ダッシュボード確認
 * - 練習記録作成→編集→詳細確認→削除
 * - レース結果登録→ベストタイム確認→記録推移確認
 * - CSVインポート→データ確認→統計更新確認
 */

import { test, expect } from '@playwright/test';

test.describe('User Journey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のベースURL
    await page.goto('http://localhost:3000');
  });

  test.describe('New User Registration Flow', () => {
    test('新規ユーザー登録→初回ログイン→ダッシュボード確認', async ({ page }) => {
      // 1. 新規ユーザー登録
      await page.click('text=アカウントをお持ちでない方は');
      await page.click('text=新規登録');
      
      await page.fill('input[name="full_name"]', 'E2Eテストユーザー');
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.fill('input[name="confirm_password"]', 'E2ETestPassword123!');
      
      await page.click('button[type="submit"]');
      
      // 登録成功の確認
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1')).toContainText('ダッシュボード');
      
      // 2. 初回ログイン後のダッシュボード確認
      await expect(page.locator('[data-testid="total-workouts"]')).toContainText('0');
      await expect(page.locator('[data-testid="total-distance"]')).toContainText('0.0 km');
      await expect(page.locator('[data-testid="total-races"]')).toContainText('0');
      
      // 3. ナビゲーションメニューの確認
      await expect(page.locator('nav')).toContainText('練習記録');
      await expect(page.locator('nav')).toContainText('レース結果');
      await expect(page.locator('nav')).toContainText('CSVインポート');
      
      // 4. ログアウト
      await page.click('text=ログアウト');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Workout Management Flow', () => {
    test('練習記録作成→編集→詳細確認→削除', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. 練習記録作成
      await page.click('text=練習記録');
      await page.click('text=新規作成');
      
      // 基本情報入力
      await page.fill('input[name="date"]', '2024-01-15');
      await page.selectOption('select[name="workout_type_id"]', '1');
      await page.fill('input[name="distance_km"]', '10');
      await page.fill('input[name="time_minutes"]', '60');
      await page.fill('input[name="intensity"]', '7');
      await page.fill('input[name="heart_rate_avg"]', '150');
      await page.fill('input[name="heart_rate_max"]', '170');
      await page.fill('textarea[name="notes"]', 'E2Eテスト練習記録');
      
      await page.click('button[type="submit"]');
      
      // 作成成功の確認
      await expect(page).toHaveURL('/workouts');
      await expect(page.locator('text=E2Eテスト練習記録')).toBeVisible();
      
      // 2. 練習記録詳細確認
      await page.click('text=詳細');
      
      await expect(page.locator('text=2024-01-15')).toBeVisible();
      await expect(page.locator('text=10.0 km')).toBeVisible();
      await expect(page.locator('text=60.0分')).toBeVisible();
      await expect(page.locator('text=強度: 7')).toBeVisible();
      await expect(page.locator('text=E2Eテスト練習記録')).toBeVisible();
      
      // 3. 練習記録編集
      await page.click('text=編集');
      
      await page.fill('input[name="distance_km"]', '15');
      await page.fill('input[name="time_minutes"]', '90');
      await page.fill('textarea[name="notes"]', '更新されたE2Eテスト練習記録');
      
      await page.click('button[type="submit"]');
      
      // 編集成功の確認
      await expect(page.locator('text=更新されたE2Eテスト練習記録')).toBeVisible();
      await expect(page.locator('text=15.0 km')).toBeVisible();
      await expect(page.locator('text=90.0分')).toBeVisible();
      
      // 4. 練習記録削除
      await page.click('text=削除');
      
      // 削除確認ダイアログ
      await expect(page.locator('text=削除しますか？')).toBeVisible();
      await page.click('text=削除');
      
      // 削除成功の確認
      await expect(page.locator('text=更新されたE2Eテスト練習記録')).not.toBeVisible();
      await expect(page.locator('text=練習記録がありません')).toBeVisible();
    });
  });

  test.describe('Race Management Flow', () => {
    test('レース結果登録→ベストタイム確認→記録推移確認', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. レース結果登録
      await page.click('text=レース結果');
      await page.click('text=新規作成');
      
      // 基本情報入力
      await page.fill('input[name="race_name"]', 'E2Eテスト大会');
      await page.fill('input[name="race_date"]', '2024-01-20');
      await page.selectOption('select[name="race_type_id"]', '1');
      await page.fill('input[name="distance_meters"]', '5000');
      await page.fill('input[name="time_seconds"]', '1800'); // 30分
      await page.fill('input[name="place"]', '5');
      await page.fill('input[name="total_participants"]', '100');
      await page.fill('textarea[name="notes"]', 'E2Eテストレース記録');
      
      await page.click('button[type="submit"]');
      
      // 作成成功の確認
      await expect(page).toHaveURL('/races');
      await expect(page.locator('text=E2Eテスト大会')).toBeVisible();
      
      // 2. ベストタイム確認
      await expect(page.locator('text=30:00')).toBeVisible(); // ベストタイム表示
      await expect(page.locator('text=6:00 /km')).toBeVisible(); // ペース表示
      
      // 3. 2つ目のレース結果登録（より良い記録）
      await page.click('text=新規作成');
      
      await page.fill('input[name="race_name"]', 'E2Eテスト大会2');
      await page.fill('input[name="race_date"]', '2024-01-25');
      await page.selectOption('select[name="race_type_id"]', '1');
      await page.fill('input[name="distance_meters"]', '5000');
      await page.fill('input[name="time_seconds"]', '1700'); // 28分20秒（より良い記録）
      await page.fill('input[name="place"]', '3');
      await page.fill('input[name="total_participants"]', '80');
      
      await page.click('button[type="submit"]');
      
      // 4. 記録推移確認
      await expect(page.locator('text=28:20')).toBeVisible(); // 新しいベストタイム
      await expect(page.locator('text=5:40 /km')).toBeVisible(); // 新しいベストペース
      
      // 5. レース結果詳細確認
      await page.click('text=詳細');
      
      await expect(page.locator('text=E2Eテスト大会2')).toBeVisible();
      await expect(page.locator('text=2024-01-25')).toBeVisible();
      await expect(page.locator('text=3位')).toBeVisible();
      await expect(page.locator('text=80人中')).toBeVisible();
    });
  });

  test.describe('CSV Import Flow', () => {
    test('CSVインポート→データ確認→統計更新確認', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. CSVインポートページへ移動
      await page.click('text=CSVインポート');
      
      // 2. CSVファイルアップロード
      const csvContent = `日付,種別,距離(km),時間(分),強度,心拍数(平均),心拍数(最大),メモ
2024-01-15,ジョギング,5.0,30,5,140,160,E2Eテスト練習1
2024-01-16,インターバル,8.0,45,8,160,180,E2Eテスト練習2
2024-01-17,ロング,15.0,90,6,150,170,E2Eテスト練習3`;
      
      // ファイルアップロード（ドラッグ&ドロップエリア）
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'e2e-test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      // アップロード完了の確認
      await expect(page.locator('text=アップロード完了')).toBeVisible();
      
      // 3. データプレビュー確認
      await expect(page.locator('text=E2Eテスト練習1')).toBeVisible();
      await expect(page.locator('text=E2Eテスト練習2')).toBeVisible();
      await expect(page.locator('text=E2Eテスト練習3')).toBeVisible();
      
      // 4. カラムマッピング設定
      await page.selectOption('select[name="date"]', '日付');
      await page.selectOption('select[name="workout_type"]', '種別');
      await page.selectOption('select[name="distance_km"]', '距離(km)');
      await page.selectOption('select[name="time_minutes"]', '時間(分)');
      await page.selectOption('select[name="intensity"]', '強度');
      await page.selectOption('select[name="heart_rate_avg"]', '心拍数(平均)');
      await page.selectOption('select[name="heart_rate_max"]', '心拍数(最大)');
      await page.selectOption('select[name="notes"]', 'メモ');
      
      // 5. インポート実行
      await page.click('text=インポート実行');
      
      // インポート完了の確認
      await expect(page.locator('text=インポート完了')).toBeVisible();
      await expect(page.locator('text=3件のデータをインポートしました')).toBeVisible();
      
      // 6. データ確認
      await page.click('text=練習記録');
      
      await expect(page.locator('text=E2Eテスト練習1')).toBeVisible();
      await expect(page.locator('text=E2Eテスト練習2')).toBeVisible();
      await expect(page.locator('text=E2Eテスト練習3')).toBeVisible();
      
      // 7. 統計更新確認
      await page.click('text=ダッシュボード');
      
      await expect(page.locator('[data-testid="total-workouts"]')).toContainText('3');
      await expect(page.locator('[data-testid="total-distance"]')).toContainText('28.0 km'); // 5.0 + 8.0 + 15.0
      await expect(page.locator('[data-testid="total-time"]')).toContainText('165.0分'); // 30 + 45 + 90
    });
  });

  test.describe('Dashboard Statistics Flow', () => {
    test('統計データ表示→チャート確認→最近の活動確認', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. 統計カード確認
      await expect(page.locator('[data-testid="total-workouts"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-distance"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-pace"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-races"]')).toBeVisible();
      
      // 2. 週間チャート確認
      await expect(page.locator('[data-testid="weekly-chart"]')).toBeVisible();
      await expect(page.locator('text=週間活動')).toBeVisible();
      
      // 3. 最近の活動確認
      await expect(page.locator('[data-testid="recent-workouts"]')).toBeVisible();
      await expect(page.locator('text=最近の練習')).toBeVisible();
      
      await expect(page.locator('[data-testid="recent-races"]')).toBeVisible();
      await expect(page.locator('text=最近のレース')).toBeVisible();
      
      // 4. チャートのインタラクション確認
      await page.hover('[data-testid="weekly-chart"]');
      // ツールチップが表示されることを確認（実装による）
      
      // 5. ナビゲーション確認
      await page.click('text=練習記録');
      await expect(page).toHaveURL('/workouts');
      
      await page.click('text=レース結果');
      await expect(page).toHaveURL('/races');
      
      await page.click('text=ダッシュボード');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Error Handling Flow', () => {
    test('エラーハンドリング→リトライ→成功確認', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. 無効なデータでの練習記録作成
      await page.click('text=練習記録');
      await page.click('text=新規作成');
      
      // 無効なデータ入力
      await page.fill('input[name="date"]', 'invalid-date');
      await page.fill('input[name="distance_km"]', '-10');
      await page.fill('input[name="time_minutes"]', '0');
      
      await page.click('button[type="submit"]');
      
      // エラーメッセージの確認
      await expect(page.locator('text=有効な日付を入力してください')).toBeVisible();
      await expect(page.locator('text=距離は0より大きい値を入力してください')).toBeVisible();
      await expect(page.locator('text=時間は0より大きい値を入力してください')).toBeVisible();
      
      // 2. 正しいデータで再入力
      await page.fill('input[name="date"]', '2024-01-15');
      await page.selectOption('select[name="workout_type_id"]', '1');
      await page.fill('input[name="distance_km"]', '10');
      await page.fill('input[name="time_minutes"]', '60');
      
      await page.click('button[type="submit"]');
      
      // 成功の確認
      await expect(page).toHaveURL('/workouts');
      await expect(page.locator('text=練習記録を作成しました')).toBeVisible();
    });
  });

  test.describe('Responsive Design Flow', () => {
    test('モバイル表示→タブレット表示→デスクトップ表示', async ({ page }) => {
      // ログイン
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="password"]', 'E2ETestPassword123!');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // 1. モバイル表示（375px）
      await page.setViewportSize({ width: 375, height: 667 });
      
      // モバイルメニューの確認
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-toggle"]');
      
      // モバイルナビゲーション確認
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      
      // 2. タブレット表示（768px）
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // タブレット表示の確認
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
      
      // 3. デスクトップ表示（1024px）
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // デスクトップ表示の確認
      await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // 4. 練習記録ページでのレスポンシブ確認
      await page.click('text=練習記録');
      
      // モバイル表示
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="mobile-workout-list"]')).toBeVisible();
      
      // デスクトップ表示
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('[data-testid="desktop-workout-table"]')).toBeVisible();
    });
  });
});

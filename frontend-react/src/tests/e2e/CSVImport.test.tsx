/**
 * E2Eテスト: CSVインポート機能
 */
import { test, expect } from '@playwright/test';

test.describe('CSVインポートテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('CSVインポートページ表示', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. ページタイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('CSVインポート');

    // 3. ファイルアップロードエリアが表示されることを確認
    await expect(page.locator('input[type="file"]')).toBeVisible();

    // 4. 説明文が表示されることを確認
    await expect(page.locator('text=CSVファイルを選択してください')).toBeVisible();
  });

  test('CSVファイルアップロード', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. CSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テストCSV1
2024-01-16,Interval,8.0,45:00,テストCSV2`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. ファイルが選択されたことを確認
    await expect(page.locator('text=test.csv')).toBeVisible();

    // 5. プレビューボタンが表示されることを確認
    await expect(page.locator('text=プレビュー')).toBeVisible();
  });

  test('CSVプレビュー機能', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. CSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テストCSV1
2024-01-16,Interval,8.0,45:00,テストCSV2`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビューボタンをクリック
    await page.click('text=プレビュー');

    // 5. プレビュー結果が表示されることを確認
    await expect(page.locator('text=プレビュー結果')).toBeVisible();
    await expect(page.locator('text=テストCSV1')).toBeVisible();
    await expect(page.locator('text=テストCSV2')).toBeVisible();

    // 6. 統計情報が表示されることを確認
    await expect(page.locator('text=総行数')).toBeVisible();
    await expect(page.locator('text=有効な行数')).toBeVisible();
    await expect(page.locator('text=検出されたエンコーディング')).toBeVisible();
  });

  test('CSVインポート実行', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. CSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テストCSV1
2024-01-16,Interval,8.0,45:00,テストCSV2`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビューを実行
    await page.click('text=プレビュー');

    // 5. インポート実行ボタンをクリック
    await page.click('text=インポート実行');

    // 6. インポート完了メッセージが表示されることを確認
    await expect(page.locator('text=インポートが完了しました')).toBeVisible();

    // 7. インポート結果が表示されることを確認
    await expect(page.locator('text=成功')).toBeVisible();
    await expect(page.locator('text=失敗')).toBeVisible();
  });

  test('CSVインポートエラーハンドリング', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. 無効なCSVファイルを作成
    const invalidCsvContent = `Invalid CSV Content
This is not a valid CSV file`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsvContent)
    });

    // 4. プレビューボタンをクリック
    await page.click('text=プレビュー');

    // 5. エラーメッセージが表示されることを確認
    await expect(page.locator('text=CSVファイルの形式が正しくありません')).toBeVisible();

    // 6. インポート実行ボタンが無効になることを確認
    await expect(page.locator('text=インポート実行')).toBeDisabled();
  });

  test('CSVインポート設定', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. CSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テストCSV1`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビューを実行
    await page.click('text=プレビュー');

    // 5. インポート設定が表示されることを確認
    await expect(page.locator('text=インポート設定')).toBeVisible();

    // 6. 日付設定
    await page.fill('input[name="workout_date"]', '2024-01-15');

    // 7. ワークアウトタイプ設定
    await page.selectOption('select[name="workout_type"]', 'easy_run');

    // 8. 強度設定
    await page.fill('input[name="intensity"]', '5');

    // 9. 設定が保存されることを確認
    await expect(page.locator('input[name="workout_date"]')).toHaveValue('2024-01-15');
    await expect(page.locator('select[name="workout_type"]')).toHaveValue('easy_run');
    await expect(page.locator('input[name="intensity"]')).toHaveValue('5');
  });

  test('CSVインポート履歴', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. インポート履歴セクションが表示されることを確認
    await expect(page.locator('text=インポート履歴')).toBeVisible();

    // 3. 履歴一覧が表示されることを確認
    await expect(page.locator('tbody tr')).toBeVisible();

    // 4. 履歴の詳細情報が表示されることを確認
    await expect(page.locator('text=ファイル名')).toBeVisible();
    await expect(page.locator('text=インポート日時')).toBeVisible();
    await expect(page.locator('text=成功数')).toBeVisible();
    await expect(page.locator('text=失敗数')).toBeVisible();
  });

  test('CSVインポートキャンセル', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. CSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テストCSV1`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビューを実行
    await page.click('text=プレビュー');

    // 5. キャンセルボタンをクリック
    await page.click('text=キャンセル');

    // 6. ファイル選択状態がリセットされることを確認
    await expect(page.locator('text=test.csv')).not.toBeVisible();
    await expect(page.locator('text=CSVファイルを選択してください')).toBeVisible();
  });

  test('CSVインポート進捗表示', async ({ page }) => {
    // 1. CSVインポートページへ
    await page.click('text=CSVインポート');
    await expect(page).toHaveURL('/import');

    // 2. 大きなCSVファイルを作成
    const csvContent = `Date,Activity Type,Distance,Time,Notes
${Array.from({ length: 100 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')},Easy Run,5.0,30:00,テストCSV${i + 1}`).join('\n')}`;

    // 3. ファイルをアップロード
    await page.setInputFiles('input[type="file"]', {
      name: 'large.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // 4. プレビューを実行
    await page.click('text=プレビュー');

    // 5. インポート実行ボタンをクリック
    await page.click('text=インポート実行');

    // 6. 進捗バーが表示されることを確認
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // 7. 進捗メッセージが表示されることを確認
    await expect(page.locator('text=インポート中')).toBeVisible();
  });
});

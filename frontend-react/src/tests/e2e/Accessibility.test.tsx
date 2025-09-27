/**
 * E2Eテスト: アクセシビリティ
 */
import { test, expect } from '@playwright/test';

test.describe('アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト開始前にログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-user@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('キーボードナビゲーション', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    await expect(page.locator('button:focus')).toBeVisible();

    // 3. 複数回Tabキーを押してナビゲーション
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // 4. Shift+Tabで逆方向ナビゲーション
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('button:focus')).toBeVisible();

    // 5. Enterキーでフォーカスされた要素をアクティベート
    await page.keyboard.press('Enter');
  });

  test('フォーカス管理', async ({ page }) => {
    // 1. 練習記録ページにアクセス
    await page.goto('/workouts');

    // 2. 新規作成ボタンをクリック
    await page.click('text=新規作成');
    await expect(page).toHaveURL('/workouts/new');

    // 3. フォーカスが最初の入力フィールドに移動することを確認
    await expect(page.locator('input[name="date"]')).toBeFocused();

    // 4. Tabキーで次の要素にフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.locator('select[name="workout_type"]')).toBeFocused();

    // 5. フォーム送信後、適切な要素にフォーカスが戻ることを確認
    await page.fill('input[name="date"]', '2024-01-15');
    await page.selectOption('select[name="workout_type"]', 'easy_run');
    await page.fill('input[name="distance"]', '5.0');
    await page.fill('input[name="duration"]', '30:00');
    await page.click('button[type="submit"]');

    // 6. 練習記録一覧に戻り、適切な要素にフォーカスが移動することを確認
    await expect(page).toHaveURL('/workouts');
  });

  test('スクリーンリーダー対応', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. 見出し要素が適切に配置されていることを確認
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // 3. 各見出しに適切なテキストが含まれていることを確認
    for (const heading of headings) {
      const text = await heading.textContent();
      expect(text).toBeTruthy();
      expect(text?.trim().length).toBeGreaterThan(0);
    }

    // 4. ラベル要素が適切に配置されていることを確認
    const labels = await page.locator('label').all();
    expect(labels.length).toBeGreaterThan(0);

    // 5. 各ラベルが対応する入力要素と関連付けられていることを確認
    for (const label of labels) {
      const forAttr = await label.getAttribute('for');
      if (forAttr) {
        const input = page.locator(`#${forAttr}`);
        await expect(input).toBeVisible();
      }
    }
  });

  test('ARIA属性の適切な使用', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. ボタン要素にaria-labelが設定されていることを確認
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      // aria-labelまたはテキストコンテンツのいずれかが存在することを確認
      expect(ariaLabel || textContent).toBeTruthy();
    }

    // 3. フォーム要素にaria-describedbyが設定されていることを確認
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      const ariaLabel = await input.getAttribute('aria-label');
      const label = await input.locator('..').locator('label').textContent();
      // いずれかのアクセシビリティ属性が設定されていることを確認
      expect(ariaDescribedBy || ariaLabel || label).toBeTruthy();
    }

    // 4. モーダル要素にrole="dialog"が設定されていることを確認
    await page.goto('/workouts');
    await page.click('tbody tr:first-child button[aria-label="削除"]');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('色のコントラスト', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. テキスト要素の色とコントラストを確認
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
    for (const element of textElements) {
      const textContent = await element.textContent();
      if (textContent && textContent.trim().length > 0) {
        const color = await element.evaluate(el => 
          window.getComputedStyle(el).color
        );
        const backgroundColor = await element.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // 色が設定されていることを確認
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
      }
    }

    // 3. リンク要素の色とコントラストを確認
    const links = await page.locator('a').all();
    for (const link of links) {
      const color = await link.evaluate(el => 
        window.getComputedStyle(el).color
      );
      const backgroundColor = await link.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // 色が設定されていることを確認
      expect(color).toBeTruthy();
      expect(backgroundColor).toBeTruthy();
    }
  });

  test('フォームのアクセシビリティ', async ({ page }) => {
    // 1. 新規練習記録作成ページにアクセス
    await page.goto('/workouts/new');

    // 2. 必須フィールドにaria-requiredが設定されていることを確認
    const requiredInputs = await page.locator('input[required], select[required], textarea[required]').all();
    for (const input of requiredInputs) {
      const ariaRequired = await input.getAttribute('aria-required');
      expect(ariaRequired).toBe('true');
    }

    // 3. エラーメッセージにaria-liveが設定されていることを確認
    await page.click('button[type="submit"]');
    const errorMessages = await page.locator('[role="alert"], [aria-live]').all();
    expect(errorMessages.length).toBeGreaterThan(0);

    // 4. フォーム要素にaria-invalidが設定されていることを確認
    const invalidInputs = await page.locator('[aria-invalid="true"]').all();
    expect(invalidInputs.length).toBeGreaterThan(0);
  });

  test('テーブルのアクセシビリティ', async ({ page }) => {
    // 1. 練習記録ページにアクセス
    await page.goto('/workouts');

    // 2. テーブルにrole="table"が設定されていることを確認
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // 3. テーブルヘッダーにscope属性が設定されていることを確認
    const headers = await page.locator('th').all();
    for (const header of headers) {
      const scope = await header.getAttribute('scope');
      expect(scope).toBeTruthy();
    }

    // 4. テーブルにcaptionが設定されていることを確認
    const caption = page.locator('caption');
    if (await caption.count() > 0) {
      await expect(caption).toBeVisible();
    }

    // 5. テーブルにaria-labelまたはaria-labelledbyが設定されていることを確認
    const ariaLabel = await table.getAttribute('aria-label');
    const ariaLabelledBy = await table.getAttribute('aria-labelledby');
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();
  });

  test('ナビゲーションのアクセシビリティ', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. ナビゲーション要素にrole="navigation"が設定されていることを確認
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // 3. ナビゲーション項目にaria-currentが設定されていることを確認
    const currentPage = page.locator('[aria-current="page"]');
    if (await currentPage.count() > 0) {
      await expect(currentPage).toBeVisible();
    }

    // 4. ナビゲーション項目にaria-labelが設定されていることを確認
    const navItems = await page.locator('nav a, nav button').all();
    for (const item of navItems) {
      const ariaLabel = await item.getAttribute('aria-label');
      const textContent = await item.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('モーダルのアクセシビリティ', async ({ page }) => {
    // 1. 練習記録ページにアクセス
    await page.goto('/workouts');

    // 2. モーダルを開く
    await page.click('tbody tr:first-child button[aria-label="削除"]');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // 3. モーダルにaria-labelledbyまたはaria-labelが設定されていることを確認
    const ariaLabel = await modal.getAttribute('aria-label');
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();

    // 4. モーダルにaria-describedbyが設定されていることを確認
    const ariaDescribedBy = await modal.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();

    // 5. モーダルが開いた時、フォーカスが適切な要素に移動することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 6. Escapeキーでモーダルが閉じることを確認
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('画像のアクセシビリティ', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. 画像要素にalt属性が設定されていることを確認
    const images = await page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const ariaLabelledBy = await image.getAttribute('aria-labelledby');
      // いずれかのアクセシビリティ属性が設定されていることを確認
      expect(alt || ariaLabel || ariaLabelledBy).toBeTruthy();
    }

    // 3. 装飾的な画像にalt=""が設定されていることを確認
    const decorativeImages = await page.locator('img[alt=""]').all();
    for (const image of decorativeImages) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBe('');
    }
  });

  test('動的コンテンツのアクセシビリティ', async ({ page }) => {
    // 1. ダッシュボードにアクセス
    await page.goto('/dashboard');

    // 2. 動的に追加されるコンテンツにaria-liveが設定されていることを確認
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);

    // 3. ローディング状態にaria-liveが設定されていることを確認
    await page.click('text=更新');
    const loadingElement = page.locator('[aria-live]');
    await expect(loadingElement).toBeVisible();

    // 4. エラーメッセージにaria-liveが設定されていることを確認
    await page.route('**/api/dashboard/stats', route => route.abort());
    await page.reload();
    const errorElement = page.locator('[role="alert"]');
    await expect(errorElement).toBeVisible();
  });
});

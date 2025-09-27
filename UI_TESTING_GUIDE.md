# UIテスト実行ガイド

## 概要
このドキュメントでは、RacePredictorアプリケーションのUIテストの実行方法について説明します。

## テスト環境のセットアップ

### 1. 自動セットアップ
```bash
cd frontend-react
./scripts/setup-test-env.sh
```

### 2. 手動セットアップ
```bash
cd frontend-react
npm ci
npx playwright install --with-deps
```

## テストの実行

### 基本的なテスト実行
```bash
# ユニットテスト
npm test

# E2Eテスト
npm run e2e

# すべてのテスト
npm run test:full
```

### 詳細なテスト実行
```bash
# テスト環境セットアップ
npm run test:setup

# ユニットテスト（カバレッジ付き）
npm run test:coverage

# E2Eテスト（UIモード）
npm run e2e:ui

# 特定のブラウザでE2Eテスト
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit

# モバイル表示でのテスト
npm run e2e:mobile

# デバッグモードでテスト
npm run test:debug
```

### カテゴリ別テスト実行
```bash
# 認証関連のテスト
npm run test:auth

# 練習記録関連のテスト
npm run test:workout

# ダッシュボード関連のテスト
npm run test:dashboard

# CSVインポート関連のテスト
npm run test:csv

# レスポンシブデザインのテスト
npm run test:responsive

# アクセシビリティのテスト
npm run test:accessibility
```

## テストスクリプトの使用

### 基本的な使用方法
```bash
# ユニットテスト
./scripts/run-tests.sh unit

# E2Eテスト
./scripts/run-tests.sh e2e

# すべてのテスト
./scripts/run-tests.sh all

# ウォッチモード
./scripts/run-tests.sh watch

# カバレッジ付きテスト
./scripts/run-tests.sh coverage
```

### オプション付きの実行
```bash
# 特定のブラウザでE2Eテスト
./scripts/run-tests.sh e2e --browser firefox

# ヘッドレスモードでE2Eテスト
./scripts/run-tests.sh e2e --headless

# UIモードでE2Eテスト
./scripts/run-tests.sh e2e --ui
```

## テストの種類

### 1. ユニットテスト
- **目的**: 個別のコンポーネントや関数の動作確認
- **実行方法**: `npm test`
- **場所**: `src/tests/`
- **フレームワーク**: Jest + Testing Library

### 2. E2Eテスト
- **目的**: ブラウザでの実際のユーザー操作のテスト
- **実行方法**: `npm run e2e`
- **場所**: `src/tests/e2e/`
- **フレームワーク**: Playwright

#### E2Eテストの種類
- **認証フロー**: ログイン・ログアウト・新規登録
- **練習記録管理**: CRUD操作・フィルター・検索
- **ダッシュボード**: 統計表示・グラフ・ナビゲーション
- **CSVインポート**: ファイルアップロード・プレビュー・インポート
- **レスポンシブデザイン**: 各デバイスサイズでの表示確認
- **アクセシビリティ**: キーボードナビゲーション・スクリーンリーダー対応

## テスト結果の確認

### 1. コンソール出力
テスト実行後、コンソールに結果が表示されます。

### 2. HTMLレポート
```bash
# Playwrightレポートを開く
npm run e2e:report

# または直接ファイルを開く
open playwright-report/index.html
```

### 3. カバレッジレポート
```bash
# カバレッジレポートを開く
open coverage/lcov-report/index.html
```

### 4. JSONレポート
- **場所**: `test-results/results.json`
- **用途**: CI/CDでの結果解析

## CI/CDでのテスト実行

### GitHub Actions
```yaml
name: UI Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run test:ci
```

### ローカルでのCIテスト
```bash
npm run test:ci
```

## トラブルシューティング

### よくある問題

#### 1. Playwrightブラウザのインストールエラー
```bash
# 解決方法
npx playwright install --with-deps
```

#### 2. テストがタイムアウトする
- テストのタイムアウト設定を確認
- アプリケーションの起動時間を確認
- ネットワーク接続を確認

#### 3. テストが失敗する
- テストログを確認
- アプリケーションが正常に起動しているか確認
- テストデータが正しく設定されているか確認

#### 4. モックが正しく動作しない
- `jest.setup.js`の設定を確認
- モックの設定を確認

### ログの確認
```bash
# テストログ
tail -f logs/test.log

# エラーログ
tail -f logs/error.log
```

### デバッグ方法

#### 1. デバッグモードでテスト実行
```bash
npm run test:debug
```

#### 2. ヘッド付きモードでテスト実行
```bash
npm run e2e:headed
```

#### 3. 特定のテストのみ実行
```bash
npx playwright test --grep="特定のテスト名"
```

## テストの追加

### 1. ユニットテストの追加
```typescript
// src/tests/components/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import NewComponent from '@/components/NewComponent';

describe('NewComponent', () => {
  test('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. E2Eテストの追加
```typescript
// src/tests/e2e/NewFeature.test.tsx
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/new-feature');
    await expect(page.locator('h1')).toContainText('New Feature');
  });
});
```

## ベストプラクティス

### 1. テストの命名
- テスト名は明確で分かりやすくする
- 日本語でテスト名を記述する場合は、適切にエスケープする

### 2. テストデータの管理
- テスト用のデータは`test-data/`ディレクトリに配置
- テスト実行前にデータをリセットする

### 3. モックの使用
- 外部APIは適切にモックする
- モックは`jest.setup.js`で設定

### 4. テストの独立性
- 各テストは独立して実行できるようにする
- テスト間でデータを共有しない

### 5. パフォーマンス
- テストの実行時間を短縮する
- 不要なテストは削除する

## 参考資料
- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)
- [Testing Library公式ドキュメント](https://testing-library.com/docs/)
- [Next.js公式ドキュメント](https://nextjs.org/docs)

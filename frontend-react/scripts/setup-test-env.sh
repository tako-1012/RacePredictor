#!/bin/bash

# テスト環境セットアップスクリプト
# 使用方法: ./scripts/setup-test-env.sh

set -e

# 色付きの出力用関数
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# ヘルプメッセージ
show_help() {
    echo "テスト環境セットアップスクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 [options]"
    echo ""
    echo "オプション:"
    echo "  --help      このヘルプを表示"
    echo "  --force     既存の設定を強制的に上書き"
    echo ""
    echo "このスクリプトは以下の作業を行います:"
    echo "  1. 必要な依存関係のインストール"
    echo "  2. Playwrightブラウザのインストール"
    echo "  3. テスト用の環境変数設定"
    echo "  4. テストデータの準備"
    echo "  5. テスト用データベースのセットアップ"
}

# デフォルト値
FORCE_OVERWRITE=""

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --force)
            FORCE_OVERWRITE="true"
            shift
            ;;
        *)
            print_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# フロントエンドディレクトリに移動
cd "$(dirname "$0")/.."

print_info "テスト環境をセットアップしています..."

# 1. 必要な依存関係の確認
print_info "必要な依存関係を確認しています..."

if ! command -v npm &> /dev/null; then
    print_error "npmがインストールされていません"
    print_info "Node.jsをインストールしてください: https://nodejs.org/"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npxがインストールされていません"
    print_info "Node.jsをインストールしてください: https://nodejs.org/"
    exit 1
fi

# Node.jsのバージョン確認
NODE_VERSION=$(node --version)
print_info "Node.jsバージョン: $NODE_VERSION"

# 2. パッケージのインストール
print_info "パッケージをインストールしています..."
npm ci

# 3. Playwrightブラウザのインストール
print_info "Playwrightブラウザをインストールしています..."
npx playwright install --with-deps

# 4. テスト用の環境変数設定
print_info "テスト用の環境変数を設定しています..."

if [[ ! -f ".env.test" || "$FORCE_OVERWRITE" == "true" ]]; then
    cat > .env.test << EOF
# テスト用環境変数
NODE_ENV=test
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=RacePredictor Test
NEXT_PUBLIC_APP_VERSION=1.0.0

# テスト用データベース設定
DATABASE_URL=sqlite:///test.db
TEST_DATABASE_URL=sqlite:///test.db

# テスト用認証設定
JWT_SECRET=test-secret-key
JWT_EXPIRE_MINUTES=60

# テスト用ログ設定
LOG_LEVEL=error
LOG_FILE=logs/test.log

# テスト用ファイルアップロード設定
UPLOAD_DIR=uploads/test
MAX_FILE_SIZE=10485760

# テスト用メール設定
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=test-password
EOF
    print_success "テスト用環境変数ファイルを作成しました: .env.test"
else
    print_warning "テスト用環境変数ファイルは既に存在します: .env.test"
fi

# 5. テスト用ディレクトリの作成
print_info "テスト用ディレクトリを作成しています..."

mkdir -p test-results
mkdir -p playwright-report
mkdir -p coverage
mkdir -p uploads/test
mkdir -p logs

print_success "テスト用ディレクトリを作成しました"

# 6. テスト用データの準備
print_info "テスト用データを準備しています..."

if [[ ! -f "test-data/sample.csv" || "$FORCE_OVERWRITE" == "true" ]]; then
    mkdir -p test-data
    cat > test-data/sample.csv << EOF
Date,Activity Type,Distance,Time,Notes
2024-01-15,Easy Run,5.0,30:00,テスト練習1
2024-01-16,Interval,8.0,45:00,テスト練習2
2024-01-17,Long Run,15.0,90:00,テスト練習3
2024-01-18,Easy Run,3.0,18:00,テスト練習4
2024-01-19,Tempo Run,10.0,60:00,テスト練習5
EOF
    print_success "テスト用CSVファイルを作成しました: test-data/sample.csv"
else
    print_warning "テスト用CSVファイルは既に存在します: test-data/sample.csv"
fi

# 7. テスト用設定ファイルの作成
print_info "テスト用設定ファイルを作成しています..."

if [[ ! -f "playwright.config.test.ts" || "$FORCE_OVERWRITE" == "true" ]]; then
    cat > playwright.config.test.ts << EOF
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});
EOF
    print_success "テスト用Playwright設定ファイルを作成しました: playwright.config.test.ts"
else
    print_warning "テスト用Playwright設定ファイルは既に存在します: playwright.config.test.ts"
fi

# 8. テスト用スクリプトの作成
print_info "テスト用スクリプトを作成しています..."

if [[ ! -f "scripts/test-ci.sh" || "$FORCE_OVERWRITE" == "true" ]]; then
    cat > scripts/test-ci.sh << 'EOF'
#!/bin/bash

# CI用テストスクリプト
set -e

echo "CI環境でのテストを実行しています..."

# 環境変数の設定
export NODE_ENV=test
export CI=true

# パッケージのインストール
npm ci

# Playwrightブラウザのインストール
npx playwright install --with-deps

# アプリケーションのビルド
npm run build

# ユニットテストの実行
echo "ユニットテストを実行中..."
npm run test:coverage

# E2Eテストの実行
echo "E2Eテストを実行中..."
npx playwright test --project=chromium

echo "CIテストが完了しました！"
EOF
    chmod +x scripts/test-ci.sh
    print_success "CI用テストスクリプトを作成しました: scripts/test-ci.sh"
else
    print_warning "CI用テストスクリプトは既に存在します: scripts/test-ci.sh"
fi

# 9. テスト用READMEの作成
print_info "テスト用READMEを作成しています..."

if [[ ! -f "TEST_README.md" || "$FORCE_OVERWRITE" == "true" ]]; then
    cat > TEST_README.md << EOF
# テスト環境セットアップガイド

## 概要
このドキュメントでは、RacePredictorアプリケーションのテスト環境のセットアップ方法について説明します。

## 前提条件
- Node.js 18.x以上
- npm 8.x以上
- Git

## セットアップ手順

### 1. テスト環境のセットアップ
\`\`\`bash
./scripts/setup-test-env.sh
\`\`\`

### 2. テストの実行
\`\`\`bash
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
\`\`\`

## テストの種類

### ユニットテスト
- コンポーネントの個別テスト
- 関数の動作確認
- モックを使用したテスト

### E2Eテスト
- ブラウザでの実際の操作テスト
- ユーザージャーニーのテスト
- レスポンシブデザインのテスト
- アクセシビリティのテスト

## テストファイルの場所
- ユニットテスト: \`src/tests/\`
- E2Eテスト: \`src/tests/e2e/\`
- テスト設定: \`jest.config.js\`, \`playwright.config.ts\`

## テスト結果の確認
- HTMLレポート: \`playwright-report/index.html\`
- カバレッジレポート: \`coverage/lcov-report/index.html\`
- JSONレポート: \`test-results/results.json\`

## トラブルシューティング

### よくある問題
1. **Playwrightブラウザのインストールエラー**
   \`\`\`bash
   npx playwright install --with-deps
   \`\`\`

2. **テストがタイムアウトする**
   - テストのタイムアウト設定を確認
   - ネットワーク接続を確認

3. **テストが失敗する**
   - テストログを確認
   - アプリケーションが正常に起動しているか確認

### ログの確認
- テストログ: \`logs/test.log\`
- エラーログ: \`logs/error.log\`

## CI/CDでのテスト実行
GitHub Actionsを使用してCI/CDパイプラインでテストを実行できます。

\`\`\`yaml
name: UI Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: ./scripts/test-ci.sh
\`\`\`

## 参考資料
- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)
- [Testing Library公式ドキュメント](https://testing-library.com/docs/)
EOF
    print_success "テスト用READMEを作成しました: TEST_README.md"
else
    print_warning "テスト用READMEは既に存在します: TEST_README.md"
fi

# 10. 最終確認
print_info "セットアップの最終確認を行っています..."

# 必要なファイルの存在確認
REQUIRED_FILES=(
    "package.json"
    "jest.config.js"
    "playwright.config.ts"
    ".env.test"
    "test-data/sample.csv"
    "scripts/run-tests.sh"
    "scripts/setup-test-env.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "✓ $file"
    else
        print_error "✗ $file が見つかりません"
    fi
done

# 必要なディレクトリの存在確認
REQUIRED_DIRS=(
    "test-results"
    "playwright-report"
    "coverage"
    "uploads/test"
    "logs"
    "test-data"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        print_success "✓ $dir"
    else
        print_error "✗ $dir が見つかりません"
    fi
done

print_success "テスト環境のセットアップが完了しました！"
print_info "次のステップ:"
print_info "  1. テストを実行: ./scripts/run-tests.sh unit"
print_info "  2. E2Eテストを実行: ./scripts/run-tests.sh e2e"
print_info "  3. すべてのテストを実行: ./scripts/run-tests.sh all"
print_info "  4. テスト結果を確認: playwright-report/index.html"

#!/bin/bash

# UIテスト実行スクリプト
# 使用方法: ./scripts/run-tests.sh [test-type] [options]

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
    echo "UIテスト実行スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 [test-type] [options]"
    echo ""
    echo "テストタイプ:"
    echo "  unit        ユニットテストを実行"
    echo "  e2e         E2Eテストを実行"
    echo "  all         すべてのテストを実行"
    echo "  watch       ウォッチモードでユニットテストを実行"
    echo "  coverage    カバレッジ付きでユニットテストを実行"
    echo ""
    echo "オプション:"
    echo "  --browser   ブラウザを指定 (chromium, firefox, webkit)"
    echo "  --headless  ヘッドレスモードで実行"
    echo "  --ui        Playwright UIモードで実行"
    echo "  --help      このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 unit"
    echo "  $0 e2e --browser chromium"
    echo "  $0 all --headless"
    echo "  $0 watch"
}

# デフォルト値
TEST_TYPE=""
BROWSER="chromium"
HEADLESS=""
UI_MODE=""
WATCH_MODE=""
COVERAGE_MODE=""

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        unit|e2e|all|watch|coverage)
            TEST_TYPE="$1"
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --headless)
            HEADLESS="--headed=false"
            shift
            ;;
        --ui)
            UI_MODE="--ui"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# テストタイプが指定されていない場合はヘルプを表示
if [[ -z "$TEST_TYPE" ]]; then
    show_help
    exit 1
fi

# フロントエンドディレクトリに移動
cd "$(dirname "$0")/.."

# 依存関係の確認
print_info "依存関係を確認しています..."

if ! command -v npm &> /dev/null; then
    print_error "npmがインストールされていません"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npxがインストールされていません"
    exit 1
fi

# パッケージのインストール
print_info "パッケージをインストールしています..."
npm ci

# Playwrightブラウザのインストール（E2Eテストの場合）
if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
    print_info "Playwrightブラウザをインストールしています..."
    npx playwright install --with-deps "$BROWSER"
fi

# テスト実行
case "$TEST_TYPE" in
    unit)
        print_info "ユニットテストを実行しています..."
        if [[ "$COVERAGE_MODE" == "coverage" ]]; then
            npm run test:coverage
        else
            npm test
        fi
        print_success "ユニットテストが完了しました"
        ;;
    e2e)
        print_info "E2Eテストを実行しています..."
        if [[ "$UI_MODE" == "--ui" ]]; then
            npx playwright test --project="$BROWSER" --ui
        else
            npx playwright test --project="$BROWSER" $HEADLESS
        fi
        print_success "E2Eテストが完了しました"
        ;;
    all)
        print_info "すべてのテストを実行しています..."
        
        # ユニットテスト
        print_info "ユニットテストを実行中..."
        npm run test:coverage
        
        # E2Eテスト
        print_info "E2Eテストを実行中..."
        npx playwright test --project="$BROWSER" $HEADLESS
        
        print_success "すべてのテストが完了しました"
        ;;
    watch)
        print_info "ウォッチモードでユニットテストを実行しています..."
        npm run test:watch
        ;;
    coverage)
        print_info "カバレッジ付きでユニットテストを実行しています..."
        npm run test:coverage
        print_success "カバレッジテストが完了しました"
        ;;
esac

# テスト結果の表示
if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
    print_info "テスト結果を確認できます:"
    print_info "  - HTMLレポート: playwright-report/index.html"
    print_info "  - JSONレポート: test-results/results.json"
    print_info "  - JUnitレポート: test-results/results.xml"
fi

if [[ "$TEST_TYPE" == "unit" || "$TEST_TYPE" == "all" || "$TEST_TYPE" == "coverage" ]]; then
    print_info "カバレッジレポートを確認できます:"
    print_info "  - HTMLレポート: coverage/lcov-report/index.html"
    print_info "  - LCOVレポート: coverage/lcov.info"
fi

print_success "テスト実行が完了しました！"

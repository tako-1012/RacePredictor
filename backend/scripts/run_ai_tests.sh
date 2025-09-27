#!/bin/bash

# AI機能テスト実行スクリプト
# RunMaster AI Features Test Runner

set -e

# 色付き出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプ表示
show_help() {
    echo "RunMaster AI Features Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help             このヘルプを表示"
    echo "  -u, --unit              単体テストのみ実行"
    echo "  -i, --integration       統合テストのみ実行"
    echo "  -p, --performance       パフォーマンステストのみ実行"
    echo "  -a, --accuracy         精度検証テストのみ実行"
    echo "  -e, --error            エラーハンドリングテストのみ実行"
    echo "  -c, --coverage         カバレッジレポート生成"
    echo "  -v, --verbose          詳細出力"
    echo "  -f, --fast             高速実行（並列実行）"
    echo "  --clean                テスト環境をクリーンアップ"
    echo "  --setup                テスト環境をセットアップ"
    echo ""
    echo "Examples:"
    echo "  $0                     全てのテストを実行"
    echo "  $0 -u                  単体テストのみ実行"
    echo "  $0 -c -v               カバレッジ付きで詳細出力"
    echo "  $0 -f                  並列実行で高速化"
}

# デフォルト設定
TEST_TYPE="all"
COVERAGE=false
VERBOSE=false
FAST=false
CLEAN=false
SETUP=false

# 引数解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--unit)
            TEST_TYPE="unit"
            shift
            ;;
        -i|--integration)
            TEST_TYPE="integration"
            shift
            ;;
        -p|--performance)
            TEST_TYPE="performance"
            shift
            ;;
        -a|--accuracy)
            TEST_TYPE="accuracy"
            shift
            ;;
        -e|--error)
            TEST_TYPE="error"
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--fast)
            FAST=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --setup)
            SETUP=true
            shift
            ;;
        *)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
    esac
done

# テスト環境のセットアップ
setup_test_environment() {
    log_info "テスト環境をセットアップ中..."
    
    # 仮想環境の確認
    if [[ -z "$VIRTUAL_ENV" ]]; then
        log_warning "仮想環境がアクティブではありません"
    fi
    
    # 必要なディレクトリを作成
    mkdir -p models
    mkdir -p logs
    mkdir -p htmlcov
    
    # テスト用データベースの準備
    log_info "テスト用データベースを準備中..."
    # ここでデータベースの初期化処理を実行
    
    # Redisの確認
    log_info "Redis接続を確認中..."
    if ! redis-cli ping > /dev/null 2>&1; then
        log_warning "Redisが起動していません。テスト用Redisを起動してください"
    fi
    
    log_success "テスト環境のセットアップが完了しました"
}

# テスト環境のクリーンアップ
clean_test_environment() {
    log_info "テスト環境をクリーンアップ中..."
    
    # テスト用ファイルを削除
    rm -rf htmlcov/
    rm -rf .coverage
    rm -rf coverage.xml
    rm -rf .pytest_cache/
    rm -rf models/test_*
    
    # ログファイルをクリア
    find logs/ -name "*.log" -delete 2>/dev/null || true
    
    log_success "テスト環境のクリーンアップが完了しました"
}

# テスト実行
run_tests() {
    local test_args=""
    
    # テストタイプに応じて引数を設定
    case $TEST_TYPE in
        "unit")
            test_args="-m unit"
            ;;
        "integration")
            test_args="-m integration"
            ;;
        "performance")
            test_args="-m performance"
            ;;
        "accuracy")
            test_args="-m accuracy"
            ;;
        "error")
            test_args="-m error_handling"
            ;;
        "all")
            test_args="-m ai"
            ;;
    esac
    
    # カバレッジ設定
    if [[ "$COVERAGE" == true ]]; then
        test_args="$test_args --cov=app --cov-report=html --cov-report=term-missing"
    fi
    
    # 詳細出力設定
    if [[ "$VERBOSE" == true ]]; then
        test_args="$test_args -v -s"
    fi
    
    # 高速実行設定
    if [[ "$FAST" == true ]]; then
        test_args="$test_args -n auto"
    fi
    
    # テスト実行
    log_info "テストを実行中: pytest $test_args"
    
    if pytest $test_args; then
        log_success "テストが正常に完了しました"
        return 0
    else
        log_error "テストが失敗しました"
        return 1
    fi
}

# テスト結果のサマリー
show_test_summary() {
    log_info "テスト結果サマリー:"
    
    # カバレッジレポートの表示
    if [[ "$COVERAGE" == true ]]; then
        log_info "カバレッジレポート: htmlcov/index.html"
    fi
    
    # テスト結果ファイルの確認
    if [[ -f "coverage.xml" ]]; then
        log_info "カバレッジXML: coverage.xml"
    fi
    
    # ログファイルの確認
    if [[ -d "logs" ]]; then
        log_info "ログファイル: logs/"
    fi
}

# メイン実行
main() {
    log_info "RunMaster AI Features Test Runner を開始します"
    
    # セットアップ
    if [[ "$SETUP" == true ]]; then
        setup_test_environment
    fi
    
    # クリーンアップ
    if [[ "$CLEAN" == true ]]; then
        clean_test_environment
    fi
    
    # テスト実行
    if run_tests; then
        show_test_summary
        log_success "全てのテストが正常に完了しました"
        exit 0
    else
        log_error "テストが失敗しました"
        exit 1
    fi
}

# スクリプト実行
main "$@"

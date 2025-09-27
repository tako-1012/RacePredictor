#!/bin/bash

# RacePredictor 包括テスト実行スクリプト

set -e

echo "🚀 RacePredictor 包括テスト開始"
echo "=================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# テスト結果の記録
TEST_RESULTS="test_results_$(date +%Y%m%d_%H%M%S).txt"

echo "📝 テスト結果を記録: $TEST_RESULTS"
echo "テスト実行開始: $(date)" > "$TEST_RESULTS"

# フロントエンドディレクトリに移動
cd frontend-react

echo -e "\n${BLUE}📦 依存関係のインストール${NC}"
if ! npm install; then
    echo -e "${RED}❌ 依存関係のインストールに失敗しました${NC}"
    exit 1
fi

echo -e "\n${BLUE}🔍 TypeScript型チェック${NC}"
if npm run type-check; then
    echo -e "${GREEN}✅ TypeScript型チェック完了${NC}"
    echo "TypeScript型チェック: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ TypeScript型チェックに失敗しました${NC}"
    echo "TypeScript型チェック: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}🧪 包括テスト実行${NC}"
if npm run test:comprehensive; then
    echo -e "${GREEN}✅ 包括テスト完了${NC}"
    echo "包括テスト: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ 包括テストに失敗しました${NC}"
    echo "包括テスト: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}📱 レスポンシブテスト実行${NC}"
if npm run test:responsive; then
    echo -e "${GREEN}✅ レスポンシブテスト完了${NC}"
    echo "レスポンシブテスト: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ レスポンシブテストに失敗しました${NC}"
    echo "レスポンシブテスト: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}🔗 統合テスト実行${NC}"
if npm run test:integration; then
    echo -e "${GREEN}✅ 統合テスト完了${NC}"
    echo "統合テスト: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ 統合テストに失敗しました${NC}"
    echo "統合テスト: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}📊 カバレッジテスト実行${NC}"
if npm run test:coverage; then
    echo -e "${GREEN}✅ カバレッジテスト完了${NC}"
    echo "カバレッジテスト: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ カバレッジテストに失敗しました${NC}"
    echo "カバレッジテスト: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}🔍 ESLint実行${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ ESLint完了${NC}"
    echo "ESLint: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ ESLintに失敗しました${NC}"
    echo "ESLint: 失敗" >> "../$TEST_RESULTS"
fi

# バックエンドディレクトリに移動
cd ../backend

echo -e "\n${BLUE}🐍 Python環境の確認${NC}"
if source venv/bin/activate && python --version; then
    echo -e "${GREEN}✅ Python環境確認完了${NC}"
    echo "Python環境: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ Python環境の確認に失敗しました${NC}"
    echo "Python環境: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}🧪 バックエンドテスト実行${NC}"
if source venv/bin/activate && python -m pytest tests/ -v; then
    echo -e "${GREEN}✅ バックエンドテスト完了${NC}"
    echo "バックエンドテスト: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${RED}❌ バックエンドテストに失敗しました${NC}"
    echo "バックエンドテスト: 失敗" >> "../$TEST_RESULTS"
fi

echo -e "\n${BLUE}🔍 バックエンド型チェック${NC}"
if source venv/bin/activate && python -m mypy app/ --ignore-missing-imports; then
    echo -e "${GREEN}✅ バックエンド型チェック完了${NC}"
    echo "バックエンド型チェック: 成功" >> "../$TEST_RESULTS"
else
    echo -e "${YELLOW}⚠️ バックエンド型チェックに警告があります${NC}"
    echo "バックエンド型チェック: 警告あり" >> "../$TEST_RESULTS"
fi

# ルートディレクトリに戻る
cd ..

echo -e "\n${BLUE}📋 テスト結果サマリー${NC}"
echo "=================================="
cat "$TEST_RESULTS"

echo -e "\n${GREEN}🎉 包括テスト完了${NC}"
echo "テスト実行終了: $(date)" >> "$TEST_RESULTS"

# 成功/失敗のカウント
SUCCESS_COUNT=$(grep -c "成功" "$TEST_RESULTS" || echo "0")
FAILURE_COUNT=$(grep -c "失敗" "$TEST_RESULTS" || echo "0")

echo -e "\n${BLUE}📊 テスト結果統計${NC}"
echo "成功: $SUCCESS_COUNT"
echo "失敗: $FAILURE_COUNT"

if [ "$FAILURE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 すべてのテストが成功しました！${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURE_COUNT 個のテストが失敗しました${NC}"
    exit 1
fi

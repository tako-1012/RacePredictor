#!/bin/bash

# テスト環境セットアップスクリプト

echo "🧪 RacePredictor テスト環境セットアップ開始"

# バックエンドテスト環境セットアップ
echo "📦 バックエンドテスト環境セットアップ"
cd backend

# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate

# テスト用依存関係インストール
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio

# テスト用環境変数設定
cp ../test.env .env

# テストデータベース初期化
python -m alembic upgrade head
python create_default_race_types.py

echo "✅ バックエンドテスト環境セットアップ完了"

# フロントエンドテスト環境セットアップ
echo "🎨 フロントエンドテスト環境セットアップ"
cd ../frontend-react

# テスト用依存関係インストール
npm install
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @playwright/test

echo "✅ フロントエンドテスト環境セットアップ完了"

# テスト実行
echo "🚀 テスト実行開始"

# バックエンドテスト実行
echo "🔧 バックエンドテスト実行"
cd ../backend
source venv/bin/activate
python run_tests.py

# フロントエンドテスト実行
echo "🎨 フロントエンドテスト実行"
cd ../frontend-react
npm test

echo "🎉 テスト環境セットアップとテスト実行完了！"

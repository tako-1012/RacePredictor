#!/bin/bash

# 手動テスト環境セットアップスクリプト

echo "🔧 RacePredictor 手動テスト環境セットアップ開始"

# バックエンド環境セットアップ
echo "📦 バックエンド環境セットアップ"
cd backend

# 仮想環境作成・有効化
python -m venv venv
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp ../test.env .env

# データベース初期化
python -m alembic upgrade head
python create_default_race_types.py
python create_test_user.py

echo "✅ バックエンド環境セットアップ完了"

# フロントエンド環境セットアップ
echo "🎨 フロントエンド環境セットアップ"
cd ../frontend-react

# 依存関係インストール
npm install

# 環境変数設定
cp env.example .env.local

echo "✅ フロントエンド環境セットアップ完了"

# テストデータ準備
echo "📊 テストデータ準備"
cd ../test_data
echo "テストデータファイルが準備されています:"
ls -la

echo "🎉 手動テスト環境セットアップ完了！"
echo ""
echo "次の手順でアプリケーションを起動してください:"
echo "1. バックエンド起動: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "2. フロントエンド起動: cd frontend-react && npm run dev"
echo "3. ブラウザで http://localhost:3000 にアクセス"

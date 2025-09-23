#!/bin/bash

echo "🚀 RacePredictor Backend Server Starting..."

# 既存プロセスを終了
echo "📋 Stopping existing processes..."
pkill -f uvicorn 2>/dev/null || true

# バックエンドディレクトリに移動
cd backend

# 仮想環境をアクティベート
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# 環境変数を設定
export DATABASE_URL="sqlite:///./test.db"
export SECRET_KEY="test-secret-key"
export DEBUG="true"
export ENVIRONMENT="development"

# サーバーを起動
echo "🌟 Starting FastAPI server..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug

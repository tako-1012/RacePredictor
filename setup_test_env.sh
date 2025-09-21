#!/bin/bash
echo "🚀 RacePredictor テスト環境セットアップ開始"

# バックエンドセットアップ
echo "📦 バックエンドセットアップ中..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# フロントエンドセットアップ
echo "📦 フロントエンドセットアップ中..."
cd ../frontend-react
npm install

echo "✅ セットアップ完了！"
echo "📝 次の手順:"
echo "1. ターミナル1: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "2. ターミナル2: cd frontend-react && npm run dev"
echo "3. ブラウザで http://localhost:3000 にアクセス"
echo ""
echo "🔧 テスト用ユーザー作成:"
echo "curl -X POST http://localhost:8000/api/auth/register \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"testpassword123\",\"confirm_password\":\"testpassword123\"}'"

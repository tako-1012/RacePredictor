#!/bin/bash

echo "🧪 RacePredictor 手動テスト環境セットアップ開始"

# テスト用Docker Composeでサービスを起動
echo "🐳 テスト環境のDockerコンテナを起動中..."
docker-compose -f docker-compose.test.yml up --build -d

# データベースの起動待ち
echo "⏳ データベースの起動を待機中..."
sleep 15

# データベースマイグレーション
echo "🗄 テストデータベースのマイグレーションを実行中..."
docker-compose -f docker-compose.test.yml exec -T backend-test alembic upgrade head

# テスト用データの作成
echo "📝 テスト用データを作成中..."
docker-compose -f docker-compose.test.yml exec -T backend-test python -c "
from app.database.init_db import init_db
init_db()
"

echo "🎉 手動テスト環境のセットアップが完了しました！"
echo ""
echo "📱 テスト環境アクセス情報:"
echo "   フロントエンド: http://localhost:3001"
echo "   バックエンドAPI: http://localhost:8001"
echo "   API ドキュメント: http://localhost:8001/docs"
echo "   データベース: localhost:5433"
echo ""
echo "🔧 テスト用コマンド:"
echo "   停止: docker-compose -f docker-compose.test.yml down"
echo "   再起動: docker-compose -f docker-compose.test.yml restart"
echo "   ログ確認: docker-compose -f docker-compose.test.yml logs -f"
echo ""
echo "🧪 手動テストを開始できます！"

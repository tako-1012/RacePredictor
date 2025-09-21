#!/bin/bash

# RacePredictor セットアップスクリプト

echo "🏃 RacePredictor セットアップを開始します..."

# 環境変数ファイルのコピー
if [ ! -f .env ]; then
    echo "📋 環境変数ファイルを作成中..."
    cp .env.example .env
    echo "✅ .envファイルが作成されました"
else
    echo "✅ .envファイルが既に存在します"
fi

# Dockerコンテナの起動
echo "🐳 Dockerコンテナを起動中..."
docker compose up --build -d

# データベースの準備待ち
echo "⏳ データベースの起動を待機中..."
sleep 10

# データベースマイグレーション
echo "🗄 データベースマイグレーションを実行中..."
docker compose exec -T backend alembic upgrade head

# デフォルト練習種別の作成
echo "📝 デフォルト練習種別を作成中..."
docker compose exec -T backend python -c "from app.core.init_data import create_default_workout_types; create_default_workout_types()"

echo "🎉 セットアップが完了しました！"
echo ""
echo "📱 アプリケーションにアクセス:"
echo "   フロントエンド: http://localhost:8502"
echo "   API ドキュメント: http://localhost:8001/docs"
echo ""
echo "🔧 管理コマンド:"
echo "   停止: docker-compose down"
echo "   再起動: docker-compose restart"
echo "   ログ確認: docker-compose logs -f"
echo ""
echo "🏃 ランニングタイム予測を始めましょう！"
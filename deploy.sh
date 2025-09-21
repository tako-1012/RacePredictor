#!/bin/bash

# RacePredictor 本番デプロイスクリプト
# 使用方法: ./deploy.sh [環境名]

set -e  # エラー時に停止

# 色付き出力用の関数
print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

# 環境設定
ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

print_info "🚀 RacePredictor デプロイ開始 (環境: ${ENVIRONMENT})"

# 環境変数ファイルの存在確認
if [ ! -f "$ENV_FILE" ]; then
    print_error "環境変数ファイルが見つかりません: $ENV_FILE"
    print_info "production.env.template をコピーして設定してください:"
    print_info "cp production.env.template $ENV_FILE"
    print_info "その後、必要に応じて設定を変更してください"
    exit 1
fi

print_success "環境変数ファイルを確認: $ENV_FILE"

# 環境変数読み込み
print_info "環境変数を読み込み中..."
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Dockerの確認
if ! command -v docker &> /dev/null; then
    print_error "Dockerがインストールされていません"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Composeがインストールされていません"
    exit 1
fi

print_success "Docker環境を確認"

# 必要なディレクトリの作成
print_info "必要なディレクトリを作成中..."
mkdir -p data backups logs
print_success "ディレクトリ作成完了"

# 既存のコンテナを停止
print_info "既存のコンテナを停止中..."
docker-compose down --remove-orphans || true
print_success "既存のコンテナ停止完了"

# Dockerイメージのビルド
print_info "Dockerイメージをビルド中..."
docker-compose build --no-cache
print_success "Dockerイメージビルド完了"

# データベースの初期化
print_info "データベースを初期化中..."
docker-compose run --rm backend python -c "
from app.core.database import engine
from app.models import *
from sqlalchemy import text

# テーブル作成
Base.metadata.create_all(bind=engine)
print('データベーステーブル作成完了')
"

# 初期データの投入
print_info "初期データを投入中..."
docker-compose run --rm backend python -c "
from app.core.init_data import create_default_workout_types
from app.core.database import get_db

db = next(get_db())
create_default_workout_types(db)
print('初期データ投入完了')
"

print_success "データベース初期化完了"

# サービス起動
print_info "サービスを起動中..."
docker-compose up -d

# ヘルスチェック
print_info "ヘルスチェックを実行中..."
sleep 10

# バックエンドのヘルスチェック
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_success "バックエンドサービス正常"
else
    print_warning "バックエンドサービスのヘルスチェックに失敗"
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost:8501/_stcore/health > /dev/null 2>&1; then
    print_success "フロントエンドサービス正常"
else
    print_warning "フロントエンドサービスのヘルスチェックに失敗"
fi

# データベースのヘルスチェック
if docker-compose exec db pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-racepredictor} > /dev/null 2>&1; then
    print_success "データベースサービス正常"
else
    print_warning "データベースサービスのヘルスチェックに失敗"
fi

# デプロイ完了
print_success "🎉 デプロイ完了！"
echo ""
print_info "アクセス情報:"
print_info "  Backend API: http://localhost:8000"
print_info "  Frontend UI: http://localhost:8501"
print_info "  API Docs: http://localhost:8000/docs"
print_info "  Database: localhost:5432"
echo ""
print_info "ログ確認:"
print_info "  docker-compose logs -f backend"
print_info "  docker-compose logs -f frontend"
print_info "  docker-compose logs -f db"
echo ""
print_info "サービス停止:"
print_info "  docker-compose down"
echo ""
print_info "サービス再起動:"
print_info "  docker-compose restart"

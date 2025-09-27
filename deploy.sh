#!/bin/bash

# RacePredictor Deployment Script
# 本番環境へのデプロイメントスクリプト

set -e  # エラー時に停止

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 設定
PROJECT_NAME="RacePredictor"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/backups"
LOG_DIR="/var/log/racepredictor"

# ヘルプ表示
show_help() {
    echo "RacePredictor Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      - 本番環境にデプロイ"
    echo "  backup      - データベースバックアップ"
    echo "  restore     - データベース復元"
    echo "  logs        - ログ表示"
    echo "  status      - サービス状態確認"
    echo "  restart     - サービス再起動"
    echo "  stop        - サービス停止"
    echo "  update      - アプリケーション更新"
    echo "  health      - ヘルスチェック"
    echo "  setup       - 初期セットアップ"
    echo "  help        - このヘルプを表示"
}

# 初期セットアップ
setup() {
    log_info "初期セットアップを開始します..."
    
    # 必要なディレクトリ作成
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p ssl
    mkdir -p logs/nginx
    
    # 環境変数ファイル確認
    if [ ! -f $ENV_FILE ]; then
        log_warn "環境変数ファイルが見つかりません: $ENV_FILE"
        log_info "production.env.templateをコピーして設定してください"
        cp production.env.template $ENV_FILE
        log_warn "環境変数を編集してから再実行してください"
        exit 1
    fi
    
    # Docker Compose確認
    if [ ! -f $DOCKER_COMPOSE_FILE ]; then
        log_error "Docker Composeファイルが見つかりません: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    # SSL証明書確認
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        log_warn "SSL証明書が見つかりません"
        log_info "Let's Encryptで証明書を取得してください:"
        log_info "certbot certonly --standalone -d yourdomain.com"
        log_info "証明書をssl/ディレクトリにコピーしてください"
    fi
    
    log_info "初期セットアップが完了しました"
}

# デプロイ実行
deploy() {
    log_info "デプロイを開始します..."
    
    # 環境変数ファイル確認
    if [ ! -f $ENV_FILE ]; then
        log_error "環境変数ファイルが見つかりません: $ENV_FILE"
        exit 1
    fi
    
    # 既存のサービス停止
    log_info "既存のサービスを停止します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE down || true
    
    # イメージビルド
    log_info "Dockerイメージをビルドします..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE build --no-cache
    
    # サービス起動
    log_info "サービスを起動します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE up -d
    
    # データベースマイグレーション
    log_info "データベースマイグレーションを実行します..."
    sleep 10  # データベース起動待機
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec backend alembic upgrade head
    
    # 初期データ投入
    log_info "初期データを投入します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec backend python create_default_race_types.py || true
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec backend python create_default_workout_types.py || true
    
    # ヘルスチェック
    log_info "ヘルスチェックを実行します..."
    sleep 5
    health_check
    
    log_info "デプロイが完了しました！"
}

# バックアップ実行
backup() {
    log_info "データベースバックアップを開始します..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    # データベースバックアップ
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec -T db pg_dump -U racepredictor_user racepredictor > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log_info "バックアップが完了しました: $BACKUP_FILE"
        
        # 古いバックアップ削除（30日以上）
        find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
        log_info "古いバックアップを削除しました"
    else
        log_error "バックアップに失敗しました"
        exit 1
    fi
}

# 復元実行
restore() {
    if [ -z "$1" ]; then
        log_error "復元するバックアップファイルを指定してください"
        log_info "使用例: $0 restore backup_20240115_030000.sql"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "バックアップファイルが見つかりません: $BACKUP_FILE"
        exit 1
    fi
    
    log_warn "データベースを復元します: $BACKUP_FILE"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "データベースを復元します..."
        docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec -T db psql -U racepredictor_user -d racepredictor < $BACKUP_FILE
        
        if [ $? -eq 0 ]; then
            log_info "復元が完了しました"
        else
            log_error "復元に失敗しました"
            exit 1
        fi
    else
        log_info "復元をキャンセルしました"
    fi
}

# ログ表示
show_logs() {
    log_info "ログを表示します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE logs -f --tail=100
}

# サービス状態確認
show_status() {
    log_info "サービス状態を確認します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE ps
}

# サービス再起動
restart() {
    log_info "サービスを再起動します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE restart
    log_info "再起動が完了しました"
}

# サービス停止
stop() {
    log_info "サービスを停止します..."
    docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE down
    log_info "停止が完了しました"
}

# アプリケーション更新
update() {
    log_info "アプリケーションを更新します..."
    
    # 最新コード取得
    git pull origin main
    
    # 再デプロイ
    deploy
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェックを実行します..."
    
    # バックエンドヘルスチェック
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_info "✓ バックエンド: 正常"
    else
        log_error "✗ バックエンド: 異常"
    fi
    
    # フロントエンドヘルスチェック
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "✓ フロントエンド: 正常"
    else
        log_error "✗ フロントエンド: 異常"
    fi
    
    # データベースヘルスチェック
    if docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec -T db pg_isready -U racepredictor_user -d racepredictor > /dev/null 2>&1; then
        log_info "✓ データベース: 正常"
    else
        log_error "✗ データベース: 異常"
    fi
    
    # Redisヘルスチェック
    if docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_info "✓ Redis: 正常"
    else
        log_error "✗ Redis: 異常"
    fi
}

# メイン処理
case "${1:-help}" in
    deploy)
        deploy
        ;;
    backup)
        backup
        ;;
    restore)
        restore $2
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    update)
        update
        ;;
    health)
        health_check
        ;;
    setup)
        setup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "不明なコマンド: $1"
        show_help
        exit 1
        ;;
esac
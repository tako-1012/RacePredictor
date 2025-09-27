# RunMaster AI機能 デプロイメントガイド

## 概要

このガイドでは、RunMaster AI機能を本番環境にデプロイするための詳細な手順を説明します。AI機能は環境変数で制御可能で、段階的なデプロイメントが可能です。

## 前提条件

### システム要件

- **OS**: Linux (Ubuntu 20.04+ 推奨)
- **Python**: 3.11+
- **メモリ**: 最低4GB、推奨8GB+
- **ストレージ**: 最低20GB、推奨50GB+
- **CPU**: 最低2コア、推奨4コア+

### 必要なサービス

- **PostgreSQL**: 12+
- **Redis**: 6+
- **Nginx**: 1.18+ (リバースプロキシ用)

## デプロイメント手順

### 1. 環境準備

#### 1.1 システムパッケージのインストール

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo apt install -y postgresql postgresql-contrib redis-server
sudo apt install -y nginx supervisor
sudo apt install -y build-essential libpq-dev

# CentOS/RHEL
sudo yum update
sudo yum install -y python311 python311-devel postgresql-server redis
sudo yum install -y nginx supervisor gcc postgresql-devel
```

#### 1.2 プロジェクトディレクトリの作成

```bash
sudo mkdir -p /opt/runmaster
sudo chown $USER:$USER /opt/runmaster
cd /opt/runmaster
```

### 2. アプリケーションのデプロイ

#### 2.1 ソースコードの配置

```bash
# Gitリポジトリからクローン
git clone <repository-url> .
cd backend

# 仮想環境の作成
python3.11 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.2 環境変数の設定

```bash
# 本番環境用の環境変数ファイルを作成
cp .env.example .env.production

# 環境変数を編集
nano .env.production
```

**本番環境用環境変数例**:
```bash
# 基本設定
APP_NAME=RunMaster
APP_VERSION=1.0.0
DEBUG=false
ENVIRONMENT=production

# データベース設定
DATABASE_URL=postgresql://runmaster:password@localhost:5432/runmaster_prod

# AI機能設定
AI_FEATURES_ENABLED=true
REDIS_URL=redis://localhost:6379/0
ML_MODELS_PATH=/opt/runmaster/models
FEATURE_STORE_RETENTION_DAYS=30
PREDICTION_CACHE_TTL=3600
RATE_LIMIT_WINDOW=60

# セキュリティ設定
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ログ設定
LOG_LEVEL=INFO
LOG_FILE_PATH=/opt/runmaster/logs/app.log
```

#### 2.3 データベースの設定

```bash
# PostgreSQLユーザーとデータベースの作成
sudo -u postgres psql
```

```sql
CREATE USER runmaster WITH PASSWORD 'your-password';
CREATE DATABASE runmaster_prod OWNER runmaster;
GRANT ALL PRIVILEGES ON DATABASE runmaster_prod TO runmaster;
\q
```

```bash
# データベースマイグレーションの実行
export DATABASE_URL=postgresql://runmaster:password@localhost:5432/runmaster_prod
alembic upgrade head
```

#### 2.4 モデルディレクトリの作成

```bash
sudo mkdir -p /opt/runmaster/models
sudo chown $USER:$USER /opt/runmaster/models
sudo mkdir -p /opt/runmaster/logs
sudo chown $USER:$USER /opt/runmaster/logs
```

### 3. Redisの設定

#### 3.1 Redis設定ファイルの編集

```bash
sudo nano /etc/redis/redis.conf
```

**重要な設定**:
```conf
# メモリ設定
maxmemory 1gb
maxmemory-policy allkeys-lru

# 永続化設定
save 900 1
save 300 10
save 60 10000

# セキュリティ設定
requirepass your-redis-password
bind 127.0.0.1

# ログ設定
loglevel notice
logfile /var/log/redis/redis-server.log
```

#### 3.2 Redisサービスの再起動

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Celeryの設定

#### 4.1 Celeryワーカーの設定ファイル作成

```bash
sudo nano /etc/supervisor/conf.d/celery-worker.conf
```

```conf
[program:celery-worker]
command=/opt/runmaster/backend/venv/bin/celery -A app.core.celery_app worker --loglevel=info
directory=/opt/runmaster/backend
user=runmaster
numprocs=2
stdout_logfile=/opt/runmaster/logs/celery-worker.log
stderr_logfile=/opt/runmaster/logs/celery-worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
killasgroup=true
priority=998
```

#### 4.2 Celery Beatの設定ファイル作成

```bash
sudo nano /etc/supervisor/conf.d/celery-beat.conf
```

```conf
[program:celery-beat]
command=/opt/runmaster/backend/venv/bin/celery -A app.core.celery_app beat --loglevel=info
directory=/opt/runmaster/backend
user=runmaster
numprocs=1
stdout_logfile=/opt/runmaster/logs/celery-beat.log
stderr_logfile=/opt/runmaster/logs/celery-beat.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
killasgroup=true
priority=999
```

#### 4.3 Supervisorの再読み込み

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker
sudo supervisorctl start celery-beat
```

### 5. FastAPIアプリケーションの設定

#### 5.1 Gunicorn設定ファイルの作成

```bash
nano /opt/runmaster/backend/gunicorn.conf.py
```

```python
import multiprocessing

# サーバー設定
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# タイムアウト設定
timeout = 30
keepalive = 2
graceful_timeout = 30

# ログ設定
accesslog = "/opt/runmaster/logs/gunicorn-access.log"
errorlog = "/opt/runmaster/logs/gunicorn-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# プロセス設定
preload_app = True
daemon = False
pidfile = "/opt/runmaster/logs/gunicorn.pid"
user = "runmaster"
group = "runmaster"

# セキュリティ設定
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
```

#### 5.2 Supervisor設定ファイルの作成

```bash
sudo nano /etc/supervisor/conf.d/runmaster-api.conf
```

```conf
[program:runmaster-api]
command=/opt/runmaster/backend/venv/bin/gunicorn -c gunicorn.conf.py app.main:app
directory=/opt/runmaster/backend
user=runmaster
numprocs=1
stdout_logfile=/opt/runmaster/logs/api.log
stderr_logfile=/opt/runmaster/logs/api.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
killasgroup=true
priority=1000
environment=DATABASE_URL="postgresql://runmaster:password@localhost:5432/runmaster_prod",AI_FEATURES_ENABLED="true",REDIS_URL="redis://localhost:6379/0"
```

### 6. Nginxの設定

#### 6.1 Nginx設定ファイルの作成

```bash
sudo nano /etc/nginx/sites-available/runmaster
```

```nginx
upstream runmaster_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # ログ設定
    access_log /var/log/nginx/runmaster_access.log;
    error_log /var/log/nginx/runmaster_error.log;

    # クライアント設定
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # プロキシ設定
    location / {
        proxy_pass http://runmaster_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # バッファ設定
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # AI機能専用の設定
    location /api/ai/ {
        proxy_pass http://runmaster_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # AI機能用のタイムアウト設定（長めに設定）
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # 静的ファイルの配信
    location /static/ {
        alias /opt/runmaster/frontend-react/out/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ヘルスチェック
    location /health {
        proxy_pass http://runmaster_backend;
        access_log off;
    }
}
```

#### 6.2 サイトの有効化

```bash
sudo ln -s /etc/nginx/sites-available/runmaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL証明書の設定（Let's Encrypt）

#### 7.1 Certbotのインストール

```bash
sudo apt install certbot python3-certbot-nginx
```

#### 7.2 SSL証明書の取得

```bash
sudo certbot --nginx -d your-domain.com
```

### 8. サービスの起動と確認

#### 8.1 全サービスの起動

```bash
# Supervisorサービスの起動
sudo supervisorctl start all

# サービスの状態確認
sudo supervisorctl status
```

#### 8.2 ヘルスチェック

```bash
# APIのヘルスチェック
curl http://localhost:8000/health

# AI機能のステータス確認
curl http://localhost:8000/api/admin/ai/system-stats
```

### 9. モニタリングとログ

#### 9.1 ログファイルの確認

```bash
# アプリケーションログ
tail -f /opt/runmaster/logs/app.log

# Celeryワーカーログ
tail -f /opt/runmaster/logs/celery-worker.log

# Nginxログ
tail -f /var/log/nginx/runmaster_access.log
```

#### 9.2 システム監視

```bash
# プロセス監視
ps aux | grep -E "(gunicorn|celery|redis|postgres)"

# メモリ使用量
free -h

# ディスク使用量
df -h
```

## AI機能の無効化

### 本番環境でAI機能を無効にする場合

```bash
# 環境変数の変更
export AI_FEATURES_ENABLED=false

# アプリケーションの再起動
sudo supervisorctl restart runmaster-api
```

### AI機能のみを無効にする場合

```bash
# Celeryワーカーの停止
sudo supervisorctl stop celery-worker
sudo supervisorctl stop celery-beat

# Redisの停止（必要に応じて）
sudo systemctl stop redis-server
```

## バックアップとリストア

### データベースのバックアップ

```bash
# バックアップの作成
pg_dump -h localhost -U runmaster runmaster_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップからのリストア
psql -h localhost -U runmaster runmaster_prod < backup_20240101_120000.sql
```

### モデルファイルのバックアップ

```bash
# モデルファイルのバックアップ
tar -czf models_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/runmaster/models/

# バックアップからのリストア
tar -xzf models_backup_20240101_120000.tar.gz -C /
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. AI機能が動作しない

**症状**: AI APIが404エラーを返す

**確認事項**:
```bash
# 環境変数の確認
echo $AI_FEATURES_ENABLED

# ログの確認
tail -f /opt/runmaster/logs/app.log | grep -i "ai"
```

**解決方法**:
```bash
# 環境変数の設定
export AI_FEATURES_ENABLED=true

# アプリケーションの再起動
sudo supervisorctl restart runmaster-api
```

#### 2. Celeryタスクが実行されない

**症状**: バックグラウンドタスクが処理されない

**確認事項**:
```bash
# Celeryワーカーの状態確認
sudo supervisorctl status celery-worker

# Redis接続の確認
redis-cli ping
```

**解決方法**:
```bash
# Redisサービスの再起動
sudo systemctl restart redis-server

# Celeryワーカーの再起動
sudo supervisorctl restart celery-worker
```

#### 3. データベース接続エラー

**症状**: データベース接続に失敗する

**確認事項**:
```bash
# PostgreSQLサービスの状態
sudo systemctl status postgresql

# データベース接続テスト
psql -h localhost -U runmaster -d runmaster_prod -c "SELECT 1;"
```

**解決方法**:
```bash
# PostgreSQLサービスの再起動
sudo systemctl restart postgresql

# データベースマイグレーションの再実行
alembic upgrade head
```

## パフォーマンス最適化

### 1. データベース最適化

```sql
-- インデックスの追加
CREATE INDEX CONCURRENTLY idx_prediction_results_user_id ON prediction_results(user_id);
CREATE INDEX CONCURRENTLY idx_prediction_results_created_at ON prediction_results(created_at);
CREATE INDEX CONCURRENTLY idx_feature_store_user_id ON feature_store(user_id);
CREATE INDEX CONCURRENTLY idx_ai_models_is_active ON ai_models(is_active);
```

### 2. Redis最適化

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 0
```

### 3. Gunicorn最適化

```python
# gunicorn.conf.py
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 2000
max_requests = 2000
max_requests_jitter = 100
```

## セキュリティ考慮事項

### 1. ファイアウォール設定

```bash
# UFWの設定
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. データベースセキュリティ

```sql
-- 不要なユーザーの削除
DROP USER IF EXISTS postgres;

-- パスワードポリシーの設定
ALTER USER runmaster PASSWORD 'strong-password-here';
```

### 3. ファイル権限の設定

```bash
# アプリケーションファイルの権限設定
sudo chown -R runmaster:runmaster /opt/runmaster
sudo chmod -R 755 /opt/runmaster
sudo chmod 600 /opt/runmaster/backend/.env.production
```

## まとめ

このデプロイメントガイドに従うことで、RunMaster AI機能を本番環境に安全かつ効率的にデプロイできます。AI機能は環境変数で制御可能で、必要に応じて無効化も可能です。

重要なポイント：
- ✅ 段階的なデプロイメント
- ✅ 環境変数による制御
- ✅ 包括的なモニタリング
- ✅ セキュリティの考慮
- ✅ バックアップとリストア
- ✅ トラブルシューティング

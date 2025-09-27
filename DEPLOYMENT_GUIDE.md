# RacePredictor デプロイメントガイド

## 概要

RacePredictorの本格運用に向けたデプロイメントガイドです。月額予算5,000円以内での運用を想定し、AWS/GCP小規模インスタンス構成案を提供します。

## アーキテクチャ概要

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFlare    │    │   Load Balancer │    │   Application   │
│   (CDN/DNS)     │────│   (Optional)    │────│   Servers       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Database      │
                                                │   (PostgreSQL)  │
                                                └─────────────────┘
```

## 構成案1: AWS構成

### 基本構成

| サービス | インスタンス/プラン | 月額料金 | 用途 |
|---------|------------------|---------|------|
| EC2 | t3.micro (1台) | ¥1,200 | アプリケーションサーバー |
| RDS | db.t3.micro | ¥2,500 | PostgreSQL データベース |
| S3 | Standard | ¥500 | 静的ファイル・バックアップ |
| CloudFront | 無料枠 | ¥0 | CDN |
| Route 53 | ホストゾーン | ¥500 | DNS管理 |
| **合計** | | **¥4,700** | |

### 詳細設定

#### EC2インスタンス設定
```yaml
Instance Type: t3.micro
vCPUs: 2
Memory: 1 GiB
Storage: 30 GB GP3
OS: Ubuntu 22.04 LTS
Security Groups:
  - HTTP (80)
  - HTTPS (443)
  - SSH (22) - 制限IP
```

#### RDS設定
```yaml
Engine: PostgreSQL 15
Instance Class: db.t3.micro
Storage: 20 GB GP2
Backup Retention: 7 days
Multi-AZ: No (コスト削減)
```

#### セキュリティ設定
```yaml
VPC: Default VPC
Subnets: Public Subnet
Security Groups:
  - Web Server: 80, 443, 22
  - Database: 5432 (Web Server only)
```

### スケーリング戦略

1. **水平スケーリング**: Auto Scaling Group設定
2. **垂直スケーリング**: t3.small (¥2,400) へのアップグレード
3. **データベース**: db.t3.small (¥5,000) へのアップグレード

## 構成案2: GCP構成

### 基本構成

| サービス | インスタンス/プラン | 月額料金 | 用途 |
|---------|------------------|---------|------|
| Compute Engine | e2-micro (1台) | ¥1,000 | アプリケーションサーバー |
| Cloud SQL | db-f1-micro | ¥2,200 | PostgreSQL データベース |
| Cloud Storage | Standard | ¥400 | 静的ファイル・バックアップ |
| Cloud CDN | 無料枠 | ¥0 | CDN |
| Cloud DNS | ゾーン管理 | ¥400 | DNS管理 |
| **合計** | | **¥4,000** | |

### 詳細設定

#### Compute Engine設定
```yaml
Machine Type: e2-micro
vCPUs: 2 (共有)
Memory: 1 GB
Storage: 30 GB SSD
OS: Ubuntu 22.04 LTS
Firewall Rules:
  - default-allow-http
  - default-allow-https
  - default-allow-ssh
```

#### Cloud SQL設定
```yaml
Database Version: PostgreSQL 15
Machine Type: db-f1-micro
Storage: 20 GB SSD
Backup: 7 days retention
High Availability: No
```

## 構成案3: ハイブリッド構成 (推奨)

### 基本構成

| サービス | プロバイダー | 月額料金 | 用途 |
|---------|------------|---------|------|
| VPS | Vultr/Sakura | ¥1,000 | アプリケーションサーバー |
| Database | Supabase | ¥2,000 | PostgreSQL + Auth |
| CDN | CloudFlare | ¥0 | CDN + DDoS保護 |
| Domain | Namecheap | ¥200 | ドメイン管理 |
| **合計** | | **¥3,200** | |

### Supabase設定
```yaml
Plan: Pro Plan ($25/month)
Features:
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Edge Functions
  - Storage
  - API Auto-generation
```

## デプロイメント手順

### 1. 環境準備

```bash
# 1. サーバーセットアップ
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# 2. Docker Compose設定
cat > docker-compose.yml << EOF
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/racepredictor
      - SECRET_KEY=your-secret-key
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build: ./frontend-react
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=racepredictor
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# 3. Nginx設定
sudo cat > /etc/nginx/sites-available/racepredictor << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 4. SSL証明書取得
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 2. アプリケーションデプロイ

```bash
# 1. リポジトリクローン
git clone https://github.com/yourusername/RacePredictor.git
cd RacePredictor

# 2. 環境変数設定
cp .env.example .env
# .envファイルを編集して本番環境の設定を追加

# 3. アプリケーション起動
docker-compose up -d

# 4. データベースマイグレーション
docker-compose exec backend alembic upgrade head

# 5. 初期データ投入
docker-compose exec backend python create_default_race_types.py
docker-compose exec backend python create_default_workout_types.py
```

### 3. 監視・ログ設定

```bash
# 1. ログローテーション設定
sudo cat > /etc/logrotate.d/racepredictor << EOF
/var/log/racepredictor/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart backend frontend
    endscript
}
EOF

# 2. システム監視設定
sudo apt install -y htop iotop nethogs

# 3. 自動バックアップ設定
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U user racepredictor > backup_\$DATE.sql
aws s3 cp backup_\$DATE.sql s3://your-backup-bucket/
rm backup_\$DATE.sql
EOF

chmod +x backup.sh
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## セキュリティ設定

### 1. ファイアウォール設定

```bash
# UFW設定
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSH設定強化

```bash
# SSH設定編集
sudo nano /etc/ssh/sshd_config

# 以下の設定を追加/変更
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers yourusername
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# SSH再起動
sudo systemctl restart ssh
```

### 3. アプリケーションセキュリティ

```python
# backend/app/core/config.py
class Settings:
    # セキュリティ設定
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS設定
    CORS_ORIGINS: str = "https://yourdomain.com,https://www.yourdomain.com"
    
    # レート制限
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # セキュリティヘッダー
    SECURE_HEADERS: bool = True
```

## パフォーマンス最適化

### 1. データベース最適化

```sql
-- PostgreSQL設定最適化
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- インデックス最適化
CREATE INDEX CONCURRENTLY idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX CONCURRENTLY idx_races_user_date ON races(user_id, race_date);
CREATE INDEX CONCURRENTLY idx_daily_metrics_user_date ON daily_metrics(user_id, date);
```

### 2. アプリケーション最適化

```python
# データベース接続プール設定
DATABASE_URL = "postgresql://user:password@localhost/racepredictor?pool_size=20&max_overflow=30"

# Redis キャッシュ設定 (オプション)
REDIS_URL = "redis://localhost:6379/0"
```

### 3. フロントエンド最適化

```javascript
// next.config.js
module.exports = {
  // 画像最適化
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 圧縮設定
  compress: true,
  
  // バンドル分析
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  
  // 環境変数
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

## 監視・アラート設定

### 1. ヘルスチェック

```python
# backend/app/main.py
@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    try:
        # データベース接続チェック
        db = next(get_db())
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": settings.app_version,
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail="Service unavailable")
```

### 2. ログ監視

```bash
# ログ監視スクリプト
cat > monitor.sh << EOF
#!/bin/bash
# エラーログ監視
if tail -n 100 /var/log/racepredictor/error.log | grep -q "ERROR"; then
    echo "Error detected in logs" | mail -s "RacePredictor Alert" admin@yourdomain.com
fi

# ディスク使用量監視
DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "Disk usage is \${DISK_USAGE}%" | mail -s "RacePredictor Disk Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor.sh
echo "*/5 * * * * /path/to/monitor.sh" | crontab -
```

## バックアップ・復旧

### 1. 自動バックアップ

```bash
# データベースバックアップ
cat > db_backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="racepredictor"

# データベースバックアップ
docker-compose exec -T db pg_dump -U user \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# ファイルバックアップ
tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz /app/uploads

# 古いバックアップ削除 (30日以上)
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x db_backup.sh
echo "0 3 * * * /path/to/db_backup.sh" | crontab -
```

### 2. 復旧手順

```bash
# データベース復旧
docker-compose exec -T db psql -U user -d racepredictor < backup_20240115_030000.sql

# アプリケーション復旧
docker-compose down
docker-compose up -d
```

## コスト最適化

### 1. リソース使用量監視

```bash
# リソース使用量監視
cat > resource_monitor.sh << EOF
#!/bin/bash
echo "=== Resource Usage ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | cut -d'%' -f1

echo "Memory Usage:"
free -h | awk 'NR==2{printf "%.1f%%", \$3*100/\$2}'

echo "Disk Usage:"
df -h | awk 'NR==2{print \$5}'

echo "Network Usage:"
cat /proc/net/dev | grep eth0 | awk '{print "RX: " \$2/1024/1024 " MB, TX: " \$10/1024/1024 " MB"}'
EOF

chmod +x resource_monitor.sh
```

### 2. 自動スケーリング

```yaml
# docker-compose.yml に追加
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## まとめ

### 推奨構成

**ハイブリッド構成 (月額¥3,200)** を推奨します：

- **VPS**: アプリケーションサーバー
- **Supabase**: データベース + 認証
- **CloudFlare**: CDN + セキュリティ
- **独自ドメイン**: ブランディング

### 次のステップ

1. **ドメイン取得**: Namecheap等でドメインを取得
2. **VPS契約**: Vultr/Sakura等でVPSを契約
3. **Supabase設定**: Pro プランでデータベースを設定
4. **CloudFlare設定**: CDNとセキュリティを設定
5. **デプロイ実行**: 上記手順でアプリケーションをデプロイ

### 運用開始後の監視項目

- **パフォーマンス**: レスポンス時間、スループット
- **可用性**: アップタイム、エラー率
- **セキュリティ**: 不正アクセス、脆弱性
- **コスト**: 月額料金、リソース使用量

この構成により、月額5,000円以内で本格運用が可能です。

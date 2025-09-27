# RacePredictor 監視・運用ガイド

## 概要

RacePredictorの本格運用に向けた監視・運用ガイドです。システムの健全性を保つための監視設定と運用手順を提供します。

## 監視項目

### 1. システムリソース監視

#### CPU使用率
```bash
# CPU使用率監視スクリプト
cat > monitor_cpu.sh << 'EOF'
#!/bin/bash
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
THRESHOLD=80

if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
    echo "ALERT: CPU usage is ${CPU_USAGE}% (threshold: ${THRESHOLD}%)" | \
    mail -s "RacePredictor CPU Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_cpu.sh
```

#### メモリ使用率
```bash
# メモリ使用率監視スクリプト
cat > monitor_memory.sh << 'EOF'
#!/bin/bash
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
THRESHOLD=85

if (( $(echo "$MEMORY_USAGE > $THRESHOLD" | bc -l) )); then
    echo "ALERT: Memory usage is ${MEMORY_USAGE}% (threshold: ${THRESHOLD}%)" | \
    mail -s "RacePredictor Memory Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_memory.sh
```

#### ディスク使用率
```bash
# ディスク使用率監視スクリプト
cat > monitor_disk.sh << 'EOF'
#!/bin/bash
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
THRESHOLD=80

if [ $DISK_USAGE -gt $THRESHOLD ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}% (threshold: ${THRESHOLD}%)" | \
    mail -s "RacePredictor Disk Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_disk.sh
```

### 2. アプリケーション監視

#### レスポンス時間監視
```bash
# レスポンス時間監視スクリプト
cat > monitor_response.sh << 'EOF'
#!/bin/bash
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8000/health)
THRESHOLD=2.0

if (( $(echo "$RESPONSE_TIME > $THRESHOLD" | bc -l) )); then
    echo "ALERT: Response time is ${RESPONSE_TIME}s (threshold: ${THRESHOLD}s)" | \
    mail -s "RacePredictor Response Time Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_response.sh
```

#### エラーレート監視
```bash
# エラーレート監視スクリプト
cat > monitor_errors.sh << 'EOF'
#!/bin/bash
ERROR_COUNT=$(grep -c "ERROR" /var/log/racepredictor/error.log | tail -100)
THRESHOLD=10

if [ $ERROR_COUNT -gt $THRESHOLD ]; then
    echo "ALERT: Error count in last 100 lines is ${ERROR_COUNT} (threshold: ${THRESHOLD})" | \
    mail -s "RacePredictor Error Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_errors.sh
```

### 3. データベース監視

#### 接続数監視
```bash
# データベース接続数監視スクリプト
cat > monitor_db_connections.sh << 'EOF'
#!/bin/bash
CONNECTIONS=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U racepredictor_user -d racepredictor -c "SELECT count(*) FROM pg_stat_activity;" | grep -o '[0-9]*' | tail -1)
THRESHOLD=50

if [ $CONNECTIONS -gt $THRESHOLD ]; then
    echo "ALERT: Database connections is ${CONNECTIONS} (threshold: ${THRESHOLD})" | \
    mail -s "RacePredictor DB Connections Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_db_connections.sh
```

#### クエリ実行時間監視
```bash
# クエリ実行時間監視スクリプト
cat > monitor_db_queries.sh << 'EOF'
#!/bin/bash
SLOW_QUERIES=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U racepredictor_user -d racepredictor -c "SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 1000;" | grep -o '[0-9]*' | tail -1)
THRESHOLD=5

if [ $SLOW_QUERIES -gt $THRESHOLD ]; then
    echo "ALERT: Slow queries count is ${SLOW_QUERIES} (threshold: ${THRESHOLD})" | \
    mail -s "RacePredictor Slow Queries Alert" admin@yourdomain.com
fi
EOF

chmod +x monitor_db_queries.sh
```

## ログ管理

### 1. ログローテーション設定

```bash
# ログローテーション設定
sudo cat > /etc/logrotate.d/racepredictor << 'EOF'
/var/log/racepredictor/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /path/to/docker-compose.prod.yml restart backend frontend
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /path/to/docker-compose.prod.yml restart nginx
    endscript
}
EOF
```

### 2. ログ分析

```bash
# ログ分析スクリプト
cat > analyze_logs.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/racepredictor/racepredictor.log"
DATE=$(date +%Y-%m-%d)

echo "=== RacePredictor Log Analysis for $DATE ==="
echo ""

# 総リクエスト数
TOTAL_REQUESTS=$(grep "$DATE" $LOG_FILE | grep "INFO" | wc -l)
echo "Total Requests: $TOTAL_REQUESTS"

# エラー数
ERROR_COUNT=$(grep "$DATE" $LOG_FILE | grep "ERROR" | wc -l)
echo "Error Count: $ERROR_COUNT"

# 警告数
WARN_COUNT=$(grep "$DATE" $LOG_FILE | grep "WARN" | wc -l)
echo "Warning Count: $WARN_COUNT"

# 最も多いエラー
echo ""
echo "Top Errors:"
grep "$DATE" $LOG_FILE | grep "ERROR" | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5

# レスポンス時間統計
echo ""
echo "Response Time Statistics:"
grep "$DATE" $LOG_FILE | grep "INFO" | grep "response_time" | awk '{print $NF}' | sort -n | awk '
{
    sum+=$1
    count++
    if (count==1) min=$1
    max=$1
}
END {
    avg=sum/count
    print "Min:", min "ms"
    print "Max:", max "ms"
    print "Avg:", avg "ms"
}'
EOF

chmod +x analyze_logs.sh
```

## アラート設定

### 1. メール通知設定

```bash
# メール設定
sudo apt install -y mailutils

# メール設定ファイル
sudo cat > /etc/postfix/main.cf << 'EOF'
# 基本設定
myhostname = yourdomain.com
mydomain = yourdomain.com
myorigin = $mydomain
inet_interfaces = localhost
inet_protocols = ipv4

# リレー設定（Gmail使用例）
relayhost = [smtp.gmail.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt
smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt
EOF

# SASL認証設定
sudo cat > /etc/postfix/sasl_passwd << 'EOF'
[smtp.gmail.com]:587 your_email@gmail.com:your_app_password
EOF

sudo postmap /etc/postfix/sasl_passwd
sudo systemctl restart postfix
```

### 2. Slack通知設定

```bash
# Slack通知スクリプト
cat > slack_notify.sh << 'EOF'
#!/bin/bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
MESSAGE="$1"
CHANNEL="#alerts"

curl -X POST -H 'Content-type: application/json' \
--data "{\"channel\":\"$CHANNEL\",\"text\":\"$MESSAGE\"}" \
$SLACK_WEBHOOK_URL
EOF

chmod +x slack_notify.sh
```

## バックアップ戦略

### 1. 自動バックアップ

```bash
# 自動バックアップスクリプト
cat > auto_backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# データベースバックアップ
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U racepredictor_user racepredictor > $BACKUP_DIR/db_backup_$DATE.sql

# アプリケーションファイルバックアップ
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /app/uploads

# 設定ファイルバックアップ
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env.production nginx.conf

# 古いバックアップ削除
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# バックアップ完了通知
echo "Backup completed: $DATE" | mail -s "RacePredictor Backup Completed" admin@yourdomain.com
EOF

chmod +x auto_backup.sh

# 毎日午前3時にバックアップ実行
echo "0 3 * * * /path/to/auto_backup.sh" | crontab -
```

### 2. バックアップ検証

```bash
# バックアップ検証スクリプト
cat > verify_backup.sh << 'EOF'
#!/bin/bash
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# バックアップファイルの整合性チェック
if pg_restore --list $BACKUP_FILE > /dev/null 2>&1; then
    echo "✓ Backup file is valid: $BACKUP_FILE"
else
    echo "✗ Backup file is corrupted: $BACKUP_FILE"
    exit 1
fi
EOF

chmod +x verify_backup.sh
```

## パフォーマンス監視

### 1. アプリケーションパフォーマンス

```python
# backend/app/middleware.py に追加
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # ログ出力
        logger.info(f"Request: {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
        
        return response
```

### 2. データベースパフォーマンス

```sql
-- パフォーマンス監視用クエリ
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- スロークエリ監視
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 10;

-- 接続数監視
SELECT 
    state,
    count(*) as connections
FROM pg_stat_activity 
GROUP BY state;
```

## セキュリティ監視

### 1. 不正アクセス監視

```bash
# 不正アクセス監視スクリプト
cat > monitor_security.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/nginx/access.log"
DATE=$(date +%Y-%m-%d)

# 失敗したログイン試行
FAILED_LOGINS=$(grep "$DATE" $LOG_FILE | grep "401\|403" | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "ALERT: High number of failed login attempts: $FAILED_LOGINS" | \
    mail -s "RacePredictor Security Alert" admin@yourdomain.com
fi

# 異常なアクセスパターン
SUSPICIOUS_IPS=$(grep "$DATE" $LOG_FILE | awk '{print $1}' | sort | uniq -c | sort -nr | head -5)
echo "Top IPs by request count:"
echo "$SUSPICIOUS_IPS"
EOF

chmod +x monitor_security.sh
```

### 2. 脆弱性スキャン

```bash
# 脆弱性スキャンスクリプト
cat > security_scan.sh << 'EOF'
#!/bin/bash
# Dockerイメージの脆弱性スキャン
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image racepredictor-backend:latest

# システムパッケージの脆弱性スキャン
sudo apt update
sudo apt list --upgradable
EOF

chmod +x security_scan.sh
```

## 運用手順

### 1. 日常運用

```bash
# 日常運用チェックリスト
cat > daily_checklist.sh << 'EOF'
#!/bin/bash
echo "=== RacePredictor Daily Checklist ==="
echo ""

# サービス状態確認
echo "1. Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "2. Resource Usage:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
echo "Memory: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"

echo ""
echo "3. Error Count (Last 24h):"
grep "$(date +%Y-%m-%d)" /var/log/racepredictor/error.log | wc -l

echo ""
echo "4. Database Status:"
docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U racepredictor_user -d racepredictor

echo ""
echo "5. SSL Certificate Expiry:"
openssl x509 -in ssl/cert.pem -noout -dates
EOF

chmod +x daily_checklist.sh
```

### 2. 緊急時対応

```bash
# 緊急時対応スクリプト
cat > emergency_response.sh << 'EOF'
#!/bin/bash
echo "=== RacePredictor Emergency Response ==="
echo ""

# サービス停止
echo "Stopping services..."
docker-compose -f docker-compose.prod.yml down

# データベースバックアップ
echo "Creating emergency backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U racepredictor_user racepredictor > /backups/emergency_backup_$TIMESTAMP.sql

# ログ保存
echo "Saving logs..."
tar -czf /backups/emergency_logs_$TIMESTAMP.tar.gz /var/log/racepredictor

# 通知送信
echo "Sending emergency notification..."
echo "Emergency response executed at $(date)" | mail -s "RacePredictor Emergency Response" admin@yourdomain.com

echo "Emergency response completed."
EOF

chmod +x emergency_response.sh
```

## まとめ

この監視・運用ガイドにより、RacePredictorの本格運用に必要な監視体制を構築できます。

### 主要な監視項目

1. **システムリソース**: CPU、メモリ、ディスク使用率
2. **アプリケーション**: レスポンス時間、エラーレート
3. **データベース**: 接続数、クエリ実行時間
4. **セキュリティ**: 不正アクセス、脆弱性

### 運用フロー

1. **日常**: 自動監視 + 日次チェックリスト
2. **異常時**: アラート通知 + 自動対応
3. **緊急時**: 緊急対応スクリプト実行

### 次のステップ

1. 監視スクリプトの配置と実行権限設定
2. アラート通知の設定（メール/Slack）
3. バックアップの自動化
4. ログ分析の定期実行
5. セキュリティスキャンの定期実行

この監視体制により、システムの健全性を保ち、問題の早期発見と迅速な対応が可能になります。

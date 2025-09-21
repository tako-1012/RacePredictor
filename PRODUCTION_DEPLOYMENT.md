# RacePredictor 本番デプロイガイド

## 🚀 クイックスタート

### 1. 環境準備
```bash
# 必要なソフトウェア
- Docker
- Docker Compose
- Git
```

### 2. デプロイ実行
```bash
# リポジトリのクローン
git clone <repository-url>
cd RacePredictor

# 環境変数ファイルの作成
cp production.env.template .env.production

# 環境変数の設定（必要に応じて編集）
nano .env.production

# デプロイ実行
./deploy.sh production
```

### 3. アクセス確認
- **フロントエンド**: http://localhost:8501
- **バックエンドAPI**: http://localhost:8000
- **APIドキュメント**: http://localhost:8000/docs
- **ヘルスチェック**: http://localhost:8000/health

## 📋 詳細設定

### 環境変数設定

#### 必須設定
```bash
# データベース
DATABASE_URL=postgresql://admin:strong-password@db:5432/racepredictor
DB_PASSWORD=strong-password-here

# セキュリティ
SECRET_KEY=your-production-secret-key-here
```

#### 推奨設定
```bash
# アプリケーション
DEBUG=false
ENVIRONMENT=production
LOG_LEVEL=INFO

# パフォーマンス
WORKERS=4
MAX_CONNECTIONS=100
TIMEOUT=30
```

### Docker Compose設定

#### サービス構成
- **backend**: FastAPI アプリケーション
- **frontend**: Streamlit UI
- **db**: PostgreSQL データベース

#### ヘルスチェック
各サービスにヘルスチェックが設定されており、30秒間隔で監視されます。

#### ボリューム
- `postgres_data`: データベース永続化
- `./data`: アプリケーションデータ
- `./backups`: バックアップファイル

## 🔧 運用コマンド

### サービス管理
```bash
# サービス起動
docker-compose up -d

# サービス停止
docker-compose down

# サービス再起動
docker-compose restart

# ログ確認
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### データベース管理
```bash
# データベース接続
docker-compose exec db psql -U admin -d racepredictor

# バックアップ作成
docker-compose exec db pg_dump -U admin racepredictor > backup.sql

# バックアップ復元
docker-compose exec -T db psql -U admin racepredictor < backup.sql
```

### アプリケーション管理
```bash
# コンテナ内でコマンド実行
docker-compose exec backend python -c "from app.core.init_data import create_default_workout_types; create_default_workout_types()"

# データベース初期化
docker-compose run --rm backend python -m app.database.init_db
```

## 📊 監視とログ

### ヘルスチェック
- **基本**: `GET /health`
- **詳細**: `GET /health/detailed`

### ログレベル
- **開発環境**: DEBUG
- **本番環境**: INFO

### ログ出力
```bash
# リアルタイムログ
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f backend | grep ERROR
```

## 🔒 セキュリティ設定

### 本番環境での推奨設定
1. **SECRET_KEY**: 強力なランダム文字列
2. **DB_PASSWORD**: 複雑なパスワード
3. **DEBUG**: false
4. **CORS**: 適切なオリジン制限

### ファイアウォール設定
```bash
# 必要なポート
- 8000: Backend API
- 8501: Frontend UI
- 5432: Database (内部のみ)
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. サービス起動失敗
```bash
# ログ確認
docker-compose logs backend

# 環境変数確認
docker-compose config

# コンテナ再作成
docker-compose down
docker-compose up --build
```

#### 2. データベース接続エラー
```bash
# データベース状態確認
docker-compose exec db pg_isready -U admin

# 接続テスト
docker-compose exec backend python -c "from app.core.database import engine; print(engine.execute('SELECT 1').fetchone())"
```

#### 3. メモリ不足
```bash
# リソース使用量確認
docker stats

# 不要なコンテナ削除
docker system prune -f
```

### ログ分析
```bash
# エラーログの抽出
docker-compose logs backend | grep -i error

# アクセスログの分析
docker-compose logs backend | grep -E "(GET|POST|PUT|DELETE)"
```

## 📈 パフォーマンス最適化

### リソース設定
```yaml
# docker-compose.yml に追加
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### データベース最適化
```sql
-- インデックス作成
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX idx_workouts_type ON workouts(workout_type_id);
```

## 🔄 バックアップとリストア

### 自動バックアップ
```bash
# cron設定例（毎日午前2時）
0 2 * * * cd /path/to/RacePredictor && docker-compose exec db pg_dump -U admin racepredictor > backups/backup_$(date +\%Y\%m\%d).sql
```

### 手動バックアップ
```bash
# フルバックアップ
docker-compose exec db pg_dump -U admin racepredictor > full_backup.sql

# スキーマのみ
docker-compose exec db pg_dump -U admin -s racepredictor > schema_backup.sql

# データのみ
docker-compose exec db pg_dump -U admin -a racepredictor > data_backup.sql
```

## 📞 サポート

### 問題報告
1. ログファイルの収集
2. 環境情報の確認
3. 再現手順の記録

### 緊急時対応
```bash
# サービス停止
docker-compose down

# データベースバックアップ
docker-compose exec db pg_dump -U admin racepredictor > emergency_backup.sql

# ログ収集
docker-compose logs > emergency_logs.txt
```

---

**最終更新**: 2024年12月20日  
**バージョン**: 1.0.0  
**ステータス**: ✅ 本番環境対応完了

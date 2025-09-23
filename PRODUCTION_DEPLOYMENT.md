# 本番環境デプロイメントガイド

## 前提条件
- Docker と Docker Compose がインストールされていること
- 本番環境用の環境変数が設定されていること

## デプロイ手順

### 1. 環境変数設定
```bash
cp production.env.template .env
# .envファイルを編集して本番環境の設定を行う
```

### 2. Docker Compose でデプロイ
```bash
docker-compose up -d
```

### 3. データベースマイグレーション
```bash
docker-compose exec backend alembic upgrade head
```

### 4. 初期データ作成
```bash
docker-compose exec backend python create_default_race_types.py
```

### 5. ヘルスチェック
```bash
curl http://localhost:8000/health
curl http://localhost:8501/
```

## 監視
- ログ監視: `docker-compose logs -f`
- リソース監視: `docker stats`
- ヘルスチェック: 定期的なAPI呼び出し

## バックアップ
- データベースバックアップの定期実行
- ログファイルのローテーション設定

## セキュリティ
- SSL証明書の設定
- ファイアウォール設定
- アクセス制限の設定

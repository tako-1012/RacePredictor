# RacePredictor 開発者向けセットアップガイド

## 開発環境のセットアップ

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd RacePredictor
```

### 2. バックエンド環境のセットアップ
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. フロントエンド環境のセットアップ
```bash
cd frontend-react
npm install
```

### 4. 環境変数の設定
```bash
# バックエンド
cp ../test.env .env

# フロントエンド
cp env.example .env.local
```

### 5. データベースの初期化
```bash
cd backend
python -m alembic upgrade head
python create_default_race_types.py
python create_test_user.py
```

### 6. アプリケーションの起動
```bash
# バックエンド（ターミナル1）
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# フロントエンド（ターミナル2）
cd frontend-react
npm run dev
```

## 開発ツール

### テスト実行
```bash
# バックエンドテスト
cd backend
python run_tests.py

# フロントエンドテスト
cd frontend-react
npm test
npm run e2e
```

### コードフォーマット
```bash
# Python
black .
isort .

# TypeScript/React
npm run lint
npm run format
```

## トラブルシューティング

### よくある問題
1. **ポート競合**: 他のアプリケーションが同じポートを使用している
2. **依存関係エラー**: pip install または npm install を再実行
3. **データベース接続エラー**: 環境変数の確認

### ログの確認
```bash
# バックエンドログ
tail -f backend/logs/racepredictor.log

# Docker ログ
docker-compose logs -f
```

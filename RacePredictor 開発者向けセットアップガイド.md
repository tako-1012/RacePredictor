# RacePredictor 開発者向けセットアップガイド

## 🛠 詳細セットアップ手順

### 前提条件
- Docker & Docker Compose
- Git
- Node.js 18+ (React UI使用時)
- Python 3.11+ (ローカル開発時)

### 方法1: Docker Compose
```bash
# 1. リポジトリクローン
git clone https://github.com/your-repo/RacePredictor.git
cd RacePredictor

# 2. 環境変数設定
cp production.env.template .env

# 3. アプリケーション起動
docker compose up --build

# 4. アクセス
# React UI: http://localhost:3000
# API: http://localhost:8000
```

### 方法2: ローカル開発環境（推奨）

#### バックエンド開発
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# データベース初期化
alembic upgrade head

# 開発サーバー起動
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### React UI開発
```bash
cd frontend-react
npm install
npm run dev
```

## 🧪 テスト環境整備

### テスト用サーバー起動
```bash
# ターミナル1: バックエンド起動
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# ターミナル2: React UI起動
cd frontend-react
npm install
npm run dev
```

### テスト用データベース初期化
```bash
# データベーステーブル作成
cd backend
alembic upgrade head

# テストデータ投入（オプション）
python -c "
from app.database.init_db import init_db
init_db()
print('テストデータ投入完了')
"
```

### テスト用ユーザー作成
```bash
# API経由でテストユーザー作成
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "confirm_password": "testpassword123"
  }'
```

### テスト用サンプルデータ作成
```bash
# 練習記録のサンプルデータ作成
curl -X POST http://localhost:8000/api/workouts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2024-12-20",
    "workout_type_id": "f41bae53-7abe-473c-a999-1f2d70eec1c1",
    "distance_meters": 5000,
    "times_seconds": 1800,
    "repetitions": 1,
    "intensity": 3,
    "notes": "テスト用の練習記録"
  }'

# レース結果のサンプルデータ作成
curl -X POST http://localhost:8000/api/races/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "race_date": "2024-12-15",
    "event": "5km",
    "time_seconds": 1800,
    "place": 10
  }'
```

### 簡単セットアップスクリプト
```bash
# テスト環境用のセットアップスクリプト作成
cat > setup_test_env.sh << 'EOF'
#!/bin/bash
echo "🚀 RacePredictor テスト環境セットアップ開始"

# バックエンドセットアップ
echo "📦 バックエンドセットアップ中..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# フロントエンドセットアップ
echo "📦 フロントエンドセットアップ中..."
cd ../frontend-react
npm install

echo "✅ セットアップ完了！"
echo "📝 次の手順:"
echo "1. ターミナル1: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "2. ターミナル2: cd frontend-react && npm run dev"
echo "3. ブラウザで http://localhost:3000 にアクセス"
EOF

chmod +x setup_test_env.sh
./setup_test_env.sh
```

## 🔍 アクセス確認
- **React UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🧪 テスト実行
```bash
# バックエンドテスト
cd backend
pytest

# APIテスト
pytest tests/test_api.py -v

# フロントエンドテスト（React）
cd frontend-react
npm test

# E2Eテスト（オプション）
npm run test:e2e
```

## 🗄 データベース操作
```bash
# マイグレーション
cd backend
alembic upgrade head

# 新しいマイグレーション作成
alembic revision --autogenerate -m "description"

# テストデータ投入
python scripts/seed_data.py
```

## 🌍 環境設定詳細

### 必要な環境変数
```bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/racepredictor

# Security  
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# App Settings
DEBUG=True
CSV_UPLOAD_MAX_SIZE=10485760  # 10MB
ALLOWED_ENCODINGS=utf-8,shift-jis,cp932,euc-jp
```

## 🚨 トラブルシューティング

### よくある問題
1. **ポート競合**: 8000, 3000ポートが使用中
2. **依存関係エラー**: `pip install -r requirements.txt` を再実行
3. **データベース接続エラー**: データベースサーバーが起動しているか確認

### ログ確認
```bash
# バックエンドログ
cd backend
python -m uvicorn app.main:app --reload --log-level debug

# フロントエンドログ（React）
cd frontend-react
npm run dev -- --verbose
```

## 📊 Garmin CSVカラム（28項目完全対応）
```
基本データ: ラップ数、タイム、距離、ペース
心拍数: 平均・最大心拍数
パワー: 平均・最大パワー、W/kg
ランニングダイナミクス: ピッチ、接地時間、上下動
環境: 気温、勾配調整ペース(GAP)
詳細: カロリー、歩幅、GCTバランス等
```

### 練習種別自動推定
- **インターバル**: 複数ラップ + ペース変動
- **テンポ走**: 4:00/km未満の一定ペース  
- **ロング走**: 15km以上の距離
- **イージーラン**: 6:00/km以上のペース
- **ジョギング**: その他

### 強度推定（心拍数ベース）
```
レベル1: <130bpm (リカバリー)
レベル2: 130-149bpm (有酸素ベース)  
レベル3: 150-164bpm (有酸素)
レベル4: 165-174bpm (閾値)
レベル5: ≥175bpm (無酸素)
```

## 🔧 開発ワークフロー

### 新機能開発
1. Issue作成
2. ブランチ作成 (`feature/機能名`)
3. 実装・テスト
4. Pull Request作成
5. レビュー・マージ

### コミットメッセージ規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
```

## 📈 パフォーマンス最適化

### 目標値
- **CSV処理**: 1000行を5秒以内
- **ページロード**: 3秒以内  
- **同時接続**: 1000ユーザー対応
- **ファイルサイズ**: 10MB制限

### 最適化ポイント
- データベースインデックス
- APIレスポンス圧縮
- フロントエンドバンドル最適化
- 画像最適化

---

**最終更新**: 2025年9月20日
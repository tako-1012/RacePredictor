# RacePredictor v2.1

**データドリブンなランニングタイム予測アプリ**

高精度な予測を実現するため、まずは豊富なデータ収集に特化したベータ版を提供中

## 🚀 現在の開発状況

### ✅ 実装完了
- **ユーザー管理**: 認証・プロフィール管理
- **練習記録**: 手動入力・編集・削除機能
- **CSVインポート**: Garmin対応（28カラム完全対応）
- **レース結果管理**: 記録・比較機能
- **基本ダッシュボード**: 練習履歴・統計表示
- **React UI**: モダンなインターフェース（全機能実装完了）
- **レスポンシブデザイン**: モバイル・タブレット対応
- **アクセシビリティ**: WCAG準拠のUI

### 🔄 実装中
- **ダッシュボードAPI**: 統計データ取得機能
- **データ可視化強化**: 詳細グラフ・分析機能
- **CSVエクスポート**: データポータビリティ

### 📅 Coming Soon（Phase 2）
- **高精度タイム予測**: 蓄積データを活用した機械学習モデル
- **個人適応機能**: 個人特性を学習した予測
- **トレーニング提案**: AI による最適な練習メニュー

## 🎯 なぜ予測機能を後回しにするのか

### データ収集優先戦略
1. **精度重視**: 十分なデータなしの予測は不正確
2. **差別化**: リリース時に競合より高い精度を実現
3. **個人化**: 多様なランナーデータで個人適応を可能に

### 現在のフォーカス
```
高品質なUI + 豊富なデータ収集 = 将来の高精度予測
```

## 📊 主な機能

### 練習記録管理
- **詳細入力**: 距離・タイム・強度・心拍数・メモ
- **インターバル対応**: セット練習の詳細記録
- **CSVインポート**: Garmin Connect データ一括取り込み
- **データ可視化**: グラフ・統計での分析

### レース結果管理
- **9種目対応**: 800m〜フルマラソン
- **記録追跡**: ベストタイム・進歩の可視化
- **将来の分析準備**: Phase 2での予測精度向上に活用

### データ分析
- **練習履歴**: 週間・月間の走行距離推移
- **強度分析**: 練習種別・強度の分布
- **トレンド表示**: パフォーマンスの変化

## 🛠 技術スタック

### バックエンド
- **FastAPI 0.104+** - 高性能API
- **SQLAlchemy 2.0+** - ORM
- **PostgreSQL 14+** - データベース
- **JWT認証** - セキュアな認証

### フロントエンド
- **React/Next.js 14+** - モダンUI・SSR対応
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - レスポンシブデザイン
- **Plotly** - データ可視化

### インフラ
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD

## 🚀 クイックスタート

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
```bash
# 1. リポジトリクローン
git clone https://github.com/your-repo/RacePredictor.git
cd RacePredictor

# 2. バックエンド起動
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. フロントエンド起動（別ターミナル）
cd frontend-react
npm install
npm run dev

# 4. アクセス
# React UI: http://localhost:3000
# API: http://localhost:8000
```


## 📚 使用方法

### React UI

#### 1. アカウント作成・ログイン
```
http://localhost:3000 → 「新規登録」または「ログイン」
```

#### 2. 練習データ記録
- **練習記録ページ**: `/workouts` で練習一覧・新規作成
- **手動入力**: 日付・練習種別・距離・タイム・強度・メモ
- **インターバル練習**: 詳細セット記録対応
- **CSVインポート**: `/import` でGarminデータ一括取り込み

#### 3. レース結果管理
- **レース結果ページ**: `/races` でレース一覧・新規作成
- **9種目対応**: 800m〜フルマラソン
- **ベストタイム追跡**: 自動更新

#### 4. データ分析
- **ダッシュボード**: `/dashboard` で統計・グラフ表示
- **練習履歴**: 週間・月間の走行距離推移
- **強度分析**: 練習種別・強度の分布


## 🎯 対応種目

**トラック**: 800m, 1500m, 3000m, 5000m, 10000m  
**ロード**: 5km, 10km, ハーフマラソン, フルマラソン

## 📈 ロードマップ

### Phase 1: データ収集特化（現在〜2025年12月）
- ✅ 基本機能完成
- 🔄 React UI移行
- 🔄 データ収集・可視化強化
- 🎯 目標: 100-500ユーザー、10,000練習記録

### Phase 2: 高精度予測実装（2026年1月〜3月）
- 🔮 機械学習モデル実装
- 🎯 個人適応機能
- 🏃 トレーニング提案
- 📊 目標: 予測誤差3%以内

### Phase 3: 本格サービス化（2026年4月〜）
- 💰 有料プラン開始
- 📱 モバイルアプリ
- 🌍 マーケティング展開

## 🤝 ベータテスター募集

現在、データ収集とUI改善のためのベータテスターを募集中！

### 参加メリット
- 🆓 将来の有料機能を無料で先行利用
- 📊 自分の練習データの詳細分析
- 🏃 高精度予測機能の優先アクセス

### 参加方法
1. アプリにユーザー登録
2. 2週間以上の練習データを入力
3. フィードバックをGitHub Issuesに投稿

## 🔧 開発者向け情報

### ローカル開発環境セットアップ

#### 1. バックエンド開発
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

#### 2. React UI開発
```bash
cd frontend-react
npm install
npm run dev
```


### テスト環境整備

#### 1. テスト用サーバー起動
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

#### 2. テスト用データベース初期化
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

#### 3. テスト用ユーザー作成
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

#### 4. テスト用サンプルデータ作成
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

#### 5. 簡単セットアップスクリプト
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

#### 6. アクセス確認
- **React UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### テスト実行
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

### データベース操作
```bash
# マイグレーション
cd backend
alembic upgrade head

# 新しいマイグレーション作成
alembic revision --autogenerate -m "description"

# テストデータ投入
python scripts/seed_data.py
```

### トラブルシューティング

#### よくある問題
1. **ポート競合**: 8000, 3000, 8501ポートが使用中
2. **依存関係エラー**: `pip install -r requirements.txt` を再実行
3. **データベース接続エラー**: データベースサーバーが起動しているか確認

#### ログ確認
```bash
# バックエンドログ
cd backend
python -m uvicorn app.main:app --reload --log-level debug

# フロントエンドログ（React）
cd frontend-react
npm run dev -- --verbose
```

## 📄 詳細ドキュメント

- [CSVインポート文字化け完全解決](CSV_ENCODING_COMPLETE_SOLUTION.md) - エンコーディング問題の解決
- [本番デプロイメント](PRODUCTION_DEPLOYMENT.md) - 本番環境構築手順
- [開発ログ](DAILYLOG.md) - 開発履歴・課題

## 🎯 対応データ詳細

### Garmin CSVカラム（28項目完全対応）
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

## ⚡ パフォーマンス仕様

- **CSV処理**: 1000行を5秒以内
- **ページロード**: 3秒以内  
- **同時接続**: 1000ユーザー対応
- **ファイルサイズ**: 10MB制限
- **対応ブラウザ**: Chrome, Firefox, Safari, Edge

## 🔐 セキュリティ

- **認証**: JWT トークン（30分有効）
- **パスワード**: bcrypt ハッシュ化
- **通信**: HTTPS必須（本番環境）
- **データ**: 個人情報暗号化保存

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

## 🤝 コントリビューション

### 歓迎する貢献
- 🐛 バグ報告
- 💡 機能提案
- 📝 ドキュメント改善
- 🧪 テストデータ提供

### 貢献方法
1. Issue作成
2. Fork & ブランチ作成
3. 変更実装
4. Pull Request作成

## 📞 サポート・お問い合わせ

- **Issues**: [GitHub Issues](https://github.com/your-repo/RacePredictor/issues)
- **機能要望**: GitHub Discussions
- **一般的な質問**: README内のFAQ

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

---

**RacePredictor v2.1** - まずはデータ、そして精度。データドリブンなトレーニングで目標達成へ 🏃‍♂️

**最終更新**: 2024-12-20
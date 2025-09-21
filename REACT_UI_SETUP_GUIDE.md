# RacePredictor React UI 実行手順ガイド

## 🚀 React UI移行プロジェクトの実行手順

### 📋 前提条件
- Node.js 18+ がインストールされていること
- Docker & Docker Compose がインストールされていること
- バックエンドAPIが起動していること

### 🔧 1. 依存関係のインストール

```bash
# frontend-reactディレクトリに移動
cd frontend-react

# 依存関係をインストール
npm install
```

### 🌍 2. 環境変数の設定

```bash
# 環境変数ファイルを作成
cp env.example .env.local

# .env.localファイルを編集
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 🏃 3. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

### 🌐 4. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000

### 🐳 5. Docker環境での実行

#### 5.1 バックエンドの起動
```bash
# プロジェクトルートに戻る
cd ..

# バックエンドを起動
docker compose up -d backend db
```

#### 5.2 フロントエンドの起動
```bash
# frontend-reactディレクトリに移動
cd frontend-react

# Dockerイメージをビルド
docker build -t racepredictor-frontend .

# コンテナを実行
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  racepredictor-frontend
```

### 🔄 6. 完全なDocker Compose環境

#### 6.1 docker-compose.ymlの更新
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://admin:password@db:5432/racepredictor
      - SECRET_KEY=your-secret-key-here
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build: ./frontend-react
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=racepredictor
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 6.2 全サービス起動
```bash
# プロジェクトルートで実行
docker compose up --build
```

### 📱 7. アプリケーションの使用

#### 7.1 アカウント作成
1. http://localhost:3000 にアクセス
2. 「新規アカウント作成」をクリック
3. メールアドレスとパスワードを入力
4. アカウント作成完了

#### 7.2 ログイン
1. 作成したアカウントでログイン
2. ダッシュボードが表示される
3. 各機能カードをクリックして機能を確認

### 🛠 8. 開発・デバッグ

#### 8.1 開発モード
```bash
# フロントエンド開発サーバー
npm run dev

# バックエンド開発サーバー（別ターミナル）
cd ../backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 8.2 ビルド・テスト
```bash
# プロダクションビルド
npm run build

# リンター実行
npm run lint

# プロダクションサーバー起動
npm start
```

### 🔍 9. トラブルシューティング

#### 9.1 よくある問題

**問題**: `npm install` でエラーが発生
```bash
# 解決方法
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**問題**: API接続エラー
```bash
# バックエンドが起動しているか確認
curl http://localhost:8000/health

# 環境変数を確認
echo $NEXT_PUBLIC_API_URL
```

**問題**: ポートが使用中
```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

#### 9.2 ログ確認
```bash
# Docker Composeログ
docker compose logs frontend
docker compose logs backend

# リアルタイムログ
docker compose logs -f frontend
```

### 📊 10. 機能確認チェックリスト

#### 10.1 基本機能
- [ ] アカウント作成
- [ ] ログイン
- [ ] ダッシュボード表示
- [ ] ログアウト

#### 10.2 ページ遷移
- [ ] ホーム → ログイン
- [ ] ログイン → ダッシュボード
- [ ] ダッシュボード → 各機能ページ（準備中）

#### 10.3 レスポンシブ
- [ ] モバイル表示
- [ ] タブレット表示
- [ ] デスクトップ表示

### 🚀 11. 本番デプロイ

#### 11.1 Vercel
```bash
# Vercel CLI インストール
npm i -g vercel

# デプロイ
vercel

# 環境変数設定
vercel env add NEXT_PUBLIC_API_URL
```

#### 11.2 Docker本番環境
```bash
# 本番用ビルド
docker build -t racepredictor-frontend:prod .

# 本番環境で実行
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.racepredictor.com \
  racepredictor-frontend:prod
```

### 📝 12. 開発メモ

#### 12.1 技術スタック
- **Next.js 14+**: App Router, TypeScript
- **Tailwind CSS**: ユーティリティファーストCSS
- **Axios**: HTTP クライアント
- **Plotly.js**: データ可視化（今後実装）
- **Lucide React**: アイコン

#### 12.2 ディレクトリ構造
```
frontend-react/
├── src/
│   ├── app/           # ページ
│   ├── components/    # コンポーネント
│   ├── hooks/         # カスタムフック
│   ├── lib/           # ユーティリティ
│   └── types/         # 型定義
├── package.json
├── next.config.js
├── tailwind.config.js
└── Dockerfile
```

#### 12.3 次の実装予定
1. 練習記録ページ
2. レース結果ページ
3. データ可視化
4. CSVインポート
5. 予測機能（Phase 2）

---

**作成日**: 2024-12-20
**更新日**: 2024-12-20
**ステータス**: React UI基盤完成

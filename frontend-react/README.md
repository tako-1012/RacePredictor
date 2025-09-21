# RacePredictor Frontend (React/Next.js)

RacePredictorのモダンなフロントエンドアプリケーション

## 🚀 技術スタック

- **Next.js 14+** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - ユーティリティファーストCSS
- **Axios** - HTTP クライアント
- **Plotly.js** - データ可視化
- **Lucide React** - アイコン

## 📁 プロジェクト構造

```
frontend-react/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # グローバルスタイル
│   │   ├── layout.tsx       # ルートレイアウト
│   │   ├── page.tsx         # ホームページ
│   │   ├── login/           # ログインページ
│   │   └── register/        # 登録ページ
│   ├── components/          # 再利用可能コンポーネント
│   ├── hooks/               # カスタムフック
│   │   └── useAuth.ts       # 認証フック
│   ├── lib/                 # ユーティリティ
│   │   └── api.ts           # API クライアント
│   └── types/               # TypeScript型定義
│       └── index.ts         # 型定義
├── package.json             # 依存関係
├── next.config.js           # Next.js設定
├── tailwind.config.js       # Tailwind設定
├── tsconfig.json            # TypeScript設定
└── Dockerfile               # Docker設定
```

## 🛠 開発環境セットアップ

### 前提条件
- Node.js 18+
- npm または yarn

### インストール
```bash
# 依存関係をインストール
npm install

# 環境変数を設定
cp env.example .env.local

# 開発サーバーを起動
npm run dev
```

### アクセス
- アプリケーション: http://localhost:3000
- API: http://localhost:8000

## 📝 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リンター実行
npm run lint
```

## 🎨 デザインシステム

### カラーパレット
- **Primary**: ブルー系（#3b82f6）
- **Secondary**: グリーン系（#22c55e）
- **Accent**: レッド系（#ef4444）

### コンポーネント
- **Button**: `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Card**: `.card`
- **Input**: `.input-field`
- **Label**: `.label`
- **Metric**: `.metric-card`, `.metric-value`, `.metric-label`

## 🔐 認証機能

- JWT トークンベース認証
- 自動トークン更新
- 認証状態の永続化
- 認証ガード

## 📊 データ可視化

- Plotly.js によるインタラクティブグラフ
- 練習履歴の可視化
- 統計情報の表示
- レスポンシブ対応

## 🐳 Docker サポート

```bash
# イメージビルド
docker build -t racepredictor-frontend .

# コンテナ実行
docker run -p 3000:3000 racepredictor-frontend
```

## 🚀 本番デプロイ

### Vercel
```bash
# Vercel CLI インストール
npm i -g vercel

# デプロイ
vercel
```

### Docker
```bash
# 本番用ビルド
docker build -t racepredictor-frontend:prod .

# 本番環境で実行
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.racepredictor.com \
  racepredictor-frontend:prod
```

## 🔧 設定

### 環境変数
- `NEXT_PUBLIC_API_URL`: バックエンドAPIのURL
- `NODE_ENV`: 実行環境（development/production）

### Next.js設定
- App Router 有効
- TypeScript 有効
- Tailwind CSS 有効
- ESLint 有効

## 📱 レスポンシブ対応

- モバイルファーストデザイン
- タブレット・デスクトップ対応
- タッチフレンドリーなUI

## 🧪 テスト

```bash
# テスト実行（今後実装予定）
npm test

# カバレッジ確認
npm run test:coverage
```

## 📈 パフォーマンス

- Next.js の最適化機能を活用
- 画像最適化
- コード分割
- キャッシュ戦略

## 🤝 コントリビューション

1. ブランチを作成
2. 変更を実装
3. テストを実行
4. Pull Request を作成

## 📄 ライセンス

MIT License

# React UI セットアップガイド

## フロントエンド技術スタック
- **Next.js 14**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Axios**: HTTP クライアント
- **React Hook Form**: フォーム管理
- **Plotly.js**: チャート表示

## コンポーネント構成

### ページコンポーネント
- `app/page.tsx`: ホームページ
- `app/login/page.tsx`: ログインページ
- `app/register/page.tsx`: 登録ページ
- `app/dashboard/page.tsx`: ダッシュボード
- `app/workouts/page.tsx`: 練習記録一覧
- `app/races/page.tsx`: レース結果一覧
- `app/import/page.tsx`: CSVインポート

### UI コンポーネント
- `components/UI/`: 再利用可能なUIコンポーネント
- `components/Charts/`: チャートコンポーネント
- `components/Layout/`: レイアウトコンポーネント

### カスタムフック
- `hooks/useAuth.tsx`: 認証管理
- `hooks/useApi.tsx`: API呼び出し
- `hooks/usePerformance.tsx`: パフォーマンス監視

## スタイリング
- Tailwind CSS を使用
- レスポンシブデザイン対応
- ダークモード対応（将来実装予定）

## 状態管理
- React Context API を使用
- ローカルストレージでの認証状態管理
- フォーム状態は React Hook Form で管理

## テスト
- Jest + Testing Library でユニットテスト
- Playwright でE2Eテスト
- テストカバレッジ80%以上を目標

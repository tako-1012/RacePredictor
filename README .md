# RacePredictor

ランニング練習記録・レース管理・AI予測機能を持つWebアプリケーション

## 概要

RacePredictorは、ランナーの練習記録を管理し、レース結果を分析し、AIによる予測機能を提供するWebアプリケーションです。

## 機能

- ユーザー認証・管理
- 練習記録の作成・管理
- レース結果の記録・分析
- CSV データインポート
- AI予測機能（開発中）
- ダッシュボード

## 技術スタック

### バックエンド
- FastAPI (Python)
- SQLAlchemy
- PostgreSQL
- JWT認証

### フロントエンド
- Next.js (React, TypeScript)
- Tailwind CSS
- Axios

### その他
- Docker
- Nginx
- pytest, Jest, Playwright

## セットアップ

### 前提条件
- Python 3.11+
- Node.js 18+
- PostgreSQL

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd RacePredictor
```

2. 環境セットアップ
```bash
./setup.sh
```

3. サービス起動
```bash
./start-servers.sh
```

4. アクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API文書: http://localhost:8000/docs

## テスト

```bash
# 全テスト実行
./run_tests.sh

# バックエンドテスト
cd backend
pytest

# フロントエンドテスト
cd frontend-react
npm test
```

## ドキュメント

- [開発者向けセットアップガイド](RacePredictor%20開発者向けセットアップガイド.md)
- [実装済み機能一覧](IMPLEMENTED_FEATURES_SUMMARY.md)
- [テストガイド](MANUAL_TESTING_GUIDE.md)

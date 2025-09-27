# RunMaster v2.2 プロジェクト構造分析レポート

## 📊 プロジェクト概要

**プロジェクト名**: RunMaster v2.2  
**分析日時**: 2025年9月25日  
**総ディスク使用量**: 約1.2GB

## 📁 ディレクトリ構造分析

### 主要ディレクトリサイズ
| ディレクトリ | サイズ | 説明 |
|-------------|--------|------|
| `frontend-react/` | 723MB | React/Next.jsフロントエンド |
| `backend/` | 479MB | FastAPI/Pythonバックエンド |
| `venv/` | 3.3MB | Python仮想環境 |
| `test_data/` | 12KB | テスト用データ |

### ファイル構成

#### バックエンド (backend/)
```
backend/
├── app/
│   ├── api/ (19個のAPIエンドポイント)
│   │   ├── auth.py
│   │   ├── workouts.py
│   │   ├── races.py
│   │   ├── dashboard.py
│   │   └── ...
│   ├── core/ (6個のコアモジュール)
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── auth.py
│   │   └── ...
│   ├── schemas/ (14個のPydanticスキーマ)
│   ├── services/ (7個のサービス層)
│   └── main.py
├── tests/ (テストファイル群)
├── alembic/ (データベースマイグレーション)
└── requirements.txt
```

#### フロントエンド (frontend-react/)
```
frontend-react/
├── src/
│   ├── app/ (Next.js App Router)
│   ├── components/ (28個のコンポーネント)
│   ├── hooks/ (4個のカスタムフック)
│   ├── lib/ (ユーティリティ関数)
│   ├── types/ (TypeScript型定義)
│   └── tests/ (12個のテストファイル)
├── public/
├── package.json
└── next.config.js
```

## 🔍 不要ファイル・重複ファイルの特定

### 削除推奨ファイル
1. **Zone.Identifierファイル** (Windows関連)
   - `README .md:Zone.Identifier`
   - `cursor_instructions.md:Zone.Identifier`
   - `combined_test_instructions.md:Zone.Identifier`
   - `activity_20360913386.csv:Zone.Identifier`

2. **重複ドキュメント**
   - `combined_test_instructions.md` (既に他のガイドに統合済み)
   - `cursor_instructions.md` (開発用メモ)

3. **古いバックアップファイル**
   - `.env.backup`

### 整理推奨ディレクトリ
1. **ドキュメント整理**
   - ルートディレクトリに散在する.mdファイルを`docs/`ディレクトリに統合
   - 日本語ファイル名の英語化検討

2. **スクリプトファイル整理**
   - `start.sh`, `start_backend.sh`, `start_frontend.sh`の統合
   - `stop.sh`の機能確認

## 📈 コード品質指標

### バックエンド
- **Pythonファイル数**: 約50個
- **APIエンドポイント**: 19個
- **スキーマ定義**: 14個
- **サービス層**: 7個

### フロントエンド
- **TypeScript/TSXファイル**: 約60個
- **コンポーネント数**: 28個
- **カスタムフック**: 4個
- **テストファイル**: 12個

## 🚨 発見された問題

### 1. ディスク使用量
- **フロントエンド**: 723MB (node_modules含む)
- **バックエンド**: 479MB (venv含む)
- **合計**: 1.2GB (開発環境としては大きい)

### 2. ファイル命名
- スペースを含むファイル名 (`README .md`)
- Zone.Identifierファイルの存在

### 3. ドキュメント散在
- ルートディレクトリに多数の.mdファイル
- 日本語ファイル名の混在

## 💡 改善提案

### 即座に実行可能
1. **Zone.Identifierファイルの削除**
2. **重複ドキュメントの統合**
3. **ファイル名の正規化**

### 中期的改善
1. **docs/ディレクトリの作成とドキュメント統合**
2. **スクリプトファイルの統合**
3. **node_modulesの最適化**

### 長期的改善
1. **モノレポ構造の検討**
2. **CI/CDパイプラインの最適化**
3. **アーキテクチャドキュメントの整備**

## 📋 次のステップ

1. **Phase 2**: README.mdの完全更新
2. **Phase 3**: API仕様書の生成
3. **Phase 4**: テスト実行・検証
4. **Phase 5**: セキュリティ監査

---

**分析者**: AI Assistant  
**分析完了日時**: 2025年9月25日 17:15

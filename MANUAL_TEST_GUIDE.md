# RacePredictor 手動テストガイド

## 概要
このガイドでは、RacePredictorアプリケーションの手動テスト環境のセットアップとテスト手順について説明します。

## 🚀 クイックスタート

### 1. テスト環境の起動
```bash
# テスト環境を起動
./setup_manual_test.sh
```

### 2. サービス連携確認
```bash
# 全サービスの動作確認
./verify_services.py
```

### 3. テストユーザー作成
```bash
# テスト用ユーザーを作成
./create_test_users.py
```

### 4. API動作確認
```bash
# API エンドポイントの動作確認
./test_api_endpoints.py
```

## 📱 アクセス情報

| サービス | URL | 説明 |
|---------|-----|------|
| フロントエンド | http://localhost:3001 | React アプリケーション |
| バックエンドAPI | http://localhost:8001 | FastAPI サーバー |
| API ドキュメント | http://localhost:8001/docs | Swagger UI |
| データベース | localhost:5433 | PostgreSQL |

## 🧪 手動テスト手順

### 1. ユーザー認証テスト

#### 1.1 ユーザー登録
1. フロントエンド (http://localhost:3001) にアクセス
2. 「新規登録」をクリック
3. 以下の情報を入力：
   - Email: `test@example.com`
   - Password: `testpassword123`
   - Name: `テストユーザー`
4. 「登録」ボタンをクリック
5. 登録成功メッセージが表示されることを確認

#### 1.2 ユーザーログイン
1. 「ログイン」ページに移動
2. 登録した情報でログイン
3. ダッシュボードに遷移することを確認

### 2. ワークアウト管理テスト

#### 2.1 ワークアウト登録
1. 「ワークアウト」メニューをクリック
2. 「新しいワークアウト」をクリック
3. 以下の情報を入力：
   - 日付: `2024-01-15`
   - 距離: `5.0`
   - 時間: `25:30`
   - 種別: `ランニング`
   - メモ: `テストワークアウト`
4. 「保存」ボタンをクリック
5. ワークアウト一覧に追加されることを確認

#### 2.2 ワークアウト一覧表示
1. ワークアウト一覧ページで登録したワークアウトが表示されることを確認
2. 距離、時間、ペースが正しく計算されていることを確認

#### 2.3 CSVインポート
1. 「インポート」メニューをクリック
2. `test_data/sample_workouts.csv` をアップロード
3. プレビューでデータが正しく表示されることを確認
4. 「インポート実行」をクリック
5. ワークアウト一覧にデータが追加されることを確認

### 3. レース管理テスト

#### 3.1 レース登録
1. 「レース」メニューをクリック
2. 「新しいレース」をクリック
3. 以下の情報を入力：
   - レース名: `東京マラソン`
   - 日付: `2024-03-10`
   - 距離: `42.195`
   - 場所: `東京`
   - 目標タイム: `3:30:00`
   - メモ: `初マラソン挑戦`
4. 「保存」ボタンをクリック
5. レース一覧に追加されることを確認

#### 3.2 レース一覧表示
1. レース一覧ページで登録したレースが表示されることを確認
2. レース詳細ページで情報が正しく表示されることを確認

### 4. 予測機能テスト

#### 4.1 タイム予測
1. レース詳細ページで「予測を実行」をクリック
2. 目標タイムを入力
3. 「予測実行」ボタンをクリック
4. 予測結果が表示されることを確認：
   - 必要な練習距離
   - 推奨ペース
   - 達成確率

#### 4.2 ダッシュボード表示
1. ダッシュボードページで以下が表示されることを確認：
   - 最近のワークアウト
   - 週間目標の進捗
   - 統計情報
   - グラフ表示

### 5. レスポンシブデザインテスト

#### 5.1 モバイル表示
1. ブラウザの開発者ツールでモバイル表示に切り替え
2. 各ページが適切に表示されることを確認
3. ナビゲーションメニューが正しく動作することを確認

#### 5.2 タブレット表示
1. タブレットサイズで表示を確認
2. レイアウトが適切に調整されることを確認

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. サービスが起動しない
```bash
# Docker コンテナの状態確認
docker-compose -f docker-compose.test.yml ps

# ログ確認
docker-compose -f docker-compose.test.yml logs

# コンテナの再起動
docker-compose -f docker-compose.test.yml restart
```

#### 2. データベース接続エラー
```bash
# データベースコンテナの状態確認
docker-compose -f docker-compose.test.yml logs db-test

# データベースの再作成
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d db-test
```

#### 3. フロントエンドが表示されない
```bash
# フロントエンドコンテナの状態確認
docker-compose -f docker-compose.test.yml logs frontend-test

# フロントエンドの再ビルド
docker-compose -f docker-compose.test.yml up --build -d frontend-test
```

#### 4. API エラー
```bash
# バックエンドコンテナの状態確認
docker-compose -f docker-compose.test.yml logs backend-test

# API ドキュメントでエンドポイント確認
# http://localhost:8001/docs
```

### ログの確認方法

#### リアルタイムログ
```bash
# 全サービスのログ
docker-compose -f docker-compose.test.yml logs -f

# 特定サービスのログ
docker-compose -f docker-compose.test.yml logs -f backend-test
docker-compose -f docker-compose.test.yml logs -f frontend-test
docker-compose -f docker-compose.test.yml logs -f db-test
```

#### アプリケーションログ
```bash
# バックエンドのアプリケーションログ
docker-compose -f docker-compose.test.yml exec backend-test tail -f /app/logs/racepredictor.log

# エラーログ
docker-compose -f docker-compose.test.yml exec backend-test tail -f /app/logs/error.log
```

## 📊 テストデータ

### サンプルファイル
- `test_data/sample_workouts.csv`: サンプルワークアウトデータ
- `test_data/sample_races.csv`: サンプルレースデータ

### テストユーザー
- Email: `test@example.com`
- Password: `testpassword123`
- Name: `テストユーザー1`

- Email: `runner@example.com`
- Password: `runner123`
- Name: `ランナーテスト`

- Email: `admin@example.com`
- Password: `admin123`
- Name: `管理者テスト`

## 🧹 クリーンアップ

### テスト環境の停止
```bash
# テスト環境の停止
docker-compose -f docker-compose.test.yml down

# データも含めて完全削除
docker-compose -f docker-compose.test.yml down -v
```

### テストデータのリセット
```bash
# データベースボリュームの削除
docker volume rm racepredictor_postgres_test_data

# テスト環境の再起動
./setup_manual_test.sh
```

## 📝 テストチェックリスト

### 基本機能
- [ ] ユーザー登録
- [ ] ユーザーログイン
- [ ] ワークアウト登録
- [ ] ワークアウト一覧表示
- [ ] レース登録
- [ ] レース一覧表示
- [ ] タイム予測
- [ ] CSVインポート

### UI/UX
- [ ] レスポンシブデザイン
- [ ] ナビゲーション
- [ ] フォームバリデーション
- [ ] エラーハンドリング
- [ ] ローディング表示

### パフォーマンス
- [ ] ページ読み込み速度
- [ ] API レスポンス時間
- [ ] 大量データの処理
- [ ] メモリ使用量

## 🎯 テスト完了基準

手動テストが完了したとみなす条件：
1. 全基本機能が正常に動作する
2. エラーが発生しない
3. UI/UX が期待通りに動作する
4. パフォーマンスが許容範囲内である
5. レスポンシブデザインが適切に動作する

---

**注意**: このテスト環境は開発・テスト専用です。本番環境での使用は避けてください。

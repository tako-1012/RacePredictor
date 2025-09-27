# RunMaster AI機能実装ロードマップ

## 事前準備（必須）

### Pythonライブラリ追加
```bash
# requirements.txtに以下を追加
scikit-learn>=1.3.0
numpy>=1.24.0
pandas>=2.0.0
scipy>=1.10.0
joblib>=1.3.0
statsmodels>=0.14.0
matplotlib>=3.7.0
seaborn>=0.12.0
prophet>=1.1.4
celery>=5.3.0
redis>=5.0.0
pydantic-extra-types>=2.0.0
mlflow>=2.8.0
```

### システム依存関係（sudoが必要）
```bash
sudo apt-get update
sudo apt-get install redis-server python3-dev build-essential python3-setuptools
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Phase 1: データベース拡張とモデル管理基盤

### Cursor指示1-1: AIモデル管理テーブル作成
```
RunMasterプロジェクトに、AI機能用のデータベースモデルを追加してください。

1. 新しいSQLAlchemyモデルを作成:
   - AIModel: 学習済みモデルのメタデータ管理
   - PredictionResult: 予測結果の保存
   - FeatureStore: 特徴量データの保存
   - TrainingMetrics: モデル学習時の性能指標

2. 各モデルに必要なフィールド:
   - AIModel: id, name, version, algorithm, created_at, performance_metrics(JSON), is_active
   - PredictionResult: id, user_id, model_id, race_type, distance, predicted_time, confidence, features_used(JSON), created_at
   - FeatureStore: id, user_id, calculation_date, features(JSON), created_at
   - TrainingMetrics: id, model_id, mae, mse, r2_score, training_data_count, created_at

3. Alembicマイグレーションファイルも作成してください
4. backend/app/models/ai.py に配置
```

### Cursor指示1-2: モデル管理サービス作成
```
AIモデルの管理を行うサービスクラスを作成してください。

1. backend/app/services/ml_model_manager.py を作成
2. MLModelManager クラスに以下の機能を実装:
   - save_model(): 学習済みモデルをファイルとDBに保存
   - load_model(): モデルをファイルから読み込み
   - get_active_model(): アクティブなモデルを取得
   - list_models(): モデル一覧を取得
   - delete_model(): モデル削除
   - update_performance(): モデル性能を更新

3. モデルファイルはbackend/ml_models/ディレクトリに保存
4. joblibを使用してモデルをシリアライズ
5. エラーハンドリングとログ機能を追加
```

### Cursor指示1-3: 特徴量管理システム
```
練習データから機械学習用の特徴量を抽出・管理するシステムを作成してください。

1. backend/app/services/feature_store.py を作成
2. FeatureStoreService クラスに以下の機能を実装:
   - calculate_user_features(): ユーザーの特徴量を計算
   - save_features(): 特徴量をDBに保存
   - get_latest_features(): 最新の特徴量を取得
   - get_features_for_training(): 学習用データセット作成

3. 抽出する特徴量（28種類）:
   基本統計: 週間平均距離、練習頻度、平均ペース
   トレンド: 距離トレンド、ペーストレンド、強度トレンド
   強度分布: イージー/テンポ/インターバル/レースの比率
   レース履歴: 最近のレース結果、改善傾向
   生理指標: 年齢、BMI、心拍数データ
   季節性: 練習の一貫性、気象要因

4. pandasとnumpyを使用して効率的に計算
5. データの前処理とクリーニング機能も追加
```

---

## Phase 2: 機械学習パイプライン実装

### Cursor指示2-1: 予測モデル実装
```
複数の機械学習アルゴリズムを実装してください。

1. backend/app/ml/predictors/ ディレクトリ作成
2. 以下のモデルクラスを作成:
   - RandomForestPredictor
   - GradientBoostingPredictor
   - LinearRegressionPredictor
   - RidgeRegressionPredictor

3. 各クラスに共通インターフェース:
   - fit(X, y): モデル学習
   - predict(X): 予測実行
   - get_feature_importance(): 特徴量重要度
   - evaluate(X, y): 性能評価

4. BasePredictor抽象クラスを作成して継承
5. scikit-learnを使用
6. ハイパーパラメータの最適化機能を含める
```

### Cursor指示2-2: アンサンブル予測システム
```
複数のモデルを組み合わせたアンサンブル予測システムを実装してください。

1. backend/app/ml/ensemble_predictor.py を作成
2. EnsemblePredictor クラスに以下の機能:
   - add_model(): 予測モデルを追加
   - fit(): 全モデルを学習
   - predict(): 重み付きアンサンブル予測
   - calculate_confidence(): 予測信頼度計算
   - get_model_weights(): モデル重みを取得

3. 重み計算方法:
   - 各モデルの性能に基づく重み付け
   - 交差検証による重み最適化
   - 動的重み調整機能

4. 信頼度計算:
   - 予測値の分散による信頼度
   - モデル合意度による信頼度
   - データ量による調整

5. フォールバック機能: AI予測失敗時の統計的予測
```

### Cursor指示2-3: モデル学習・評価システム
```
自動的にモデルを学習・評価するシステムを実装してください。

1. backend/app/ml/training_pipeline.py を作成
2. TrainingPipeline クラスに以下の機能:
   - prepare_training_data(): 学習データの準備
   - split_data(): 訓練・検証・テストデータ分割
   - train_models(): 全モデルの学習実行
   - evaluate_models(): モデル性能評価
   - save_best_model(): 最良モデルの保存

3. 評価指標:
   - MAE (Mean Absolute Error)
   - MSE (Mean Squared Error)
   - R² Score
   - MAPE (Mean Absolute Percentage Error)

4. 交差検証とグリッドサーチの実装
5. 学習結果の可視化とレポート生成
6. モデルの自動選択機能
```

---

## Phase 3: タイム予測API実装

### Cursor指示3-1: 予測API エンドポイント
```
タイム予測を行うAPIエンドポイントを実装してください。

1. backend/app/api/ai_predictions.py を作成
2. 以下のエンドポイントを実装:
   
   POST /api/ai/predict-time
   - リクエスト: race_type, distance, user_id
   - レスポンス: predicted_time, confidence, model_used, features_used
   
   GET /api/ai/prediction-history
   - ユーザーの予測履歴を取得
   - ページネーション対応
   
   GET /api/ai/model-performance
   - 現在使用中モデルの性能情報

3. Pydanticスキーマも作成:
   - PredictionRequest
   - PredictionResponse
   - PredictionHistory

4. 認証とバリデーション
5. エラーハンドリングとログ
```

### Cursor指示3-2: 予測結果管理システム
```
予測結果の保存・管理システムを実装してください。

1. backend/app/services/prediction_service.py を作成
2. PredictionService クラスに以下の機能:
   - execute_prediction(): AI予測の実行
   - save_prediction_result(): 予測結果の保存
   - get_prediction_history(): 予測履歴の取得
   - compare_with_actual(): 実績との比較分析
   - calculate_accuracy(): 予測精度の計算

3. 実装する分析機能:
   - 予測精度の時系列変化
   - 種目別・距離別の精度分析
   - ユーザー別の予測傾向
   - モデル別の性能比較

4. 統計的フォールバック:
   - AI予測失敗時の代替予測
   - 同年代・同レベルの統計的予測
   - 単純な時系列予測
```

### Cursor指示3-3: バックグラウンド処理システム
```
重い計算処理をバックグラウンドで実行するシステムを実装してください。

1. Celeryの設定:
   - backend/app/core/celery_app.py を作成
   - Redis をブローカーとして設定
   - タスクの設定とルーティング

2. backend/app/tasks/ ディレクトリ作成
3. 以下のタスクを実装:
   - train_models_task(): モデル学習タスク
   - batch_prediction_task(): バッチ予測処理
   - feature_calculation_task(): 特徴量計算
   - performance_analysis_task(): 性能分析

4. タスク管理API:
   - GET /api/tasks/status/{task_id}
   - GET /api/tasks/results/{task_id}
   - POST /api/tasks/cancel/{task_id}

5. 進捗表示とエラー処理
6. 定期実行スケジュール設定
```

---

## Phase 4: コーチング機能実装

### Cursor指示4-1: 練習プラン生成エンジン
```
個人化された練習プランを生成するシステムを実装してください。

1. backend/app/ml/coaching/workout_planner.py を作成
2. WorkoutPlanner クラスに以下の機能:
   - generate_weekly_plan(): 週間プラン生成
   - generate_periodized_plan(): 期分け計画生成
   - analyze_weaknesses(): 弱点分析
   - suggest_workouts(): 練習提案

3. 考慮する要素:
   - 目標レースとレース日
   - 現在の実力と過去の実績
   - 週間走行距離と練習頻度
   - 個人の得意・不得意分野
   - 怪我歴と回復状況

4. 生成する練習プラン:
   - 基礎期・鍛練期・調整期の期分け
   - 週間メニューの詳細
   - 強度別練習の配分
   - 休養日の配置

5. 科学的根拠に基づく計画立案
```

### Cursor指示4-2: 練習効果分析システム
```
各練習の個人への効果を分析するシステムを実装してください。

1. backend/app/ml/coaching/effectiveness_analyzer.py を作成
2. EffectivenessAnalyzer クラスに以下の機能:
   - analyze_workout_effect(): 個別練習の効果分析
   - calculate_training_stress(): 練習ストレス計算
   - predict_adaptation(): 適応予測
   - optimize_training_load(): 練習負荷最適化

3. 分析する指標:
   - 練習後のパフォーマンス変化
   - 心拍数の適応
   - 主観的疲労度との相関
   - 長期的な能力向上への寄与

4. 個人化要素:
   - 年齢・性別による調整
   - 経験レベルでの違い
   - 過去の反応パターン学習
   - 生理的特性の考慮

5. 最適化提案:
   - 練習強度の調整
   - 休養期間の提案
   - 練習種目の変更提案
```

### Cursor指示4-3: コーチングAPI実装
```
コーチング機能のAPIエンドポイントを実装してください。

1. backend/app/api/ai_coaching.py を作成
2. 以下のエンドポイントを実装:

   POST /api/ai/generate-plan
   - 個人化された練習プラン生成
   - 目標レースと現在の状況から最適プラン作成

   GET /api/ai/workout-recommendations
   - 今日の推奨練習を取得
   - 疲労度と目標を考慮した提案

   POST /api/ai/analyze-effectiveness
   - 完了した練習の効果分析
   - 次回練習への調整提案

   GET /api/ai/training-insights
   - 練習パフォーマンスの洞察
   - 改善点と強化点の分析

3. Pydanticスキーマ作成
4. 認証・バリデーション・エラーハンドリング
5. 詳細なログとモニタリング
```

---

## Phase 5: 怪我予防・調子分析システム

### Cursor指示5-1: 調子分析エンジン
```
ユーザーの調子とコンディションを分析するシステムを実装してください。

1. backend/app/ml/health/condition_analyzer.py を作成
2. ConditionAnalyzer クラスに以下の機能:
   - analyze_condition(): 現在の調子分析
   - detect_overtraining(): オーバートレーニング検出
   - calculate_readiness(): 練習準備度計算
   - predict_recovery_time(): 回復時間予測

3. 分析指標:
   - 心拍変動（HRV）の変化
   - 主観的疲労度とパフォーマンス
   - 睡眠質と練習効果の相関
   - 練習負荷と回復のバランス

4. 機械学習モデル:
   - 異常検知モデル（Isolation Forest）
   - 時系列予測モデル（ARIMA/Prophet）
   - 分類モデル（調子の良/悪判定）

5. アラート機能:
   - 疲労蓄積の早期警告
   - 体調不良の兆候検出
   - 休養推奨のタイミング
```

### Cursor指示5-2: 怪我予防システム
```
怪我リスクを予測・予防するシステムを実装してください。

1. backend/app/ml/health/injury_predictor.py を作成
2. InjuryPredictor クラスに以下の機能:
   - assess_injury_risk(): 怪我リスク評価
   - identify_risk_factors(): リスク要因特定
   - recommend_prevention(): 予防策提案
   - monitor_warning_signs(): 警告サイン監視

3. リスク要因分析:
   - 急激な練習量増加
   - 不適切な強度配分
   - 回復不足での練習継続
   - 過去の怪我歴との関連

4. 予防策生成:
   - 練習量の段階的増加提案
   - 適切な休養日設定
   - 補強運動の推奨
   - ストレッチ・ケアの提案

5. 統計的分析:
   - 怪我発生パターンの分析
   - 同年代・同レベルとの比較
   - 季節性・環境要因の考慮
```

### Cursor指示5-3: リアルタイム監視API
```
調子と怪我リスクをリアルタイムで監視するAPIを実装してください。

1. backend/app/api/ai_health.py を作成
2. 以下のエンドポイントを実装:

   GET /api/ai/condition-analysis
   - 現在のコンディション分析結果
   - 疲労度・回復度・調子スコア

   POST /api/ai/risk-assessment
   - 怪我リスクの評価実行
   - リスクレベルと要因分析

   GET /api/ai/recovery-recommendations
   - 回復促進の推奨事項
   - 休養・ケア・栄養の提案

   GET /api/ai/health-trends
   - 健康状態の長期トレンド
   - 改善・悪化傾向の分析

3. ウェブhook機能:
   - 高リスク時の自動アラート
   - 外部システムへの通知

4. 詳細なログとモニタリング
5. プライバシーとセキュリティ対策
```

---

## Phase 6: システム統合とテスト

### Cursor指示6-1: 統合テスト実装
```
AI機能の統合テストを実装してください。

1. tests/test_ai/ ディレクトリ作成
2. 以下のテストを実装:
   - test_prediction_pipeline.py: 予測パイプライン
   - test_coaching_system.py: コーチングシステム
   - test_health_monitoring.py: 健康監視システム
   - test_ml_models.py: 機械学習モデル

3. テスト内容:
   - 各APIエンドポイントの動作確認
   - モデル学習・予測の精度テスト
   - バックグラウンドタスクの実行テスト
   - エラーハンドリングの確認

4. モックデータの作成:
   - 仮想ユーザーの練習データ
   - 様々なレベルのランナーデータ
   - 異常ケースのテストデータ

5. パフォーマンステスト:
   - 大量データでの処理速度
   - 同時リクエストの処理能力
   - メモリ使用量の監視
```

### Cursor指示6-2: AI機能管理画面
```
管理者用のAI機能管理画面を実装してください。

1. backend/app/api/admin/ai_management.py を作成
2. 管理者用エンドポイント:
   - GET /api/admin/ai/models: モデル一覧
   - POST /api/admin/ai/train: モデル学習実行
   - GET /api/admin/ai/performance: システム性能
   - POST /api/admin/ai/config: AI設定変更

3. 監視ダッシュボード機能:
   - 予測精度の推移グラフ
   - システムリソース使用状況
   - エラー発生状況
   - ユーザー利用統計

4. 設定管理機能:
   - 予測モデルの有効/無効切り替え
   - アルゴリズムパラメータの調整
   - アラート設定の変更
   - データ保持期間の設定

5. セキュリティ機能:
   - 管理者認証
   - 操作ログの記録
   - 重要操作の確認ダイアログ
```

### Cursor指示6-3: ドキュメントとデプロイ準備
```
AI機能のドキュメント作成とデプロイ準備を行ってください。

1. ドキュメント作成:
   - docs/ai_system_architecture.md
   - docs/ml_model_documentation.md
   - docs/api_reference_ai.md
   - docs/deployment_guide_ai.md

2. 設定ファイル更新:
   - docker-compose.prod.yml にRedis追加
   - requirements.txt の最終確認
   - 環境変数の追加設定

3. デプロイスクリプト更新:
   - AI機能用の初期化処理追加
   - モデルファイルのマイグレーション
   - Redis・Celeryの起動設定

4. モニタリング設定:
   - AI機能のログ設定
   - パフォーマンス監視の設定
   - アラート設定の追加

5. バックアップ戦略:
   - 学習済みモデルのバックアップ
   - 特徴量データのバックアップ
   - 設定ファイルのバックアップ

注意: フロントエンド実装は含めず、APIのみ実装
```

---

## 実装順序と注意点

### 実装順序
1. Phase 1 → Phase 2 → Phase 3 の順で実装
2. 各Phaseで動作確認してから次に進む
3. Phase 4, 5, 6 は並行実装可能

### 注意点
- フロントエンド実装は一切含めない（APIのみ）
- AI機能はデプロイ時に無効化する設定を用意
- テストデータでの動作確認を必須とする
- セキュリティとプライバシーに十分配慮
- スケーラビリティを考慮した設計

### 設定管理
- AI機能の有効/無効を環境変数で制御
- 開発環境でのみAI機能を有効化
- 本番デプロイ時はAI機能を無効化

この順序で実装すれば、ユーザーに見えることなくAI機能の完全な実装が可能です。
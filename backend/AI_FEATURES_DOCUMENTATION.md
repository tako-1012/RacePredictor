# RunMaster AI機能 完全実装ドキュメント

## 概要

RunMaster AI機能は、ランニングパフォーマンスの予測、パーソナライズされたコーチング、ヘルスモニタリング、怪我予防を提供する包括的なAIシステムです。本ドキュメントでは、実装された全機能の詳細な説明、API仕様、設定方法、デプロイメント手順を提供します。

## 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [Phase 1: データベース拡張とモデル管理基盤](#phase-1-データベース拡張とモデル管理基盤)
3. [Phase 2: 機械学習パイプライン実装](#phase-2-機械学習パイプライン実装)
4. [Phase 3: タイム予測API実装](#phase-3-タイム予測api実装)
5. [Phase 4: コーチング機能実装](#phase-4-コーチング機能実装)
6. [Phase 5: 怪我予防・調子分析システム](#phase-5-怪我予防調子分析システム)
7. [Phase 6: システム統合とテスト](#phase-6-システム統合とテスト)
8. [API仕様](#api仕様)
9. [設定とデプロイメント](#設定とデプロイメント)
10. [テストとモニタリング](#テストとモニタリング)
11. [トラブルシューティング](#トラブルシューティング)

## アーキテクチャ概要

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (ML Pipeline) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (PostgreSQL)  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis/Celery  │
                       │   (Background)  │
                       └─────────────────┘
```

### 主要コンポーネント

- **データベース層**: SQLAlchemy + Alembic
- **API層**: FastAPI
- **機械学習層**: scikit-learn, numpy, pandas
- **バックグラウンド処理**: Celery + Redis
- **特徴量管理**: Feature Store
- **モデル管理**: ML Model Manager
- **予測サービス**: Prediction Service
- **コーチング**: Workout Planner + Effectiveness Analyzer
- **ヘルスモニタリング**: Condition Analyzer + Injury Predictor

## Phase 1: データベース拡張とモデル管理基盤

### データベースモデル

#### AIModel
```python
class AIModel(Base):
    __tablename__ = "ai_models"
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    performance_metrics = Column(JSON)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
```

#### PredictionResult
```python
class PredictionResult(Base):
    __tablename__ = "prediction_results"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    model_id = Column(String(36), ForeignKey("ai_models.id"))
    target_distance = Column(Float, nullable=False)
    race_type = Column(String(50), nullable=False)
    predicted_time_minutes = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    conditions = Column(JSON)
    features_used = Column(JSON)
    created_at = Column(DateTime, default=func.now())
```

#### FeatureStore
```python
class FeatureStore(Base):
    __tablename__ = "feature_store"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    features = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=func.now())
```

#### TrainingMetrics
```python
class TrainingMetrics(Base):
    __tablename__ = "training_metrics"
    id = Column(String(36), primary_key=True)
    model_id = Column(String(36), ForeignKey("ai_models.id"))
    training_data_size = Column(Integer)
    validation_data_size = Column(Integer)
    performance_metrics = Column(JSON)
    hyperparameters = Column(JSON)
    created_at = Column(DateTime, default=func.now())
```

#### ModelTrainingJob
```python
class ModelTrainingJob(Base):
    __tablename__ = "model_training_jobs"
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    status = Column(String(20), nullable=False)
    target_distance = Column(Float)
    target_time_minutes = Column(Float)
    training_data_size = Column(Integer)
    models_trained = Column(Integer)
    best_model_id = Column(String(36))
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
```

#### AISystemConfig
```python
class AISystemConfig(Base):
    __tablename__ = "ai_system_config"
    id = Column(String(36), primary_key=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

### マイグレーション

```bash
# マイグレーションファイルの生成
alembic revision --autogenerate -m "add_ai_models_tables"

# マイグレーションの実行
alembic upgrade head
```

### サービス層

#### MLModelManager
- モデルの保存・読み込み
- モデルのアクティベーション
- 性能メトリクスの更新
- モデルの一覧取得

#### FeatureStoreService
- 特徴量の計算・抽出
- 特徴量の保存・取得
- 特徴量の履歴管理
- 特徴量のクリーンアップ

## Phase 2: 機械学習パイプライン実装

### 予測器クラス

#### BasePredictor
```python
class BasePredictor(ABC):
    @abstractmethod
    async def predict(self, features: Dict[str, Any], conditions: Dict[str, Any]) -> PredictionResult:
        pass
    
    @abstractmethod
    async def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        pass
```

#### 実装された予測器
1. **RandomForestPredictor**: ランダムフォレスト回帰
2. **GradientBoostingPredictor**: 勾配ブースティング回帰
3. **LinearRegressionPredictor**: 線形回帰
4. **RidgeRegressionPredictor**: リッジ回帰

### アンサンブル予測器

```python
class EnsemblePredictor:
    async def predict_ensemble(self, user_id: str, target_distance: float, conditions: Dict[str, Any]) -> PredictionResult:
        # 複数のモデルで予測を実行
        # 重み付き平均で最終予測を計算
        # 信頼度スコアを計算
```

### トレーニングパイプライン

```python
class TrainingPipeline:
    async def train_models(self, user_id: str, target_distance: float, target_time_minutes: float) -> ModelTrainingJob:
        # トレーニングデータの準備
        # 複数モデルの訓練
        # 性能評価と最良モデルの選択
        # ハイパーパラメータ最適化
```

## Phase 3: タイム予測API実装

### API エンドポイント

#### 予測API
```http
POST /api/ai/predict-time
Content-Type: application/json

{
    "target_distance": 5.0,
    "race_type": "5k",
    "conditions": {
        "temperature": 20,
        "humidity": 60,
        "wind_speed": 5,
        "elevation_gain": 0
    }
}
```

#### 予測履歴API
```http
GET /api/ai/prediction-history?user_id={user_id}&limit=10&offset=0
```

#### モデル性能API
```http
GET /api/ai/model-performance?model_id={model_id}
```

### 予測サービス

```python
class PredictionService:
    async def predict_race_time(self, user_id: str, target_distance: float, race_type: str, conditions: Dict[str, Any]) -> PredictionResult:
        # 特徴量の取得
        # モデルの選択
        # 予測の実行
        # 結果の保存
```

### Celeryタスク

```python
@celery_app.task
async def train_model_task(user_id: str, target_distance: float, target_time_minutes: float):
    # バックグラウンドでのモデル訓練

@celery_app.task
async def batch_predict_task(user_ids: List[str], target_distance: float, race_type: str):
    # バッチ予測の実行
```

## Phase 4: コーチング機能実装

### ワークアウトプランナー

```python
class WorkoutPlanner:
    async def generate_training_plan(self, user_id: str, target_distance: float, target_time_minutes: float, weeks: int, current_fitness_level: str) -> TrainingPlan:
        # ユーザープロファイルの分析
        # トレーニングプランの生成
        # ワークアウトの最適化
```

### 効果分析器

```python
class EffectivenessAnalyzer:
    async def analyze_workout_effectiveness(self, user_id: str, workout_id: str) -> EffectivenessAnalysis:
        # ワークアウト効果の分析
        # パフォーマンス指標の計算
        # 推奨事項の生成
```

### コーチングAPI

#### プラン生成API
```http
POST /api/ai/generate-plan
Content-Type: application/json

{
    "target_distance": 10.0,
    "target_time_minutes": 45.0,
    "weeks": 12,
    "current_fitness_level": "intermediate",
    "goals": ["improve_endurance", "increase_speed"]
}
```

#### ワークアウト推奨API
```http
GET /api/ai/workout-recommendations?user_id={user_id}&type={type}
```

## Phase 5: 怪我予防・調子分析システム

### コンディション分析器

```python
class ConditionAnalyzer:
    async def analyze_user_condition(self, user_id: str, analysis_period_days: int = 30) -> ConditionAnalysis:
        # 疲労レベルの分析
        # 回復時間の予測
        # ストレスレベルの評価
        # モチベーションレベルの測定
```

### 怪我予測器

```python
class InjuryPredictor:
    async def assess_injury_risk(self, user_id: str, analysis_period_days: int = 30) -> InjuryRiskAssessment:
        # 怪我リスクの評価
        # リスク要因の特定
        # 予防推奨事項の生成
```

### ヘルスモニタリングAPI

#### コンディション分析API
```http
GET /api/ai/condition-analysis?user_id={user_id}&period_days=30
```

#### 怪我リスク評価API
```http
GET /api/ai/risk-assessment?user_id={user_id}&period_days=30
```

## Phase 6: システム統合とテスト

### 統合テスト

- **エンドツーエンドテスト**: 全機能の連携テスト
- **パフォーマンステスト**: 負荷下での性能テスト
- **エラーハンドリングテスト**: 異常ケースの処理テスト
- **データ整合性テスト**: データの一貫性テスト

### 管理API

#### システム統計API
```http
GET /api/admin/ai/system-stats
```

#### モデル管理API
```http
GET /api/admin/ai/models
POST /api/admin/ai/models/{model_id}/activate
DELETE /api/admin/ai/models/{model_id}
```

## API仕様

### 認証

すべてのAI APIは認証が必要です：

```http
Authorization: Bearer {access_token}
```

### エラーレスポンス

```json
{
    "error": "error_code",
    "message": "Error description",
    "details": {}
}
```

### 共通エラーコード

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## 設定とデプロイメント

### 環境変数

```bash
# AI機能の有効/無効
AI_FEATURES_ENABLED=true

# Redis設定
REDIS_URL=redis://localhost:6379/0

# 機械学習モデル保存パス
ML_MODELS_PATH=/app/models

# 特徴量ストア保持日数
FEATURE_STORE_RETENTION_DAYS=30

# 予測キャッシュTTL（秒）
PREDICTION_CACHE_TTL=3600

# レート制限ウィンドウ（秒）
RATE_LIMIT_WINDOW=60
```

### Docker Compose設定

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - AI_FEATURES_ENABLED=true
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: ./backend
    command: celery -A app.core.celery_app worker --loglevel=info
    environment:
      - AI_FEATURES_ENABLED=true
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - postgres

  celery-beat:
    build: ./backend
    command: celery -A app.core.celery_app beat --loglevel=info
    environment:
      - AI_FEATURES_ENABLED=true
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - postgres
```

### デプロイメント手順

1. **データベースマイグレーション**
   ```bash
   alembic upgrade head
   ```

2. **モデルディレクトリの作成**
   ```bash
   mkdir -p /app/models
   ```

3. **Redisの起動**
   ```bash
   redis-server
   ```

4. **Celeryワーカーの起動**
   ```bash
   celery -A app.core.celery_app worker --loglevel=info
   ```

5. **アプリケーションの起動**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## テストとモニタリング

### テスト実行

```bash
# 全テストの実行
pytest tests/test_ai/ -v

# 特定のテストの実行
pytest tests/test_ai/test_ai_integration.py -v

# カバレッジレポートの生成
pytest --cov=app tests/test_ai/ --cov-report=html
```

### モニタリング

#### システムヘルスチェック
```http
GET /health
```

#### AI機能ステータス
```http
GET /api/admin/ai/system-stats
```

#### モデル性能監視
```http
GET /api/admin/ai/model-performance-stats
```

### ログ設定

```python
import logging

# AI機能専用ロガー
ai_logger = logging.getLogger("ai_features")
ai_logger.setLevel(logging.INFO)

# ファイルハンドラー
file_handler = logging.FileHandler("logs/ai_features.log")
file_handler.setLevel(logging.INFO)

# フォーマッター
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

ai_logger.addHandler(file_handler)
```

## トラブルシューティング

### よくある問題

#### 1. AI機能が無効になっている
**症状**: AI APIが404エラーを返す
**解決方法**: 環境変数`AI_FEATURES_ENABLED=true`を設定

#### 2. Redis接続エラー
**症状**: Celeryタスクが実行されない
**解決方法**: Redisサーバーが起動しているか確認、`REDIS_URL`を正しく設定

#### 3. モデルファイルが見つからない
**症状**: 予測APIが500エラーを返す
**解決方法**: `ML_MODELS_PATH`ディレクトリが存在し、書き込み権限があるか確認

#### 4. データベースマイグレーションエラー
**症状**: アプリケーション起動時にエラー
**解決方法**: `alembic upgrade head`を実行

### パフォーマンス最適化

#### 1. キャッシュの活用
- 予測結果のキャッシュ
- 特徴量のキャッシュ
- モデルのメモリキャッシュ

#### 2. バッチ処理
- 複数ユーザーの同時予測
- 特徴量の一括計算
- モデルの一括訓練

#### 3. データベース最適化
- インデックスの追加
- クエリの最適化
- 接続プールの設定

### セキュリティ考慮事項

#### 1. データ保護
- 個人データの暗号化
- アクセスログの記録
- データ保持ポリシーの実装

#### 2. API セキュリティ
- レート制限の実装
- 入力値の検証
- SQLインジェクション対策

#### 3. モデルセキュリティ
- モデルファイルの保護
- 予測結果の検証
- 悪意のある入力の検出

## 今後の拡張計画

### Phase 7: 高度なAI機能
- 深層学習モデルの導入
- 時系列予測の改善
- リアルタイム適応

### Phase 8: 外部連携
- ウェアラブルデバイス連携
- 天気予報API連携
- ソーシャル機能

### Phase 9: パーソナライゼーション
- ユーザー行動分析
- 個別最適化
- 学習機能の強化

## まとめ

RunMaster AI機能は、6つのフェーズに分けて包括的に実装されました。各フェーズは独立してテスト可能で、段階的なデプロイメントが可能です。環境変数による制御により、本番環境での柔軟な運用が可能です。

実装された機能：
- ✅ データベース拡張とモデル管理基盤
- ✅ 機械学習パイプライン実装
- ✅ タイム予測API実装
- ✅ コーチング機能実装
- ✅ 怪我予防・調子分析システム
- ✅ システム統合とテスト

すべての機能は本番環境での使用を想定して設計され、エラーハンドリング、ログ機能、モニタリング機能が含まれています。

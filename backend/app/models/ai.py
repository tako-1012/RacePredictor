"""
AI機能用のデータベースモデル

このモジュールには機械学習機能に必要な以下のモデルが含まれます：
- AIModel: 学習済みモデルのメタデータ管理
- PredictionResult: 予測結果の保存
- FeatureStore: 特徴量データの保存
- TrainingMetrics: モデル学習時の性能指標
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class AIModel(Base):
    """AIモデルのメタデータ管理テーブル"""
    __tablename__ = "ai_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=False, index=True, comment="モデル名")
    version = Column(String(50), nullable=False, comment="モデルバージョン")
    algorithm = Column(String(100), nullable=False, comment="使用アルゴリズム")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="作成日時")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新日時")
    performance_metrics = Column(JSON, comment="性能指標（MAE, MSE, R²等）")
    is_active = Column(Boolean, default=False, comment="アクティブフラグ")
    model_path = Column(String(500), comment="モデルファイルのパス")
    training_data_count = Column(Integer, comment="学習データ数")
    feature_count = Column(Integer, comment="特徴量数")
    hyperparameters = Column(JSON, comment="ハイパーパラメータ")
    description = Column(Text, comment="モデル説明")

    # リレーション
    predictions = relationship("PredictionResult", back_populates="model")
    training_metrics = relationship("TrainingMetrics", back_populates="model")

    def __repr__(self):
        return f"<AIModel(id={self.id}, name='{self.name}', version='{self.version}', algorithm='{self.algorithm}')>"


class PredictionResult(Base):
    """予測結果の保存テーブル"""
    __tablename__ = "prediction_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True, comment="ユーザーID")
    model_id = Column(String(36), ForeignKey("ai_models.id"), nullable=False, index=True, comment="モデルID")
    race_type = Column(String(100), nullable=False, comment="レース種目")
    distance = Column(Float, nullable=False, comment="距離（km）")
    predicted_time = Column(Float, nullable=False, comment="予測タイム（秒）")
    confidence = Column(Float, comment="予測信頼度（0-1）")
    features_used = Column(JSON, comment="使用した特徴量")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="予測日時")
    
    # 実績データ（後で比較分析用）
    actual_time = Column(Float, comment="実際のタイム（秒）")
    actual_date = Column(DateTime(timezone=True), comment="実際のレース日時")
    prediction_accuracy = Column(Float, comment="予測精度（実績との差）")
    
    # リレーション
    user = relationship("User", back_populates="prediction_results")
    model = relationship("AIModel", back_populates="predictions")

    def __repr__(self):
        return f"<PredictionResult(id={self.id}, user_id={self.user_id}, race_type='{self.race_type}', distance={self.distance})>"


class FeatureStore(Base):
    """特徴量データの保存テーブル"""
    __tablename__ = "feature_store"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True, comment="ユーザーID")
    calculation_date = Column(DateTime(timezone=True), server_default=func.now(), comment="計算日時")
    features = Column(JSON, nullable=False, comment="特徴量データ")
    feature_version = Column(String(50), default="v1.0", comment="特徴量バージョン")
    
    # 特徴量の統計情報
    total_workouts = Column(Integer, comment="総練習数")
    total_distance = Column(Float, comment="総距離")
    avg_pace = Column(Float, comment="平均ペース")
    training_period_days = Column(Integer, comment="練習期間（日数）")
    
    # リレーション
    user = relationship("User", back_populates="feature_data")

    def __repr__(self):
        return f"<FeatureStore(id={self.id}, user_id={self.user_id}, calculation_date='{self.calculation_date}')>"


class TrainingMetrics(Base):
    """モデル学習時の性能指標テーブル"""
    __tablename__ = "training_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_id = Column(String(36), ForeignKey("ai_models.id"), nullable=False, index=True, comment="モデルID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="記録日時")
    
    # 性能指標
    mae = Column(Float, comment="平均絶対誤差")
    mse = Column(Float, comment="平均二乗誤差")
    rmse = Column(Float, comment="平方根平均二乗誤差")
    r2_score = Column(Float, comment="決定係数")
    mape = Column(Float, comment="平均絶対パーセント誤差")
    
    # データ情報
    training_data_count = Column(Integer, comment="学習データ数")
    validation_data_count = Column(Integer, comment="検証データ数")
    test_data_count = Column(Integer, comment="テストデータ数")
    
    # 学習情報
    training_time_seconds = Column(Float, comment="学習時間（秒）")
    cross_validation_scores = Column(JSON, comment="交差検証スコア")
    feature_importance = Column(JSON, comment="特徴量重要度")
    
    # リレーション
    model = relationship("AIModel", back_populates="training_metrics")

    def __repr__(self):
        return f"<TrainingMetrics(id={self.id}, model_id={self.model_id}, mae={self.mae}, r2_score={self.r2_score})>"


class ModelTrainingJob(Base):
    """モデル学習ジョブの管理テーブル"""
    __tablename__ = "model_training_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    job_id = Column(String(255), unique=True, nullable=False, index=True, comment="ジョブID")
    status = Column(String(50), default="pending", comment="ジョブステータス")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="作成日時")
    started_at = Column(DateTime(timezone=True), comment="開始日時")
    completed_at = Column(DateTime(timezone=True), comment="完了日時")
    
    # ジョブ情報
    algorithm = Column(String(100), comment="使用アルゴリズム")
    training_data_count = Column(Integer, comment="学習データ数")
    hyperparameters = Column(JSON, comment="ハイパーパラメータ")
    
    # 結果
    result_model_id = Column(Integer, ForeignKey("ai_models.id"), comment="結果モデルID")
    error_message = Column(Text, comment="エラーメッセージ")
    performance_metrics = Column(JSON, comment="性能指標")
    
    # リレーション
    result_model = relationship("AIModel")

    def __repr__(self):
        return f"<ModelTrainingJob(id={self.id}, job_id='{self.job_id}', status='{self.status}')>"


class AISystemConfig(Base):
    """AI機能のシステム設定テーブル"""
    __tablename__ = "ai_system_config"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    config_key = Column(String(255), unique=True, nullable=False, index=True, comment="設定キー")
    config_value = Column(JSON, nullable=False, comment="設定値")
    description = Column(Text, comment="設定説明")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="作成日時")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新日時")

    def __repr__(self):
        return f"<AISystemConfig(id={self.id}, config_key='{self.config_key}')>"

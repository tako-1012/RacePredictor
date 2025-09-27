from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class WorkoutImportData(Base):
    """ワークアウトインポートデータ（元データと修正データを保持）"""
    __tablename__ = "workout_import_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    workout_id = Column(String(36), ForeignKey("workouts.id"), nullable=True)  # 関連するワークアウトID
    
    # 元データ（生データ）
    raw_data = Column(JSON, nullable=False)  # インポート時の元データ
    
    # 修正データ
    processed_data = Column(JSON, nullable=True)  # 修正後のデータ
    
    # ユーザー選択
    user_choice = Column(String(20), default='raw')  # 'raw' または 'processed'
    
    # 修正内容の記録
    modifications = Column(JSON, nullable=True)  # 修正内容の詳細記録
    
    # 異常検出結果
    anomaly_detection = Column(JSON, nullable=True)  # 異常検出の結果
    
    # メタデータ
    import_source = Column(String(50))  # 'csv', 'garmin', 'strava', etc.
    import_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    last_modified = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    user = relationship("User")
    workout = relationship("Workout")


class IntervalAnalysis(Base):
    """インターバル分析結果"""
    __tablename__ = "interval_analysis"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workout_import_data_id = Column(String(36), ForeignKey("workout_import_data.id"), nullable=False)
    
    # 分析結果
    total_laps = Column(Integer, nullable=False)
    average_lap_time = Column(Integer)  # 秒
    average_lap_distance = Column(Integer)  # メートル
    
    # 異常検出結果
    has_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String(50))  # 'short_last_lap', 'extra_lap', 'missing_lap', etc.
    anomaly_lap_index = Column(Integer)  # 異常なラップのインデックス
    anomaly_severity = Column(String(20))  # 'low', 'medium', 'high'
    
    # 統計情報
    lap_times = Column(JSON)  # 各ラップのタイム配列
    lap_distances = Column(JSON)  # 各ラップの距離配列
    lap_paces = Column(JSON)  # 各ラップのペース配列
    
    # 修正提案
    suggested_corrections = Column(JSON)  # 修正提案の配列
    
    # メタデータ
    analysis_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # リレーション
    workout_import_data = relationship("WorkoutImportData")

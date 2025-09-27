from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, ForeignKey, JSON, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class DailyMetrics(Base):
    """毎日のコンディション記録"""
    __tablename__ = "daily_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # 身体データ
    weight_kg = Column(Float)  # 体重（kg）
    body_fat_percentage = Column(Float)  # 体脂肪率（%）
    muscle_mass_kg = Column(Float)  # 筋肉量（kg）
    
    # 睡眠データ
    sleep_duration_hours = Column(Float)  # 睡眠時間（時間）
    sleep_quality_score = Column(Integer)  # 睡眠の質（1-10）
    bedtime = Column(String(10))  # 就寝時間（HH:MM）
    wake_time = Column(String(10))  # 起床時間（HH:MM）
    
    # コンディション評価
    fatigue_level = Column(Integer)  # 疲労度（1-10）
    motivation_level = Column(Integer)  # モチベーション（1-10）
    stress_level = Column(Integer)  # ストレスレベル（1-10）
    energy_level = Column(Integer)  # エネルギーレベル（1-10）
    
    # 運動関連
    training_readiness = Column(Integer)  # トレーニング準備度（1-10）
    recovery_status = Column(String(20))  # 回復状態（excellent, good, fair, poor）
    
    # 健康指標
    resting_heart_rate = Column(Integer)  # 安静時心拍数（bpm）
    blood_pressure_systolic = Column(Integer)  # 収縮期血圧（mmHg）
    blood_pressure_diastolic = Column(Integer)  # 拡張期血圧（mmHg）
    
    # メモ・その他
    notes = Column(String(500))  # メモ
    mood_tags = Column(JSON)  # 気分タグ（配列）
    
    # メタデータ
    is_estimated = Column(Boolean, default=False)  # 推定値かどうか
    data_source = Column(String(50))  # データソース（manual, device, app）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User")


class WeeklyMetricsSummary(Base):
    """週間メトリクスサマリー"""
    __tablename__ = "weekly_metrics_summary"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    week_start_date = Column(Date, nullable=False)  # 週の開始日（月曜日）
    week_end_date = Column(Date, nullable=False)  # 週の終了日（日曜日）
    
    # 週間平均値
    avg_weight_kg = Column(Float)
    avg_sleep_duration_hours = Column(Float)
    avg_fatigue_level = Column(Float)
    avg_motivation_level = Column(Float)
    avg_stress_level = Column(Float)
    avg_energy_level = Column(Float)
    avg_training_readiness = Column(Float)
    avg_resting_heart_rate = Column(Float)
    
    # 週間トレンド
    weight_trend = Column(String(20))  # increasing, decreasing, stable
    sleep_trend = Column(String(20))
    fatigue_trend = Column(String(20))
    motivation_trend = Column(String(20))
    
    # データ品質
    data_completeness = Column(Float)  # データ完全性（0-1）
    days_recorded = Column(Integer)  # 記録日数
    
    # メタデータ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User")


class MonthlyMetricsSummary(Base):
    """月間メトリクスサマリー"""
    __tablename__ = "monthly_metrics_summary"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    
    # 月間平均値
    avg_weight_kg = Column(Float)
    avg_sleep_duration_hours = Column(Float)
    avg_fatigue_level = Column(Float)
    avg_motivation_level = Column(Float)
    avg_stress_level = Column(Float)
    avg_energy_level = Column(Float)
    avg_training_readiness = Column(Float)
    avg_resting_heart_rate = Column(Float)
    
    # 月間統計
    weight_change_kg = Column(Float)  # 月初からの変化
    sleep_consistency_score = Column(Float)  # 睡眠の一貫性スコア
    stress_peak_days = Column(Integer)  # 高ストレス日数
    low_energy_days = Column(Integer)  # 低エネルギーの日数
    
    # データ品質
    data_completeness = Column(Float)  # データ完全性（0-1）
    days_recorded = Column(Integer)  # 記録日数
    
    # メタデータ
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User")

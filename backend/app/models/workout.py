from sqlalchemy import Column, String, Date, DateTime, Integer, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class WorkoutType(Base):
    __tablename__ = "workout_types"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    is_default = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="created_workout_types")
    workouts = relationship("Workout", back_populates="workout_type")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    workout_type_id = Column(String(36), ForeignKey("workout_types.id"), nullable=False)
    
    # 目標値（計画された練習内容）
    target_distance_meters = Column(Integer)
    target_times_seconds = Column(JSON)
    
    # 実際の値（実行された練習内容）
    actual_distance_meters = Column(Integer)
    actual_times_seconds = Column(JSON)
    
    # 練習の完了状況
    completed = Column(Boolean, default=False)
    completion_rate = Column(Integer)  # 0-100 (完了率)
    
    # その他の設定
    repetitions = Column(Integer)
    rest_type = Column(String(50))
    rest_duration = Column(Integer)
    intensity = Column(Integer)
    notes = Column(Text)
    extended_data = Column(JSON)  # Garmin詳細データ用
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 後方互換性のためのプロパティ
    @property
    def distance_meters(self):
        """後方互換性のため、実際の距離を返す"""
        return self.actual_distance_meters or self.target_distance_meters
    
    @property
    def times_seconds(self):
        """後方互換性のため、実際のタイムを返す"""
        return self.actual_times_seconds or self.target_times_seconds

    user = relationship("User", back_populates="workouts")
    workout_type = relationship("WorkoutType", back_populates="workouts")
from sqlalchemy import Column, String, Date, DateTime, Float, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class RaceType(Base):
    __tablename__ = "race_types"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False)
    category = Column(String(20), nullable=False)  # 'track', 'road', 'relay'
    default_distance_meters = Column(Integer, nullable=False)
    is_customizable = Column(Boolean, default=True)
    min_distance_meters = Column(Integer, default=50)
    max_distance_meters = Column(Integer, default=100000)
    description = Column(String(500))
    is_default = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])
    races = relationship("RaceResult", back_populates="race_type_rel")


class RaceResult(Base):
    __tablename__ = "race_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    race_date = Column(Date, nullable=False)
    race_name = Column(String(100), nullable=False)
    race_type_id = Column(String(36), ForeignKey("race_types.id"), nullable=True)
    race_type = Column(String(10), nullable=False)  # 'track', 'road', 'relay'
    distance_meters = Column(Integer, nullable=False)
    custom_distance_m = Column(Integer)  # カスタム距離（メートル）
    time_seconds = Column(Float, nullable=False)
    pace_seconds = Column(Float, nullable=False)
    place = Column(Integer)
    total_participants = Column(Integer)
    notes = Column(String(1000))
    
    # 駅伝専用フィールド
    is_relay = Column(Boolean, default=False)
    relay_segment = Column(Integer)
    team_name = Column(String(100))
    relay_time = Column(String(20))
    segment_place = Column(Integer)
    segment_total_participants = Column(Integer)
    
    # 詳細情報
    splits = Column(JSON)  # スプリットタイムの配列
    weather = Column(String(50))
    course_type = Column(String(50))
    strategy_notes = Column(String(1000))
    
    prediction_id = Column(String(36), ForeignKey("predictions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="race_results")
    race_type_rel = relationship("RaceType", back_populates="races")
    prediction = relationship("Prediction", back_populates="race_results")


class Race(Base):
    __tablename__ = "races"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    race_type_id = Column(String(36), ForeignKey("race_types.id"), nullable=False)
    name = Column(String(100), nullable=False)
    distance_meters = Column(Integer, nullable=False)
    time_seconds = Column(Integer, nullable=True)
    date = Column(Date, nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    user = relationship("User")
    race_type = relationship("RaceType")
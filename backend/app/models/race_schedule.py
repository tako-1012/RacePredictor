from sqlalchemy import Column, String, Date, DateTime, Float, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class RaceSchedule(Base):
    __tablename__ = "race_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    race_name = Column(String(255), nullable=False)
    race_date = Column(Date, nullable=False)
    location = Column(String(255))  # 開催地
    race_type = Column(String(10), nullable=False)  # 'track', 'road', 'relay'
    distance = Column(String(50), nullable=False)  # プリセット値
    custom_distance_m = Column(Integer)  # カスタム距離（メートル）
    target_time_seconds = Column(Integer)  # 目標タイム（秒）
    status = Column(String(20), nullable=False, default='scheduled')  # 'scheduled', 'completed', 'cancelled'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # リレーションシップ
    user = relationship("User", back_populates="race_schedules")

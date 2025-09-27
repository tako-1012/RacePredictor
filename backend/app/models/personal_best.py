from sqlalchemy import Column, String, Date, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class PersonalBest(Base):
    __tablename__ = "personal_bests"
    __table_args__ = {'extend_existing': True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    race_type = Column(String(10), nullable=False)  # 'track', 'road', 'ekiden'
    distance = Column(String(50), nullable=False)  # 距離のプリセット値
    custom_distance_m = Column(Integer)  # カスタム距離（メートル）
    time_seconds = Column(Integer, nullable=False)
    achieved_date = Column(Date, nullable=False)
    race_name = Column(String(255))  # レース名
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # リレーションシップ
    user = relationship("User", back_populates="personal_bests")

    @property
    def distance_meters(self):
        """距離をメートルで取得"""
        if self.custom_distance_m:
            return self.custom_distance_m
        # プリセット値から距離を計算
        distance_map = {
            '800m': 800,
            '1500m': 1500,
            '3000m': 3000,
            '5000m': 5000,
            '10000m': 10000,
            '5km': 5000,
            '10km': 10000,
            'half_marathon': 21097,
            'marathon': 42195
        }
        return distance_map.get(self.distance, 0)

    @property
    def event_name(self):
        """大会名を取得（race_nameのエイリアス）"""
        return self.race_name

    def __repr__(self):
        return f"<PersonalBest(id={self.id}, distance={self.distance}, time={self.time_seconds}s)>"

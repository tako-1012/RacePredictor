from sqlalchemy import Column, String, Date, DateTime, Float, Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    age = Column(Integer)
    birth_date = Column(Date)  # 生年月日
    gender = Column(String(10))  # 'M', 'F', 'Other'
    height_cm = Column(Float)
    weight_kg = Column(Float)
    bmi = Column(Float)  # 自動計算フィールド
    resting_hr = Column(Integer)  # 安静時心拍数
    max_hr = Column(Integer)  # 最大心拍数
    vo2_max = Column(Float)  # 最大酸素摂取量
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ
    user = relationship("User", back_populates="profile")

    def calculate_bmi(self):
        """BMIを自動計算"""
        if self.height_cm and self.weight_kg:
            height_m = self.height_cm / 100
            self.bmi = round(self.weight_kg / (height_m ** 2), 2)
        return self.bmi

    def calculate_age(self):
        """生年月日から年齢を自動計算"""
        if self.birth_date:
            from datetime import date
            today = date.today()
            age = today.year - self.birth_date.year
            if today.month < self.birth_date.month or (today.month == self.birth_date.month and today.day < self.birth_date.day):
                age -= 1
            self.age = age
        return self.age



from sqlalchemy import Column, String, Date, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class UserTypeEnum(str, enum.Enum):
    athlete = "athlete"
    serious_runner = "serious_runner"
    casual_runner = "casual_runner"


class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    birth_date = Column(Date)
    gender = Column(Enum(GenderEnum))
    user_type = Column(Enum(UserTypeEnum))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ (循環インポート回避のため文字列指定)
    workouts = relationship("Workout", back_populates="user")
    created_workout_types = relationship("WorkoutType", back_populates="creator")
    predictions = relationship("Prediction", back_populates="user")
    race_results = relationship("RaceResult", back_populates="user")
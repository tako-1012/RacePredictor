from sqlalchemy import Column, String, Date, Enum, DateTime, Boolean
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
    hashed_password = Column(String(255), nullable=False)
    username = Column(String(100), unique=True, nullable=True)
    name = Column(String(100))
    birth_date = Column(Date)
    gender = Column(Enum(GenderEnum))
    user_type = Column(Enum(UserTypeEnum))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーションシップ（文字列参照を使用して循環インポートを回避）
    workouts = relationship("Workout", back_populates="user")
    created_workout_types = relationship("WorkoutType", back_populates="creator")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    personal_bests = relationship("PersonalBest", back_populates="user")
    custom_workout_templates = relationship("CustomWorkoutTemplate", back_populates="user")
    custom_workout_plans = relationship("CustomWorkoutPlan", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    race_results = relationship("RaceResult", back_populates="user")
    race_schedules = relationship("RaceSchedule", back_populates="user")
    prediction_results = relationship("PredictionResult", back_populates="user")
    feature_data = relationship("FeatureStore", back_populates="user")
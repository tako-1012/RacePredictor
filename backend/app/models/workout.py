from sqlalchemy import Column, String, Date, DateTime, Integer, Text, Boolean, UUID, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class WorkoutType(Base):
    __tablename__ = "workout_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    is_default = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="created_workout_types")
    workouts = relationship("Workout", back_populates="workout_type")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    workout_type_id = Column(UUID(as_uuid=True), ForeignKey("workout_types.id"), nullable=False)
    distance_meters = Column(Integer)
    times_seconds = Column(JSON)
    repetitions = Column(Integer)
    rest_type = Column(String(50))
    rest_duration = Column(Integer)
    intensity = Column(Integer)
    notes = Column(Text)
    extended_data = Column(JSON)  # Garmin詳細データ用
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="workouts")
    workout_type = relationship("WorkoutType", back_populates="workouts")
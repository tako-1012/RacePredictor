from sqlalchemy import Column, String, Date, DateTime, Float, UUID, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    prediction_date = Column(Date, nullable=False)
    target_event = Column(String(20), nullable=False)
    predicted_time_seconds = Column(Float, nullable=False)
    confidence_level = Column(Float, nullable=False)
    model_version = Column(String(20), default="v1_statistical")
    base_workouts = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="predictions")
    race_results = relationship("RaceResult", back_populates="prediction")
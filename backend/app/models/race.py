from sqlalchemy import Column, String, Date, DateTime, Float, Integer, UUID, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class RaceResult(Base):
    __tablename__ = "race_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    race_date = Column(Date, nullable=False)
    event = Column(String(20), nullable=False)
    time_seconds = Column(Float, nullable=False)
    place = Column(Integer)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey("predictions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="race_results")
    prediction = relationship("Prediction", back_populates="race_results")
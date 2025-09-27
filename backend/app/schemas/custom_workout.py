from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class CustomWorkoutTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    workout_type_id: UUID
    is_public: Optional[bool] = False
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration_minutes: Optional[int] = Field(None, ge=1, le=300)
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutTemplateCreate(CustomWorkoutTemplateBase):
    pass


class CustomWorkoutTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    workout_type_id: Optional[UUID] = None
    is_public: Optional[bool] = None
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration_minutes: Optional[int] = Field(None, ge=1, le=300)
    tags: Optional[List[str]] = None


class CustomWorkoutTemplateResponse(CustomWorkoutTemplateBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    usage_count: Optional[int] = 0

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    template_id: Optional[UUID] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)  # 0=Monday, 6=Sunday
    week_number: Optional[int] = Field(None, ge=1, le=52)
    is_active: Optional[bool] = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutPlanCreate(CustomWorkoutPlanBase):
    pass


class CustomWorkoutPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    template_id: Optional[UUID] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    week_number: Optional[int] = Field(None, ge=1, le=52)
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CustomWorkoutPlanResponse(CustomWorkoutPlanBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    plan_items: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutPlanItemBase(BaseModel):
    plan_id: UUID
    exercise_name: str = Field(..., min_length=1, max_length=100)
    exercise_type: Optional[str] = Field(None, pattern="^(cardio|strength|flexibility|balance|other)$")
    sets: Optional[int] = Field(None, ge=1, le=50)
    reps: Optional[int] = Field(None, ge=1, le=1000)
    weight_kg: Optional[float] = Field(None, ge=0, le=500)
    duration_seconds: Optional[int] = Field(None, ge=1, le=3600)
    distance_km: Optional[float] = Field(None, ge=0, le=100)
    rest_seconds: Optional[int] = Field(None, ge=0, le=1800)
    intensity_level: Optional[str] = Field(None, pattern="^(low|moderate|high|max)$")
    notes: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = Field(None, ge=0)

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutPlanItemCreate(CustomWorkoutPlanItemBase):
    pass


class CustomWorkoutPlanItemUpdate(BaseModel):
    exercise_name: Optional[str] = Field(None, min_length=1, max_length=100)
    exercise_type: Optional[str] = Field(None, pattern="^(cardio|strength|flexibility|balance|other)$")
    sets: Optional[int] = Field(None, ge=1, le=50)
    reps: Optional[int] = Field(None, ge=1, le=1000)
    weight_kg: Optional[float] = Field(None, ge=0, le=500)
    duration_seconds: Optional[int] = Field(None, ge=1, le=3600)
    distance_km: Optional[float] = Field(None, ge=0, le=100)
    rest_seconds: Optional[int] = Field(None, ge=0, le=1800)
    intensity_level: Optional[str] = Field(None, pattern="^(low|moderate|high|max)$")
    notes: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = Field(None, ge=0)


class CustomWorkoutPlanItemResponse(CustomWorkoutPlanItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutTemplateNewCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    template_type: str = Field(..., description="Template type: section, full_workout")
    section_type: Optional[str] = Field(None, description="Section type: warmup, main, cooldown")
    sessions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    workout_type_id: Optional[UUID] = None
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration_minutes: Optional[int] = Field(None, ge=1, le=300)
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutTemplateNewResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    template_type: str
    section_type: Optional[str] = None
    sessions: Optional[List[Dict[str, Any]]] = None
    steps: List[Dict[str, Any]]
    workout_type_id: Optional[UUID] = None
    difficulty_level: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutPlanListResponse(BaseModel):
    items: List[CustomWorkoutPlanResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class CustomWorkoutTemplateListResponse(BaseModel):
    items: List[CustomWorkoutTemplateResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
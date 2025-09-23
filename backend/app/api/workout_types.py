from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.workout import WorkoutType
from app.schemas.workout import WorkoutTypeCreate, WorkoutTypeResponse

router = APIRouter()


@router.get("/", response_model=List[WorkoutTypeResponse])
async def get_workout_types(
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """練習種別一覧取得（デフォルト + ユーザーカスタム）"""
    try:
        workout_types = (
            db.query(WorkoutType)
            .filter(
                or_(
                    WorkoutType.is_default == True,
                    WorkoutType.created_by == current_user
                )
            )
            .order_by(WorkoutType.is_default.desc(), WorkoutType.name)
            .all()
        )

        return workout_types

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workout types"
        )


@router.post("/", response_model=WorkoutTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_workout_type(
    workout_type_data: WorkoutTypeCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタム練習種別作成"""
    try:
        # 同名の種別が存在するかチェック（ユーザー毎）
        existing = (
            db.query(WorkoutType)
            .filter(
                WorkoutType.name == workout_type_data.name,
                or_(
                    WorkoutType.is_default == True,
                    WorkoutType.created_by == current_user
                )
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workout type with this name already exists"
            )

        # 新しい練習種別作成
        db_workout_type = WorkoutType(
            name=workout_type_data.name,
            category=workout_type_data.category,
            is_default=False,
            created_by=current_user
        )

        db.add(db_workout_type)
        db.commit()
        db.refresh(db_workout_type)

        return db_workout_type

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workout type"
        )
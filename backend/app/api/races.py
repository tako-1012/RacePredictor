from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.race import RaceResult
from app.models.prediction import Prediction
from app.schemas.race import RaceResultCreate, RaceResultUpdate, RaceResultResponse

router = APIRouter()


@router.post("/", response_model=RaceResultResponse, status_code=status.HTTP_201_CREATED)
async def create_race_result(
    race_data: RaceResultCreate,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果作成"""
    try:
        # 予測ID存在チェック（指定されている場合）
        if race_data.prediction_id:
            prediction = (
                db.query(Prediction)
                .filter(
                    Prediction.id == race_data.prediction_id,
                    Prediction.user_id == current_user
                )
                .first()
            )
            if not prediction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Prediction not found"
                )

        # レース結果作成
        db_race_result = RaceResult(
            user_id=current_user,
            race_date=race_data.race_date,
            event=race_data.event.value,
            time_seconds=race_data.time_seconds,
            place=race_data.place,
            prediction_id=race_data.prediction_id
        )

        db.add(db_race_result)
        db.commit()
        db.refresh(db_race_result)

        return db_race_result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create race result"
        )


@router.get("/", response_model=List[RaceResultResponse])
async def get_race_results(
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果一覧取得"""
    try:
        race_results = (
            db.query(RaceResult)
            .filter(RaceResult.user_id == current_user)
            .order_by(desc(RaceResult.race_date), desc(RaceResult.created_at))
            .all()
        )

        return race_results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race results"
        )


@router.get("/{race_id}", response_model=RaceResultResponse)
async def get_race_result(
    race_id: str,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果詳細取得"""
    try:
        race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user
            )
            .first()
        )

        if not race_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        return race_result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race result"
        )


@router.put("/{race_id}", response_model=RaceResultResponse)
async def update_race_result(
    race_id: str,
    race_data: RaceResultUpdate,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果更新"""
    try:
        # レース結果存在確認
        db_race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user
            )
            .first()
        )

        if not db_race_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        # 予測ID存在チェック（更新される場合）
        if race_data.prediction_id:
            prediction = (
                db.query(Prediction)
                .filter(
                    Prediction.id == race_data.prediction_id,
                    Prediction.user_id == current_user
                )
                .first()
            )
            if not prediction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Prediction not found"
                )

        # 更新データ適用
        update_data = race_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "event" and value:
                setattr(db_race_result, field, value.value)
            else:
                setattr(db_race_result, field, value)

        db.commit()
        db.refresh(db_race_result)

        return db_race_result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update race result"
        )


@router.delete("/{race_id}")
async def delete_race_result(
    race_id: str,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果削除"""
    try:
        # レース結果存在確認
        db_race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user
            )
            .first()
        )

        if not db_race_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        db.delete(db_race_result)
        db.commit()

        return {"message": "Race result deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete race result"
        )
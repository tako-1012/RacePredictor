from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.race import RaceResult, RaceType
from app.models.prediction import Prediction
from app.schemas.race import RaceResultCreate, RaceResultUpdate, RaceResultResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.post("/", response_model=RaceResultResponse, status_code=status.HTTP_201_CREATED)
async def create_race_result(
    race_data: RaceResultCreate,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果作成"""
    try:
        # レース種別存在チェック
        race_type = (
            db.query(RaceType)
            .filter(RaceType.id == race_data.race_type_id)
            .first()
        )
        if not race_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race type not found"
            )

        # 距離のバリデーション
        if not (race_type.min_distance_meters <= race_data.distance_meters <= race_type.max_distance_meters):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Distance must be between {race_type.min_distance_meters}m and {race_type.max_distance_meters}m for this race type"
            )

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
            race_name=race_data.race_name,
            race_type_id=race_data.race_type_id,
            distance_meters=race_data.distance_meters,
            time_seconds=race_data.time_seconds,
            pace_seconds=race_data.pace_seconds,
            place=race_data.place,
            total_participants=race_data.total_participants,
            notes=race_data.notes,
            is_relay=race_data.is_relay,
            relay_segment=race_data.relay_segment,
            team_name=race_data.team_name,
            relay_time=race_data.relay_time,
            segment_place=race_data.segment_place,
            segment_total_participants=race_data.segment_total_participants,
            splits=race_data.splits,
            weather=race_data.weather,
            course_type=race_data.course_type,
            strategy_notes=race_data.strategy_notes,
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


@router.get("/", response_model=PaginatedResponse[RaceResultResponse])
async def get_race_results(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    race_type_id: Optional[str] = Query(None),
    is_relay: Optional[bool] = Query(None),
    year: Optional[int] = Query(None),
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース結果一覧取得（フィルタリング・ページネーション対応）"""
    try:
        query = db.query(RaceResult).filter(RaceResult.user_id == current_user)

        # フィルタリング
        if race_type_id:
            query = query.filter(RaceResult.race_type_id == race_type_id)
        
        if is_relay is not None:
            query = query.filter(RaceResult.is_relay == is_relay)
        
        if year:
            query = query.filter(
                db.func.extract('year', RaceResult.race_date) == year
            )

        # 総件数取得
        total = query.count()

        # ページネーション
        race_results = (
            query
            .order_by(desc(RaceResult.race_date), desc(RaceResult.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return PaginatedResponse(
            data=race_results,
            pagination={
                "page": (offset // limit) + 1,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit,
                "has_next": offset + limit < total,
                "has_prev": offset > 0
            }
        )

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
        # UUID変換
        try:
            race_uuid = UUID(race_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_uuid,
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
        # UUID変換
        try:
            race_uuid = UUID(race_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        # レース結果存在確認
        db_race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_uuid,
                RaceResult.user_id == current_user
            )
            .first()
        )

        if not db_race_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        # レース種別存在チェック（更新される場合）
        if race_data.race_type_id:
            race_type = (
                db.query(RaceType)
                .filter(RaceType.id == race_data.race_type_id)
                .first()
            )
            if not race_type:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Race type not found"
                )

        # 距離のバリデーション（更新される場合）
        if race_data.distance_meters and race_data.race_type_id:
            race_type = (
                db.query(RaceType)
                .filter(RaceType.id == race_data.race_type_id)
                .first()
            )
            if race_type and not (race_type.min_distance_meters <= race_data.distance_meters <= race_type.max_distance_meters):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Distance must be between {race_type.min_distance_meters}m and {race_type.max_distance_meters}m for this race type"
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
        # UUID変換
        try:
            race_uuid = UUID(race_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        # レース結果存在確認
        db_race_result = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_uuid,
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
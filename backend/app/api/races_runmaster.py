from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
import logging
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.race import RaceResult
from app.schemas.race_runmaster import RaceCreate, RaceResponse, RaceUpdate
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[RaceResponse])
async def get_races(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("race_date", pattern="^(race_date|race_name|time_seconds|place)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果一覧取得"""
    try:
        logger.info(f"🔍 レース結果一覧取得開始: user_id={current_user_id}, page={page}, limit={limit}")
        
        # オフセット計算
        offset = (page - 1) * limit
        
        # ソート順の決定（型安全な方法）
        valid_sort_fields = ["race_date", "race_name", "time_seconds", "place"]
        if sort_by not in valid_sort_fields:
            sort_by = "race_date"  # デフォルト値にフォールバック
        
        try:
            sort_field = getattr(RaceResult, sort_by)
            if sort_order == "desc":
                order_by = desc(sort_field)
            else:
                order_by = asc(sort_field)
        except AttributeError:
            # フィールドが存在しない場合はrace_dateでソート
            order_by = desc(RaceResult.race_date)
        
        # クエリ実行
        races = db.query(RaceResult).filter(
            RaceResult.user_id == current_user_id
        ).order_by(order_by).offset(offset).limit(limit).all()
        
        logger.info(f"✅ レース結果一覧取得成功: {len(races)}件")
        
        # レスポンス形式に変換
        race_responses = []
        for race in races:
            race_responses.append(RaceResponse(
                id=str(race.id),
                user_id=str(race.user_id),
                race_name=race.race_name,
                race_date=race.race_date,
                race_type=race.race_type,  # NOT NULL制約により確実に値が存在
                distance_meters=race.distance_meters,
                time_seconds=race.time_seconds,
                pace_seconds=race.pace_seconds,
                place=race.place,
                total_participants=race.total_participants,
                notes=race.notes,
                created_at=race.created_at,
                updated_at=race.updated_at
            ))
        
        return race_responses

    except Exception as e:
        logger.error(f"❌ レース結果一覧取得エラー: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race results. Please try again."
        )

@router.get("/{race_id}", response_model=RaceResponse)
async def get_race(
    race_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果詳細取得"""
    try:
        logger.info(f"🔍 レース結果詳細取得開始: race_id={race_id}, user_id={current_user_id}")
        
        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user_id
            )
            .first()
        )

        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        logger.info(f"✅ レース結果詳細取得成功: {race_id}")
        
        return RaceResponse(
            id=str(race.id),
            user_id=str(race.user_id),
            race_name=race.race_name,
            race_date=race.race_date,
            race_type=race.race_type,  # NOT NULL制約により確実に値が存在
            distance_meters=race.distance_meters,
            time_seconds=race.time_seconds,
            pace_seconds=race.pace_seconds,
            place=race.place,
            total_participants=race.total_participants,
            notes=race.notes,
            created_at=race.created_at,
            updated_at=race.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ レース結果詳細取得エラー: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race result. Please try again."
        )

@router.post("/", response_model=RaceResponse, status_code=status.HTTP_201_CREATED)
async def create_race(
    race_data: RaceCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果作成"""
    try:
        logger.info(f"🔍 レース結果作成開始: user_id={current_user_id}")
        logger.debug(f"Received data: {race_data}")
        logger.debug(f"Race data dict: {race_data.dict()}")
        
        # レース結果作成
        db_race = RaceResult(
            id=str(uuid.uuid4()),
            user_id=current_user_id,  # 認証されたユーザーIDを使用
            race_name=race_data.race_name,
            race_date=race_data.race_date,
            race_type_id=None,  # FOREIGN KEY制約を回避
            race_type=race_data.race_type,
            distance_meters=race_data.distance_meters,
            time_seconds=race_data.time_seconds,
            pace_seconds=race_data.pace_seconds or (race_data.time_seconds / (race_data.distance_meters / 1000)),  # ペース計算
            place=race_data.place,
            total_participants=race_data.total_participants,
            notes=race_data.notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(db_race)
        db.commit()
        db.refresh(db_race)

        logger.info(f"✅ レース結果作成成功: {db_race.id}")
        
        return RaceResponse(
            id=str(db_race.id),
            user_id=current_user_id,
            race_name=db_race.race_name,
            race_date=db_race.race_date,
            race_type=race_data.race_type,
            distance_meters=db_race.distance_meters,
            time_seconds=db_race.time_seconds,
            pace_seconds=db_race.pace_seconds,
            place=db_race.place,
            total_participants=db_race.total_participants,
            notes=race_data.notes,
            created_at=db_race.created_at,
            updated_at=db_race.updated_at
        )

    except ValueError as e:
        logger.error(f"❌ レース結果作成バリデーションエラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ レース結果作成エラー: {e}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create race result. Please try again."
        )

@router.put("/{race_id}", response_model=RaceResponse)
async def update_race(
    race_id: str,
    race_data: RaceUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果更新"""
    try:
        logger.info(f"🔍 レース結果更新開始: race_id={race_id}, user_id={current_user_id}")
        
        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user_id
            )
            .first()
        )

        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        # 更新データを適用
        update_data = race_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'race_date':
                setattr(race, 'race_date', value)
            elif field == 'distance_meters':
                setattr(race, 'distance_meters', value)
            elif field == 'time_seconds':
                setattr(race, 'time_seconds', value)
                # ペースを再計算
                if hasattr(race, 'distance_meters') and race.distance_meters > 0:
                    race.pace_seconds = value / (race.distance_meters / 1000)
            elif field == 'place':
                setattr(race, 'place', value)
            elif field == 'total_participants':
                setattr(race, 'total_participants', value)
            else:
                setattr(race, field, value)
        
        race.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(race)

        logger.info(f"✅ レース結果更新成功: {race_id}")
        
        return RaceResponse(
            id=str(race.id),
            user_id=str(race.user_id),
            race_name=race.race_name,
            race_date=race.race_date,
            race_type=race.race_type,  # NOT NULL制約により確実に値が存在
            distance_meters=race.distance_meters,
            time_seconds=race.time_seconds,
            pace_seconds=race.pace_seconds,
            place=race.place,
            total_participants=race.total_participants,
            notes=race.notes,
            created_at=race.created_at,
            updated_at=race.updated_at
        )

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ レース結果更新バリデーションエラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ レース結果更新エラー: {e}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update race result. Please try again."
        )

@router.delete("/{race_id}")
async def delete_race(
    race_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果削除"""
    try:
        logger.info(f"🔍 レース結果削除開始: race_id={race_id}, user_id={current_user_id}")
        
        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,
                RaceResult.user_id == current_user_id
            )
            .first()
        )

        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        db.delete(race)
        db.commit()

        logger.info(f"✅ レース結果削除成功: {race_id}")
        return {"message": "Race result deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ レース結果削除エラー: {e}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete race result. Please try again."
        )

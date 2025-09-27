from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from uuid import UUID
from datetime import date
import logging
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.race import RaceResult, RaceType
from app.models.prediction import Prediction
from app.schemas.race import RaceResultCreate, RaceResultUpdate, RaceResultResponse, RaceResultListResponse
from app.schemas.common import PaginatedResponse
from app.services.personal_best_service import update_personal_best_from_race_result

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=RaceResultListResponse)
async def get_race_results(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("race_date", pattern="^(race_date|time_seconds|place)$"),
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
        valid_sort_fields = ["race_date", "time_seconds", "place"]
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
        
        # 総数取得
        total = db.query(RaceResult).filter(RaceResult.user_id == current_user_id).count()
        
        logger.info(f"✅ レース結果一覧取得成功: {len(races)}件")
        
        return {
            "items": races,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }

    except Exception as e:
        logger.error(f"❌ レース結果一覧取得エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        # エラー時でも一貫したレスポンス構造を返す
        return {
            "items": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "error": str(e)
        }


@router.get("/{race_id}", response_model=RaceResultResponse)
async def get_race_result(
    race_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果詳細取得"""
    try:
        logger.info(f"🔍 レース結果詳細取得開始: race_id={race_id}, user_id={current_user_id}")
        
        # UUID形式の検証（文字列として保存されているため、文字列として比較）
        try:
            UUID(race_id)  # 形式チェックのみ
        except ValueError:
            logger.warning(f"❌ 無効なレースID形式: {race_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_id,  # 文字列として比較
                RaceResult.user_id == current_user_id
            )
            .first()
        )

        if not race:
            logger.warning(f"❌ レース結果が見つかりません: race_id={race_id}, user_id={current_user_id}")
            # デバッグ用: 該当ユーザーの全レース結果を確認
            user_races = db.query(RaceResult).filter(RaceResult.user_id == current_user_id).all()
            logger.info(f"🔍 ユーザーの全レース結果: {len(user_races)}件")
            for r in user_races:
                logger.info(f"  - ID: {r.id}, Name: {r.race_name}, Date: {r.race_date}")
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race result not found"
            )

        logger.info(f"✅ レース結果詳細取得成功: {race_id}")
        return race

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ レース結果詳細取得エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race result"
        )


@router.post("/", response_model=RaceResultResponse, status_code=status.HTTP_201_CREATED)
async def create_race_result(
    race_data: RaceResultCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果作成"""
    try:
        logger.info(f"🔍 レース結果作成開始: user_id={current_user_id}")
        
        # レース種別存在チェック（race_type_idが提供されている場合のみ）
        if race_data.race_type_id:
            try:
                race_type = (
                    db.query(RaceType)
                    .filter(RaceType.id == str(race_data.race_type_id))
                    .first()
                )

                if not race_type:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Race type not found"
                    )
            except Exception as e:
                logger.warning(f"⚠️ レース種別チェックでエラー: {e}")
                # レース種別チェックのエラーはレース結果作成を阻害しない

        # レース結果作成
        db_race = RaceResult(
            user_id=current_user_id,
            race_name=race_data.race_name,
            race_type_id=race_data.race_type_id,
            race_date=race_data.race_date,
            time_seconds=race_data.time_seconds,
            distance_meters=race_data.distance_meters,
            pace_seconds=race_data.pace_seconds,
            place=race_data.place,
            total_participants=race_data.total_participants,
            notes=race_data.notes,
            race_type=race_data.race_type,
            custom_distance_m=race_data.custom_distance_m,
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

        db.add(db_race)
        db.commit()
        db.refresh(db_race)

        # 自己ベストの自動更新
        try:
            updated_pb = update_personal_best_from_race_result(db, current_user_id, db_race)
            if updated_pb:
                logger.info(f"🏆 自己ベスト自動更新完了: {updated_pb.id}")
        except Exception as pb_error:
            logger.warning(f"⚠️ 自己ベスト更新でエラー: {pb_error}")
            # 自己ベスト更新のエラーはレース結果作成を阻害しない

        logger.info(f"✅ レース結果作成成功: {db_race.id}")
        return db_race

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ レース結果作成エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create race result"
        )


@router.put("/{race_id}", response_model=RaceResultResponse)
async def update_race_result(
    race_id: str,
    race_data: RaceResultUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果更新"""
    try:
        logger.info(f"🔍 レース結果更新開始: race_id={race_id}, user_id={current_user_id}")
        
        # UUID変換
        try:
            race_uuid = UUID(race_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_uuid,
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
            setattr(race, field, value)

        db.commit()
        db.refresh(race)

        # 自己ベストの自動更新
        try:
            updated_pb = update_personal_best_from_race_result(db, current_user_id, race)
            if updated_pb:
                logger.info(f"🏆 自己ベスト自動更新完了: {updated_pb.id}")
        except Exception as pb_error:
            logger.warning(f"⚠️ 自己ベスト更新でエラー: {pb_error}")
            # 自己ベスト更新のエラーはレース結果更新を阻害しない

        logger.info(f"✅ レース結果更新成功: {race_id}")
        return race

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ レース結果更新エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update race result"
        )


@router.delete("/{race_id}")
async def delete_race_result(
    race_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース結果削除"""
    try:
        logger.info(f"🔍 レース結果削除開始: race_id={race_id}, user_id={current_user_id}")
        
        # UUID変換
        try:
            race_uuid = UUID(race_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race ID format"
            )

        race = (
            db.query(RaceResult)
            .filter(
                RaceResult.id == race_uuid,
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
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete race result"
        )
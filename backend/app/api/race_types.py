from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.race import RaceType
from app.schemas.race_type import RaceTypeCreate, RaceTypeUpdate, RaceTypeResponse

router = APIRouter()


@router.get("/", response_model=List[RaceTypeResponse])
async def get_race_types(
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """レース種目一覧取得（デフォルト + ユーザーカスタム）"""
    try:
        race_types = (
            db.query(RaceType)
            .filter(
                or_(
                    RaceType.is_default == True,
                    RaceType.created_by == current_user
                )
            )
            .order_by(RaceType.is_default.desc(), RaceType.category, RaceType.name)
            .all()
        )

        return race_types

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch race types"
        )


@router.post("/", response_model=RaceTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_race_type(
    race_type_data: RaceTypeCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムレース種目作成"""
    try:
        # 同名の種目が存在するかチェック（ユーザー毎）
        existing = (
            db.query(RaceType)
            .filter(
                RaceType.name == race_type_data.name,
                or_(
                    RaceType.is_default == True,
                    RaceType.created_by == current_user
                )
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Race type with this name already exists"
            )

        # 新しいレース種目作成
        db_race_type = RaceType(
            name=race_type_data.name,
            category=race_type_data.category,
            default_distance_meters=race_type_data.default_distance_meters,
            is_customizable=race_type_data.is_customizable,
            min_distance_meters=race_type_data.min_distance_meters,
            max_distance_meters=race_type_data.max_distance_meters,
            description=race_type_data.description,
            is_default=False,
            created_by=current_user
        )

        db.add(db_race_type)
        db.commit()
        db.refresh(db_race_type)

        return db_race_type

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create race type"
        )


@router.put("/{race_type_id}", response_model=RaceTypeResponse)
async def update_race_type(
    race_type_id: str,
    race_type_data: RaceTypeUpdate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムレース種目更新"""
    try:
        # UUID変換
        try:
            race_type_uuid = UUID(race_type_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race type ID format"
            )

        # レース種目存在確認（カスタム種目のみ更新可能）
        db_race_type = (
            db.query(RaceType)
            .filter(
                RaceType.id == race_type_uuid,
                RaceType.created_by == current_user,
                RaceType.is_default == False
            )
            .first()
        )

        if not db_race_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race type not found or not editable"
            )

        # 更新データ適用
        update_data = race_type_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_race_type, field, value)

        db.commit()
        db.refresh(db_race_type)

        return db_race_type

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update race type"
        )


@router.delete("/{race_type_id}")
async def delete_race_type(
    race_type_id: str,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムレース種目削除"""
    try:
        # UUID変換
        try:
            race_type_uuid = UUID(race_type_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid race type ID format"
            )

        # レース種目存在確認（カスタム種目のみ削除可能）
        db_race_type = (
            db.query(RaceType)
            .filter(
                RaceType.id == race_type_uuid,
                RaceType.created_by == current_user,
                RaceType.is_default == False
            )
            .first()
        )

        if not db_race_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race type not found or not deletable"
            )

        # この種目を使用しているレース結果があるかチェック
        from app.models.race import RaceResult
        existing_races = (
            db.query(RaceResult)
            .filter(RaceResult.race_type_id == race_type_uuid)
            .count()
        )

        if existing_races > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete race type. {existing_races} race results are using this type."
            )

        db.delete(db_race_type)
        db.commit()

        return {"message": "Race type deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete race type"
        )

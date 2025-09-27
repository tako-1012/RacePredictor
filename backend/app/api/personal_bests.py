from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.user import User
from app.models.personal_best import PersonalBest
from app.schemas.personal_best import (
    PersonalBestCreate, 
    PersonalBestResponse, 
    PersonalBestUpdate, 
    PersonalBestWithPace
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/personal-bests", tags=["personal-bests"])


@router.get("/", response_model=List[PersonalBestWithPace])
async def get_personal_bests(
    race_type: Optional[str] = Query(None, description="レース種目でフィルタ"),
    distance: Optional[str] = Query(None, description="距離でフィルタ"),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザーの自己ベスト一覧を取得"""
    query = db.query(PersonalBest).filter(PersonalBest.user_id == current_user_id)
    
    if race_type:
        query = query.filter(PersonalBest.race_type == race_type)
    
    if distance:
        query = query.filter(PersonalBest.distance == distance)
    
    personal_bests = query.order_by(PersonalBest.achieved_date.desc()).all()
    
    # ペースを計算
    for pb in personal_bests:
        if pb.custom_distance_m:
            distance_km = pb.custom_distance_m / 1000
            pb.pace_per_km = round(pb.time_seconds / distance_km, 2)
    
    return personal_bests


@router.get("/{personal_best_id}", response_model=PersonalBestWithPace)
async def get_personal_best(
    personal_best_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """特定の自己ベストを取得"""
    personal_best = db.query(PersonalBest).filter(
        PersonalBest.id == personal_best_id,
        PersonalBest.user_id == current_user_id
    ).first()
    
    if not personal_best:
        raise NotFoundError("自己ベストが見つかりません")
    
    # ペースを計算
    if personal_best.custom_distance_m:
        distance_km = personal_best.custom_distance_m / 1000
        personal_best.pace_per_km = round(personal_best.time_seconds / distance_km, 2)
    
    return personal_best


@router.post("/", response_model=PersonalBestResponse, status_code=status.HTTP_201_CREATED)
async def create_personal_best(
    personal_best_data: PersonalBestCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい自己ベストを作成"""
    # 同じ種目・距離の既存記録をチェック
    existing_pb = db.query(PersonalBest).filter(
        PersonalBest.user_id == current_user_id,
        PersonalBest.race_type == personal_best_data.race_type,
        PersonalBest.distance == personal_best_data.distance,
        PersonalBest.custom_distance_m == personal_best_data.custom_distance_m
    ).first()
    
    if existing_pb:
        # より良いタイムの場合のみ更新
        if personal_best_data.time_seconds < existing_pb.time_seconds:
            existing_pb.time_seconds = personal_best_data.time_seconds
            existing_pb.achieved_date = personal_best_data.achieved_date
            existing_pb.race_name = personal_best_data.race_name
            db.commit()
            db.refresh(existing_pb)
            return existing_pb
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="既存の記録の方が良いタイムです"
            )
    
    # 新しい自己ベストを作成
    personal_best = PersonalBest(
        user_id=current_user_id,
        race_type=personal_best_data.race_type,
        distance=personal_best_data.distance,
        custom_distance_m=personal_best_data.custom_distance_m,
        time_seconds=personal_best_data.time_seconds,
        achieved_date=personal_best_data.achieved_date,
        race_name=personal_best_data.race_name
    )
    
    db.add(personal_best)
    db.commit()
    db.refresh(personal_best)
    
    return personal_best


@router.put("/{personal_best_id}", response_model=PersonalBestResponse)
async def update_personal_best(
    personal_best_id: str,
    personal_best_data: PersonalBestUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """自己ベストを更新"""
    personal_best = db.query(PersonalBest).filter(
        PersonalBest.id == personal_best_id,
        PersonalBest.user_id == current_user_id
    ).first()
    
    if not personal_best:
        raise NotFoundError("自己ベストが見つかりません")
    
    # 更新データを適用
    update_data = personal_best_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(personal_best, field, value)
    
    db.commit()
    db.refresh(personal_best)
    
    return personal_best


@router.delete("/{personal_best_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personal_best(
    personal_best_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """自己ベストを削除"""
    personal_best = db.query(PersonalBest).filter(
        PersonalBest.id == personal_best_id,
        PersonalBest.user_id == current_user_id
    ).first()
    
    if not personal_best:
        raise NotFoundError("自己ベストが見つかりません")
    
    db.delete(personal_best)
    db.commit()
    
    return None


@router.get("/stats/summary", response_model=dict)
async def get_personal_best_summary(
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """自己ベスト統計サマリーを取得"""
    personal_bests = db.query(PersonalBest).filter(
        PersonalBest.user_id == current_user_id
    ).all()
    
    if not personal_bests:
        return {"message": "自己ベスト記録がありません"}
    
    # 種目別統計
    race_type_stats = {}
    for pb in personal_bests:
        if pb.race_type not in race_type_stats:
            race_type_stats[pb.race_type] = {
                "count": 0,
                "best_time": float('inf'),
                "best_distance": None,
                "recent_date": None
            }
        
        race_type_stats[pb.race_type]["count"] += 1
        
        if pb.time_seconds < race_type_stats[pb.race_type]["best_time"]:
            race_type_stats[pb.race_type]["best_time"] = pb.time_seconds
            race_type_stats[pb.race_type]["best_distance"] = pb.distance
            race_type_stats[pb.race_type]["recent_date"] = pb.achieved_date
    
    # 総統計
    total_count = len(personal_bests)
    latest_achievement = max(personal_bests, key=lambda x: x.achieved_date)
    
    return {
        "total_count": total_count,
        "race_type_stats": race_type_stats,
        "latest_achievement": {
            "race_type": latest_achievement.race_type,
            "distance": latest_achievement.distance,
            "time_seconds": latest_achievement.time_seconds,
            "achieved_date": latest_achievement.achieved_date,
            "race_name": latest_achievement.race_name
        }
    }

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.race_schedule import RaceSchedule
from app.schemas.race_schedule import (
    RaceScheduleCreate, 
    RaceScheduleResponse, 
    RaceScheduleUpdate, 
    RaceScheduleWithCountdown
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/race-schedules", tags=["race-schedules"])


@router.get("/")
async def get_race_schedules(
    status: Optional[str] = Query(None, description="ステータスでフィルタ"),
    race_type: Optional[str] = Query(None, description="レース種目でフィルタ"),
    upcoming_only: bool = Query(False, description="今後のレースのみ"),
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーのレース予定一覧を取得"""
    try:
        query = db.query(RaceSchedule).filter(RaceSchedule.user_id == current_user_id)
        
        if status:
            query = query.filter(RaceSchedule.status == status)
        
        if race_type:
            query = query.filter(RaceSchedule.race_type == race_type)
        
        if upcoming_only:
            today = date.today()
            query = query.filter(RaceSchedule.race_date >= today)
        
        race_schedules = query.order_by(RaceSchedule.race_date.asc()).all()
        
        # シンプルな辞書形式で返す
        result = []
        for rs in race_schedules:
            today = date.today()
            delta = rs.race_date - today
            days_until_race = delta.days
            
            result.append({
                "id": str(rs.id),
                "user_id": str(rs.user_id),
                "race_name": rs.race_name,
                "race_date": rs.race_date.isoformat() if rs.race_date else None,
                "location": rs.location,
                "race_type": rs.race_type,
                "distance": rs.distance,
                "custom_distance_m": rs.custom_distance_m,
                "target_time_seconds": rs.target_time_seconds,
                "status": rs.status,
                "created_at": rs.created_at.isoformat() if rs.created_at else None,
                "days_until_race": days_until_race
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"レーススケジュールの取得に失敗しました: {str(e)}"
        )


@router.get("/{race_schedule_id}", response_model=RaceScheduleWithCountdown)
async def get_race_schedule(
    race_schedule_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """特定のレース予定を取得"""
    race_schedule = db.query(RaceSchedule).filter(
        RaceSchedule.id == race_schedule_id,
        RaceSchedule.user_id == current_user_id
    ).first()
    
    if not race_schedule:
        raise NotFoundError("レース予定が見つかりません")
    
    # カウントダウンを計算
    today = date.today()
    delta = race_schedule.race_date - today
    race_schedule.days_until_race = delta.days
    
    return race_schedule


@router.post("/", response_model=RaceScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_race_schedule(
    race_schedule_data: RaceScheduleCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しいレース予定を作成"""
    # 過去の日付をチェック
    if race_schedule_data.race_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="過去の日付は設定できません"
        )
    
    # レース予定を作成
    race_schedule = RaceSchedule(
        user_id=current_user_id,
        race_name=race_schedule_data.race_name,
        race_date=race_schedule_data.race_date,
        location=race_schedule_data.location,
        race_type=race_schedule_data.race_type,
        distance=race_schedule_data.distance,
        custom_distance_m=race_schedule_data.custom_distance_m,
        target_time_seconds=race_schedule_data.target_time_seconds,
        status=race_schedule_data.status
    )
    
    db.add(race_schedule)
    db.commit()
    db.refresh(race_schedule)
    
    return race_schedule


@router.put("/{race_schedule_id}", response_model=RaceScheduleResponse)
async def update_race_schedule(
    race_schedule_id: str,
    race_schedule_data: RaceScheduleUpdate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース予定を更新"""
    race_schedule = db.query(RaceSchedule).filter(
        RaceSchedule.id == race_schedule_id,
        RaceSchedule.user_id == current_user_id
    ).first()
    
    if not race_schedule:
        raise NotFoundError("レース予定が見つかりません")
    
    # 更新データを適用
    update_data = race_schedule_data.dict(exclude_unset=True)
    
    # 過去の日付をチェック
    if 'race_date' in update_data and update_data['race_date'] < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="過去の日付は設定できません"
        )
    
    for field, value in update_data.items():
        setattr(race_schedule, field, value)
    
    db.commit()
    db.refresh(race_schedule)
    
    return race_schedule


@router.delete("/{race_schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_race_schedule(
    race_schedule_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース予定を削除"""
    race_schedule = db.query(RaceSchedule).filter(
        RaceSchedule.id == race_schedule_id,
        RaceSchedule.user_id == current_user_id
    ).first()
    
    if not race_schedule:
        raise NotFoundError("レース予定が見つかりません")
    
    db.delete(race_schedule)
    db.commit()
    
    return None


@router.patch("/{race_schedule_id}/complete", response_model=RaceScheduleResponse)
async def complete_race_schedule(
    race_schedule_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース予定を完了済みにマーク"""
    race_schedule = db.query(RaceSchedule).filter(
        RaceSchedule.id == race_schedule_id,
        RaceSchedule.user_id == current_user_id
    ).first()
    
    if not race_schedule:
        raise NotFoundError("レース予定が見つかりません")
    
    race_schedule.status = "completed"
    db.commit()
    db.refresh(race_schedule)
    
    return race_schedule


@router.get("/upcoming/countdown", response_model=List[RaceScheduleWithCountdown])
async def get_upcoming_races_with_countdown(
    limit: int = Query(5, ge=1, le=20, description="取得件数"),
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """今後のレース予定をカウントダウン付きで取得"""
    today = date.today()
    
    upcoming_races = db.query(RaceSchedule).filter(
        RaceSchedule.user_id == current_user_id,
        RaceSchedule.race_date >= today,
        RaceSchedule.status == "scheduled"
    ).order_by(RaceSchedule.race_date.asc()).limit(limit).all()
    
    # カウントダウンを計算
    for race in upcoming_races:
        delta = race.race_date - today
        race.days_until_race = delta.days
    
    return upcoming_races


@router.get("/stats/summary", response_model=dict)
async def get_race_schedule_summary(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """レース予定統計サマリーを取得"""
    race_schedules = db.query(RaceSchedule).filter(
        RaceSchedule.user_id == current_user_id
    ).all()
    
    if not race_schedules:
        return {"message": "レース予定がありません"}
    
    # ステータス別統計
    status_stats = {}
    race_type_stats = {}
    upcoming_count = 0
    completed_count = 0
    
    today = date.today()
    
    for rs in race_schedules:
        # ステータス別
        if rs.status not in status_stats:
            status_stats[rs.status] = 0
        status_stats[rs.status] += 1
        
        # 種目別
        if rs.race_type not in race_type_stats:
            race_type_stats[rs.race_type] = 0
        race_type_stats[rs.race_type] += 1
        
        # 今後のレース
        if rs.race_date >= today and rs.status == "scheduled":
            upcoming_count += 1
        
        # 完了済み
        if rs.status == "completed":
            completed_count += 1
    
    # 次のレース
    next_race = db.query(RaceSchedule).filter(
        RaceSchedule.user_id == current_user_id,
        RaceSchedule.race_date >= today,
        RaceSchedule.status == "scheduled"
    ).order_by(RaceSchedule.race_date.asc()).first()
    
    next_race_info = None
    if next_race:
        delta = next_race.race_date - today
        next_race_info = {
            "race_name": next_race.race_name,
            "race_date": next_race.race_date,
            "days_until": delta.days,
            "location": next_race.location,
            "race_type": next_race.race_type,
            "distance": next_race.distance
        }
    
    return {
        "total_count": len(race_schedules),
        "status_stats": status_stats,
        "race_type_stats": race_type_stats,
        "upcoming_count": upcoming_count,
        "completed_count": completed_count,
        "next_race": next_race_info
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.user_profile_new import (
    UserProfileCreate, 
    UserProfileResponse, 
    UserProfileUpdate, 
    UserProfileWithBMI
)
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/user-profile", tags=["user-profile"])


@router.get("/me", response_model=UserProfileWithBMI)
async def get_my_profile(
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """現在のユーザーのプロフィールを取得"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    
    if not profile:
        # プロフィールが存在しない場合はデフォルトプロフィールを作成
        profile = UserProfile(
            user_id=current_user_id,
            age=None,
            birth_date=None,
            gender=None,
            height_cm=None,
            weight_kg=None,
            bmi=None,
            resting_hr=None,
            max_hr=None,
            vo2_max=None
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # BMIと年齢を自動計算
    profile.calculate_bmi()
    profile.calculate_age()
    
    return profile


@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: UserProfileCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザープロフィールを作成"""
    # 既存のプロフィールをチェック
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="プロフィールは既に存在します"
        )
    
    # プロフィール作成
    profile = UserProfile(
        user_id=current_user_id,
        age=profile_data.age,
        birth_date=profile_data.birth_date,
        gender=profile_data.gender,
        height_cm=profile_data.height_cm,
        weight_kg=profile_data.weight_kg,
        resting_hr=profile_data.resting_hr,
        max_hr=profile_data.max_hr,
        vo2_max=profile_data.vo2_max
    )
    
    # BMIと年齢を自動計算
    profile.calculate_bmi()
    profile.calculate_age()
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile


@router.put("/", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザープロフィールを更新"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    
    if not profile:
        raise NotFoundError("プロフィール")
    
    # 更新データを適用
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # BMIと年齢を自動計算
    profile.calculate_bmi()
    profile.calculate_age()
    
    db.commit()
    db.refresh(profile)
    
    return profile


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザープロフィールを削除"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    
    if not profile:
        raise NotFoundError("プロフィール")
    
    db.delete(profile)
    db.commit()
    
    return None


@router.get("/stats", response_model=dict)
async def get_profile_stats(
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """プロフィール統計情報を取得"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
    
    if not profile:
        raise NotFoundError("プロフィール")
    
    stats = {
        "age": profile.age,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "bmi": profile.bmi,
        "resting_hr": profile.resting_hr,
        "max_hr": profile.max_hr,
        "vo2_max": profile.vo2_max,
        "updated_at": profile.updated_at
    }
    
    # BMIカテゴリを追加
    if profile.bmi:
        if profile.bmi < 18.5:
            stats["bmi_category"] = "低体重"
        elif profile.bmi < 25:
            stats["bmi_category"] = "正常体重"
        elif profile.bmi < 30:
            stats["bmi_category"] = "肥満度1"
        else:
            stats["bmi_category"] = "肥満度2以上"
    
    return stats

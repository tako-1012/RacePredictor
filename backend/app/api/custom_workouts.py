from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from uuid import UUID
import json
import logging
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.custom_workout import CustomWorkoutTemplate, CustomWorkoutPlan, CustomWorkoutPlanItem, CustomWorkoutTemplateNew
from app.schemas.custom_workout import (
    CustomWorkoutTemplateCreate, 
    CustomWorkoutTemplateUpdate, 
    CustomWorkoutTemplateResponse,
    CustomWorkoutPlanCreate,
    CustomWorkoutPlanResponse,
    CustomWorkoutTemplateNewCreate,
    CustomWorkoutTemplateNewResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


class BulkDeleteRequest(BaseModel):
    template_ids: List[str]


def convert_template_to_response(template: CustomWorkoutTemplateNew) -> dict:
    """CustomWorkoutTemplateNewオブジェクトをレスポンス用の辞書に変換"""
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "template_type": template.template_type,
        "section_type": template.section_type,
        "sessions": template.sessions,
        "steps": template.steps,
        "workout_type_id": None,  # 新しいテーブルにはこのフィールドがない
        "difficulty_level": None,  # 新しいテーブルにはこのフィールドがない
        "estimated_duration_minutes": None,  # 新しいテーブルにはこのフィールドがない
        "tags": None,  # 新しいテーブルにはこのフィールドがない
        "created_at": template.created_at,
        "updated_at": template.updated_at
    }


@router.get("/templates-new", response_model=List[CustomWorkoutTemplateNewResponse])
async def get_custom_workout_templates(
    category: Optional[str] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    template_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("usage_count"),
    sort_order: Optional[str] = Query("desc"),
    limit: Optional[int] = Query(None),
    offset: Optional[int] = Query(0),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート一覧取得（ソート・フィルター・検索対応）"""
    try:
        logger.info(f"🔍 カスタムワークアウトテンプレート一覧取得開始: user_id={current_user_id}")
        
        query = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.user_id == current_user_id
        )
        
        # お気に入りフィルター
        if is_favorite is not None:
            query = query.filter(CustomWorkoutTemplateNew.is_favorite == is_favorite)
        
        # テンプレートタイプフィルター
        if template_type:
            query = query.filter(CustomWorkoutTemplateNew.template_type == template_type)
        
        # 検索フィルター（名前・説明）
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                CustomWorkoutTemplateNew.name.ilike(search_term) |
                CustomWorkoutTemplateNew.description.ilike(search_term)
            )
        
        # ソート処理
        sort_column = getattr(CustomWorkoutTemplateNew, sort_by, CustomWorkoutTemplateNew.usage_count)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # ページネーション
        if limit:
            query = query.limit(limit).offset(offset)
        
        templates = query.all()
        
        logger.info(f"✅ カスタムワークアウトテンプレート一覧取得成功: {len(templates)}件")
        
        return [convert_template_to_response(template) for template in templates]
        
    except Exception as e:
        logger.error(f"❌ カスタムワークアウトテンプレート一覧取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch custom workout templates"
        )


@router.post("/templates", response_model=CustomWorkoutTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_workout_template(
    template_data: CustomWorkoutTemplateCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート作成"""
    try:
        logger.info(f"🔍 カスタムワークアウトテンプレート作成開始: user_id={current_user_id}")
        
        # 同名のテンプレートが存在するかチェック
        existing = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.name == template_data.name,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template with this name already exists"
            )
        
        # 新しいテンプレート作成
        db_template = CustomWorkoutTemplate(
            user_id=current_user_id,
            name=template_data.name,
            description=template_data.description,
            category=template_data.category,
            created_from=template_data.created_from,
            workout_type_id=str(template_data.workout_type_id),
            distance_meters=template_data.distance_meters,
            times_seconds=template_data.times_seconds,
            repetitions=template_data.repetitions,
            rest_type=template_data.rest_type,
            rest_duration=template_data.rest_duration,
            intensity=template_data.intensity,
            session_period=template_data.session_period,
            warmup_distance=template_data.warmup_distance,
            warmup_time=template_data.warmup_time,
            main_distance=template_data.main_distance,
            main_time=template_data.main_time,
            cooldown_distance=template_data.cooldown_distance,
            cooldown_time=template_data.cooldown_time
        )
        
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        logger.info(f"✅ カスタムワークアウトテンプレート作成成功: template_id={db_template.id}")
        
        return convert_template_to_response(db_template)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ カスタムワークアウトテンプレート作成エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create custom workout template"
        )


@router.get("/templates/{template_id}", response_model=CustomWorkoutTemplateResponse)
async def get_custom_workout_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート詳細取得"""
    try:
        template = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.id == template_id,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return convert_template_to_response(template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ カスタムワークアウトテンプレート詳細取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template"
        )


@router.put("/templates/{template_id}", response_model=CustomWorkoutTemplateResponse)
async def update_custom_workout_template(
    template_id: str,
    template_data: CustomWorkoutTemplateUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート更新"""
    try:
        template = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.id == template_id,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # 更新データを適用
        update_data = template_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        
        return convert_template_to_response(template)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ カスタムワークアウトテンプレート更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )




@router.post("/templates/{template_id}/duplicate", response_model=CustomWorkoutTemplateResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_custom_workout_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート複製"""
    try:
        logger.info(f"🔍 カスタムワークアウトテンプレート複製開始: template_id={template_id}, user_id={current_user_id}")
        
        # 元のテンプレートを取得
        original_template = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.id == template_id,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if not original_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # 複製テンプレートを作成
        duplicated_template = CustomWorkoutTemplate(
            user_id=current_user_id,
            name=f"{original_template.name} (コピー)",
            description=original_template.description,
            category=original_template.category,
            created_from=original_template.created_from,
            workout_type_id=original_template.workout_type_id,
            distance_meters=original_template.distance_meters,
            times_seconds=original_template.times_seconds,
            repetitions=original_template.repetitions,
            rest_type=original_template.rest_type,
            rest_duration=original_template.rest_duration,
            intensity=original_template.intensity,
            session_period=original_template.session_period,
            warmup_distance=original_template.warmup_distance,
            warmup_time=original_template.warmup_time,
            main_distance=original_template.main_distance,
            main_time=original_template.main_time,
            cooldown_distance=original_template.cooldown_distance,
            cooldown_time=original_template.cooldown_time,
            is_favorite=False,  # 複製時はお気に入りをリセット
            usage_count=0       # 複製時は使用回数をリセット
        )
        
        db.add(duplicated_template)
        db.commit()
        db.refresh(duplicated_template)
        
        logger.info(f"✅ カスタムワークアウトテンプレート複製成功: new_template_id={duplicated_template.id}")
        
        return convert_template_to_response(duplicated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ カスタムワークアウトテンプレート複製エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to duplicate template"
        )


@router.delete("/templates/{template_id}")
async def delete_custom_workout_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート削除"""
    try:
        template = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.id == template_id,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        db.delete(template)
        db.commit()
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ カスタムワークアウトテンプレート削除エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )


@router.post("/templates/{template_id}/use")
async def use_custom_workout_template(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """カスタムワークアウトテンプレート使用（使用回数と最終使用日時を更新）"""
    try:
        template = db.query(CustomWorkoutTemplate).filter(
            CustomWorkoutTemplate.id == template_id,
            CustomWorkoutTemplate.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        template.usage_count += 1
        template.last_used = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Template usage updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ カスタムワークアウトテンプレート使用更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template usage"
        )


# 新しいテンプレート形式用のAPI
@router.get("/templates-new", response_model=List[CustomWorkoutTemplateNewResponse])
async def get_custom_workout_templates_new(
    template_type: Optional[str] = Query(None),
    # current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート一覧取得"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート一覧取得開始")
        
        # 現在はモックデータを返す（実際のデータベース実装は後で追加）
        mock_templates = [
            {
                "id": "template_1",
                "name": "イージーデー",
                "description": "回復を重視した軽い練習",
                "template_type": "daily",
                "section_type": None,
                "sessions": [
                    {
                        "id": "session_1",
                        "session_number": 1,
                        "time_period": "morning",
                        "sections": {
                            "warmup": {
                                "steps": [
                                    {
                                        "id": "step_1",
                                        "type": "jogging",
                                        "name": "ジョギング",
                                        "distance_meters": 2000,
                                        "duration_seconds": 600,
                                        "target_pace": "5:00/km",
                                        "intensity_rpe": 3,
                                        "notes": "楽なペースで"
                                    }
                                ],
                                "avg_heart_rate": None,
                                "max_heart_rate": None
                            },
                            "main": {
                                "steps": [
                                    {
                                        "id": "step_2",
                                        "type": "easy_run",
                                        "name": "イージーラン",
                                        "distance_meters": 5000,
                                        "duration_seconds": 1500,
                                        "target_pace": "5:00/km",
                                        "intensity_rpe": 4,
                                        "notes": "会話できるペース"
                                    }
                                ],
                                "avg_heart_rate": None,
                                "max_heart_rate": None
                            },
                            "cooldown": {
                                "steps": [
                                    {
                                        "id": "step_3",
                                        "type": "walking",
                                        "name": "ウォーキング",
                                        "distance_meters": 1000,
                                        "duration_seconds": 600,
                                        "target_pace": "10:00/km",
                                        "intensity_rpe": 2,
                                        "notes": "ゆっくり歩く"
                                    }
                                ],
                                "avg_heart_rate": None,
                                "max_heart_rate": None
                            }
                        }
                    }
                ],
                "steps": [],
                "is_favorite": False,
                "usage_count": 0,
                "last_used": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # セクションテンプレート（ウォームアップ）
            {
                "id": "template_warmup_1",
                "name": "基本ウォームアップ",
                "description": "ジョギング→ストレッチ→動的ウォームアップ",
                "template_type": "section",
                "section_type": "warmup",
                "sessions": [],
                "steps": [
                    {
                        "id": "step_w1",
                        "type": "jogging",
                        "name": "ジョギング",
                        "distance_meters": 1000,
                        "duration_seconds": 600,
                        "target_pace": "6:00/km",
                        "intensity_rpe": 3,
                        "notes": "軽いジョギング"
                    },
                    {
                        "id": "step_w2",
                        "type": "dynamic_stretch",
                        "name": "動的ストレッチ",
                        "distance_meters": 0,
                        "duration_seconds": 300,
                        "target_pace": None,
                        "intensity_rpe": 2,
                        "notes": "動的ストレッチ"
                    },
                    {
                        "id": "step_w3",
                        "type": "flow_run",
                        "name": "流し",
                        "distance_meters": 200,
                        "duration_seconds": 120,
                        "target_pace": "4:00/km",
                        "intensity_rpe": 6,
                        "notes": "流し"
                    }
                ],
                "is_favorite": False,
                "usage_count": 0,
                "last_used": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # セクションテンプレート（メイン練習）
            {
                "id": "template_main_1",
                "name": "インターバル練習",
                "description": "400m×5本のインターバル練習",
                "template_type": "section",
                "section_type": "main",
                "sessions": [],
                "steps": [
                    {
                        "id": "step_m1",
                        "type": "interval_run",
                        "name": "インターバル走",
                        "distance_meters": 400,
                        "duration_seconds": 75,
                        "target_pace": "3:07/km",
                        "intensity_rpe": 8,
                        "notes": "400m×5本"
                    },
                    {
                        "id": "step_m2",
                        "type": "rest",
                        "name": "レスト",
                        "distance_meters": 0,
                        "duration_seconds": 90,
                        "target_pace": None,
                        "intensity_rpe": 1,
                        "notes": "90秒休憩"
                    }
                ],
                "is_favorite": True,
                "usage_count": 5,
                "last_used": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # セクションテンプレート（クールダウン）
            {
                "id": "template_cooldown_1",
                "name": "基本クールダウン",
                "description": "ジョギング→ストレッチ→整理運動",
                "template_type": "section",
                "section_type": "cooldown",
                "sessions": [],
                "steps": [
                    {
                        "id": "step_c1",
                        "type": "jogging",
                        "name": "ジョギング",
                        "distance_meters": 500,
                        "duration_seconds": 300,
                        "target_pace": "6:00/km",
                        "intensity_rpe": 2,
                        "notes": "軽いジョギング"
                    },
                    {
                        "id": "step_c2",
                        "type": "dynamic_stretch",
                        "name": "ストレッチ",
                        "distance_meters": 0,
                        "duration_seconds": 300,
                        "target_pace": None,
                        "intensity_rpe": 2,
                        "notes": "ストレッチ"
                    },
                    {
                        "id": "step_c3",
                        "type": "cooldown",
                        "name": "整理運動",
                        "distance_meters": 0,
                        "duration_seconds": 180,
                        "target_pace": None,
                        "intensity_rpe": 1,
                        "notes": "整理運動"
                    }
                ],
                "is_favorite": False,
                "usage_count": 3,
                "last_used": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        # template_typeでフィルタリング
        if template_type:
            mock_templates = [t for t in mock_templates if t["template_type"] == template_type]
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート一覧取得成功: {len(mock_templates)}件")
        
        return mock_templates
        
    except Exception as e:
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート一覧取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch new custom workout templates"
        )


@router.post("/templates-new", response_model=CustomWorkoutTemplateNewResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_workout_template_new(
    template_data: CustomWorkoutTemplateNewCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート作成"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート作成開始: user_id={current_user_id}")
        
        # 同名のテンプレートが存在するかチェック
        existing = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.name == template_data.name,
            CustomWorkoutTemplateNew.user_id == current_user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template with this name already exists"
            )
        
        # 新しいテンプレートを作成
        new_template = CustomWorkoutTemplateNew(
            user_id=current_user_id,
            name=template_data.name,
            description=template_data.description,
            template_type=template_data.template_type,
            section_type=template_data.section_type,
            sessions=template_data.sessions,
            steps=template_data.steps,
            is_favorite=False,
            usage_count=0,
            last_used=None
        )
        
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート作成成功: template_id={new_template.id}")
        
        return {
            "id": new_template.id,
            "name": new_template.name,
            "description": new_template.description,
            "template_type": new_template.template_type,
            "section_type": new_template.section_type,
            "sessions": new_template.sessions,
            "steps": new_template.steps,
            "is_favorite": new_template.is_favorite,
            "usage_count": new_template.usage_count,
            "last_used": new_template.last_used,
            "created_at": new_template.created_at,
            "updated_at": new_template.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート作成エラー: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create new custom workout template"
        )


@router.get("/templates-new/{template_id}", response_model=CustomWorkoutTemplateNewResponse)
async def get_custom_workout_template_new(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート詳細取得"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート詳細取得開始: template_id={template_id}, user_id={current_user_id}")
        
        # 現在はモックデータを返す（実際のデータベース実装は後で追加）
        mock_template = {
            "id": template_id,
            "name": "イージーデー",
            "description": "回復を重視した軽い練習",
            "template_type": "daily",
            "section_type": None,
            "sessions": [
                {
                    "id": "session_1",
                    "session_number": 1,
                    "time_period": "morning",
                    "sections": {
                        "warmup": {
                            "steps": [
                                {
                                    "id": "step_1",
                                    "type": "jogging",
                                    "name": "ジョギング",
                                    "distance_meters": 2000,
                                    "duration_seconds": 600,
                                    "target_pace": "5:00/km",
                                    "intensity_rpe": 3,
                                    "notes": "楽なペースで"
                                }
                            ],
                            "avg_heart_rate": None,
                            "max_heart_rate": None
                        },
                        "main": {
                            "steps": [
                                {
                                    "id": "step_2",
                                    "type": "easy_run",
                                    "name": "イージーラン",
                                    "distance_meters": 5000,
                                    "duration_seconds": 1500,
                                    "target_pace": "5:00/km",
                                    "intensity_rpe": 4,
                                    "notes": "会話できるペース"
                                }
                            ],
                            "avg_heart_rate": None,
                            "max_heart_rate": None
                        },
                        "cooldown": {
                            "steps": [
                                {
                                    "id": "step_3",
                                    "type": "walking",
                                    "name": "ウォーキング",
                                    "distance_meters": 1000,
                                    "duration_seconds": 600,
                                    "target_pace": "10:00/km",
                                    "intensity_rpe": 2,
                                    "notes": "ゆっくり歩く"
                                }
                            ],
                            "avg_heart_rate": None,
                            "max_heart_rate": None
                        }
                    }
                }
            ],
            "steps": [],
            "is_favorite": False,
            "usage_count": 0,
            "last_used": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート詳細取得成功: template_id={template_id}")
        
        return mock_template
        
    except Exception as e:
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート詳細取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch new custom workout template"
        )


@router.put("/templates-new/{template_id}", response_model=CustomWorkoutTemplateNewResponse)
async def update_custom_workout_template_new(
    template_id: str,
    template_data: CustomWorkoutTemplateNewCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート更新"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート更新開始: template_id={template_id}, user_id={current_user_id}")
        
        # 現在はモックレスポンスを返す（実際のデータベース実装は後で追加）
        updated_template = {
            "id": template_id,
            "name": template_data.name,
            "description": template_data.description,
            "template_type": template_data.template_type,
            "section_type": template_data.section_type,
            "sessions": template_data.sessions,
            "steps": template_data.steps,
            "is_favorite": False,
            "usage_count": 0,
            "last_used": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート更新成功: template_id={template_id}")
        
        return updated_template
        
    except Exception as e:
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update new custom workout template"
        )


@router.delete("/templates-new/{template_id}")
async def delete_custom_workout_template_new(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート削除"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート削除開始: template_id={template_id}, user_id={current_user_id}")
        
        template = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.id == template_id,
            CustomWorkoutTemplateNew.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        db.delete(template)
        db.commit()
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート削除成功: template_id={template_id}")
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート削除エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete new custom workout template"
        )


@router.delete("/templates-new/bulk")
async def bulk_delete_custom_workout_templates_new(
    request: BulkDeleteRequest,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート一括削除"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート一括削除開始: user_id={current_user_id}, ids={request.template_ids}")
        
        # ユーザーが所有するテンプレートのみを削除対象とする
        templates_to_delete = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.id.in_(request.template_ids),
            CustomWorkoutTemplateNew.user_id == current_user_id
        ).all()
        
        deleted_count = len(templates_to_delete)
        
        # 削除実行
        for template in templates_to_delete:
            db.delete(template)
        
        db.commit()
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート一括削除成功: {deleted_count}件")
        
        return {
            "message": f"Successfully deleted {deleted_count} templates",
            "deleted_count": deleted_count,
            "requested_count": len(request.template_ids)
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート一括削除エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk delete templates"
        )


@router.post("/templates-new/{template_id}/duplicate", response_model=CustomWorkoutTemplateNewResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_custom_workout_template_new(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート複製"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート複製開始: template_id={template_id}, user_id={current_user_id}")
        
        # 元のテンプレートを取得
        original_template = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.id == template_id,
            CustomWorkoutTemplateNew.user_id == current_user_id
        ).first()
        
        if not original_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # 複製テンプレートを作成
        duplicated_template = CustomWorkoutTemplateNew(
            user_id=current_user_id,
            name=f"{original_template.name} (コピー)",
            description=original_template.description,
            template_type=original_template.template_type,
            section_type=original_template.section_type,
            sessions=original_template.sessions,
            steps=original_template.steps,
            is_favorite=False,  # 複製時はお気に入りをリセット
            usage_count=0       # 複製時は使用回数をリセット
        )
        
        db.add(duplicated_template)
        db.commit()
        db.refresh(duplicated_template)
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート複製成功: new_template_id={duplicated_template.id}")
        
        return convert_template_to_response(duplicated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート複製エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to duplicate template"
        )


@router.post("/templates-new/{template_id}/use", response_model=CustomWorkoutTemplateNewResponse)
async def use_custom_workout_template_new(
    template_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """新しい形式のカスタムワークアウトテンプレート使用（使用回数と最終使用日時を更新）"""
    try:
        logger.info(f"🔍 新しいカスタムワークアウトテンプレート使用更新開始: template_id={template_id}, user_id={current_user_id}")
        
        # テンプレートを取得
        template = db.query(CustomWorkoutTemplateNew).filter(
            CustomWorkoutTemplateNew.id == template_id,
            CustomWorkoutTemplateNew.user_id == current_user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # 使用回数を増加
        template.usage_count += 1
        template.last_used = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(template)
        
        logger.info(f"✅ 新しいカスタムワークアウトテンプレート使用更新成功: template_id={template_id}")
        
        return convert_template_to_response(template)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 新しいカスタムワークアウトテンプレート使用更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update new custom workout template usage"
        )
#!/usr/bin/env python3
"""
デフォルトの練習種別を作成するスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.workout import WorkoutType
from app.models.user import User
from app.models.prediction import Prediction
from app.models.race import RaceResult, RaceType
from app.models.user_profile import UserProfile
from app.models.personal_best import PersonalBest
from app.models.race_schedule import RaceSchedule
from app.models.custom_workout import CustomWorkoutTemplate, CustomWorkoutPlan, CustomWorkoutPlanItem
from sqlalchemy.orm import Session
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_default_workout_types():
    """デフォルトの練習種別を作成"""
    
    db = next(get_db())
    
    try:
        # 既存のデフォルト練習種別を確認
        existing_count = db.query(WorkoutType).filter(WorkoutType.is_default == True).count()
        
        if existing_count > 0:
            logger.info(f"デフォルトの練習種別は既に {existing_count} 件存在します。")
            return
        
        # デフォルトの練習種別データ
        default_workout_types = [
            {
                "name": "ジョギング",
                "category": "base",
                "is_default": True,
                "created_by": None
            },
            {
                "name": "インターバル",
                "category": "speed",
                "is_default": True,
                "created_by": None
            },
            {
                "name": "テンポ走",
                "category": "threshold",
                "is_default": True,
                "created_by": None
            },
            {
                "name": "ロング走",
                "category": "endurance",
                "is_default": True,
                "created_by": None
            },
            {
                "name": "レペティション",
                "category": "speed",
                "is_default": True,
                "created_by": None
            }
        ]
        
        # 練習種別を作成
        created_count = 0
        for workout_type_data in default_workout_types:
            workout_type = WorkoutType(**workout_type_data)
            db.add(workout_type)
            created_count += 1
        
        db.commit()
        logger.info(f"デフォルトの練習種別を {created_count} 件作成しました。")
        
    except Exception as e:
        logger.error(f"練習種別作成エラー: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_default_workout_types()

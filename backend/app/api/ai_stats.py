from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.user import User
from app.models.workout import Workout
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/stats")
async def get_ai_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    AI機能用の統計データを取得
    """
    try:
        # 練習記録の総数
        total_workouts = db.query(func.count(Workout.id)).scalar() or 0
        
        # 登録ユーザーの総数
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # データ蓄積期間（最初の練習記録から現在まで）
        first_workout = db.query(func.min(Workout.date)).scalar()
        if first_workout:
            # 日付文字列をdatetimeオブジェクトに変換
            if isinstance(first_workout, str):
                first_workout_date = datetime.strptime(first_workout, '%Y-%m-%d').date()
            else:
                first_workout_date = first_workout
            data_collection_days = (datetime.now().date() - first_workout_date).days
        else:
            data_collection_days = 0
        
        return {
            "totalWorkouts": total_workouts,
            "totalUsers": total_users,
            "dataCollectionDays": data_collection_days,
            "lastUpdated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"統計データの取得に失敗しました: {str(e)}"
        )

@router.get("/stats/public")
async def get_ai_stats_public(db: Session = Depends(get_db)):
    """
    公開用のAI統計データを取得（認証不要）
    """
    try:
        # 練習記録の総数
        total_workouts = db.query(func.count(Workout.id)).scalar() or 0
        
        # 登録ユーザーの総数
        total_users = db.query(func.count(User.id)).scalar() or 0
        
        # データ蓄積期間（最初の練習記録から現在まで）
        first_workout = db.query(func.min(Workout.date)).scalar()
        if first_workout:
            # 日付文字列をdatetimeオブジェクトに変換
            if isinstance(first_workout, str):
                first_workout_date = datetime.strptime(first_workout, '%Y-%m-%d').date()
            else:
                first_workout_date = first_workout
            data_collection_days = (datetime.now().date() - first_workout_date).days
        else:
            data_collection_days = 0
        
        return {
            "totalWorkouts": total_workouts,
            "totalUsers": total_users,
            "dataCollectionDays": data_collection_days,
            "lastUpdated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"統計データの取得に失敗しました: {str(e)}"
        )

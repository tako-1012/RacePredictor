#!/usr/bin/env python3
"""
日付付きのテストデータを作成するスクリプト
"""

import os
import sys
from datetime import date, timedelta
import random

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import engine
from app.models.workout import Workout, WorkoutType
from app.models.user import User
from app.core.security import get_password_hash

def create_test_data_with_dates():
    """日付付きのテストデータを作成"""
    print("🚀 日付付きテストデータ作成を開始します...")
    
    # データベース接続
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # テストユーザー作成
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                name="テストユーザー",
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ テストユーザーを作成しました: {test_user.email}")
        else:
            print(f"✅ テストユーザーが既に存在します: {test_user.email}")
        
        # 練習種別作成
        workout_types_data = [
            {"name": "easy_run", "category": "endurance"},
            {"name": "tempo_run", "category": "tempo"},
            {"name": "interval", "category": "speed"},
            {"name": "long_run", "category": "endurance"},
            {"name": "recovery", "category": "recovery"},
        ]
        
        workout_types = {}
        for wt_data in workout_types_data:
            workout_type = db.query(WorkoutType).filter(WorkoutType.name == wt_data["name"]).first()
            if not workout_type:
                workout_type = WorkoutType(
                    name=wt_data["name"],
                    category=wt_data["category"],
                    is_default=True
                )
                db.add(workout_type)
                db.commit()
                db.refresh(workout_type)
                print(f"✅ 練習種別を作成しました: {workout_type.name}")
            else:
                print(f"✅ 練習種別が既に存在します: {workout_type.name}")
            workout_types[wt_data["name"]] = workout_type
        
        # 既存のワークアウトデータを削除
        existing_workouts = db.query(Workout).filter(Workout.user_id == test_user.id).all()
        if existing_workouts:
            print(f"🗑️ 既存のワークアウトデータ {len(existing_workouts)}件を削除します...")
            for workout in existing_workouts:
                db.delete(workout)
            db.commit()
        
        # 最近3日分のテストデータを作成
        workouts_created = 0
        base_date = date.today()
        
        workout_data = [
            {
                "date": base_date - timedelta(days=2),
                "type": "easy_run",
                "distance": 5000,
                "time_seconds": 25 * 60 + 43,  # 25分43秒
                "intensity": 2
            },
            {
                "date": base_date - timedelta(days=1),
                "type": "easy_run", 
                "distance": 4840,
                "time_seconds": 29 * 60 + 14,  # 29分14秒
                "intensity": 2
            },
            {
                "date": base_date,
                "type": "easy_run",
                "distance": 4870,
                "time_seconds": 34 * 60 + 43,  # 34分43秒
                "intensity": 2
            }
        ]
        
        for data in workout_data:
            workout = Workout(
                user_id=test_user.id,
                date=data["date"],
                workout_type_id=str(workout_types[data["type"]].id),
                target_distance_meters=data["distance"],
                actual_distance_meters=data["distance"],
                target_times_seconds=[data["time_seconds"]],
                actual_times_seconds=[data["time_seconds"]],
                intensity=data["intensity"],
                completed=True,
                completion_rate=100.0,
                notes=f"{workout_types[data['type']].name} - テストデータ"
            )
            
            db.add(workout)
            workouts_created += 1
        
        db.commit()
        print(f"✅ {workouts_created}件のワークアウトデータを作成しました")
        print(f"📅 期間: {base_date - timedelta(days=2)} ～ {base_date}")
        print("✅ 日付付きテストデータの作成が完了しました！")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        print(f"❌ スタックトレース: {traceback.format_exc()}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data_with_dates()

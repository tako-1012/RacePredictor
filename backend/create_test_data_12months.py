#!/usr/bin/env python3
"""
分析ページ用のテストデータを作成するスクリプト（12ヶ月版）
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

def create_test_data():
    """テストデータを作成"""
    print("🚀 分析ページ用テストデータ作成を開始します...")
    
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
        
        # テストワークアウトデータ作成（過去12ヶ月分）
        start_date = date.today() - timedelta(days=365)  # 12ヶ月前
        workouts_created = 0
        
        current_date = start_date
        week_count = 0
        
        while current_date <= date.today():
            week_count += 1
            
            # 週間パターンでデータを作成
            weekly_pattern = [
                ("easy_run", 2, 5000, [1200, 1200, 1200, 1200, 200]),  # 月: イージーラン
                ("interval", 4, 4000, [400, 400, 400, 400, 400, 400, 400, 400, 400, 400]),  # 火: インターバル
                ("recovery", 1, 3000, [1800]),  # 水: 回復走
                ("tempo_run", 3, 6000, [1800, 1800, 1800]),  # 木: テンポ走
                None,  # 金: 休息
                ("long_run", 2, 15000, [4500, 4500, 4500]),  # 土: ロング走
                ("easy_run", 2, 4000, [1200, 1200, 1200, 400]),  # 日: イージーラン
            ]
            
            for day_offset, workout_info in enumerate(weekly_pattern):
                if workout_info is None:  # 休息日
                    current_date += timedelta(days=1)
                    continue
                
                workout_type_name, intensity, distance_meters, times_seconds = workout_info
                
                # 達成率をランダムに設定（80-100%）
                # 過去の期間は少し低めに設定
                if current_date < date.today() - timedelta(days=180):  # 6ヶ月前より前
                    completion_rate = random.uniform(0.7, 0.9)
                else:  # 最近6ヶ月
                    completion_rate = random.uniform(0.8, 1.0)
                
                actual_distance = int(distance_meters * completion_rate)
                actual_times = [int(time * completion_rate) for time in times_seconds]
                
                # 完了フラグ
                completed = completion_rate >= 0.9
                
                workout = Workout(
                    user_id=test_user.id,
                    date=current_date,
                    workout_type_id=str(workout_types[workout_type_name].id),
                    target_distance_meters=distance_meters,
                    actual_distance_meters=actual_distance,
                    target_times_seconds=times_seconds,
                    actual_times_seconds=actual_times,
                    intensity=intensity,
                    completed=completed,
                    completion_rate=completion_rate * 100,
                    notes=f"{workout_types[workout_type_name].name} - テストデータ"
                )
                
                db.add(workout)
                workouts_created += 1
                current_date += timedelta(days=1)
        
        db.commit()
        print(f"✅ {workouts_created}件のワークアウトデータを作成しました")
        print(f"📅 期間: {start_date} ～ {date.today()}")
        print("✅ 分析ページ用テストデータの作成が完了しました！")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        print(f"❌ スタックトレース: {traceback.format_exc()}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()

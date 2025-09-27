#!/usr/bin/env python3
"""
分析ページ用のテストデータを作成するスクリプト
"""

import sys
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.workout import Workout, WorkoutType
from app.models.user import User
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_user(db: Session):
    """テストユーザーを作成"""
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            full_name="テストユーザー",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        logger.info(f"✅ テストユーザーを作成しました: {test_user.email}")
    else:
        logger.info(f"✅ テストユーザーが既に存在します: {test_user.email}")
    return test_user

def create_workout_types(db: Session):
    """練習種別を作成"""
    workout_types = [
        {"name": "easy_run", "display_name": "イージーラン", "description": "回復を重視した軽いランニング"},
        {"name": "tempo_run", "display_name": "テンポ走", "description": "一定のペースで走る練習"},
        {"name": "interval", "display_name": "インターバル走", "description": "高強度のインターバル練習"},
        {"name": "long_run", "display_name": "ロング走", "description": "長距離の持久走"},
        {"name": "recovery", "display_name": "回復走", "description": "疲労回復を目的とした軽いランニング"},
        {"name": "hill_training", "display_name": "坂道練習", "description": "坂道での筋力強化練習"},
    ]
    
    created_types = {}
    for wt_data in workout_types:
        workout_type = db.query(WorkoutType).filter(WorkoutType.name == wt_data["name"]).first()
        if not workout_type:
            workout_type = WorkoutType(
                name=wt_data["name"],
                display_name=wt_data["display_name"],
                description=wt_data["description"],
                is_default=True
            )
            db.add(workout_type)
            db.commit()
            db.refresh(workout_type)
            logger.info(f"✅ 練習種別を作成しました: {workout_type.name}")
        else:
            logger.info(f"✅ 練習種別が既に存在します: {workout_type.name}")
        created_types[wt_data["name"]] = workout_type
    
    return created_types

def create_test_workouts(db: Session, user_id: str, workout_types: dict):
    """テスト用のワークアウトデータを作成"""
    
    # 過去6ヶ月分のデータを作成
    start_date = date.today() - timedelta(days=180)
    
    workouts_data = []
    
    # 週間パターンでデータを作成
    current_date = start_date
    week_count = 0
    
    while current_date <= date.today():
        week_count += 1
        
        # 週間パターン: 月(イージー), 火(インターバル), 水(回復), 木(テンポ), 金(休息), 土(ロング), 日(イージー)
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
            import random
            completion_rate = random.uniform(0.8, 1.0)
            actual_distance = int(distance_meters * completion_rate)
            actual_times = [int(time * completion_rate) for time in times_seconds]
            
            # 完了フラグ
            completed = completion_rate >= 0.9
            
            workout = Workout(
                user_id=user_id,
                date=current_date,
                workout_type_id=str(workout_types[workout_type_name].id),
                target_distance_meters=distance_meters,
                actual_distance_meters=actual_distance,
                target_times_seconds=times_seconds,
                actual_times_seconds=actual_times,
                intensity=intensity,
                completed=completed,
                completion_rate=completion_rate * 100,
                notes=f"週{week_count} - {workout_types[workout_type_name].display_name}"
            )
            
            db.add(workout)
            workouts_data.append(workout)
            
            current_date += timedelta(days=1)
    
    db.commit()
    logger.info(f"✅ {len(workouts_data)}件のワークアウトデータを作成しました")
    return workouts_data

def main():
    """メイン関数"""
    try:
        logger.info("🚀 分析ページ用テストデータ作成を開始します...")
        
        # データベース接続
        from app.core.database import engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # テストユーザー作成
            test_user = create_test_user(db)
            
            # 練習種別作成
            workout_types = create_workout_types(db)
            
            # 既存のワークアウトデータを削除
            existing_workouts = db.query(Workout).filter(Workout.user_id == test_user.id).all()
            if existing_workouts:
                logger.info(f"🗑️ 既存のワークアウトデータ {len(existing_workouts)}件を削除します...")
                for workout in existing_workouts:
                    db.delete(workout)
                db.commit()
            
            # テストワークアウトデータ作成
            workouts = create_test_workouts(db, test_user.id, workout_types)
            
            logger.info("✅ 分析ページ用テストデータの作成が完了しました！")
            logger.info(f"📊 作成されたデータ:")
            logger.info(f"   - ユーザー: {test_user.email}")
            logger.info(f"   - 練習種別: {len(workout_types)}種類")
            logger.info(f"   - ワークアウト: {len(workouts)}件")
            logger.info(f"   - 期間: {workouts[0].date} ～ {workouts[-1].date}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ エラーが発生しました: {e}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    main()

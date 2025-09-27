#!/usr/bin/env python3
"""
テストユーザー作成スクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User, UserTypeEnum, GenderEnum
from app.models.user_profile import UserProfile
from app.models.workout import Workout, WorkoutType
from app.models.personal_best import PersonalBest
from app.core.security import get_password_hash
from datetime import datetime, date, timedelta
import random

def create_test_users():
    """テストユーザーを作成"""
    with get_db_session() as db:
        # デフォルトのWorkoutTypeを作成
        default_workout_type = db.query(WorkoutType).filter(WorkoutType.name == "easy_run").first()
        if not default_workout_type:
            default_workout_type = WorkoutType(
                name="easy_run",
                category="endurance",
                is_default=True
            )
            db.add(default_workout_type)
            db.flush()
        # テストユーザーデータ
        test_users = [
            {
                "email": "tanaka.athlete@test.com",
                "password": "password123",
                "username": "tanaka.athlete",
                "name": "田中 アスリート",
                "birth_date": date(1990, 5, 15),
                "gender": GenderEnum.male,
                "user_type": UserTypeEnum.athlete,
                "profile": {
                    "age": 34,
                    "gender": "M",
                    "height_cm": 175.0,
                    "weight_kg": 68.0,
                    "resting_hr": 55,
                    "max_hr": 185,
                    "vo2_max": 55.0
                }
            },
            {
                "email": "sato.coach@test.com",
                "password": "password123",
                "username": "sato.coach",
                "name": "佐藤 コーチ",
                "birth_date": date(1985, 8, 22),
                "gender": GenderEnum.male,
                "user_type": UserTypeEnum.serious_runner,
                "profile": {
                    "age": 39,
                    "gender": "M",
                    "height_cm": 170.0,
                    "weight_kg": 72.0,
                    "resting_hr": 60,
                    "max_hr": 180,
                    "vo2_max": 50.0
                }
            },
            {
                "email": "yamada.beginner@test.com",
                "password": "password123",
                "username": "yamada.beginner",
                "name": "山田 ビギナー",
                "birth_date": date(1995, 3, 10),
                "gender": GenderEnum.female,
                "user_type": UserTypeEnum.casual_runner,
                "profile": {
                    "age": 29,
                    "gender": "F",
                    "height_cm": 160.0,
                    "weight_kg": 55.0,
                    "resting_hr": 65,
                    "max_hr": 190,
                    "vo2_max": 40.0
                }
            },
            {
                "email": "suzuki.marathon@test.com",
                "password": "password123",
                "username": "suzuki.marathon",
                "name": "鈴木 マラソン",
                "birth_date": date(1988, 12, 5),
                "gender": GenderEnum.male,
                "user_type": UserTypeEnum.athlete,
                "profile": {
                    "age": 35,
                    "gender": "M",
                    "height_cm": 178.0,
                    "weight_kg": 70.0,
                    "resting_hr": 50,
                    "max_hr": 188,
                    "vo2_max": 60.0
                }
            },
            {
                "email": "kobayashi.sprinter@test.com",
                "password": "password123",
                "username": "kobayashi.sprinter",
                "name": "小林 スプリンター",
                "birth_date": date(1992, 7, 18),
                "gender": GenderEnum.female,
                "user_type": UserTypeEnum.athlete,
                "profile": {
                    "age": 32,
                    "gender": "F",
                    "height_cm": 165.0,
                    "weight_kg": 58.0,
                    "resting_hr": 58,
                    "max_hr": 195,
                    "vo2_max": 52.0
                }
            }
        ]

        created_users = []
        
        for user_data in test_users:
            # ユーザーが既に存在するかチェック
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"⚠️ ユーザー {user_data['email']} は既に存在します")
                continue

            # ユーザー作成
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                username=user_data["username"],
                name=user_data["name"],
                birth_date=user_data["birth_date"],
                gender=user_data["gender"],
                user_type=user_data["user_type"],
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()  # IDを取得するためにflush

            # プロフィール作成
            profile = UserProfile(
                user_id=user.id,
                age=user_data["profile"]["age"],
                gender=user_data["profile"]["gender"],
                height_cm=user_data["profile"]["height_cm"],
                weight_kg=user_data["profile"]["weight_kg"],
                resting_hr=user_data["profile"]["resting_hr"],
                max_hr=user_data["profile"]["max_hr"],
                vo2_max=user_data["profile"]["vo2_max"]
            )
            profile.calculate_bmi()  # BMIを計算
            db.add(profile)

            # サンプルワークアウトデータ作成（簡略化）
            for i in range(3):  # 3つのワークアウト
                workout_date = datetime.now() - timedelta(days=i*3)
                
                workout = Workout(
                    user_id=user.id,
                    date=workout_date.date(),
                    workout_type_id=default_workout_type.id,
                    target_distance_meters=5000,
                    actual_distance_meters=5000 + random.randint(-200, 200),
                    target_times_seconds=[1800],  # 30分
                    actual_times_seconds=[1800 + random.randint(-300, 300)],
                    completed=True,
                    completion_rate=100,
                    notes=f"サンプルワークアウト {i+1}"
                )
                db.add(workout)

            # サンプル個人ベストデータ作成
            pb_distances = ["5km", "10km", "half_marathon"]
            pb_times = [1800, 3600, 7800]  # 30分, 60分, 2時間10分
            
            for i, (dist, time) in enumerate(zip(pb_distances, pb_times)):
                pb = PersonalBest(
                    user_id=user.id,
                    race_type="road",
                    distance=dist,
                    time_seconds=time + random.randint(-300, 300),
                    achieved_date=date.today() - timedelta(days=random.randint(30, 365)),
                    race_name=f"サンプルレース {dist}"
                )
                db.add(pb)

            created_users.append({
                "email": user_data["email"],
                "password": user_data["password"],
                "username": user_data["username"]
            })
            print(f"✅ ユーザー作成完了: {user_data['email']}")

        db.commit()
        print(f"\n🎉 {len(created_users)}人のテストユーザーを作成しました！")
        
        print("\n📋 ログイン情報:")
        for user in created_users:
            print(f"  メール: {user['email']}")
            print(f"  パスワード: {user['password']}")
            print(f"  ユーザー名: {user['username']}")
            print()

if __name__ == "__main__":
    create_test_users()

#!/usr/bin/env python3
"""
データベーステーブルを作成するスクリプト
"""
from app.core.database import engine, Base

# 個別にモデルをインポート（循環インポートを避ける）
from app.models.user import User
from app.models.workout import WorkoutType, Workout
from app.models.prediction import Prediction
from app.models.race import RaceResult, RaceType
from app.models.user_profile import UserProfile
from app.models.personal_best import PersonalBest
from app.models.race_schedule import RaceSchedule
from app.models.custom_workout import CustomWorkoutTemplate, CustomWorkoutPlan, CustomWorkoutPlanItem

def create_all_tables():
    """すべてのテーブルを作成"""
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_all_tables()

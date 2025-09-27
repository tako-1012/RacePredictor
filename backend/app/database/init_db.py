#!/usr/bin/env python3
"""
データベース初期化スクリプト
本番環境でのデプロイ時に使用
"""

import sys
import os
from pathlib import Path

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.database import engine, Base
# モデルを個別にインポート（循環インポートを避ける）
from app.models.user import User
from app.models.workout import WorkoutType, Workout
from app.models.prediction import Prediction
from app.models.race import RaceResult, RaceType
from app.models.user_profile import UserProfile
from app.models.personal_best import PersonalBest
from app.models.race_schedule import RaceSchedule
from app.models.custom_workout import CustomWorkoutTemplate, CustomWorkoutPlan, CustomWorkoutPlanItem
from sqlalchemy.orm import sessionmaker

def init_database():
    """データベースの初期化"""
    print("🗄️  データベースを初期化中...")
    
    try:
        # テーブル作成
        print("📋 テーブルを作成中...")
        Base.metadata.create_all(bind=engine)
        print("✅ テーブル作成完了")
        
        # セッション作成
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # 初期データの投入（現在はスキップ）
            print("📊 初期データの投入はスキップされました")
            
        except Exception as e:
            print(f"⚠️  初期データ投入でエラー: {e}")
            # 初期データのエラーは致命的ではないので続行
        
        finally:
            db.close()
        
        print("🎉 データベース初期化完了")
        
    except Exception as e:
        print(f"❌ データベース初期化エラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()

#!/usr/bin/env python3
"""
WorkoutTypeテーブルの初期データ作成
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import get_db
from backend.app.models.workout import WorkoutType

def create_workout_types():
    """WorkoutTypeの初期データを作成"""
    try:
        db = next(get_db())
        
        # 既存のデータをチェック
        existing_count = db.query(WorkoutType).count()
        if existing_count > 0:
            print(f'ℹ️ WorkoutTypeは既に{existing_count}件存在します')
            db.close()
            return
        
        # 初期データを作成
        workout_types = [
            {"name": "ジョギング", "description": "ゆっくりとしたペースでのランニング"},
            {"name": "ランニング", "description": "中程度のペースでのランニング"},
            {"name": "インターバル", "description": "高強度と低強度を交互に繰り返す練習"},
            {"name": "テンポ走", "description": "一定のペースを維持する練習"},
            {"name": "ロングラン", "description": "長距離を走る練習"},
            {"name": "リカバリーラン", "description": "回復を目的とした軽いランニング"},
            {"name": "ヒルラン", "description": "坂道でのランニング練習"},
            {"name": "トラック練習", "description": "トラックでの練習"},
        ]
        
        for type_data in workout_types:
            workout_type = WorkoutType(
                name=type_data["name"],
                description=type_data["description"]
            )
            db.add(workout_type)
        
        db.commit()
        print(f'✅ WorkoutType初期データ作成完了: {len(workout_types)}件')
        
    except Exception as e:
        print(f'❌ エラー: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_workout_types()

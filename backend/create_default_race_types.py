#!/usr/bin/env python3
"""
デフォルトのレース種別を作成するスクリプト
"""

import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.race import RaceType

def create_default_race_types():
    """デフォルトのレース種別を作成"""
    print("🚀 デフォルトのレース種別を作成します...")
    
    # データベース接続
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # デフォルトのレース種別データ
        race_types_data = [
            {
                "name": "5km",
                "distance_km": 5.0,
                "description": "5キロメートルレース",
                "category": "road",
                "is_default": True,
                "world_record_seconds": 12 * 60 + 35,  # 12:35
                "typical_finish_time_range": {"min": 15 * 60, "max": 30 * 60}
            },
            {
                "name": "10km",
                "distance_km": 10.0,
                "description": "10キロメートルレース",
                "category": "road",
                "is_default": True,
                "world_record_seconds": 26 * 60 + 11,  # 26:11
                "typical_finish_time_range": {"min": 30 * 60, "max": 60 * 60}
            },
            {
                "name": "ハーフマラソン",
                "distance_km": 21.0975,
                "description": "ハーフマラソン（21.0975km）",
                "category": "road",
                "is_default": True,
                "world_record_seconds": 57 * 60 + 31,  # 57:31
                "typical_finish_time_range": {"min": 60 * 60, "max": 120 * 60}
            },
            {
                "name": "マラソン",
                "distance_km": 42.195,
                "description": "フルマラソン（42.195km）",
                "category": "road",
                "is_default": True,
                "world_record_seconds": 2 * 60 * 60 + 1 * 60 + 39,  # 2:01:39
                "typical_finish_time_range": {"min": 120 * 60, "max": 300 * 60}
            },
            {
                "name": "800m",
                "distance_km": 0.8,
                "description": "800メートル走",
                "category": "track",
                "is_default": True,
                "world_record_seconds": 1 * 60 + 40,  # 1:40
                "typical_finish_time_range": {"min": 2 * 60, "max": 4 * 60}
            },
            {
                "name": "1500m",
                "distance_km": 1.5,
                "description": "1500メートル走",
                "category": "track",
                "is_default": True,
                "world_record_seconds": 3 * 60 + 26,  # 3:26
                "typical_finish_time_range": {"min": 4 * 60, "max": 8 * 60}
            },
            {
                "name": "5000m",
                "distance_km": 5.0,
                "description": "5000メートル走",
                "category": "track",
                "is_default": True,
                "world_record_seconds": 12 * 60 + 35,  # 12:35
                "typical_finish_time_range": {"min": 15 * 60, "max": 30 * 60}
            },
            {
                "name": "10000m",
                "distance_km": 10.0,
                "description": "10000メートル走",
                "category": "track",
                "is_default": True,
                "world_record_seconds": 26 * 60 + 11,  # 26:11
                "typical_finish_time_range": {"min": 30 * 60, "max": 60 * 60}
            }
        ]
        
        created_count = 0
        for rt_data in race_types_data:
            # 既存チェック
            existing = db.query(RaceType).filter(RaceType.name == rt_data["name"]).first()
            if not existing:
                race_type = RaceType(**rt_data)
                db.add(race_type)
                created_count += 1
                print(f"✅ レース種別を作成しました: {race_type.name}")
            else:
                print(f"✅ レース種別が既に存在します: {existing.name}")
        
        db.commit()
        print(f"✅ {created_count}件のレース種別を作成しました")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        print(f"❌ スタックトレース: {traceback.format_exc()}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_default_race_types()
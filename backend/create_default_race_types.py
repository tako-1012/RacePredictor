#!/usr/bin/env python3
"""
デフォルトのレース種目を作成するスクリプト
基本9種目 + 駅伝対応
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.models.race import RaceType
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# デフォルトのレース種目データ
DEFAULT_RACE_TYPES = [
    # トラック種目
    {
        "name": "800m",
        "category": "track",
        "default_distance_meters": 800,
        "is_customizable": True,
        "min_distance_meters": 400,
        "max_distance_meters": 1600,
        "description": "中距離トラック種目"
    },
    {
        "name": "1500m",
        "category": "track",
        "default_distance_meters": 1500,
        "is_customizable": True,
        "min_distance_meters": 800,
        "max_distance_meters": 3000,
        "description": "中距離トラック種目"
    },
    {
        "name": "3000m",
        "category": "track",
        "default_distance_meters": 3000,
        "is_customizable": True,
        "min_distance_meters": 1500,
        "max_distance_meters": 5000,
        "description": "長距離トラック種目"
    },
    {
        "name": "5000m",
        "category": "track",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "長距離トラック種目"
    },
    {
        "name": "10000m",
        "category": "track",
        "default_distance_meters": 10000,
        "is_customizable": True,
        "min_distance_meters": 5000,
        "max_distance_meters": 20000,
        "description": "長距離トラック種目"
    },
    
    # ロード種目
    {
        "name": "5km",
        "category": "road",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "ロードレース（5km）"
    },
    {
        "name": "10km",
        "category": "road",
        "default_distance_meters": 10000,
        "is_customizable": True,
        "min_distance_meters": 5000,
        "max_distance_meters": 20000,
        "description": "ロードレース（10km）"
    },
    {
        "name": "ハーフマラソン",
        "category": "road",
        "default_distance_meters": 21097,
        "is_customizable": True,
        "min_distance_meters": 15000,
        "max_distance_meters": 25000,
        "description": "ハーフマラソン（21.097km）"
    },
    {
        "name": "フルマラソン",
        "category": "road",
        "default_distance_meters": 42195,
        "is_customizable": True,
        "min_distance_meters": 30000,
        "max_distance_meters": 50000,
        "description": "フルマラソン（42.195km）"
    },
    
    # 駅伝種目
    {
        "name": "駅伝（1区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝1区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（2区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝2区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（3区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝3区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（4区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝4区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（5区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝5区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（6区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝6区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（7区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝7区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（8区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝8区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（9区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝9区（距離カスタマイズ可能）"
    },
    {
        "name": "駅伝（10区）",
        "category": "relay",
        "default_distance_meters": 5000,
        "is_customizable": True,
        "min_distance_meters": 3000,
        "max_distance_meters": 10000,
        "description": "駅伝10区（距離カスタマイズ可能）"
    }
]


def create_default_race_types():
    """デフォルトのレース種目を作成"""
    # データベース接続
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 既存のデフォルト種目をチェック
        existing_count = db.query(RaceType).filter(RaceType.is_default == True).count()
        
        if existing_count > 0:
            print(f"デフォルトのレース種目は既に {existing_count} 件存在します。")
            return
        
        # デフォルト種目を作成
        created_count = 0
        for race_type_data in DEFAULT_RACE_TYPES:
            race_type = RaceType(
                **race_type_data,
                is_default=True,
                created_by=None
            )
            db.add(race_type)
            created_count += 1
        
        db.commit()
        print(f"デフォルトのレース種目 {created_count} 件を作成しました。")
        
    except Exception as e:
        db.rollback()
        print(f"エラーが発生しました: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_default_race_types()

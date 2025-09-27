#!/usr/bin/env python3
"""
データベースとテーブルを作成するスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import *  # すべてのモデルをインポート
from sqlalchemy import inspect
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    """データベースとテーブルを作成"""
    
    try:
        # すべてのテーブルを作成
        Base.metadata.create_all(bind=engine)
        logger.info("データベースとテーブルが作成されました")
        
        # テーブル一覧を表示
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"作成されたテーブル: {tables}")
        
    except Exception as e:
        logger.error(f"データベース作成エラー: {e}")
        raise

if __name__ == "__main__":
    create_database()

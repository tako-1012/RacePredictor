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
from app.models import user, workout, prediction, race
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

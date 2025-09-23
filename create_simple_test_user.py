#!/usr/bin/env python3
"""
簡単なテストユーザー作成スクリプト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.core.security import get_password_hash

def create_simple_test_user():
    """簡単なテストユーザーを作成"""
    try:
        db = next(get_db())
        
        # 既存ユーザーをチェック
        existing_user = db.query(User).filter(User.email == 'test@example.com').first()
        if existing_user:
            print('ℹ️ テストユーザー test@example.com は既に存在します')
            db.close()
            return
        
        # 新規ユーザー作成
        test_user = User(
            email='test@example.com',
            password_hash=get_password_hash('testpassword123'),
            name='Test User',
            birth_date='1990-01-01',
            gender='other',
            user_type='runner'
        )
        
        db.add(test_user)
        db.commit()
        print('✅ テストユーザー作成完了: test@example.com')
        print('   メール: test@example.com')
        print('   パスワード: testpassword123')
        
    except Exception as e:
        print(f'❌ エラー: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_test_user()

#!/usr/bin/env python3
"""
パスワード修正スクリプト
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db_session
from app.models.user import User
from app.core.security import get_password_hash

def fix_passwords():
    """テストユーザーのパスワードを修正"""
    with get_db_session() as db:
        test_emails = [
            'tanaka.athlete@test.com',
            'sato.coach@test.com', 
            'yamada.beginner@test.com',
            'suzuki.marathon@test.com',
            'kobayashi.sprinter@test.com'
        ]
        
        for email in test_emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                # パスワードを再ハッシュ化
                user.hashed_password = get_password_hash('password123')
                print(f'✅ {email} のパスワードを修正しました')
            else:
                print(f'❌ {email} が見つかりません')
        
        db.commit()
        print('🎉 全ユーザーのパスワード修正完了！')

if __name__ == "__main__":
    fix_passwords()

#!/usr/bin/env python3
"""
テストユーザー作成スクリプト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.core.security import get_password_hash


def create_test_users():
    """テストユーザーを作成"""
    db = next(get_db())
    
    test_users = [
        {
            "email": "test1@example.com",
            "name": "テストユーザー1",
            "password": "testpassword123"
        },
        {
            "email": "test2@example.com", 
            "name": "テストユーザー2",
            "password": "testpassword123"
        },
        {
            "email": "admin@example.com",
            "name": "管理者ユーザー",
            "password": "adminpassword123"
        }
    ]
    
    for user_data in test_users:
        # 既存ユーザーをチェック
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            print(f"ユーザー {user_data['email']} は既に存在します")
            continue
        
        # 新規ユーザー作成
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            password_hash=get_password_hash(user_data["password"]),
            birth_date='1990-01-01',
            gender='other',
            user_type='runner'
        )
        
        db.add(user)
        db.commit()
        print(f"テストユーザー {user_data['email']} を作成しました")
    
    print("テストユーザー作成完了")


if __name__ == "__main__":
    create_test_users()

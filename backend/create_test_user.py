#!/usr/bin/env python3
"""
テストユーザー作成スクリプト
"""
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash

def create_test_user():
    """テストユーザーを作成または確認"""
    # データベースセッションを取得
    db = next(get_db())
    
    try:
        # テストユーザーが存在するかチェック
        test_user = db.query(User).filter(User.email == 'test@example.com').first()
        
        if not test_user:
            # テストユーザーを作成
            test_user = User(
                email='test@example.com',
                password_hash=get_password_hash('testpassword123'),
                name='テストユーザー',
                birth_date='1990-01-01',
                gender='male',
                user_type='runner'
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f'✅ テストユーザーを作成しました: {test_user.email} (ID: {test_user.id})')
        else:
            print(f'✅ テストユーザーは既に存在します: {test_user.email} (ID: {test_user.id})')
            
        return test_user
        
    except Exception as e:
        print(f'❌ エラーが発生しました: {str(e)}')
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()

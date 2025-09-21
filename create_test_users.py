#!/usr/bin/env python3
"""
テスト用ユーザー作成スクリプト
手動テスト用のサンプルユーザーを作成します
"""

import requests
import json
import sys

# テスト環境のAPI URL
API_BASE_URL = "http://localhost:8001"

def create_test_user(email, password, name="テストユーザー"):
    """テストユーザーを作成"""
    url = f"{API_BASE_URL}/api/auth/register"
    data = {
        "email": email,
        "password": password,
        "confirm_password": password,
        "name": name
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 201:
            print(f"✅ ユーザー作成成功: {email}")
            return response.json()
        else:
            print(f"❌ ユーザー作成失敗: {email} - {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("❌ APIサーバーに接続できません。サーバーが起動しているか確認してください。")
        return None
    except Exception as e:
        print(f"❌ エラー: {e}")
        return None

def login_user(email, password):
    """ユーザーログイン"""
    url = f"{API_BASE_URL}/api/auth/login"
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f"✅ ログイン成功: {email}")
            return response.json()
        else:
            print(f"❌ ログイン失敗: {email} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ ログインエラー: {e}")
        return None

def main():
    print("🧪 テスト用ユーザー作成スクリプト")
    print("=" * 50)
    
    # テストユーザーの定義
    test_users = [
        {"email": "test@example.com", "password": "testpassword123", "name": "テストユーザー1"},
        {"email": "runner@example.com", "password": "runner123", "name": "ランナーテスト"},
        {"email": "admin@example.com", "password": "admin123", "name": "管理者テスト"},
    ]
    
    created_users = []
    
    for user in test_users:
        print(f"\n📝 ユーザー作成中: {user['email']}")
        result = create_test_user(user["email"], user["password"], user["name"])
        if result:
            created_users.append(user)
    
    print(f"\n🎉 作成完了: {len(created_users)}/{len(test_users)} ユーザー")
    
    if created_users:
        print("\n📋 作成されたユーザー情報:")
        for user in created_users:
            print(f"   Email: {user['email']}")
            print(f"   Password: {user['password']}")
            print(f"   Name: {user['name']}")
            print("   ---")
    
    print("\n🔧 次のステップ:")
    print("1. フロントエンド (http://localhost:3001) にアクセス")
    print("2. 上記のユーザー情報でログイン")
    print("3. 手動テストを実行")

if __name__ == "__main__":
    main()

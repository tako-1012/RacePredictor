#!/usr/bin/env python3
"""
クイックテストユーザー作成
"""
import sqlite3
import hashlib
import os

def create_test_user():
    """SQLiteに直接テストユーザーを作成"""
    db_path = "backend/test.db"
    
    # データベース接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # パスワードハッシュ（bcryptの代わりに簡単なハッシュ）
    password = "testpassword123"
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # テストユーザー作成
    cursor.execute("""
        INSERT OR REPLACE INTO users 
        (id, email, password_hash, name, birth_date, gender, user_type, created_at, updated_at)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (
        "550e8400-e29b-41d4-a716-446655440000",  # UUID
        "test@example.com",
        password_hash,
        "Test User",
        "1990-01-01",
        "other",
        "runner"
    ))
    
    conn.commit()
    conn.close()
    
    print("✅ テストユーザー作成完了!")
    print("   メール: test@example.com")
    print("   パスワード: testpassword123")

if __name__ == "__main__":
    create_test_user()

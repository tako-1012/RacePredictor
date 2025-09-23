"""
テスト設定とフィクスチャ
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import tempfile
import os
from typing import Generator

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings


# テスト用データベース設定
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """テスト用データベースセッション"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def event_loop():
    """イベントループフィクスチャ"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def client():
    """テストクライアントフィクスチャ"""
    # データベーステーブルを作成
    Base.metadata.create_all(bind=engine)
    
    # データベース依存関係をオーバーライド
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # テスト後にテーブルを削除
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """データベースセッションフィクスチャ"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user_data():
    """テストユーザーデータ"""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "name": "テストユーザー"
    }


@pytest.fixture
def test_workout_data():
    """テストワークアウトデータ"""
    return {
        "date": "2024-01-15",
        "workout_type": "easy_run",
        "distance_meters": 5000,
        "duration_seconds": 1800,
        "pace_per_km": 360,
        "heart_rate_avg": 140,
        "heart_rate_max": 160,
        "notes": "テスト練習"
    }


@pytest.fixture
def test_race_data():
    """テストレースデータ"""
    return {
        "race_name": "テストレース",
        "race_type": "5km",
        "date": "2024-02-15",
        "time_seconds": 1200,
        "pace_per_km": 240,
        "place": 10,
        "total_participants": 100,
        "weather": "晴れ",
        "temperature": 15.0,
        "notes": "テストレース"
    }


@pytest.fixture
def auth_headers(client, test_user_data):
    """認証ヘッダーフィクスチャ"""
    # ユーザー登録
    response = client.post("/api/auth/register", json=test_user_data)
    assert response.status_code == 201
    
    # ログイン
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_csv_data():
    """サンプルCSVデータ"""
    return """Date,Activity Type,Distance,Time,Avg HR,Max HR,Notes
2024-01-15,Easy Run,5.0,30:00,140,160,テスト練習1
2024-01-16,Interval,8.0,45:00,150,180,テスト練習2
2024-01-17,Long Run,15.0,90:00,135,155,テスト練習3"""

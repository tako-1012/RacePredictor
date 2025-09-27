"""
AI機能テスト用のフィクスチャ
包括的なモックデータとテスト用の設定を提供
"""

import pytest
import asyncio
import uuid
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from unittest.mock import Mock, AsyncMock

from app.core.database import get_db
from app.models.ai import AIModel, PredictionResult, FeatureStore, TrainingMetrics, ModelTrainingJob, AISystemConfig
from app.models.user import User
from app.models.workout import Workout
from app.models.race import Race


class AIFixtures:
    """AI機能テスト用のフィクスチャクラス"""

    @staticmethod
    def create_test_user_data() -> Dict[str, Any]:
        """テスト用ユーザーデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "email": f"test_user_{uuid.uuid4().hex[:8]}@example.com",
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "hashed_password": "hashed_password_123",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now() - timedelta(days=30),
            "updated_at": datetime.now()
        }

    @staticmethod
    def create_beginner_user_data() -> Dict[str, Any]:
        """初心者ユーザーのデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "email": "beginner@example.com",
            "username": "beginner_runner",
            "hashed_password": "hashed_password_123",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now() - timedelta(days=60),
            "updated_at": datetime.now()
        }

    @staticmethod
    def create_advanced_user_data() -> Dict[str, Any]:
        """上級者ユーザーのデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "email": "advanced@example.com",
            "username": "advanced_runner",
            "hashed_password": "hashed_password_123",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now()
        }

    @staticmethod
    def create_workout_data(user_id: str, days_back: int = 0) -> Dict[str, Any]:
        """テスト用ワークアウトデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "workout_type_id": str(uuid.uuid4()),
            "distance_km": round(np.random.uniform(3.0, 15.0), 2),
            "duration_minutes": round(np.random.uniform(20, 90), 1),
            "avg_pace_min_per_km": round(np.random.uniform(4.0, 7.0), 2),
            "avg_heart_rate": int(np.random.uniform(120, 180)),
            "max_heart_rate": int(np.random.uniform(150, 200)),
            "calories_burned": int(np.random.uniform(200, 800)),
            "elevation_gain_m": int(np.random.uniform(0, 500)),
            "notes": f"Test workout {uuid.uuid4().hex[:8]}",
            "date": datetime.now() - timedelta(days=days_back),
            "created_at": datetime.now() - timedelta(days=days_back),
            "updated_at": datetime.now() - timedelta(days=days_back)
        }

    @staticmethod
    def create_race_data(user_id: str, distance: float = 5.0) -> Dict[str, Any]:
        """テスト用レースデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "race_type_id": str(uuid.uuid4()),
            "name": f"Test Race {uuid.uuid4().hex[:8]}",
            "distance_km": distance,
            "target_time_minutes": round(distance * np.random.uniform(4.5, 6.0), 1),
            "actual_time_minutes": round(distance * np.random.uniform(4.5, 6.0), 1),
            "race_date": datetime.now() - timedelta(days=np.random.randint(1, 365)),
            "location": f"Test City {uuid.uuid4().hex[:4]}",
            "weather_conditions": np.random.choice(["sunny", "cloudy", "rainy", "windy"]),
            "temperature_celsius": round(np.random.uniform(5, 35), 1),
            "humidity_percent": int(np.random.uniform(30, 90)),
            "notes": f"Test race {uuid.uuid4().hex[:8]}",
            "created_at": datetime.now() - timedelta(days=np.random.randint(1, 365)),
            "updated_at": datetime.now() - timedelta(days=np.random.randint(1, 365))
        }

    @staticmethod
    def create_ai_model_data(algorithm: str = "random_forest") -> Dict[str, Any]:
        """テスト用AIモデルデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "name": f"test_model_{algorithm}_{uuid.uuid4().hex[:8]}",
            "version": "1.0.0",
            "algorithm": algorithm,
            "performance_metrics": {
                "mae": round(np.random.uniform(0.3, 0.8), 3),
                "rmse": round(np.random.uniform(0.5, 1.2), 3),
                "r2": round(np.random.uniform(0.8, 0.98), 3),
                "accuracy": round(np.random.uniform(0.85, 0.95), 3)
            },
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=np.random.randint(1, 30)),
            "updated_at": datetime.now()
        }

    @staticmethod
    def create_prediction_result_data(user_id: str, model_id: str) -> Dict[str, Any]:
        """テスト用予測結果データを作成"""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "model_id": model_id,
            "target_distance": round(np.random.uniform(5.0, 42.2), 1),
            "race_type": np.random.choice(["5k", "10k", "half_marathon", "marathon"]),
            "predicted_time_minutes": round(np.random.uniform(20, 180), 1),
            "confidence_score": round(np.random.uniform(0.7, 0.95), 3),
            "conditions": {
                "temperature": round(np.random.uniform(5, 35), 1),
                "humidity": int(np.random.uniform(30, 90)),
                "wind_speed": round(np.random.uniform(0, 20), 1),
                "elevation_gain": int(np.random.uniform(0, 500))
            },
            "features_used": {
                "total_distance": round(np.random.uniform(50, 200), 2),
                "avg_pace": round(np.random.uniform(4.5, 6.5), 2),
                "training_frequency": round(np.random.uniform(2, 7), 1),
                "avg_heart_rate": int(np.random.uniform(130, 170))
            },
            "created_at": datetime.now()
        }

    @staticmethod
    def create_feature_store_data(user_id: str) -> Dict[str, Any]:
        """テスト用特徴量ストアデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "features": {
                "total_distance": round(np.random.uniform(50, 200), 2),
                "avg_pace": round(np.random.uniform(4.5, 6.5), 2),
                "training_frequency": round(np.random.uniform(2, 7), 1),
                "avg_heart_rate": int(np.random.uniform(130, 170)),
                "max_distance": round(np.random.uniform(10, 30), 2),
                "total_workouts": int(np.random.uniform(20, 100)),
                "avg_workout_duration": round(np.random.uniform(30, 90), 1),
                "elevation_gain": int(np.random.uniform(100, 1000)),
                "calories_burned": int(np.random.uniform(5000, 20000)),
                "recent_performance_trend": round(np.random.uniform(-0.1, 0.1), 3),
                "fatigue_level": round(np.random.uniform(0.1, 0.9), 3),
                "recovery_time": round(np.random.uniform(12, 72), 1)
            },
            "created_at": datetime.now()
        }

    @staticmethod
    def create_training_metrics_data(model_id: str) -> Dict[str, Any]:
        """テスト用トレーニングメトリクスデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "model_id": model_id,
            "training_data_size": int(np.random.uniform(100, 1000)),
            "validation_data_size": int(np.random.uniform(20, 200)),
            "training_duration_minutes": round(np.random.uniform(5, 60), 1),
            "performance_metrics": {
                "mae": round(np.random.uniform(0.3, 0.8), 3),
                "rmse": round(np.random.uniform(0.5, 1.2), 3),
                "r2": round(np.random.uniform(0.8, 0.98), 3),
                "accuracy": round(np.random.uniform(0.85, 0.95), 3),
                "precision": round(np.random.uniform(0.8, 0.95), 3),
                "recall": round(np.random.uniform(0.8, 0.95), 3),
                "f1_score": round(np.random.uniform(0.8, 0.95), 3)
            },
            "hyperparameters": {
                "n_estimators": int(np.random.uniform(50, 200)),
                "max_depth": int(np.random.uniform(5, 20)),
                "learning_rate": round(np.random.uniform(0.01, 0.3), 3),
                "random_state": 42
            },
            "created_at": datetime.now()
        }

    @staticmethod
    def create_training_job_data(user_id: str) -> Dict[str, Any]:
        """テスト用トレーニングジョブデータを作成"""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "status": "completed",
            "target_distance": round(np.random.uniform(5.0, 42.2), 1),
            "target_time_minutes": round(np.random.uniform(20, 180), 1),
            "training_data_size": int(np.random.uniform(100, 1000)),
            "models_trained": int(np.random.uniform(1, 4)),
            "best_model_id": str(uuid.uuid4()),
            "error_message": None,
            "started_at": datetime.now() - timedelta(minutes=np.random.randint(5, 60)),
            "completed_at": datetime.now(),
            "created_at": datetime.now() - timedelta(minutes=np.random.randint(5, 60))
        }

    @staticmethod
    def create_ai_system_config_data() -> Dict[str, Any]:
        """テスト用AIシステム設定データを作成"""
        return {
            "id": str(uuid.uuid4()),
            "key": "ai_features_enabled",
            "value": "true",
            "description": "AI機能の有効/無効",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }

    @staticmethod
    def create_comprehensive_dataset() -> Dict[str, Any]:
        """包括的なテストデータセットを作成"""
        # ユーザーデータの作成
        users = [
            AIFixtures.create_test_user_data(),
            AIFixtures.create_beginner_user_data(),
            AIFixtures.create_advanced_user_data()
        ]
        
        # 各ユーザーのワークアウトデータ
        workouts = []
        for user in users:
            for i in range(20):  # 各ユーザー20件のワークアウト
                workout = AIFixtures.create_workout_data(user["id"], days_back=i)
                workouts.append(workout)
        
        # 各ユーザーのレースデータ
        races = []
        distances = [5.0, 10.0, 21.1, 42.2]
        for user in users:
            for distance in distances:
                race = AIFixtures.create_race_data(user["id"], distance)
                races.append(race)
        
        # AIモデルデータ
        algorithms = ["random_forest", "gradient_boosting", "linear_regression", "ridge_regression"]
        ai_models = [AIFixtures.create_ai_model_data(alg) for alg in algorithms]
        
        # 予測結果データ
        prediction_results = []
        for user in users:
            for model in ai_models:
                prediction = AIFixtures.create_prediction_result_data(user["id"], model["id"])
                prediction_results.append(prediction)
        
        # 特徴量ストアデータ
        feature_stores = [AIFixtures.create_feature_store_data(user["id"]) for user in users]
        
        # トレーニングメトリクスデータ
        training_metrics = [AIFixtures.create_training_metrics_data(model["id"]) for model in ai_models]
        
        # トレーニングジョブデータ
        training_jobs = [AIFixtures.create_training_job_data(user["id"]) for user in users]
        
        return {
            "users": users,
            "workouts": workouts,
            "races": races,
            "ai_models": ai_models,
            "prediction_results": prediction_results,
            "feature_stores": feature_stores,
            "training_metrics": training_metrics,
            "training_jobs": training_jobs
        }

    @staticmethod
    def create_edge_case_data() -> Dict[str, Any]:
        """エッジケース用のテストデータを作成"""
        return {
            "insufficient_data_user": {
                "id": str(uuid.uuid4()),
                "email": "insufficient@example.com",
                "username": "insufficient_data",
                "workouts": [],  # ワークアウトデータなし
                "races": []  # レースデータなし
            },
            "overtraining_user": {
                "id": str(uuid.uuid4()),
                "email": "overtraining@example.com",
                "username": "overtraining_data",
                "workouts": [
                    AIFixtures.create_workout_data(str(uuid.uuid4()), days_back=i)
                    for i in range(30)  # 30日連続のワークアウト
                ]
            },
            "invalid_data": {
                "negative_distance": -5.0,
                "zero_duration": 0,
                "invalid_pace": -1.0,
                "future_date": datetime.now() + timedelta(days=1)
            }
        }

    @staticmethod
    def create_performance_test_data() -> Dict[str, Any]:
        """パフォーマンステスト用の大量データを作成"""
        # 1000ユーザーのデータ
        users = []
        workouts = []
        
        for i in range(1000):
            user = AIFixtures.create_test_user_data()
            users.append(user)
            
            # 各ユーザー50件のワークアウト
            for j in range(50):
                workout = AIFixtures.create_workout_data(user["id"], days_back=j)
                workouts.append(workout)
        
        return {
            "users": users,
            "workouts": workouts,
            "total_records": len(users) + len(workouts)
        }


# Pytest フィクスチャ
@pytest.fixture
def ai_fixtures():
    """AI機能テスト用フィクスチャのインスタンス"""
    return AIFixtures()


@pytest.fixture
async def test_user(db_session):
    """テスト用ユーザーを作成"""
    user_data = AIFixtures.create_test_user_data()
    user = User(**user_data)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def beginner_user(db_session):
    """初心者ユーザーを作成"""
    user_data = AIFixtures.create_beginner_user_data()
    user = User(**user_data)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def advanced_user(db_session):
    """上級者ユーザーを作成"""
    user_data = AIFixtures.create_advanced_user_data()
    user = User(**user_data)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_workouts(test_user, db_session):
    """テスト用ワークアウトデータを作成"""
    workouts = []
    for i in range(20):
        workout_data = AIFixtures.create_workout_data(test_user.id, days_back=i)
        workout = Workout(**workout_data)
        db_session.add(workout)
        workouts.append(workout)
    
    await db_session.commit()
    return workouts


@pytest.fixture
async def test_races(test_user, db_session):
    """テスト用レースデータを作成"""
    races = []
    distances = [5.0, 10.0, 21.1, 42.2]
    for distance in distances:
        race_data = AIFixtures.create_race_data(test_user.id, distance)
        race = Race(**race_data)
        db_session.add(race)
        races.append(race)
    
    await db_session.commit()
    return races


@pytest.fixture
async def test_ai_model(db_session):
    """テスト用AIモデルを作成"""
    model_data = AIFixtures.create_ai_model_data()
    model = AIModel(**model_data)
    db_session.add(model)
    await db_session.commit()
    await db_session.refresh(model)
    return model


@pytest.fixture
async def test_prediction_result(test_user, test_ai_model, db_session):
    """テスト用予測結果を作成"""
    prediction_data = AIFixtures.create_prediction_result_data(test_user.id, test_ai_model.id)
    prediction = PredictionResult(**prediction_data)
    db_session.add(prediction)
    await db_session.commit()
    await db_session.refresh(prediction)
    return prediction


@pytest.fixture
async def test_feature_store(test_user, db_session):
    """テスト用特徴量ストアを作成"""
    feature_data = AIFixtures.create_feature_store_data(test_user.id)
    feature_store = FeatureStore(**feature_data)
    db_session.add(feature_store)
    await db_session.commit()
    await db_session.refresh(feature_store)
    return feature_store


@pytest.fixture
async def test_training_metrics(test_ai_model, db_session):
    """テスト用トレーニングメトリクスを作成"""
    metrics_data = AIFixtures.create_training_metrics_data(test_ai_model.id)
    metrics = TrainingMetrics(**metrics_data)
    db_session.add(metrics)
    await db_session.commit()
    await db_session.refresh(metrics)
    return metrics


@pytest.fixture
async def test_training_job(test_user, db_session):
    """テスト用トレーニングジョブを作成"""
    job_data = AIFixtures.create_training_job_data(test_user.id)
    job = ModelTrainingJob(**job_data)
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job


@pytest.fixture
async def comprehensive_dataset(db_session):
    """包括的なテストデータセットを作成"""
    dataset = AIFixtures.create_comprehensive_dataset()
    
    # データベースに保存
    for user_data in dataset["users"]:
        user = User(**user_data)
        db_session.add(user)
    
    await db_session.commit()
    
    # ワークアウトデータの保存
    for workout_data in dataset["workouts"]:
        workout = Workout(**workout_data)
        db_session.add(workout)
    
    # レースデータの保存
    for race_data in dataset["races"]:
        race = Race(**race_data)
        db_session.add(race)
    
    # AIモデルデータの保存
    for model_data in dataset["ai_models"]:
        model = AIModel(**model_data)
        db_session.add(model)
    
    await db_session.commit()
    
    return dataset


@pytest.fixture
def mock_redis():
    """モックRedisクライアント"""
    mock_redis = Mock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = True
    mock_redis.exists.return_value = False
    return mock_redis


@pytest.fixture
def mock_celery():
    """モックCeleryタスク"""
    mock_task = Mock()
    mock_task.delay.return_value = Mock(id="test-task-id", status="PENDING")
    mock_task.apply_async.return_value = Mock(id="test-task-id", status="PENDING")
    return mock_task


@pytest.fixture
def mock_ml_model():
    """モック機械学習モデル"""
    mock_model = Mock()
    mock_model.predict.return_value = np.array([25.0, 30.0, 35.0])
    mock_model.fit.return_value = mock_model
    mock_model.score.return_value = 0.95
    return mock_model


@pytest.fixture
def performance_test_data():
    """パフォーマンステスト用データ"""
    return AIFixtures.create_performance_test_data()


@pytest.fixture
def edge_case_data():
    """エッジケーステスト用データ"""
    return AIFixtures.create_edge_case_data()

"""
AI機能テスト用のモックデータ
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
import numpy as np


def create_mock_user_data() -> Dict[str, Any]:
    """テスト用のユーザーデータを作成"""
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


def create_mock_workout_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用のワークアウトデータを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
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
        "date": datetime.now() - timedelta(days=np.random.randint(1, 30)),
        "created_at": datetime.now() - timedelta(days=np.random.randint(1, 30)),
        "updated_at": datetime.now() - timedelta(days=np.random.randint(1, 30))
    }


def create_mock_race_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用のレースデータを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    distances = [5.0, 10.0, 21.1, 42.2]
    distance = np.random.choice(distances)
    
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


def create_mock_features_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用の特徴量データを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    return {
        "user_id": user_id,
        "total_distance": round(np.random.uniform(50, 200), 2),
        "avg_pace": round(np.random.uniform(4.5, 6.5), 2),
        "training_frequency": round(np.random.uniform(2, 7), 1),
        "avg_heart_rate": int(np.random.uniform(130, 170)),
        "max_distance": round(np.random.uniform(10, 30), 2),
        "total_workouts": int(np.random.uniform(20, 100)),
        "avg_workout_duration": round(np.random.uniform(30, 90), 1),
        "elevation_gain": int(np.random.uniform(100, 1000)),
        "calories_burned": int(np.random.uniform(5000, 20000)),
        "created_at": datetime.now()
    }


def create_mock_training_data() -> Dict[str, Any]:
    """テスト用のトレーニングデータを作成"""
    n_samples = 100
    
    return {
        "features": np.random.rand(n_samples, 10),
        "targets": np.random.uniform(20, 60, n_samples),
        "feature_names": [
            "distance", "pace", "frequency", "heart_rate", "elevation",
            "temperature", "humidity", "wind_speed", "age", "experience"
        ],
        "target_name": "race_time_minutes"
    }


def create_mock_ai_model_data() -> Dict[str, Any]:
    """テスト用のAIモデルデータを作成"""
    algorithms = ["random_forest", "gradient_boosting", "linear_regression", "ridge_regression"]
    algorithm = np.random.choice(algorithms)
    
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
        "is_active": np.random.choice([True, False]),
        "created_at": datetime.now() - timedelta(days=np.random.randint(1, 30)),
        "updated_at": datetime.now()
    }


def create_mock_prediction_result_data(user_id: str = None, model_id: str = None) -> Dict[str, Any]:
    """テスト用の予測結果データを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    if model_id is None:
        model_id = str(uuid.uuid4())
    
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


def create_mock_feature_store_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用の特徴量ストアデータを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
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


def create_mock_training_metrics_data(model_id: str = None) -> Dict[str, Any]:
    """テスト用のトレーニングメトリクスデータを作成"""
    if model_id is None:
        model_id = str(uuid.uuid4())
    
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


def create_mock_model_training_job_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用のモデル訓練ジョブデータを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    statuses = ["pending", "running", "completed", "failed"]
    status = np.random.choice(statuses)
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "status": status,
        "target_distance": round(np.random.uniform(5.0, 42.2), 1),
        "target_time_minutes": round(np.random.uniform(20, 180), 1),
        "training_data_size": int(np.random.uniform(100, 1000)),
        "models_trained": int(np.random.uniform(1, 4)),
        "best_model_id": str(uuid.uuid4()) if status == "completed" else None,
        "error_message": f"Test error {uuid.uuid4().hex[:8]}" if status == "failed" else None,
        "started_at": datetime.now() - timedelta(minutes=np.random.randint(5, 60)),
        "completed_at": datetime.now() if status in ["completed", "failed"] else None,
        "created_at": datetime.now() - timedelta(minutes=np.random.randint(5, 60))
    }


def create_mock_ai_system_config_data() -> Dict[str, Any]:
    """テスト用のAIシステム設定データを作成"""
    configs = [
        ("ai_features_enabled", "true", "AI機能の有効/無効"),
        ("ml_models_path", "/models", "機械学習モデルの保存パス"),
        ("feature_store_retention_days", "30", "特徴量ストアの保持日数"),
        ("prediction_cache_ttl", "3600", "予測キャッシュのTTL（秒）"),
        ("rate_limit_window", "60", "レート制限のウィンドウ（秒）"),
        ("max_training_data_size", "10000", "最大トレーニングデータサイズ"),
        ("model_retention_count", "5", "保持するモデル数"),
        ("auto_retrain_enabled", "true", "自動再訓練の有効/無効"),
        ("prediction_threshold", "0.7", "予測の信頼度閾値")
    ]
    
    key, value, description = np.random.choice(configs)
    
    return {
        "id": str(uuid.uuid4()),
        "key": key,
        "value": value,
        "description": description,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }


def create_mock_workout_plan_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用のワークアウトプランデータを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "target_distance": round(np.random.uniform(5.0, 42.2), 1),
        "target_time_minutes": round(np.random.uniform(20, 180), 1),
        "total_weeks": int(np.random.uniform(8, 20)),
        "current_week": int(np.random.uniform(1, 8)),
        "fitness_level": np.random.choice(["beginner", "intermediate", "advanced"]),
        "goals": np.random.choice([
            ["improve_endurance", "increase_speed"],
            ["lose_weight", "improve_endurance"],
            ["increase_speed", "build_strength"],
            ["improve_endurance"]
        ]),
        "workouts": [
            {
                "week": i + 1,
                "day": j + 1,
                "type": np.random.choice(["easy_run", "tempo_run", "interval", "long_run", "recovery"]),
                "distance": round(np.random.uniform(3.0, 20.0), 1),
                "intensity": np.random.choice(["easy", "moderate", "hard", "very_hard"]),
                "duration_minutes": round(np.random.uniform(20, 120), 1),
                "description": f"Week {i+1}, Day {j+1} workout"
            }
            for i in range(8) for j in range(3)  # 8週間、週3回
        ],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }


def create_mock_effectiveness_analysis_data(workout_id: str = None) -> Dict[str, Any]:
    """テスト用の効果分析データを作成"""
    if workout_id is None:
        workout_id = str(uuid.uuid4())
    
    return {
        "id": str(uuid.uuid4()),
        "workout_id": workout_id,
        "effectiveness_score": round(np.random.uniform(0.3, 0.95), 3),
        "performance_metrics": {
            "pace_improvement": round(np.random.uniform(-0.2, 0.2), 3),
            "heart_rate_efficiency": round(np.random.uniform(0.6, 0.9), 3),
            "recovery_time": round(np.random.uniform(12, 48), 1),
            "perceived_exertion": round(np.random.uniform(3, 9), 1)
        },
        "recommendations": [
            {
                "type": "intensity_adjustment",
                "description": "Consider increasing intensity for better adaptation",
                "priority": "medium"
            },
            {
                "type": "recovery_optimization",
                "description": "Focus on recovery techniques to improve performance",
                "priority": "high"
            }
        ],
        "created_at": datetime.now()
    }


def create_mock_condition_analysis_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用のコンディション分析データを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "fatigue_level": round(np.random.uniform(0.1, 0.9), 3),
        "recovery_time_hours": round(np.random.uniform(12, 72), 1),
        "stress_level": round(np.random.uniform(0.1, 0.9), 3),
        "motivation_level": round(np.random.uniform(0.3, 1.0), 3),
        "sleep_quality": round(np.random.uniform(0.4, 1.0), 3),
        "nutrition_score": round(np.random.uniform(0.5, 1.0), 3),
        "hydration_level": round(np.random.uniform(0.6, 1.0), 3),
        "analysis_period_days": int(np.random.uniform(7, 30)),
        "recommendations": [
            {
                "type": "recovery",
                "description": "Increase rest days to improve recovery",
                "priority": "high"
            },
            {
                "type": "nutrition",
                "description": "Focus on protein intake for better recovery",
                "priority": "medium"
            }
        ],
        "created_at": datetime.now()
    }


def create_mock_injury_risk_assessment_data(user_id: str = None) -> Dict[str, Any]:
    """テスト用の怪我リスク評価データを作成"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "overall_risk_score": round(np.random.uniform(0.1, 0.8), 3),
        "risk_factors": [
            {
                "factor": "high_training_load",
                "risk_level": round(np.random.uniform(0.6, 0.9), 3),
                "description": "Training load is significantly higher than recommended"
            },
            {
                "factor": "poor_recovery",
                "risk_level": round(np.random.uniform(0.4, 0.8), 3),
                "description": "Insufficient recovery time between workouts"
            },
            {
                "factor": "biomechanical_issues",
                "risk_level": round(np.random.uniform(0.3, 0.7), 3),
                "description": "Potential biomechanical risk factors detected"
            }
        ],
        "specific_injury_risks": {
            "knee_injury_risk": round(np.random.uniform(0.1, 0.7), 3),
            "ankle_injury_risk": round(np.random.uniform(0.1, 0.6), 3),
            "shin_splints_risk": round(np.random.uniform(0.1, 0.8), 3),
            "stress_fracture_risk": round(np.random.uniform(0.1, 0.5), 3)
        },
        "prevention_recommendations": [
            {
                "type": "training_modification",
                "description": "Reduce training intensity by 20%",
                "priority": "high",
                "implementation": "Gradually reduce intensity over 2 weeks"
            },
            {
                "type": "strength_training",
                "description": "Add strength training for injury prevention",
                "priority": "medium",
                "implementation": "2-3 sessions per week focusing on core and legs"
            }
        ],
        "analysis_period_days": int(np.random.uniform(14, 30)),
        "created_at": datetime.now()
    }


def create_mock_celery_task_data() -> Dict[str, Any]:
    """テスト用のCeleryタスクデータを作成"""
    task_types = ["train_model", "batch_predict", "calculate_features", "analyze_effectiveness"]
    task_type = np.random.choice(task_types)
    statuses = ["PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY"]
    status = np.random.choice(statuses)
    
    return {
        "id": str(uuid.uuid4()),
        "task_type": task_type,
        "status": status,
        "user_id": str(uuid.uuid4()),
        "parameters": {
            "target_distance": round(np.random.uniform(5.0, 42.2), 1),
            "target_time_minutes": round(np.random.uniform(20, 180), 1),
            "analysis_period_days": int(np.random.uniform(7, 30))
        },
        "result": {
            "model_id": str(uuid.uuid4()) if status == "SUCCESS" else None,
            "predictions_count": int(np.random.uniform(10, 100)) if status == "SUCCESS" else 0,
            "accuracy": round(np.random.uniform(0.8, 0.95), 3) if status == "SUCCESS" else None
        } if status == "SUCCESS" else None,
        "error_message": f"Test error {uuid.uuid4().hex[:8]}" if status == "FAILURE" else None,
        "started_at": datetime.now() - timedelta(minutes=np.random.randint(1, 30)),
        "completed_at": datetime.now() if status in ["SUCCESS", "FAILURE"] else None,
        "created_at": datetime.now() - timedelta(minutes=np.random.randint(1, 30))
    }


def create_mock_system_stats_data() -> Dict[str, Any]:
    """テスト用のシステム統計データを作成"""
    return {
        "total_models": int(np.random.uniform(10, 50)),
        "active_models": int(np.random.uniform(3, 15)),
        "total_predictions": int(np.random.uniform(1000, 10000)),
        "total_users": int(np.random.uniform(100, 1000)),
        "system_health": {
            "overall_score": round(np.random.uniform(0.8, 1.0), 3),
            "model_performance": round(np.random.uniform(0.85, 0.98), 3),
            "prediction_accuracy": round(np.random.uniform(0.8, 0.95), 3),
            "system_load": round(np.random.uniform(0.3, 0.8), 3),
            "error_rate": round(np.random.uniform(0.01, 0.05), 3)
        },
        "performance_metrics": {
            "average_prediction_time_ms": round(np.random.uniform(100, 500), 1),
            "average_training_time_minutes": round(np.random.uniform(10, 60), 1),
            "cache_hit_rate": round(np.random.uniform(0.7, 0.95), 3),
            "memory_usage_percent": round(np.random.uniform(40, 80), 1),
            "cpu_usage_percent": round(np.random.uniform(20, 60), 1)
        },
        "created_at": datetime.now()
    }


def create_batch_mock_data(data_type: str, count: int = 10) -> List[Dict[str, Any]]:
    """指定されたタイプのモックデータをバッチで作成"""
    data_creators = {
        "user": create_mock_user_data,
        "workout": create_mock_workout_data,
        "race": create_mock_race_data,
        "features": create_mock_features_data,
        "ai_model": create_mock_ai_model_data,
        "prediction_result": create_mock_prediction_result_data,
        "feature_store": create_mock_feature_store_data,
        "training_metrics": create_mock_training_metrics_data,
        "training_job": create_mock_model_training_job_data,
        "system_config": create_mock_ai_system_config_data,
        "workout_plan": create_mock_workout_plan_data,
        "effectiveness_analysis": create_mock_effectiveness_analysis_data,
        "condition_analysis": create_mock_condition_analysis_data,
        "injury_risk_assessment": create_mock_injury_risk_assessment_data,
        "celery_task": create_mock_celery_task_data,
        "system_stats": create_mock_system_stats_data
    }
    
    if data_type not in data_creators:
        raise ValueError(f"Unknown data type: {data_type}")
    
    creator = data_creators[data_type]
    return [creator() for _ in range(count)]


def create_comprehensive_test_dataset() -> Dict[str, Any]:
    """包括的なテストデータセットを作成"""
    # ユーザーデータを作成
    users = create_batch_mock_data("user", 5)
    user_ids = [user["id"] for user in users]
    
    # 各ユーザーのワークアウトデータを作成
    workouts = []
    for user_id in user_ids:
        user_workouts = create_batch_mock_data("workout", 20)
        for workout in user_workouts:
            workout["user_id"] = user_id
        workouts.extend(user_workouts)
    
    # 各ユーザーのレースデータを作成
    races = []
    for user_id in user_ids:
        user_races = create_batch_mock_data("race", 5)
        for race in user_races:
            race["user_id"] = user_id
        races.extend(user_races)
    
    # AIモデルデータを作成
    ai_models = create_batch_mock_data("ai_model", 8)
    
    # 予測結果データを作成
    prediction_results = []
    for user_id in user_ids:
        for model in ai_models[:4]:  # 各ユーザーに対して4つのモデルで予測
            prediction = create_mock_prediction_result_data(user_id, model["id"])
            prediction_results.append(prediction)
    
    # 特徴量ストアデータを作成
    feature_stores = []
    for user_id in user_ids:
        feature_store = create_mock_feature_store_data(user_id)
        feature_stores.append(feature_store)
    
    # トレーニングメトリクスデータを作成
    training_metrics = []
    for model in ai_models:
        metrics = create_mock_training_metrics_data(model["id"])
        training_metrics.append(metrics)
    
    # トレーニングジョブデータを作成
    training_jobs = []
    for user_id in user_ids:
        job = create_mock_model_training_job_data(user_id)
        training_jobs.append(job)
    
    # システム設定データを作成
    system_configs = create_batch_mock_data("system_config", 9)
    
    # ワークアウトプランデータを作成
    workout_plans = []
    for user_id in user_ids:
        plan = create_mock_workout_plan_data(user_id)
        workout_plans.append(plan)
    
    # 効果分析データを作成
    effectiveness_analyses = []
    for workout in workouts[:50]:  # 最初の50のワークアウトに対して
        analysis = create_mock_effectiveness_analysis_data(workout["id"])
        effectiveness_analyses.append(analysis)
    
    # コンディション分析データを作成
    condition_analyses = []
    for user_id in user_ids:
        analysis = create_mock_condition_analysis_data(user_id)
        condition_analyses.append(analysis)
    
    # 怪我リスク評価データを作成
    injury_risk_assessments = []
    for user_id in user_ids:
        assessment = create_mock_injury_risk_assessment_data(user_id)
        injury_risk_assessments.append(assessment)
    
    # Celeryタスクデータを作成
    celery_tasks = create_batch_mock_data("celery_task", 20)
    
    # システム統計データを作成
    system_stats = create_mock_system_stats_data()
    
    return {
        "users": users,
        "workouts": workouts,
        "races": races,
        "ai_models": ai_models,
        "prediction_results": prediction_results,
        "feature_stores": feature_stores,
        "training_metrics": training_metrics,
        "training_jobs": training_jobs,
        "system_configs": system_configs,
        "workout_plans": workout_plans,
        "effectiveness_analyses": effectiveness_analyses,
        "condition_analyses": condition_analyses,
        "injury_risk_assessments": injury_risk_assessments,
        "celery_tasks": celery_tasks,
        "system_stats": system_stats,
        "summary": {
            "total_users": len(users),
            "total_workouts": len(workouts),
            "total_races": len(races),
            "total_ai_models": len(ai_models),
            "total_predictions": len(prediction_results),
            "total_feature_stores": len(feature_stores),
            "total_training_metrics": len(training_metrics),
            "total_training_jobs": len(training_jobs),
            "total_system_configs": len(system_configs),
            "total_workout_plans": len(workout_plans),
            "total_effectiveness_analyses": len(effectiveness_analyses),
            "total_condition_analyses": len(condition_analyses),
            "total_injury_risk_assessments": len(injury_risk_assessments),
            "total_celery_tasks": len(celery_tasks)
        }
    }

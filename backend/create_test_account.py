#!/usr/bin/env python3
"""
Comprehensive test account creation script
Creates a test account with 1 year's worth of realistic data:
- Workout records (various types)
- Custom workout templates
- Condition tracking data
- Race results
- User profile with realistic metrics
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import json

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.workout import Workout, WorkoutType
from app.models.custom_workout import CustomWorkoutTemplateNew
# from app.models.condition import ConditionEntry  # Not available
from app.models.race import RaceResult
from app.core.security import get_password_hash

# Test account credentials
TEST_EMAIL = "test_runner@example.com"
TEST_PASSWORD = "testpassword123"
TEST_USERNAME = "test_runner"

def create_test_user(db: Session) -> User:
    """Create test user account"""
    print("🔧 Creating test user account...")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == TEST_EMAIL).first()
    if existing_user:
        print(f"✅ Test user already exists: {existing_user.email}")
        return existing_user
    
    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        email=TEST_EMAIL,
        username=TEST_USERNAME,
        hashed_password=get_password_hash(TEST_PASSWORD),
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print(f"✅ Created test user: {user.email}")
    return user

def create_user_profile(db: Session, user: User) -> UserProfile:
    """Create realistic user profile"""
    print("🔧 Creating user profile...")
    
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if existing_profile:
        print(f"✅ User profile already exists")
        return existing_profile
    
    # Create realistic profile for a 25-year-old runner
    birth_date = date(1999, 3, 15)  # 25 years old
    profile = UserProfile(
        id=str(uuid.uuid4()),
        user_id=user.id,
        age=25,
        birth_date=birth_date,
        gender="male",
        height_cm=175,
        weight_kg=68,
        bmi=22.2,
        resting_hr=55,
        max_hr=195,
        vo2_max=55.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    print(f"✅ Created user profile: {profile.age}yo, {profile.height_cm}cm, {profile.weight_kg}kg")
    return profile

def create_workout_types(db: Session) -> List[WorkoutType]:
    """Create workout types if they don't exist"""
    print("🔧 Creating workout types...")
    
    workout_types_data = [
        {"id": str(uuid.uuid4()), "name": "easy_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "tempo_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "interval_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "long_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "recovery_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "hill_run", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "fartlek", "category": "running"},
        {"id": str(uuid.uuid4()), "name": "strength_training", "category": "strength"},
        {"id": str(uuid.uuid4()), "name": "cross_training", "category": "cross"},
    ]
    
    workout_types = []
    for wt_data in workout_types_data:
        existing = db.query(WorkoutType).filter(WorkoutType.name == wt_data["name"]).first()
        if not existing:
            workout_type = WorkoutType(**wt_data)
            db.add(workout_type)
            workout_types.append(workout_type)
        else:
            workout_types.append(existing)
    
    db.commit()
    print(f"✅ Created/found {len(workout_types)} workout types")
    return workout_types

def generate_workout_data(start_date: date, end_date: date, workout_types: List[WorkoutType]) -> List[Dict]:
    """Generate realistic workout data for the date range"""
    print(f"🔧 Generating workout data from {start_date} to {end_date}...")
    
    workouts = []
    current_date = start_date
    
    while current_date <= end_date:
        # Skip some days (rest days)
        if random.random() < 0.2:  # 20% chance of rest day
            current_date += timedelta(days=1)
            continue
        
        # Determine workout type based on day of week and season
        day_of_week = current_date.weekday()
        month = current_date.month
        
        # Seasonal adjustments
        if month in [12, 1, 2]:  # Winter
            easy_prob = 0.6
            tempo_prob = 0.2
            interval_prob = 0.1
            long_prob = 0.1
        elif month in [3, 4, 5]:  # Spring
            easy_prob = 0.4
            tempo_prob = 0.3
            interval_prob = 0.2
            long_prob = 0.1
        elif month in [6, 7, 8]:  # Summer
            easy_prob = 0.5
            tempo_prob = 0.2
            interval_prob = 0.2
            long_prob = 0.1
        else:  # Fall
            easy_prob = 0.3
            tempo_prob = 0.3
            interval_prob = 0.2
            long_prob = 0.2
        
        # Day of week adjustments
        if day_of_week == 6:  # Sunday - long run day
            workout_type_name = "long_run"
        elif day_of_week in [1, 3]:  # Tuesday, Thursday - interval/tempo
            rand = random.random()
            if rand < interval_prob:
                workout_type_name = "interval_run"
            else:
                workout_type_name = "tempo_run"
        else:
            rand = random.random()
            if rand < easy_prob:
                workout_type_name = "easy_run"
            elif rand < easy_prob + tempo_prob:
                workout_type_name = "tempo_run"
            elif rand < easy_prob + tempo_prob + interval_prob:
                workout_type_name = "interval_run"
            else:
                workout_type_name = "long_run"
        
        # Find workout type
        workout_type = next((wt for wt in workout_types if wt.name == workout_type_name), workout_types[0])
        
        # Generate realistic workout parameters
        if workout_type_name == "easy_run":
            distance = random.randint(3000, 8000)  # 3-8km
            pace_minutes = random.randint(4, 5)  # 4:00-5:00/km
            pace_seconds = random.randint(0, 59)
            duration = int((distance / 1000) * (pace_minutes * 60 + pace_seconds))
            intensity = random.randint(2, 4)
        elif workout_type_name == "tempo_run":
            distance = random.randint(5000, 10000)  # 5-10km
            pace_minutes = random.randint(3, 4)  # 3:30-4:30/km
            pace_seconds = random.randint(30, 59)
            duration = int((distance / 1000) * (pace_minutes * 60 + pace_seconds))
            intensity = random.randint(6, 8)
        elif workout_type_name == "interval_run":
            distance = random.randint(2000, 5000)  # 2-5km total
            pace_minutes = random.randint(3, 4)  # 3:00-4:00/km
            pace_seconds = random.randint(0, 30)
            duration = int((distance / 1000) * (pace_minutes * 60 + pace_seconds))
            intensity = random.randint(7, 9)
        elif workout_type_name == "long_run":
            distance = random.randint(15000, 30000)  # 15-30km
            pace_minutes = random.randint(4, 5)  # 4:00-5:30/km
            pace_seconds = random.randint(0, 59)
            duration = int((distance / 1000) * (pace_minutes * 60 + pace_seconds))
            intensity = random.randint(3, 6)
        else:
            distance = random.randint(3000, 6000)
            pace_minutes = random.randint(4, 5)
            pace_seconds = random.randint(0, 59)
            duration = int((distance / 1000) * (pace_minutes * 60 + pace_seconds))
            intensity = random.randint(3, 5)
        
        # Add some variation to actual vs target
        actual_distance = distance + random.randint(-200, 200)
        actual_duration = duration + random.randint(-60, 60)
        
        workout = {
            "id": str(uuid.uuid4()),
            "user_id": "",  # Will be set later
            "date": current_date,
            "workout_type_id": workout_type.id,
            "target_distance_meters": distance,
            "target_times_seconds": [duration],
            "actual_distance_meters": max(0, actual_distance),
            "actual_times_seconds": [max(0, actual_duration)],
            "completed": random.random() > 0.1,  # 90% completion rate
            "completion_rate": random.randint(85, 100),
            "repetitions": None,
            "rest_type": None,
            "rest_duration": None,
            "intensity": intensity,
            "notes": f"{workout_type.name} - {current_date.strftime('%Y年%m月%d日')}",
            "extended_data": json.dumps({
                "weather": random.choice(["晴れ", "曇り", "雨", "雪"]),
                "temperature": random.randint(5, 30),
                "humidity": random.randint(40, 80),
                "wind_speed": random.randint(0, 15)
            }),
            "created_at": datetime.utcnow(),
        }
        
        workouts.append(workout)
        current_date += timedelta(days=1)
    
    print(f"✅ Generated {len(workouts)} workouts")
    return workouts

def create_workouts(db: Session, user: User, workouts_data: List[Dict]):
    """Create workout records in database"""
    print("🔧 Creating workout records...")
    
    # Check if workouts already exist
    existing_count = db.query(Workout).filter(Workout.user_id == user.id).count()
    if existing_count > 0:
        print(f"✅ {existing_count} workouts already exist")
        return
    
    for workout_data in workouts_data:
        workout_data["user_id"] = user.id
        workout = Workout(**workout_data)
        db.add(workout)
    
    db.commit()
    print(f"✅ Created {len(workouts_data)} workout records")

def create_custom_templates(db: Session, user: User):
    """Create custom workout templates"""
    print("🔧 Creating custom workout templates...")
    
    # Check if templates already exist
    existing_count = db.query(CustomWorkoutTemplateNew).filter(CustomWorkoutTemplateNew.user_id == user.id).count()
    if existing_count > 0:
        print(f"✅ {existing_count} templates already exist")
        return
    
    templates_data = [
        {
            "name": "朝練ジョグ",
            "description": "朝の軽いジョギング",
            "template_type": "section",
            "section_type": "warmup",
            "steps": [
                {
                    "id": "step_1",
                    "type": "run",
                    "duration": 600,  # 10分
                    "distance": 2000,  # 2km
                    "pace": 300,  # 5:00/km
                    "intensity": 3,
                    "notes": "軽いジョギング"
                }
            ],
            "is_favorite": True,
            "usage_count": 15
        },
        {
            "name": "インターバル練習",
            "description": "1000m x 5本のインターバル",
            "template_type": "section",
            "section_type": "main",
            "steps": [
                {
                    "id": "step_1",
                    "type": "run",
                    "duration": 240,  # 4分
                    "distance": 1000,  # 1km
                    "pace": 240,  # 4:00/km
                    "intensity": 8,
                    "notes": "1000m x 5本"
                },
                {
                    "id": "step_2",
                    "type": "rest",
                    "duration": 180,  # 3分
                    "restFormat": "standing",
                    "intensity": 1,
                    "notes": "3分間休憩"
                }
            ],
            "is_favorite": True,
            "usage_count": 8
        },
        {
            "name": "クールダウン",
            "description": "練習後のクールダウン",
            "template_type": "section",
            "section_type": "cooldown",
            "steps": [
                {
                    "id": "step_1",
                    "type": "run",
                    "duration": 600,  # 10分
                    "distance": 1500,  # 1.5km
                    "pace": 400,  # 6:40/km
                    "intensity": 2,
                    "notes": "ゆっくりジョグ"
                },
                {
                    "id": "step_2",
                    "type": "stretch",
                    "duration": 300,  # 5分
                    "intensity": 1,
                    "notes": "ストレッチ"
                }
            ],
            "is_favorite": True,
            "usage_count": 20
        },
        {
            "name": "ロングラン",
            "description": "週末のロングラン",
            "template_type": "workout",
            "section_type": None,
            "sessions": [
                {
                    "id": "session_1",
                    "sessionNumber": 1,
                    "timeOfDay": "morning",
                    "sections": {
                        "warmup": {
                            "steps": [
                                {
                                    "id": "step_1",
                                    "type": "run",
                                    "duration": 900,  # 15分
                                    "distance": 3000,  # 3km
                                    "pace": 300,  # 5:00/km
                                    "intensity": 3,
                                    "notes": "ウォームアップ"
                                }
                            ]
                        },
                        "main": {
                            "steps": [
                                {
                                    "id": "step_2",
                                    "type": "run",
                                    "duration": 3600,  # 60分
                                    "distance": 15000,  # 15km
                                    "pace": 240,  # 4:00/km
                                    "intensity": 5,
                                    "notes": "メインランニング"
                                }
                            ]
                        },
                        "cooldown": {
                            "steps": [
                                {
                                    "id": "step_3",
                                    "type": "run",
                                    "duration": 600,  # 10分
                                    "distance": 2000,  # 2km
                                    "pace": 300,  # 5:00/km
                                    "intensity": 2,
                                    "notes": "クールダウン"
                                }
                            ]
                        }
                    }
                }
            ],
            "is_favorite": True,
            "usage_count": 12
        }
    ]
    
    for template_data in templates_data:
        template = CustomWorkoutTemplateNew(
            id=str(uuid.uuid4()),
            user_id=user.id,
            name=template_data["name"],
            description=template_data["description"],
            template_type=template_data["template_type"],
            section_type=template_data.get("section_type"),
            sessions=json.dumps(template_data.get("sessions", [])),
            steps=json.dumps(template_data.get("steps", [])),
            is_favorite=template_data["is_favorite"],
            usage_count=template_data["usage_count"],
            last_used=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            updated_at=datetime.utcnow()
        )
        db.add(template)
    
    db.commit()
    print(f"✅ Created {len(templates_data)} custom templates")

# Condition data creation removed - model not available

def create_race_results(db: Session, user: User, start_date: date, end_date: date):
    """Create race results"""
    print("🔧 Creating race results...")
    
    # Check if race results already exist
    existing_count = db.query(RaceResult).filter(RaceResult.user_id == user.id).count()
    if existing_count > 0:
        print(f"✅ {existing_count} race results already exist")
        return
    
    # Generate race dates (roughly monthly)
    race_dates = []
    current_date = start_date
    while current_date <= end_date:
        if random.random() < 0.08:  # ~8% chance per month
            race_dates.append(current_date)
        current_date += timedelta(days=30)
    
    race_results = []
    for race_date in race_dates:
        # Random race distance
        distances = [5000, 10000, 15000, 21097, 42195]  # 5K, 10K, 15K, Half, Full
        distance = random.choice(distances)
        
        # Generate realistic times based on distance
        if distance == 5000:
            time_minutes = random.randint(18, 25)
            time_seconds = random.randint(0, 59)
        elif distance == 10000:
            time_minutes = random.randint(38, 50)
            time_seconds = random.randint(0, 59)
        elif distance == 15000:
            time_minutes = random.randint(58, 75)
            time_seconds = random.randint(0, 59)
        elif distance == 21097:  # Half marathon
            time_minutes = random.randint(85, 110)
            time_seconds = random.randint(0, 59)
        else:  # Full marathon
            time_minutes = random.randint(180, 240)
            time_seconds = random.randint(0, 59)
        
        total_seconds = time_minutes * 60 + time_seconds
        
        race_result = RaceResult(
            id=str(uuid.uuid4()),
            user_id=user.id,
            race_name=f"{race_date.strftime('%Y年%m月')}大会",
            race_date=race_date,
            distance_meters=distance,
            time_seconds=total_seconds,
            pace_seconds=total_seconds / (distance / 1000),
            place=random.randint(1, 100),
            total_participants=random.randint(50, 500),
            race_type="road",
            weather=random.choice(["晴れ", "曇り", "雨"]),
            notes=f"レース結果 - {distance/1000:.0f}km",
            created_at=datetime.utcnow()
        )
        race_results.append(race_result)
    
    for result in race_results:
        db.add(result)
    
    db.commit()
    print(f"✅ Created {len(race_results)} race results")

def main():
    """Main function to create comprehensive test account"""
    print("🚀 Starting comprehensive test account creation...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Create user account
        user = create_test_user(db)
        
        # Create user profile
        profile = create_user_profile(db, user)
        
        # Create workout types
        workout_types = create_workout_types(db)
        
        # Generate date range (1 year ago to now)
        end_date = date.today()
        start_date = end_date - timedelta(days=365)
        
        # Generate workout data
        workouts_data = generate_workout_data(start_date, end_date, workout_types)
        
        # Create workouts
        create_workouts(db, user, workouts_data)
        
        # Create custom templates
        create_custom_templates(db, user)
        
        # Condition data creation skipped - model not available
        
        # Create race results
        create_race_results(db, user, start_date, end_date)
        
        print("\n🎉 Test account creation completed successfully!")
        print(f"📧 Email: {TEST_EMAIL}")
        print(f"🔑 Password: {TEST_PASSWORD}")
        print(f"👤 Username: {TEST_USERNAME}")
        print(f"📊 Data created:")
        print(f"   - {len(workouts_data)} workout records")
        print(f"   - 4 custom workout templates")
        print(f"   - ~10 race results")
        print(f"   - 1 user profile")
        
    except Exception as e:
        print(f"❌ Error creating test account: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()

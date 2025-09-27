#!/usr/bin/env python3
"""
RunMaster 包括的テストデータ生成 - 体調管理機能を含む完全データセット

このスクリプトは以下の機能を提供します：
- 5名の異なるレベルのランナーのプロフィール作成
- 1か月分の健康的な練習記録生成
- 体調記録データの生成（体重、睡眠、疲労度、モチベーション等）
- 練習と体調の相関を考慮した現実的なデータ生成
- 健康性チェックとデータ検証

使用方法:
    python scripts/generate_healthy_test_data.py
"""

import sys
import os
import random
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass
import logging

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db, engine
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.workout import Workout, WorkoutType
from app.models.daily_metrics import DailyMetrics
from app.models.personal_best import PersonalBest
from app.models.race import Race, RaceSchedule
from app.ml.health.training_condition_correlator import TrainingConditionCorrelator
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    """ユーザープロフィール定義"""
    name: str
    age: int
    gender: str
    height_cm: float
    base_weight_kg: float
    fitness_level: str  # beginner, intermediate, advanced, master, student
    weekly_frequency: int  # 週練習回数
    avg_distance_per_session: float  # 平均練習距離
    target_race: str
    motivation_base: float  # 基本モチベーション（0-1）
    recovery_ability: float  # 回復能力（0-1）


@dataclass
class TrainingPattern:
    """練習パターン定義"""
    workout_type: str
    distance_km: float
    intensity: float  # 0-1
    duration_minutes: int
    fatigue_impact: float  # 疲労への影響（0-1）


class HealthyDataGenerator:
    """健康的なテストデータ生成器"""
    
    def __init__(self):
        """初期化"""
        self.db = next(get_db())
        self.users = []
        self.workout_types = {}
        self.race_types = {}
        self.correlator = TrainingConditionCorrelator()
        
        # 健康的な範囲の定義
        self.health_ranges = {
            'weight_variation': 2.0,  # 体重変動範囲（kg）
            'sleep_min': 6.5,        # 最小睡眠時間
            'sleep_max': 9.0,        # 最大睡眠時間
            'fatigue_max': 7,        # 最大疲労度
            'motivation_min': 4,     # 最小モチベーション
            'stress_max': 7,         # 最大ストレスレベル
            'energy_min': 3          # 最小エネルギーレベル
        }
        
        logger.info("HealthyDataGenerator initialized")
    
    def create_user_profiles(self) -> List[UserProfile]:
        """5名のユーザープロフィールを作成"""
        profiles = [
            UserProfile(
                name="田中太郎",
                age=25,
                gender="male",
                height_cm=170.0,
                base_weight_kg=65.0,
                fitness_level="beginner",
                weekly_frequency=4,
                avg_distance_per_session=4.0,
                target_race="5km",
                motivation_base=0.7,
                recovery_ability=0.6
            ),
            UserProfile(
                name="佐藤花子",
                age=30,
                gender="female",
                height_cm=160.0,
                base_weight_kg=55.0,
                fitness_level="intermediate",
                weekly_frequency=5,
                avg_distance_per_session=8.0,
                target_race="marathon",
                motivation_base=0.8,
                recovery_ability=0.7
            ),
            UserProfile(
                name="山田健一",
                age=28,
                gender="male",
                height_cm=175.0,
                base_weight_kg=68.0,
                fitness_level="advanced",
                weekly_frequency=6,
                avg_distance_per_session=12.0,
                target_race="marathon_sub3",
                motivation_base=0.9,
                recovery_ability=0.8
            ),
            UserProfile(
                name="鈴木美代子",
                age=45,
                gender="female",
                height_cm=158.0,
                base_weight_kg=58.0,
                fitness_level="master",
                weekly_frequency=4,
                avg_distance_per_session=6.0,
                target_race="half_marathon",
                motivation_base=0.6,
                recovery_ability=0.5
            ),
            UserProfile(
                name="高橋翔太",
                age=20,
                gender="male",
                height_cm=172.0,
                base_weight_kg=62.0,
                fitness_level="student",
                weekly_frequency=7,
                avg_distance_per_session=10.0,
                target_race="track_5000m",
                motivation_base=0.85,
                recovery_ability=0.9
            )
        ]
        
        logger.info(f"Created {len(profiles)} user profiles")
        return profiles
    
    def create_workout_types(self) -> Dict[str, WorkoutType]:
        """練習種別を作成"""
        workout_types_data = [
            {"name": "ジョグ", "description": "イージーラン", "base_intensity": 0.3},
            {"name": "テンポ走", "description": "閾値走", "base_intensity": 0.7},
            {"name": "インターバル走", "description": "高強度インターバル", "base_intensity": 0.9},
            {"name": "ロング走", "description": "長距離走", "base_intensity": 0.5},
            {"name": "レペティション", "description": "短距離反復", "base_intensity": 0.95},
            {"name": "ファルトレク", "description": "起伏走", "base_intensity": 0.6},
            {"name": "坂道練習", "description": "ヒルワーク", "base_intensity": 0.8}
        ]
        
        workout_types = {}
        for wt_data in workout_types_data:
            workout_type = WorkoutType(
                id=str(uuid.uuid4()),
                name=wt_data["name"],
                description=wt_data["description"],
                base_intensity=wt_data["base_intensity"]
            )
            self.db.add(workout_type)
            workout_types[wt_data["name"]] = workout_type
        
        self.db.commit()
        logger.info(f"Created {len(workout_types)} workout types")
        return workout_types
    
    def generate_training_patterns(self, profile: UserProfile) -> List[TrainingPattern]:
        """ユーザーの練習パターンを生成"""
        patterns = []
        
        # 練習種別の分布（健康的な範囲）
        pattern_distribution = {
            "ジョグ": 0.65,      # 60-70%
            "テンポ走": 0.12,     # 10-15%
            "インターバル走": 0.10, # 10-15%
            "ロング走": 0.08,     # 5-10%
            "レペティション": 0.05  # 5%
        }
        
        for workout_name, probability in pattern_distribution.items():
            if random.random() < probability:
                # 距離の計算
                if workout_name == "ジョグ":
                    distance = profile.avg_distance_per_session * random.uniform(0.8, 1.2)
                elif workout_name == "テンポ走":
                    distance = profile.avg_distance_per_session * random.uniform(0.6, 0.9)
                elif workout_name == "インターバル走":
                    distance = profile.avg_distance_per_session * random.uniform(0.4, 0.7)
                elif workout_name == "ロング走":
                    distance = profile.avg_distance_per_session * random.uniform(1.5, 2.5)
                elif workout_name == "レペティション":
                    distance = profile.avg_distance_per_session * random.uniform(0.3, 0.6)
                else:
                    distance = profile.avg_distance_per_session * random.uniform(0.8, 1.2)
                
                # 強度の計算
                intensity = self._calculate_intensity(workout_name, profile.fitness_level)
                
                # 時間の計算（分）
                duration = int(distance * random.uniform(4.5, 6.0))  # 4.5-6.0分/km
                
                # 疲労への影響
                fatigue_impact = intensity * random.uniform(0.8, 1.2)
                
                patterns.append(TrainingPattern(
                    workout_type=workout_name,
                    distance_km=distance,
                    intensity=intensity,
                    duration_minutes=duration,
                    fatigue_impact=fatigue_impact
                ))
        
        return patterns
    
    def _calculate_intensity(self, workout_name: str, fitness_level: str) -> float:
        """練習強度を計算"""
        base_intensities = {
            "ジョグ": 0.3,
            "テンポ走": 0.7,
            "インターバル走": 0.9,
            "ロング走": 0.5,
            "レペティション": 0.95,
            "ファルトレク": 0.6,
            "坂道練習": 0.8
        }
        
        base_intensity = base_intensities.get(workout_name, 0.5)
        
        # フィットネスレベルによる調整
        level_adjustments = {
            "beginner": 0.9,      # 初心者は強度を下げる
            "intermediate": 1.0,   # 標準
            "advanced": 1.1,       # 上級者は強度を上げる
            "master": 0.95,        # マスターズは少し下げる
            "student": 1.05         # 学生は少し上げる
        }
        
        adjustment = level_adjustments.get(fitness_level, 1.0)
        intensity = base_intensity * adjustment * random.uniform(0.9, 1.1)
        
        return max(0.1, min(1.0, intensity))
    
    def generate_condition_data(
        self, 
        user_id: str, 
        date: date, 
        training_pattern: Optional[TrainingPattern],
        previous_condition: Optional[Dict[str, Any]] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """体調データを生成（相関ロジックを使用）"""
        
        # 基本体重（健康的な変動範囲内）
        base_weight = user_profile.get('base_weight_kg', 65.0) if user_profile else 65.0
        weight_variation = random.uniform(-self.health_ranges['weight_variation'], 
                                        self.health_ranges['weight_variation'])
        weight_kg = base_weight + weight_variation
        
        # 練習データの準備
        workout_data = None
        if training_pattern:
            workout_data = {
                'intensity': training_pattern.intensity,
                'distance_km': training_pattern.distance_km,
                'duration_minutes': training_pattern.duration_minutes,
                'success_rate': random.uniform(0.6, 0.9)  # 成功率
            }
        
        # 現在の体調データ
        current_condition = previous_condition or {
            'fatigue_level': random.uniform(2, 6),
            'energy_level': random.uniform(5, 8),
            'motivation_level': random.uniform(5, 8),
            'stress_level': random.uniform(2, 6),
            'sleep_quality_score': random.uniform(6, 8)
        }
        
        # 相関ロジックを使用して体調データを生成
        if workout_data and user_profile:
            # 練習影響を計算
            correlation = self.correlator.calculate_training_impact(
                workout_data, current_condition, user_profile
            )
            
            # 練習後の体調を予測
            predicted_condition = self.correlator.predict_condition_after_workout(
                current_condition, correlation, hours_after_workout=24
            )
            
            # 基本データを予測結果で更新
            fatigue_level = predicted_condition.get('fatigue_level', 5)
            energy_level = predicted_condition.get('energy_level', 7)
            motivation_level = predicted_condition.get('motivation_level', 7)
            stress_level = predicted_condition.get('stress_level', 5)
            sleep_quality = predicted_condition.get('sleep_quality_score', 7)
        else:
            # 練習がない場合の基本生成
            fatigue_level = random.uniform(2, self.health_ranges['fatigue_max'])
            energy_level = random.uniform(self.health_ranges['energy_min'], 9)
            motivation_level = random.uniform(self.health_ranges['motivation_min'], 9)
            stress_level = random.uniform(2, self.health_ranges['stress_max'])
            sleep_quality = random.uniform(6, 9)
        
        # 睡眠時間（推奨範囲内）
        sleep_duration = random.uniform(self.health_ranges['sleep_min'], 
                                       self.health_ranges['sleep_max'])
        
        # 練習による睡眠への影響
        if training_pattern and training_pattern.intensity > 0.7:
            sleep_duration += random.uniform(0.2, 0.5)  # 高強度練習後は睡眠時間が長くなる
        
        # トレーニング準備度の計算
        training_readiness = self.correlator._calculate_training_readiness({
            'fatigue_level': fatigue_level,
            'energy_level': energy_level,
            'sleep_quality_score': sleep_quality,
            'stress_level': stress_level
        })
        
        # 回復状態
        if training_readiness >= 8:
            recovery_status = "excellent"
        elif training_readiness >= 6:
            recovery_status = "good"
        elif training_readiness >= 4:
            recovery_status = "fair"
        else:
            recovery_status = "poor"
        
        # 安静時心拍数（健康的な範囲）
        resting_heart_rate = random.randint(50, 80)
        
        # 疲労度による心拍数の調整
        if fatigue_level > 6:
            resting_heart_rate += random.randint(5, 15)
        
        # 血圧（健康的な範囲）
        blood_pressure_systolic = random.randint(100, 140)
        blood_pressure_diastolic = random.randint(60, 90)
        
        # ストレスによる血圧の調整
        if stress_level > 6:
            blood_pressure_systolic += random.randint(5, 20)
            blood_pressure_diastolic += random.randint(3, 10)
        
        return {
            'weight_kg': round(weight_kg, 1),
            'sleep_duration_hours': round(sleep_duration, 1),
            'sleep_quality_score': int(sleep_quality),
            'fatigue_level': int(fatigue_level),
            'motivation_level': int(motivation_level),
            'stress_level': int(stress_level),
            'energy_level': int(energy_level),
            'training_readiness': int(training_readiness),
            'recovery_status': recovery_status,
            'resting_heart_rate': resting_heart_rate,
            'blood_pressure_systolic': blood_pressure_systolic,
            'blood_pressure_diastolic': blood_pressure_diastolic,
            'bedtime': self._generate_bedtime(),
            'wake_time': self._generate_wake_time(sleep_duration),
            'notes': self._generate_notes(training_pattern, fatigue_level, motivation_level),
            'mood_tags': self._generate_mood_tags(motivation_level, stress_level, energy_level)
        }
    
    def _generate_bedtime(self) -> str:
        """就寝時間を生成"""
        hour = random.randint(22, 24)
        minute = random.randint(0, 59)
        if hour == 24:
            hour = 0
        return f"{hour:02d}:{minute:02d}"
    
    def _generate_wake_time(self, sleep_duration: float) -> str:
        """起床時間を生成（睡眠時間を考慮）"""
        bedtime_hour = random.randint(22, 23)
        bedtime_minute = random.randint(0, 59)
        
        # 睡眠時間を考慮して起床時間を計算
        wake_hour = bedtime_hour + int(sleep_duration)
        wake_minute = bedtime_minute + int((sleep_duration % 1) * 60)
        
        if wake_minute >= 60:
            wake_hour += 1
            wake_minute -= 60
        
        if wake_hour >= 24:
            wake_hour -= 24
        
        return f"{wake_hour:02d}:{wake_minute:02d}"
    
    def _generate_notes(self, training_pattern: Optional[TrainingPattern], 
                       fatigue_level: float, motivation_level: float) -> str:
        """メモを生成"""
        notes = []
        
        if training_pattern:
            if training_pattern.intensity > 0.8:
                notes.append("高強度練習を実施")
            elif training_pattern.intensity < 0.4:
                notes.append("リカバリー練習")
        
        if fatigue_level > 6:
            notes.append("疲労感あり")
        elif fatigue_level < 3:
            notes.append("体調良好")
        
        if motivation_level > 8:
            notes.append("モチベーション高")
        elif motivation_level < 5:
            notes.append("やる気不足")
        
        return "、".join(notes) if notes else ""
    
    def _generate_mood_tags(self, motivation_level: float, stress_level: float, 
                          energy_level: float) -> List[str]:
        """気分タグを生成"""
        tags = []
        
        if motivation_level > 7:
            tags.append("やる気満々")
        elif motivation_level < 5:
            tags.append("やる気不足")
        
        if stress_level > 6:
            tags.append("ストレス高")
        elif stress_level < 4:
            tags.append("リラックス")
        
        if energy_level > 7:
            tags.append("エネルギッシュ")
        elif energy_level < 4:
            tags.append("疲れ気味")
        
        return tags
    
    def validate_health_patterns(self, condition_data: Dict[str, Any]) -> bool:
        """生成されたデータの健康性をチェック"""
        
        # 体重の極端な変動チェック
        if condition_data.get('weight_kg', 0) < 40 or condition_data.get('weight_kg', 0) > 120:
            return False
        
        # 睡眠時間のチェック
        sleep_duration = condition_data.get('sleep_duration_hours', 0)
        if sleep_duration < 4 or sleep_duration > 12:
            return False
        
        # 疲労度のチェック
        fatigue_level = condition_data.get('fatigue_level', 0)
        if fatigue_level > 9:  # 極端な疲労は避ける
            return False
        
        # モチベーションのチェック
        motivation_level = condition_data.get('motivation_level', 0)
        if motivation_level < 2:  # 極端に低いモチベーションは避ける
            return False
        
        # ストレスレベルのチェック
        stress_level = condition_data.get('stress_level', 0)
        if stress_level > 9:  # 極端なストレスは避ける
            return False
        
        # エネルギーレベルのチェック
        energy_level = condition_data.get('energy_level', 0)
        if energy_level < 1:  # 極端に低いエネルギーは避ける
            return False
        
        return True
    
    def generate_comprehensive_dataset(self, days: int = 30) -> Dict[str, Any]:
        """包括的なテストデータセットを生成"""
        logger.info(f"Generating comprehensive dataset for {days} days")
        
        # ユーザープロフィール作成
        profiles = self.create_user_profiles()
        
        # 練習種別作成
        workout_types = self.create_workout_types()
        
        # データ生成結果
        generated_data = {
            'users': [],
            'workouts': [],
            'daily_metrics': [],
            'personal_bests': [],
            'races': []
        }
        
        # 各ユーザーのデータ生成
        for profile in profiles:
            logger.info(f"Generating data for {profile.name}")
            
            # ユーザー作成
            user = User(
                id=str(uuid.uuid4()),
                email=f"{profile.name.lower()}@example.com",
                username=profile.name,
                hashed_password="hashed_password_placeholder"
            )
            self.db.add(user)
            self.db.commit()
            
            # ユーザープロフィール作成
            user_profile = UserProfile(
                id=str(uuid.uuid4()),
                user_id=user.id,
                age=profile.age,
                gender=profile.gender,
                height_cm=profile.height_cm,
                weight_kg=profile.base_weight_kg,
                resting_hr=random.randint(50, 80),
                max_hr=220 - profile.age,
                vo2_max=random.uniform(35, 65)
            )
            self.db.add(user_profile)
            self.db.commit()
            
            generated_data['users'].append({
                'user_id': user.id,
                'profile': profile,
                'user_profile': user_profile
            })
            
            # 練習パターン生成
            training_patterns = self.generate_training_patterns(profile)
            
            # 日次データ生成
            previous_condition = None
            for day in range(days):
                current_date = date.today() - timedelta(days=days-day-1)
                
                # 練習日かどうか決定（週頻度に基づく）
                is_training_day = random.random() < (profile.weekly_frequency / 7)
                
                training_pattern = None
                if is_training_day and training_patterns:
                    training_pattern = random.choice(training_patterns)
                    
                    # 練習記録作成
                    workout = Workout(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        date=current_date,
                        workout_type_id=workout_types[training_pattern.workout_type].id,
                        distance_km=training_pattern.distance_km,
                        duration_minutes=training_pattern.duration_minutes,
                        notes=f"{training_pattern.workout_type} - {training_pattern.distance_km:.1f}km"
                    )
                    self.db.add(workout)
                    generated_data['workouts'].append(workout)
                
                # 体調データ生成
                condition_data = self.generate_condition_data(
                    user.id, current_date, training_pattern, previous_condition, {
                        'base_weight_kg': profile.base_weight_kg,
                        'recovery_ability': profile.recovery_ability,
                        'fitness_level': profile.fitness_level
                    }
                )
                
                # 健康性チェック
                if not self.validate_health_patterns(condition_data):
                    logger.warning(f"Unhealthy pattern detected for {profile.name} on {current_date}")
                    # 不健康なパターンの場合は調整
                    condition_data = self._adjust_unhealthy_pattern(condition_data)
                
                # 体調記録作成
                daily_metrics = DailyMetrics(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    date=current_date,
                    **condition_data,
                    is_estimated=False,
                    data_source="generated"
                )
                self.db.add(daily_metrics)
                generated_data['daily_metrics'].append(daily_metrics)
                
                previous_condition = condition_data
            
            self.db.commit()
        
        logger.info("Comprehensive dataset generation completed")
        return generated_data
    
    def _adjust_unhealthy_pattern(self, condition_data: Dict[str, Any]) -> Dict[str, Any]:
        """不健康なパターンを健康的な範囲に調整"""
        adjusted = condition_data.copy()
        
        # 体重の調整
        if adjusted.get('weight_kg', 0) < 40:
            adjusted['weight_kg'] = random.uniform(45, 50)
        elif adjusted.get('weight_kg', 0) > 120:
            adjusted['weight_kg'] = random.uniform(100, 110)
        
        # 睡眠時間の調整
        sleep_duration = adjusted.get('sleep_duration_hours', 0)
        if sleep_duration < 4:
            adjusted['sleep_duration_hours'] = random.uniform(6, 7)
        elif sleep_duration > 12:
            adjusted['sleep_duration_hours'] = random.uniform(8, 9)
        
        # 疲労度の調整
        if adjusted.get('fatigue_level', 0) > 9:
            adjusted['fatigue_level'] = random.randint(6, 8)
        
        # モチベーションの調整
        if adjusted.get('motivation_level', 0) < 2:
            adjusted['motivation_level'] = random.randint(4, 6)
        
        # ストレスレベルの調整
        if adjusted.get('stress_level', 0) > 9:
            adjusted['stress_level'] = random.randint(6, 8)
        
        # エネルギーレベルの調整
        if adjusted.get('energy_level', 0) < 1:
            adjusted['energy_level'] = random.randint(3, 5)
        
        return adjusted
    
    def generate_summary_report(self, generated_data: Dict[str, Any]) -> str:
        """生成データのサマリーレポートを作成"""
        report = []
        report.append("=" * 60)
        report.append("RunMaster 包括的テストデータ生成レポート")
        report.append("=" * 60)
        
        # ユーザー情報
        report.append(f"\n📊 生成されたユーザー数: {len(generated_data['users'])}")
        for user_data in generated_data['users']:
            profile = user_data['profile']
            report.append(f"  - {profile.name} ({profile.age}歳, {profile.gender})")
            report.append(f"    フィットネスレベル: {profile.fitness_level}")
            report.append(f"    週練習回数: {profile.weekly_frequency}回")
            report.append(f"    目標レース: {profile.target_race}")
        
        # 練習記録
        report.append(f"\n🏃 生成された練習記録数: {len(generated_data['workouts'])}")
        
        # 体調記録
        report.append(f"\n💊 生成された体調記録数: {len(generated_data['daily_metrics'])}")
        
        # 健康性チェック
        healthy_count = 0
        for metrics in generated_data['daily_metrics']:
            if self.validate_health_patterns({
                'weight_kg': metrics.weight_kg,
                'sleep_duration_hours': metrics.sleep_duration_hours,
                'fatigue_level': metrics.fatigue_level,
                'motivation_level': metrics.motivation_level,
                'stress_level': metrics.stress_level,
                'energy_level': metrics.energy_level
            }):
                healthy_count += 1
        
        health_percentage = (healthy_count / len(generated_data['daily_metrics']) * 100) if generated_data['daily_metrics'] else 0
        report.append(f"\n✅ 健康性チェック: {healthy_count}/{len(generated_data['daily_metrics'])} 件が健康的な範囲内 ({health_percentage:.1f}%)")
        
        # データ品質
        report.append(f"\n📈 データ品質:")
        report.append(f"  - 体調記録の完全性: {len(generated_data['daily_metrics'])} 件")
        report.append(f"  - 練習記録の完全性: {len(generated_data['workouts'])} 件")
        
        report.append("\n" + "=" * 60)
        report.append("データ生成完了！")
        report.append("=" * 60)
        
        return "\n".join(report)


def main():
    """メイン実行関数"""
    logger.info("Starting RunMaster comprehensive test data generation")
    
    try:
        # データ生成器の初期化
        generator = HealthyDataGenerator()
        
        # 包括的データセット生成
        generated_data = generator.generate_comprehensive_dataset(days=30)
        
        # サマリーレポート生成
        report = generator.generate_summary_report(generated_data)
        print(report)
        
        # レポートをファイルに保存
        with open("test_data_generation_report.txt", "w", encoding="utf-8") as f:
            f.write(report)
        
        logger.info("Test data generation completed successfully")
        
    except Exception as e:
        logger.error(f"Error during test data generation: {e}")
        raise


if __name__ == "__main__":
    main()

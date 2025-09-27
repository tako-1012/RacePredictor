"""
個人化された練習プランを生成するシステム

このモジュールには以下の機能が含まれます：
- 週間プラン生成
- 期分け計画生成
- 弱点分析
- 練習提案
- 科学的根拠に基づく計画立案
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class TrainingPhase(Enum):
    """練習期分け"""
    BASE = "base"           # 基礎期
    BUILD = "build"         # 鍛練期
    PEAK = "peak"           # 調整期
    RECOVERY = "recovery"   # 回復期


class WorkoutType(Enum):
    """練習種目"""
    EASY = "easy"           # イージー
    TEMPO = "tempo"         # テンポ
    INTERVAL = "interval"   # インターバル
    LONG = "long"           # ロング
    RECOVERY = "recovery"   # 回復


@dataclass
class Workout:
    """練習メニュー"""
    type: WorkoutType
    distance: float
    pace: float
    description: str
    intensity: float
    duration_minutes: int
    notes: Optional[str] = None


@dataclass
class WeeklyPlan:
    """週間プラン"""
    week_number: int
    phase: TrainingPhase
    total_distance: float
    workouts: List[Workout]
    recovery_days: List[int]  # 曜日（0=月曜日）


@dataclass
class TrainingPlan:
    """トレーニングプラン"""
    user_id: int
    target_race: str
    race_date: datetime
    current_date: datetime
    weeks_remaining: int
    weekly_plans: List[WeeklyPlan]
    total_distance: float
    peak_distance: float


class WorkoutPlanner:
    """練習プラン生成エンジン"""
    
    def __init__(self):
        """初期化"""
        self.base_paces = {
            '5k': 240,      # 4分/km
            '10k': 270,     # 4分30秒/km
            'half_marathon': 300,  # 5分/km
            'marathon': 330,       # 5分30秒/km
        }
        
        logger.info("WorkoutPlanner initialized")
    
    def generate_weekly_plan(
        self,
        user_id: int,
        current_fitness: Dict[str, Any],
        target_race: str,
        race_date: datetime,
        current_date: datetime,
        weekly_distance: float,
        training_frequency: int
    ) -> WeeklyPlan:
        """
        週間プラン生成
        
        Args:
            user_id: ユーザーID
            current_fitness: 現在の体力レベル
            target_race: 目標レース
            race_date: レース日
            current_date: 現在日
            weekly_distance: 週間走行距離
            training_frequency: 練習頻度
            
        Returns:
            週間プラン
        """
        try:
            logger.info(f"Generating weekly plan for user {user_id}")
            
            # 現在の期分けを決定
            phase = self._determine_training_phase(race_date, current_date)
            
            # 週間距離の調整
            adjusted_distance = self._adjust_weekly_distance(
                weekly_distance, phase, current_fitness
            )
            
            # 練習頻度の調整
            adjusted_frequency = self._adjust_training_frequency(
                training_frequency, adjusted_distance
            )
            
            # 練習メニューの生成
            workouts = self._generate_workouts(
                phase, adjusted_distance, adjusted_frequency, current_fitness, target_race
            )
            
            # 回復日の設定
            recovery_days = self._determine_recovery_days(adjusted_frequency)
            
            weekly_plan = WeeklyPlan(
                week_number=self._get_week_number(race_date, current_date),
                phase=phase,
                total_distance=adjusted_distance,
                workouts=workouts,
                recovery_days=recovery_days
            )
            
            logger.info(f"Weekly plan generated: {len(workouts)} workouts, {adjusted_distance:.1f}km")
            return weekly_plan
            
        except Exception as e:
            logger.error(f"Failed to generate weekly plan: {str(e)}")
            raise RuntimeError(f"週間プランの生成に失敗しました: {str(e)}")
    
    def generate_periodized_plan(
        self,
        user_id: int,
        current_fitness: Dict[str, Any],
        target_race: str,
        race_date: datetime,
        current_date: datetime,
        current_weekly_distance: float,
        training_frequency: int
    ) -> TrainingPlan:
        """
        期分け計画生成
        
        Args:
            user_id: ユーザーID
            current_fitness: 現在の体力レベル
            target_race: 目標レース
            race_date: レース日
            current_date: 現在日
            current_weekly_distance: 現在の週間走行距離
            training_frequency: 練習頻度
            
        Returns:
            期分けトレーニングプラン
        """
        try:
            logger.info(f"Generating periodized plan for user {user_id}")
            
            weeks_remaining = self._calculate_weeks_remaining(race_date, current_date)
            
            if weeks_remaining < 4:
                raise ValueError("レースまで4週間未満のため、期分けプランは生成できません")
            
            # 期分けの設定
            phase_weeks = self._calculate_phase_weeks(weeks_remaining)
            
            # ピーク距離の計算
            peak_distance = self._calculate_peak_distance(
                current_weekly_distance, target_race, current_fitness
            )
            
            # 各週のプラン生成
            weekly_plans = []
            current_phase_distance = current_weekly_distance
            
            for week_num in range(weeks_remaining):
                phase = self._get_phase_for_week(week_num, phase_weeks)
                
                # 週間距離の調整
                if phase == TrainingPhase.BASE:
                    current_phase_distance = min(
                        current_phase_distance * 1.1,  # 10%増加
                        peak_distance * 0.7
                    )
                elif phase == TrainingPhase.BUILD:
                    current_phase_distance = min(
                        current_phase_distance * 1.05,  # 5%増加
                        peak_distance
                    )
                elif phase == TrainingPhase.PEAK:
                    current_phase_distance = peak_distance
                else:  # RECOVERY
                    current_phase_distance = peak_distance * 0.6
                
                # 週間プラン生成
                weekly_plan = self.generate_weekly_plan(
                    user_id=user_id,
                    current_fitness=current_fitness,
                    target_race=target_race,
                    race_date=race_date,
                    current_date=current_date + timedelta(weeks=week_num),
                    weekly_distance=current_phase_distance,
                    training_frequency=training_frequency
                )
                
                weekly_plans.append(weekly_plan)
            
            # 総距離の計算
            total_distance = sum(plan.total_distance for plan in weekly_plans)
            
            training_plan = TrainingPlan(
                user_id=user_id,
                target_race=target_race,
                race_date=race_date,
                current_date=current_date,
                weeks_remaining=weeks_remaining,
                weekly_plans=weekly_plans,
                total_distance=total_distance,
                peak_distance=peak_distance
            )
            
            logger.info(f"Periodized plan generated: {weeks_remaining} weeks, {total_distance:.1f}km total")
            return training_plan
            
        except Exception as e:
            logger.error(f"Failed to generate periodized plan: {str(e)}")
            raise RuntimeError(f"期分けプランの生成に失敗しました: {str(e)}")
    
    def analyze_weaknesses(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        弱点分析
        
        Args:
            user_data: ユーザーデータ
            
        Returns:
            弱点分析結果
        """
        try:
            logger.info("Analyzing user weaknesses")
            
            weaknesses = {}
            
            # ペース分析
            if 'avg_pace' in user_data and 'race_pace' in user_data:
                pace_gap = user_data['race_pace'] - user_data['avg_pace']
                if pace_gap > 30:  # 30秒/km以上の差
                    weaknesses['pace_consistency'] = {
                        'severity': 'high' if pace_gap > 60 else 'medium',
                        'description': '練習ペースとレースペースの差が大きい',
                        'recommendation': 'テンポ走の頻度を増やす'
                    }
            
            # 距離分析
            if 'max_distance' in user_data and 'target_distance' in user_data:
                distance_ratio = user_data['max_distance'] / user_data['target_distance']
                if distance_ratio < 0.8:
                    weaknesses['endurance'] = {
                        'severity': 'high' if distance_ratio < 0.6 else 'medium',
                        'description': '目標距離に対する最大距離が不足',
                        'recommendation': 'ロング走の距離を段階的に増やす'
                    }
            
            # 強度分析
            if 'easy_ratio' in user_data:
                if user_data['easy_ratio'] < 0.6:
                    weaknesses['recovery'] = {
                        'severity': 'medium',
                        'description': 'イージー走の割合が少ない',
                        'recommendation': '回復走の頻度を増やす'
                    }
                elif user_data['easy_ratio'] > 0.9:
                    weaknesses['intensity'] = {
                        'severity': 'medium',
                        'description': '高強度練習が不足',
                        'recommendation': 'インターバル走やテンポ走を増やす'
                    }
            
            # 頻度分析
            if 'weekly_frequency' in user_data:
                if user_data['weekly_frequency'] < 3:
                    weaknesses['frequency'] = {
                        'severity': 'high',
                        'description': '練習頻度が少ない',
                        'recommendation': '週3回以上の練習を心がける'
                    }
                elif user_data['weekly_frequency'] > 6:
                    weaknesses['overtraining'] = {
                        'severity': 'medium',
                        'description': '練習頻度が高すぎる可能性',
                        'recommendation': '適切な休養日を設ける'
                    }
            
            logger.info(f"Weakness analysis completed: {len(weaknesses)} weaknesses identified")
            return weaknesses
            
        except Exception as e:
            logger.error(f"Failed to analyze weaknesses: {str(e)}")
            raise RuntimeError(f"弱点分析に失敗しました: {str(e)}")
    
    def suggest_workouts(
        self,
        user_data: Dict[str, Any],
        target_race: str,
        days_ahead: int = 7
    ) -> List[Workout]:
        """
        練習提案
        
        Args:
            user_data: ユーザーデータ
            target_race: 目標レース
            days_ahead: 何日先まで提案するか
            
        Returns:
            練習提案リスト
        """
        try:
            logger.info(f"Suggesting workouts for {days_ahead} days")
            
            suggestions = []
            
            # 現在の体力レベルに基づく提案
            current_pace = user_data.get('avg_pace', 300)
            weekly_distance = user_data.get('weekly_distance', 20)
            training_frequency = user_data.get('training_frequency', 4)
            
            # 目標ペースの設定
            target_pace = self.base_paces.get(target_race, 300)
            
            # 日別の練習提案
            for day in range(days_ahead):
                if day % (7 // training_frequency) == 0:  # 練習日
                    workout_type = self._select_workout_type(user_data, day)
                    
                    if workout_type == WorkoutType.EASY:
                        workout = Workout(
                            type=WorkoutType.EASY,
                            distance=weekly_distance / training_frequency * 0.8,
                            pace=current_pace * 1.2,  # 20%遅く
                            description="イージー走",
                            intensity=0.5,
                            duration_minutes=int((weekly_distance / training_frequency * 0.8) * (current_pace * 1.2) / 60),
                            notes="会話ができるペースで"
                        )
                    elif workout_type == WorkoutType.TEMPO:
                        workout = Workout(
                            type=WorkoutType.TEMPO,
                            distance=weekly_distance / training_frequency * 0.6,
                            pace=target_pace * 0.9,  # 目標ペースの90%
                            description="テンポ走",
                            intensity=0.8,
                            duration_minutes=int((weekly_distance / training_frequency * 0.6) * (target_pace * 0.9) / 60),
                            notes="ややきついが維持できるペース"
                        )
                    elif workout_type == WorkoutType.INTERVAL:
                        interval_distance = weekly_distance / training_frequency * 0.4
                        workout = Workout(
                            type=WorkoutType.INTERVAL,
                            distance=interval_distance,
                            pace=target_pace * 0.85,  # 目標ペースの85%
                            description=f"インターバル走 ({interval_distance:.1f}km)",
                            intensity=0.9,
                            duration_minutes=int(interval_distance * (target_pace * 0.85) / 60),
                            notes="高強度で短時間"
                        )
                    else:  # LONG
                        workout = Workout(
                            type=WorkoutType.LONG,
                            distance=weekly_distance / training_frequency * 1.2,
                            pace=current_pace * 1.1,  # 10%遅く
                            description="ロング走",
                            intensity=0.6,
                            duration_minutes=int((weekly_distance / training_frequency * 1.2) * (current_pace * 1.1) / 60),
                            notes="長時間の有酸素運動"
                        )
                    
                    suggestions.append(workout)
            
            logger.info(f"Generated {len(suggestions)} workout suggestions")
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to suggest workouts: {str(e)}")
            raise RuntimeError(f"練習提案に失敗しました: {str(e)}")
    
    def _determine_training_phase(self, race_date: datetime, current_date: datetime) -> TrainingPhase:
        """現在の期分けを決定"""
        weeks_remaining = self._calculate_weeks_remaining(race_date, current_date)
        
        if weeks_remaining <= 2:
            return TrainingPhase.PEAK
        elif weeks_remaining <= 6:
            return TrainingPhase.BUILD
        elif weeks_remaining <= 12:
            return TrainingPhase.BASE
        else:
            return TrainingPhase.BASE
    
    def _calculate_weeks_remaining(self, race_date: datetime, current_date: datetime) -> int:
        """残り週数を計算"""
        delta = race_date - current_date
        return max(0, delta.days // 7)
    
    def _calculate_phase_weeks(self, total_weeks: int) -> Dict[TrainingPhase, int]:
        """期分けの週数を計算"""
        if total_weeks <= 4:
            return {TrainingPhase.PEAK: total_weeks}
        elif total_weeks <= 8:
            return {
                TrainingPhase.BUILD: total_weeks - 2,
                TrainingPhase.PEAK: 2
            }
        elif total_weeks <= 16:
            return {
                TrainingPhase.BASE: total_weeks - 6,
                TrainingPhase.BUILD: 4,
                TrainingPhase.PEAK: 2
            }
        else:
            return {
                TrainingPhase.BASE: total_weeks - 8,
                TrainingPhase.BUILD: 6,
                TrainingPhase.PEAK: 2
            }
    
    def _get_phase_for_week(self, week_num: int, phase_weeks: Dict[TrainingPhase, int]) -> TrainingPhase:
        """週番号から期分けを取得"""
        cumulative_weeks = 0
        for phase, weeks in phase_weeks.items():
            cumulative_weeks += weeks
            if week_num < cumulative_weeks:
                return phase
        return TrainingPhase.PEAK
    
    def _adjust_weekly_distance(self, distance: float, phase: TrainingPhase, fitness: Dict[str, Any]) -> float:
        """週間距離の調整"""
        base_distance = distance
        
        # 期分けによる調整
        if phase == TrainingPhase.BASE:
            multiplier = 1.0
        elif phase == TrainingPhase.BUILD:
            multiplier = 1.1
        elif phase == TrainingPhase.PEAK:
            multiplier = 1.2
        else:  # RECOVERY
            multiplier = 0.8
        
        # 体力レベルによる調整
        if 'experience_level' in fitness:
            if fitness['experience_level'] == 'beginner':
                multiplier *= 0.8
            elif fitness['experience_level'] == 'advanced':
                multiplier *= 1.2
        
        return base_distance * multiplier
    
    def _adjust_training_frequency(self, frequency: int, weekly_distance: float) -> int:
        """練習頻度の調整"""
        # 距離に基づく頻度調整
        if weekly_distance < 20:
            return min(frequency, 4)
        elif weekly_distance < 40:
            return min(frequency, 5)
        else:
            return min(frequency, 6)
    
    def _generate_workouts(
        self,
        phase: TrainingPhase,
        weekly_distance: float,
        frequency: int,
        fitness: Dict[str, Any],
        target_race: str
    ) -> List[Workout]:
        """練習メニューの生成"""
        workouts = []
        distance_per_workout = weekly_distance / frequency
        
        # 期分けに応じた練習配分
        if phase == TrainingPhase.BASE:
            workout_distribution = [0.4, 0.3, 0.2, 0.1]  # イージー, テンポ, インターバル, ロング
        elif phase == TrainingPhase.BUILD:
            workout_distribution = [0.3, 0.4, 0.2, 0.1]
        elif phase == TrainingPhase.PEAK:
            workout_distribution = [0.2, 0.3, 0.4, 0.1]
        else:  # RECOVERY
            workout_distribution = [0.6, 0.2, 0.1, 0.1]
        
        # 各練習の生成
        for i in range(frequency):
            if i < len(workout_distribution):
                workout_distance = distance_per_workout * workout_distribution[i]
                workout_type = self._get_workout_type_by_index(i, phase)
                
                workout = self._create_workout(
                    workout_type, workout_distance, fitness, target_race
                )
                workouts.append(workout)
        
        return workouts
    
    def _get_workout_type_by_index(self, index: int, phase: TrainingPhase) -> WorkoutType:
        """インデックスから練習種目を取得"""
        if phase == TrainingPhase.BASE:
            types = [WorkoutType.EASY, WorkoutType.TEMPO, WorkoutType.INTERVAL, WorkoutType.LONG]
        elif phase == TrainingPhase.BUILD:
            types = [WorkoutType.TEMPO, WorkoutType.INTERVAL, WorkoutType.EASY, WorkoutType.LONG]
        elif phase == TrainingPhase.PEAK:
            types = [WorkoutType.INTERVAL, WorkoutType.TEMPO, WorkoutType.EASY, WorkoutType.LONG]
        else:  # RECOVERY
            types = [WorkoutType.EASY, WorkoutType.RECOVERY, WorkoutType.EASY, WorkoutType.EASY]
        
        return types[index % len(types)]
    
    def _create_workout(
        self,
        workout_type: WorkoutType,
        distance: float,
        fitness: Dict[str, Any],
        target_race: str
    ) -> Workout:
        """練習メニューの作成"""
        current_pace = fitness.get('avg_pace', 300)
        target_pace = self.base_paces.get(target_race, 300)
        
        if workout_type == WorkoutType.EASY:
            pace = current_pace * 1.2
            intensity = 0.5
            description = "イージー走"
            notes = "会話ができるペースで"
        elif workout_type == WorkoutType.TEMPO:
            pace = target_pace * 0.9
            intensity = 0.8
            description = "テンポ走"
            notes = "ややきついが維持できるペース"
        elif workout_type == WorkoutType.INTERVAL:
            pace = target_pace * 0.85
            intensity = 0.9
            description = "インターバル走"
            notes = "高強度で短時間"
        elif workout_type == WorkoutType.LONG:
            pace = current_pace * 1.1
            intensity = 0.6
            description = "ロング走"
            notes = "長時間の有酸素運動"
        else:  # RECOVERY
            pace = current_pace * 1.3
            intensity = 0.4
            description = "回復走"
            notes = "非常にゆっくりとしたペース"
        
        duration_minutes = int(distance * pace / 60)
        
        return Workout(
            type=workout_type,
            distance=distance,
            pace=pace,
            description=description,
            intensity=intensity,
            duration_minutes=duration_minutes,
            notes=notes
        )
    
    def _determine_recovery_days(self, frequency: int) -> List[int]:
        """回復日の設定"""
        # 週7日から練習日を除いた日を回復日とする
        all_days = list(range(7))
        workout_days = list(range(frequency))
        return [day for day in all_days if day not in workout_days]
    
    def _get_week_number(self, race_date: datetime, current_date: datetime) -> int:
        """週番号の取得"""
        return self._calculate_weeks_remaining(race_date, current_date)
    
    def _calculate_peak_distance(self, current_distance: float, target_race: str, fitness: Dict[str, Any]) -> float:
        """ピーク距離の計算"""
        base_multiplier = {
            '5k': 1.5,
            '10k': 2.0,
            'half_marathon': 2.5,
            'marathon': 3.0
        }.get(target_race, 2.0)
        
        peak_distance = current_distance * base_multiplier
        
        # 経験レベルによる調整
        if 'experience_level' in fitness:
            if fitness['experience_level'] == 'beginner':
                peak_distance *= 0.8
            elif fitness['experience_level'] == 'advanced':
                peak_distance *= 1.2
        
        return min(peak_distance, 100)  # 最大100km/週に制限
    
    def _select_workout_type(self, user_data: Dict[str, Any], day: int) -> WorkoutType:
        """練習種目の選択"""
        # 簡易的な選択ロジック
        if day % 3 == 0:
            return WorkoutType.EASY
        elif day % 3 == 1:
            return WorkoutType.TEMPO
        else:
            return WorkoutType.INTERVAL

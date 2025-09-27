from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class DataQualityLevel(Enum):
    """データ品質レベル"""
    EXCELLENT = "excellent"  # 優秀
    GOOD = "good"          # 良好
    WARNING = "warning"    # 警告
    ERROR = "error"       # エラー

@dataclass
class DataQualityIssue:
    """データ品質問題"""
    id: str
    level: DataQualityLevel
    title: str
    description: str
    suggestion: str
    field: Optional[str] = None
    value: Optional[Any] = None
    expected_range: Optional[Tuple[float, float]] = None

@dataclass
class DataQualityReport:
    """データ品質レポート"""
    overall_score: float
    level: DataQualityLevel
    issues: List[DataQualityIssue]
    total_records: int
    valid_records: int
    generated_at: datetime

class DataQualityService:
    """データ品質管理サービス"""
    
    def __init__(self):
        # 人間の能力限界を考慮した制限値
        self.limits = {
            'pace_per_km': {
                'min': 2.0,  # 2分/km (30km/h) - 世界記録レベル
                'max': 15.0  # 15分/km (4km/h) - 歩行速度
            },
            'distance_km': {
                'min': 0.1,   # 100m
                'max': 100.0  # 100km (ウルトラマラソン)
            },
            'time_minutes': {
                'min': 1.0,    # 1分
                'max': 600.0   # 10時間
            },
            'heart_rate': {
                'min': 40,   # 40bpm (安静時)
                'max': 220   # 220bpm (最大心拍数)
            }
        }
        
        # 異常パターンの定義
        self.anomaly_patterns = {
            'impossible_pace': {
                'description': '人間では不可能なペース',
                'threshold': 2.0  # 2分/km未満
            },
            'extreme_distance': {
                'description': '極端に長い距離',
                'threshold': 50.0  # 50km以上
            },
            'extreme_time': {
                'description': '極端に長い時間',
                'threshold': 300.0  # 5時間以上
            },
            'pace_distance_mismatch': {
                'description': 'ペースと距離の不整合',
                'tolerance': 0.1  # 10%の許容誤差
            }
        }

    def validate_workout_data(self, workout_data: Dict[str, Any]) -> DataQualityReport:
        """練習記録データの品質検証"""
        issues = []
        
        # 基本フィールドの存在チェック
        required_fields = ['date', 'distance_km', 'time_minutes']
        for field in required_fields:
            if field not in workout_data or workout_data[field] is None:
                issues.append(DataQualityIssue(
                    id=f"missing_{field}",
                    level=DataQualityLevel.ERROR,
                    title=f"必須フィールドが不足: {field}",
                    description=f"{field}フィールドが設定されていません",
                    suggestion=f"{field}を入力してください",
                    field=field
                ))
        
        if not issues:  # 必須フィールドが揃っている場合のみ詳細検証
            issues.extend(self._validate_pace(workout_data))
            issues.extend(self._validate_distance(workout_data))
            issues.extend(self._validate_time(workout_data))
            issues.extend(self._validate_heart_rate(workout_data))
            issues.extend(self._validate_consistency(workout_data))
            issues.extend(self._validate_anomalies(workout_data))
        
        # 品質スコア計算
        total_records = 1
        valid_records = total_records - len([i for i in issues if i.level == DataQualityLevel.ERROR])
        overall_score = (valid_records / total_records) * 100
        
        # 品質レベル決定
        if overall_score >= 90:
            level = DataQualityLevel.EXCELLENT
        elif overall_score >= 75:
            level = DataQualityLevel.GOOD
        elif overall_score >= 50:
            level = DataQualityLevel.WARNING
        else:
            level = DataQualityLevel.ERROR
        
        return DataQualityReport(
            overall_score=overall_score,
            level=level,
            issues=issues,
            total_records=total_records,
            valid_records=valid_records,
            generated_at=datetime.now()
        )

    def _validate_pace(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """ペースの検証"""
        issues = []
        
        if 'pace_per_km' in data and data['pace_per_km'] is not None:
            pace = float(data['pace_per_km'])
            min_pace = self.limits['pace_per_km']['min']
            max_pace = self.limits['pace_per_km']['max']
            
            if pace < min_pace:
                issues.append(DataQualityIssue(
                    id="pace_too_fast",
                    level=DataQualityLevel.ERROR,
                    title="ペースが速すぎます",
                    description=f"ペース {pace:.1f}分/km は人間では不可能です",
                    suggestion=f"ペースを {min_pace}分/km 以上に修正してください",
                    field='pace_per_km',
                    value=pace,
                    expected_range=(min_pace, max_pace)
                ))
            elif pace > max_pace:
                issues.append(DataQualityIssue(
                    id="pace_too_slow",
                    level=DataQualityLevel.WARNING,
                    title="ペースが遅すぎます",
                    description=f"ペース {pace:.1f}分/km は歩行速度です",
                    suggestion=f"ランニングの場合は {max_pace}分/km 以下に修正してください",
                    field='pace_per_km',
                    value=pace,
                    expected_range=(min_pace, max_pace)
                ))
        
        return issues

    def _validate_distance(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """距離の検証"""
        issues = []
        
        if 'distance_km' in data and data['distance_km'] is not None:
            distance = float(data['distance_km'])
            min_distance = self.limits['distance_km']['min']
            max_distance = self.limits['distance_km']['max']
            
            if distance < min_distance:
                issues.append(DataQualityIssue(
                    id="distance_too_short",
                    level=DataQualityLevel.WARNING,
                    title="距離が短すぎます",
                    description=f"距離 {distance:.1f}km は記録対象として短すぎます",
                    suggestion=f"距離を {min_distance}km 以上に修正してください",
                    field='distance_km',
                    value=distance,
                    expected_range=(min_distance, max_distance)
                ))
            elif distance > max_distance:
                issues.append(DataQualityIssue(
                    id="distance_too_long",
                    level=DataQualityLevel.WARNING,
                    title="距離が長すぎます",
                    description=f"距離 {distance:.1f}km は極端に長い距離です",
                    suggestion=f"ウルトラマラソンの場合は正しい距離を確認してください",
                    field='distance_km',
                    value=distance,
                    expected_range=(min_distance, max_distance)
                ))
        
        return issues

    def _validate_time(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """時間の検証"""
        issues = []
        
        if 'time_minutes' in data and data['time_minutes'] is not None:
            time_minutes = float(data['time_minutes'])
            min_time = self.limits['time_minutes']['min']
            max_time = self.limits['time_minutes']['max']
            
            if time_minutes < min_time:
                issues.append(DataQualityIssue(
                    id="time_too_short",
                    level=DataQualityLevel.WARNING,
                    title="時間が短すぎます",
                    description=f"時間 {time_minutes:.1f}分 は記録対象として短すぎます",
                    suggestion=f"時間を {min_time}分 以上に修正してください",
                    field='time_minutes',
                    value=time_minutes,
                    expected_range=(min_time, max_time)
                ))
            elif time_minutes > max_time:
                issues.append(DataQualityIssue(
                    id="time_too_long",
                    level=DataQualityLevel.WARNING,
                    title="時間が長すぎます",
                    description=f"時間 {time_minutes:.1f}分 は極端に長い時間です",
                    suggestion=f"長時間の練習の場合は正しい時間を確認してください",
                    field='time_minutes',
                    value=time_minutes,
                    expected_range=(min_time, max_time)
                ))
        
        return issues

    def _validate_heart_rate(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """心拍数の検証"""
        issues = []
        
        heart_rate_fields = ['avg_heart_rate', 'max_heart_rate']
        for field in heart_rate_fields:
            if field in data and data[field] is not None:
                heart_rate = int(data[field])
                min_hr = self.limits['heart_rate']['min']
                max_hr = self.limits['heart_rate']['max']
                
                if heart_rate < min_hr or heart_rate > max_hr:
                    issues.append(DataQualityIssue(
                        id=f"heart_rate_invalid_{field}",
                        level=DataQualityLevel.WARNING,
                        title=f"{field}が異常です",
                        description=f"心拍数 {heart_rate}bpm は正常範囲外です",
                        suggestion=f"心拍数を {min_hr}-{max_hr}bpm の範囲で修正してください",
                        field=field,
                        value=heart_rate,
                        expected_range=(min_hr, max_hr)
                    ))
        
        return issues

    def _validate_consistency(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """データの一貫性検証"""
        issues = []
        
        # ペースと距離・時間の一貫性チェック
        if all(field in data and data[field] is not None for field in ['distance_km', 'time_minutes', 'pace_per_km']):
            distance = float(data['distance_km'])
            time_minutes = float(data['time_minutes'])
            pace_per_km = float(data['pace_per_km'])
            
            # 計算されたペース
            calculated_pace = time_minutes / distance if distance > 0 else 0
            
            # 許容誤差内かチェック
            tolerance = self.anomaly_patterns['pace_distance_mismatch']['tolerance']
            if abs(calculated_pace - pace_per_km) > pace_per_km * tolerance:
                issues.append(DataQualityIssue(
                    id="pace_distance_mismatch",
                    level=DataQualityLevel.WARNING,
                    title="ペースと距離・時間の不整合",
                    description=f"入力されたペース {pace_per_km:.1f}分/km と計算値 {calculated_pace:.1f}分/km が一致しません",
                    suggestion="距離、時間、ペースの値を再確認してください",
                    field='pace_per_km',
                    value=pace_per_km
                ))
        
        return issues

    def _validate_anomalies(self, data: Dict[str, Any]) -> List[DataQualityIssue]:
        """異常パターンの検証"""
        issues = []
        
        # 不可能なペースのチェック
        if 'pace_per_km' in data and data['pace_per_km'] is not None:
            pace = float(data['pace_per_km'])
            if pace < self.anomaly_patterns['impossible_pace']['threshold']:
                issues.append(DataQualityIssue(
                    id="impossible_pace",
                    level=DataQualityLevel.ERROR,
                    title="人間では不可能なペース",
                    description=f"ペース {pace:.1f}分/km は世界記録を大幅に上回ります",
                    suggestion="ペースの単位（分/km）を確認してください",
                    field='pace_per_km',
                    value=pace
                ))
        
        # 極端に長い距離のチェック
        if 'distance_km' in data and data['distance_km'] is not None:
            distance = float(data['distance_km'])
            if distance > self.anomaly_patterns['extreme_distance']['threshold']:
                issues.append(DataQualityIssue(
                    id="extreme_distance",
                    level=DataQualityLevel.WARNING,
                    title="極端に長い距離",
                    description=f"距離 {distance:.1f}km はウルトラマラソン以上の距離です",
                    suggestion="距離の単位（km）を確認してください",
                    field='distance_km',
                    value=distance
                ))
        
        # 極端に長い時間のチェック
        if 'time_minutes' in data and data['time_minutes'] is not None:
            time_minutes = float(data['time_minutes'])
            if time_minutes > self.anomaly_patterns['extreme_time']['threshold']:
                issues.append(DataQualityIssue(
                    id="extreme_time",
                    level=DataQualityLevel.WARNING,
                    title="極端に長い時間",
                    description=f"時間 {time_minutes:.1f}分 は5時間以上の長時間です",
                    suggestion="時間の単位（分）を確認してください",
                    field='time_minutes',
                    value=time_minutes
                ))
        
        return issues

    def generate_weekly_quality_report(self, user_id: str) -> DataQualityReport:
        """週次データ品質レポート生成"""
        # 実際の実装では、データベースから過去1週間のデータを取得
        # ここではサンプルデータを使用
        sample_issues = [
            DataQualityIssue(
                id="sample_issue_1",
                level=DataQualityLevel.WARNING,
                title="ペースの不整合",
                description="一部の記録でペースと距離・時間が一致しません",
                suggestion="記録を再確認してください",
                field='pace_per_km'
            )
        ]
        
        return DataQualityReport(
            overall_score=85.0,
            level=DataQualityLevel.GOOD,
            issues=sample_issues,
            total_records=10,
            valid_records=9,
            generated_at=datetime.now()
        )

    def get_data_quality_tips(self) -> List[str]:
        """データ品質向上のためのヒント"""
        return [
            "練習記録は練習直後に記録することをお勧めします",
            "距離と時間は正確に測定してください",
            "心拍数データがあるとより詳細な分析が可能です",
            "異常に速いペースは記録ミスの可能性があります",
            "長時間の練習は複数セッションに分割して記録してください"
        ]

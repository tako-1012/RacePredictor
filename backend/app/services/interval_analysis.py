import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from app.models.workout_import_data import IntervalAnalysis

logger = logging.getLogger(__name__)


@dataclass
class LapData:
    """ラップデータ"""
    index: int
    time_seconds: float
    distance_meters: float
    pace_per_km: float


@dataclass
class AnomalyDetection:
    """異常検出結果"""
    has_anomaly: bool
    anomaly_type: Optional[str]
    anomaly_lap_index: Optional[int]
    severity: str
    confidence: float
    description: str
    suggested_correction: Optional[Dict[str, Any]]


class IntervalAnalyzer:
    """インターバル分析クラス"""
    
    def __init__(self):
        self.min_lap_distance = 30  # 最小ラップ距離（メートル）
        self.anomaly_threshold_percentage = 20  # 異常検出の閾値（%）
        self.short_distance_threshold = 50  # 短距離ラップの閾値（メートル）
    
    def analyze_interval_data(self, lap_times: List[float], lap_distances: List[float]) -> Dict[str, Any]:
        """
        インターバルデータを分析
        
        Args:
            lap_times: ラップタイムの配列（秒）
            lap_distances: ラップ距離の配列（メートル）
            
        Returns:
            分析結果の辞書
        """
        try:
            logger.info(f"🔍 インターバル分析開始: {len(lap_times)}ラップ")
            
            # ラップデータの作成
            lap_data = self._create_lap_data(lap_times, lap_distances)
            
            # 基本統計の計算
            basic_stats = self._calculate_basic_stats(lap_data)
            
            # 異常検出
            anomaly_detection = self._detect_anomalies(lap_data)
            
            # 修正提案の生成
            corrections = self._generate_corrections(lap_data, anomaly_detection)
            
            # 結果の統合
            result = {
                'total_laps': len(lap_data),
                'average_lap_time': basic_stats['average_time'],
                'average_lap_distance': basic_stats['average_distance'],
                'has_anomaly': anomaly_detection.has_anomaly,
                'anomaly_type': anomaly_detection.anomaly_type,
                'anomaly_lap_index': anomaly_detection.anomaly_lap_index,
                'anomaly_severity': anomaly_detection.severity,
                'lap_times': lap_times,
                'lap_distances': lap_distances,
                'lap_paces': [lap.pace_per_km for lap in lap_data],
                'suggested_corrections': corrections,
                'analysis_metadata': {
                    'confidence': anomaly_detection.confidence,
                    'description': anomaly_detection.description,
                    'analysis_timestamp': basic_stats['analysis_timestamp']
                }
            }
            
            logger.info(f"✅ インターバル分析完了: 異常={anomaly_detection.has_anomaly}")
            return result
            
        except Exception as e:
            logger.error(f"❌ インターバル分析エラー: {e}")
            raise
    
    def _create_lap_data(self, lap_times: List[float], lap_distances: List[float]) -> List[LapData]:
        """ラップデータオブジェクトの作成"""
        lap_data = []
        
        for i, (time, distance) in enumerate(zip(lap_times, lap_distances)):
            pace_per_km = (time / distance * 1000) if distance > 0 else 0
            
            lap_data.append(LapData(
                index=i,
                time_seconds=time,
                distance_meters=distance,
                pace_per_km=pace_per_km
            ))
        
        return lap_data
    
    def _calculate_basic_stats(self, lap_data: List[LapData]) -> Dict[str, Any]:
        """基本統計の計算"""
        if not lap_data:
            return {
                'average_time': 0,
                'average_distance': 0,
                'analysis_timestamp': None
            }
        
        total_time = sum(lap.time_seconds for lap in lap_data)
        total_distance = sum(lap.distance_meters for lap in lap_data)
        
        return {
            'average_time': total_time / len(lap_data),
            'average_distance': total_distance / len(lap_data),
            'analysis_timestamp': None  # 実際の実装では現在時刻を設定
        }
    
    def _detect_anomalies(self, lap_data: List[LapData]) -> AnomalyDetection:
        """異常検出"""
        if len(lap_data) < 2:
            return AnomalyDetection(
                has_anomaly=False,
                anomaly_type=None,
                anomaly_lap_index=None,
                severity='low',
                confidence=0.0,
                description='ラップ数が少なすぎて分析できません',
                suggested_correction=None
            )
        
        # 最後のラップの異常検出
        last_lap_anomaly = self._detect_last_lap_anomaly(lap_data)
        if last_lap_anomaly.has_anomaly:
            return last_lap_anomaly
        
        # その他の異常検出（将来の拡張用）
        return AnomalyDetection(
            has_anomaly=False,
            anomaly_type=None,
            anomaly_lap_index=None,
            severity='low',
            confidence=1.0,
            description='異常は検出されませんでした',
            suggested_correction=None
        )
    
    def _detect_last_lap_anomaly(self, lap_data: List[LapData]) -> AnomalyDetection:
        """最後のラップの異常検出"""
        if len(lap_data) < 3:  # 短距離インターバル（30m×10本等）は正常として判定
            return AnomalyDetection(
                has_anomaly=False,
                anomaly_type=None,
                anomaly_lap_index=None,
                severity='low',
                confidence=0.8,
                description='短距離インターバルのため、最後のラップは正常と判定',
                suggested_correction=None
            )
        
        last_lap = lap_data[-1]
        other_laps = lap_data[:-1]
        
        # 他のラップの平均を計算
        avg_time = sum(lap.time_seconds for lap in other_laps) / len(other_laps)
        avg_distance = sum(lap.distance_meters for lap in other_laps) / len(other_laps)
        
        # 最後のラップが異常に短いかチェック
        time_ratio = last_lap.time_seconds / avg_time if avg_time > 0 else 1
        distance_ratio = last_lap.distance_meters / avg_distance if avg_distance > 0 else 1
        
        # 異常検出条件：
        # 1. 最後のラップが他のラップ平均の20%未満
        # 2. かつ50m未満
        is_time_anomaly = time_ratio < (self.anomaly_threshold_percentage / 100)
        is_distance_anomaly = last_lap.distance_meters < self.short_distance_threshold
        
        if is_time_anomaly and is_distance_anomaly:
            confidence = min(0.9, 1.0 - time_ratio)
            severity = 'high' if confidence > 0.8 else 'medium'
            
            return AnomalyDetection(
                has_anomaly=True,
                anomaly_type='short_last_lap',
                anomaly_lap_index=last_lap.index,
                severity=severity,
                confidence=confidence,
                description=f'最後のラップが異常に短いです（時間: {time_ratio:.1%}, 距離: {last_lap.distance_meters}m）',
                suggested_correction={
                    'type': 'remove_last_lap',
                    'reason': '余分なラップの可能性が高い',
                    'confidence': confidence
                }
            )
        
        return AnomalyDetection(
            has_anomaly=False,
            anomaly_type=None,
            anomaly_lap_index=None,
            severity='low',
            confidence=0.9,
            description='最後のラップは正常です',
            suggested_correction=None
        )
    
    def _generate_corrections(self, lap_data: List[LapData], anomaly: AnomalyDetection) -> List[Dict[str, Any]]:
        """修正提案の生成"""
        corrections = []
        
        if anomaly.has_anomaly and anomaly.suggested_correction:
            corrections.append(anomaly.suggested_correction)
        
        return corrections
    
    def apply_correction(self, lap_times: List[float], lap_distances: List[float], 
                        correction_type: str) -> Tuple[List[float], List[float]]:
        """修正の適用"""
        corrected_times = lap_times.copy()
        corrected_distances = lap_distances.copy()
        
        if correction_type == 'remove_last_lap':
            if len(corrected_times) > 1:
                corrected_times.pop()
                corrected_distances.pop()
        
        return corrected_times, corrected_distances
    
    def validate_interval_pattern(self, lap_times: List[float], lap_distances: List[float]) -> Dict[str, Any]:
        """インターバルパターンの検証"""
        # 短距離インターバル（30m×10本等）の検出
        if len(lap_times) >= 5:
            avg_distance = sum(lap_distances) / len(lap_distances)
            if avg_distance <= 100:  # 平均距離が100m以下
                return {
                    'pattern_type': 'short_interval',
                    'is_valid': True,
                    'description': '短距離インターバルとして正常'
                }
        
        # 中距離インターバル（400m×8本等）の検出
        if len(lap_times) >= 3:
            avg_distance = sum(lap_distances) / len(lap_distances)
            if 300 <= avg_distance <= 600:
                return {
                    'pattern_type': 'medium_interval',
                    'is_valid': True,
                    'description': '中距離インターバルとして正常'
                }
        
        return {
            'pattern_type': 'unknown',
            'is_valid': True,
            'description': '一般的なインターバルパターン'
        }

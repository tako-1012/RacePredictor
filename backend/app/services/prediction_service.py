"""
予測結果の保存・管理システム

このモジュールには以下の機能が含まれます：
- AI予測の実行
- 予測結果の保存
- 予測履歴の取得
- 実績との比較分析
- 予測精度の計算
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models.ai import PredictionResult, AIModel
from app.services.ml_model_manager import MLModelManager
from app.services.feature_store import FeatureStoreService
from app.core.exceptions import DatabaseError, ValidationError, NotFoundError

logger = logging.getLogger(__name__)


class PredictionService:
    """予測結果管理サービスクラス"""
    
    def __init__(self, db: Session):
        self.db = db
        self.model_manager = MLModelManager(db)
        self.feature_service = FeatureStoreService(db)
    
    async def execute_prediction(
        self,
        user_id: int,
        race_type: str,
        distance: float
    ) -> Dict[str, Any]:
        """
        AI予測の実行
        
        Args:
            user_id: ユーザーID
            race_type: レース種目
            distance: 距離（km）
            
        Returns:
            予測結果辞書
        """
        try:
            logger.info(f"予測実行開始: user_id={user_id}, race_type={race_type}, distance={distance}")
            
            # アクティブなモデルを取得
            active_model = self.model_manager.get_active_model()
            if not active_model:
                logger.warning("アクティブなモデルが見つかりません、フォールバック予測を使用")
                return await self._fallback_prediction(user_id, race_type, distance)
            
            # モデルの読み込み
            model = self.model_manager.load_model(active_model.id)
            if not model:
                logger.warning("モデルの読み込みに失敗、フォールバック予測を使用")
                return await self._fallback_prediction(user_id, race_type, distance)
            
            # ユーザーの特徴量を取得
            features = await self._get_user_features(user_id)
            if not features:
                logger.warning("特徴量が取得できません、フォールバック予測を使用")
                return await self._fallback_prediction(user_id, race_type, distance)
            
            # 予測実行
            try:
                if hasattr(model, 'predict_single'):
                    predicted_time = model.predict_single(features)
                else:
                    # アンサンブルモデルの場合
                    predicted_time, confidence = model.predict_single(features)
                
                # 信頼度の計算
                if hasattr(model, 'calculate_confidence'):
                    confidence = model.calculate_confidence(np.array([features]))[0]
                else:
                    confidence = 0.8  # デフォルト信頼度
                
            except Exception as e:
                logger.error(f"予測実行エラー: {str(e)}")
                return await self._fallback_prediction(user_id, race_type, distance)
            
            # 予測結果の保存
            prediction_result = await self._save_prediction_result(
                user_id=user_id,
                model_id=active_model.id,
                race_type=race_type,
                distance=distance,
                predicted_time=predicted_time,
                confidence=confidence,
                features_used=features
            )
            
            # レスポンス形式に変換
            result = {
                'predicted_time': predicted_time,
                'predicted_time_formatted': self._format_time(predicted_time),
                'confidence': confidence,
                'model_used': active_model.name,
                'features_used': self._format_features(features),
                'prediction_id': prediction_result.id,
                'created_at': prediction_result.created_at
            }
            
            logger.info(f"予測完了: predicted_time={predicted_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"予測実行エラー: {str(e)}")
            raise ValidationError(f"予測の実行に失敗しました: {str(e)}")
    
    async def _fallback_prediction(
        self,
        user_id: int,
        race_type: str,
        distance: float
    ) -> Dict[str, Any]:
        """
        統計的フォールバック予測
        
        Args:
            user_id: ユーザーID
            race_type: レース種目
            distance: 距離（km）
            
        Returns:
            フォールバック予測結果
        """
        try:
            logger.info(f"フォールバック予測実行: user_id={user_id}")
            
            # 簡易的な統計的予測
            base_pace = self._get_base_pace_for_race_type(race_type)
            predicted_time = distance * base_pace
            
            # ユーザーの過去の実績を考慮（利用可能な場合）
            user_adjustment = await self._get_user_pace_adjustment(user_id)
            predicted_time *= user_adjustment
            
            # 予測結果の保存
            prediction_result = await self._save_prediction_result(
                user_id=user_id,
                model_id=None,  # フォールバック予測
                race_type=race_type,
                distance=distance,
                predicted_time=predicted_time,
                confidence=0.3,  # 低い信頼度
                features_used={'fallback': True}
            )
            
            result = {
                'predicted_time': predicted_time,
                'predicted_time_formatted': self._format_time(predicted_time),
                'confidence': 0.3,
                'model_used': 'Statistical Fallback',
                'features_used': {'fallback': True, 'distance': distance, 'race_type': race_type},
                'prediction_id': prediction_result.id if prediction_result else None,
                'created_at': datetime.now()
            }
            
            logger.info(f"フォールバック予測完了: predicted_time={predicted_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"フォールバック予測エラー: {str(e)}")
            # 最終的なデフォルト予測
            default_time = distance * 300  # 5分/km
            return {
                'predicted_time': default_time,
                'predicted_time_formatted': self._format_time(default_time),
                'confidence': 0.1,
                'model_used': 'Default',
                'features_used': {'default': True},
                'prediction_id': None,
                'created_at': datetime.now()
            }
    
    async def _get_user_features(self, user_id: int) -> Optional[List[float]]:
        """
        ユーザーの特徴量を取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            特徴量リスト
        """
        try:
            # 最新の特徴量を取得
            feature_store = self.feature_service.get_latest_features(user_id)
            if not feature_store or not feature_store.features:
                return None
            
            features = feature_store.features
            
            # 数値特徴量のみを抽出
            feature_names = [
                "weekly_avg_distance", "weekly_avg_frequency", "avg_pace",
                "distance_trend", "pace_trend", "intensity_trend",
                "easy_ratio", "tempo_ratio", "interval_ratio", "race_ratio",
                "recent_race_count", "avg_race_pace", "race_improvement_trend",
                "consistency_score", "seasonal_factor", "age", "bmi", "gender"
            ]
            
            feature_vector = []
            for name in feature_names:
                feature_vector.append(features.get(name, 0))
            
            return feature_vector
            
        except Exception as e:
            logger.error(f"特徴量取得エラー: {str(e)}")
            return None
    
    async def _save_prediction_result(
        self,
        user_id: int,
        model_id: Optional[str],
        race_type: str,
        distance: float,
        predicted_time: float,
        confidence: float,
        features_used: Dict[str, Any]
    ) -> Optional[PredictionResult]:
        """
        予測結果の保存
        
        Args:
            user_id: ユーザーID
            model_id: モデルID
            race_type: レース種目
            distance: 距離
            predicted_time: 予測タイム
            confidence: 信頼度
            features_used: 使用特徴量
            
        Returns:
            保存された予測結果
        """
        try:
            prediction_result = PredictionResult(
                user_id=str(user_id),
                model_id=model_id,
                race_type=race_type,
                distance=distance,
                predicted_time=predicted_time,
                confidence=confidence,
                features_used=features_used
            )
            
            self.db.add(prediction_result)
            self.db.commit()
            self.db.refresh(prediction_result)
            
            logger.info(f"予測結果保存完了: {prediction_result.id}")
            return prediction_result
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"予測結果保存エラー: {str(e)}")
            return None
    
    def _get_base_pace_for_race_type(self, race_type: str) -> float:
        """レース種目に基づく基本ペースを取得"""
        base_paces = {
            '5k': 240,      # 4分/km
            '10k': 270,     # 4.5分/km
            'half_marathon': 300,  # 5分/km
            'marathon': 330,       # 5.5分/km
            'other': 300   # 5分/km
        }
        return base_paces.get(race_type, 300)
    
    async def _get_user_pace_adjustment(self, user_id: int) -> float:
        """ユーザーのペース調整係数を取得"""
        try:
            # ユーザーの過去の実績を考慮
            # 簡易実装では1.0を返す
            return 1.0
        except Exception as e:
            logger.error(f"ペース調整係数取得エラー: {str(e)}")
            return 1.0
    
    def _format_time(self, seconds: float) -> str:
        """秒を時間形式にフォーマット"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes:02d}:{secs:02d}"
    
    def _format_features(self, features: List[float]) -> Dict[str, Any]:
        """特徴量をフォーマット"""
        feature_names = [
            "weekly_avg_distance", "weekly_avg_frequency", "avg_pace",
            "distance_trend", "pace_trend", "intensity_trend",
            "easy_ratio", "tempo_ratio", "interval_ratio", "race_ratio",
            "recent_race_count", "avg_race_pace", "race_improvement_trend",
            "consistency_score", "seasonal_factor", "age", "bmi", "gender"
        ]
        
        formatted_features = {}
        for i, name in enumerate(feature_names):
            if i < len(features):
                formatted_features[name] = features[i]
        
        return formatted_features
    
    async def get_prediction_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        race_type: Optional[str] = None,
        include_comparisons: bool = False
    ) -> List[Dict[str, Any]]:
        """
        予測履歴の取得
        
        Args:
            user_id: ユーザーID
            limit: 取得件数制限
            offset: オフセット
            race_type: レース種目フィルタ
            include_comparisons: 実績との比較を含める
            
        Returns:
            予測履歴リスト
        """
        try:
            logger.info(f"予測履歴取得: user_id={user_id}")
            
            query = self.db.query(PredictionResult).filter(
                PredictionResult.user_id == str(user_id)
            )
            
            if race_type:
                query = query.filter(PredictionResult.race_type == race_type)
            
            predictions = query.order_by(
                PredictionResult.created_at.desc()
            ).offset(offset).limit(limit).all()
            
            history = []
            for pred in predictions:
                history_item = {
                    'id': pred.id,
                    'race_type': pred.race_type,
                    'distance': pred.distance,
                    'predicted_time': pred.predicted_time,
                    'predicted_time_formatted': self._format_time(pred.predicted_time),
                    'confidence': pred.confidence,
                    'model_used': pred.model_id,
                    'created_at': pred.created_at,
                    'features_used': pred.features_used
                }
                
                if include_comparisons:
                    # 実績との比較を追加
                    history_item['actual_time'] = None  # 実装が必要
                    history_item['accuracy'] = None
                
                history.append(history_item)
            
            logger.info(f"予測履歴取得完了: {len(history)}件")
            return history
            
        except Exception as e:
            logger.error(f"予測履歴取得エラー: {str(e)}")
            return []
    
    async def get_model_performance(self) -> Dict[str, Any]:
        """
        モデル性能情報の取得
        
        Returns:
            モデル性能情報
        """
        try:
            logger.info("モデル性能情報取得")
            
            active_model = self.model_manager.get_active_model()
            if not active_model:
                return {
                    "model_name": "No Active Model",
                    "status": "no_model",
                    "message": "アクティブなモデルがありません"
                }
            
            return {
                "model_name": active_model.name,
                "version": active_model.version,
                "algorithm": active_model.algorithm,
                "performance_metrics": active_model.performance_metrics or {},
                "training_data_count": active_model.training_data_count or 0,
                "feature_count": active_model.feature_count or 0,
                "last_trained": active_model.updated_at.isoformat() if active_model.updated_at else None,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"モデル性能情報取得エラー: {str(e)}")
            return {"error": str(e)}
    
    async def get_prediction_statistics(self, user_id: int) -> Dict[str, Any]:
        """
        予測統計の取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            予測統計
        """
        try:
            logger.info(f"予測統計取得: user_id={user_id}")
            
            # ユーザーの予測履歴を取得
            predictions = self.db.query(PredictionResult).filter(
                PredictionResult.user_id == str(user_id)
            ).all()
            
            if not predictions:
                return {
                    "total_predictions": 0,
                    "avg_confidence": 0,
                    "race_type_distribution": {},
                    "accuracy_rate": 0,
                    "last_prediction_date": None
                }
            
            # 統計計算
            total_predictions = len(predictions)
            avg_confidence = sum(p.confidence for p in predictions) / total_predictions
            
            race_type_distribution = {}
            for pred in predictions:
                race_type_distribution[pred.race_type] = race_type_distribution.get(pred.race_type, 0) + 1
            
            last_prediction_date = max(p.created_at for p in predictions)
            
            return {
                "total_predictions": total_predictions,
                "avg_confidence": avg_confidence,
                "race_type_distribution": race_type_distribution,
                "accuracy_rate": 0,  # 実装が必要
                "last_prediction_date": last_prediction_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"予測統計取得エラー: {str(e)}")
            return {"error": str(e)}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """
        AI機能ステータスの取得
        
        Returns:
            AI機能ステータス
        """
        try:
            logger.info("AI機能ステータス取得")
            
            active_model = self.model_manager.get_active_model()
            
            return {
                "ai_enabled": True,
                "data_collection_stage": True,
                "models_available": len(self.model_manager.get_model_list()),
                "active_model": active_model.name if active_model else None,
                "last_update": datetime.now().isoformat(),
                "status": "data_collection",
                "message": "データ収集段階のため、フォールバック予測を提供しています"
            }
            
        except Exception as e:
            logger.error(f"AI機能ステータス取得エラー: {str(e)}")
            return {
                "ai_enabled": False,
                "error": str(e),
                "status": "error"
            }
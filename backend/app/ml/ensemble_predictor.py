"""
アンサンブル予測システム

このモジュールには複数のモデルを組み合わせたアンサンブル予測システムが含まれます：
- 重み付きアンサンブル予測
- 予測信頼度計算
- 動的重み調整機能
- フォールバック機能
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import cross_val_score

from .predictors.base_predictor import BasePredictor
from .predictors.random_forest_predictor import RandomForestPredictor
from .predictors.gradient_boosting_predictor import GradientBoostingPredictor
from .predictors.linear_regression_predictor import LinearRegressionPredictor
from .predictors.ridge_regression_predictor import RidgeRegressionPredictor

logger = logging.getLogger(__name__)


class EnsemblePredictor:
    """アンサンブル予測器クラス"""
    
    def __init__(self, name: str = "EnsemblePredictor"):
        """
        初期化
        
        Args:
            name: アンサンブル予測器名
        """
        self.name = name
        self.models: List[BasePredictor] = []
        self.model_weights: Dict[str, float] = {}
        self.is_trained = False
        self.ensemble_score_ = None
        self.feature_names: List[str] = []
        
        logger.info(f"Initialized {self.name}")
    
    def add_model(self, model: BasePredictor) -> 'EnsemblePredictor':
        """
        予測モデルを追加
        
        Args:
            model: 追加する予測モデル
            
        Returns:
            アンサンブル予測器
        """
        self.models.append(model)
        logger.info(f"Added {model.name} to ensemble")
        return self
    
    def add_default_models(self) -> 'EnsemblePredictor':
        """
        デフォルトのモデルセットを追加
        
        Returns:
            アンサンブル予測器
        """
        # デフォルトモデルの追加
        self.add_model(RandomForestPredictor(n_estimators=100, max_depth=10))
        self.add_model(GradientBoostingPredictor(n_estimators=100, learning_rate=0.1))
        self.add_model(LinearRegressionPredictor())
        self.add_model(RidgeRegressionPredictor(alpha=1.0))
        
        logger.info("Added default models to ensemble")
        return self
    
    def fit(self, X: np.ndarray, y: np.ndarray, validation_split: float = 0.2) -> 'EnsemblePredictor':
        """
        全モデルを学習
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            validation_split: 検証データの割合
            
        Returns:
            学習済みのアンサンブル予測器
        """
        try:
            logger.info(f"Training ensemble with {len(self.models)} models")
            
            if not self.models:
                raise ValueError("No models added to ensemble")
            
            # 特徴量名の設定
            self.feature_names = [f'feature_{i}' for i in range(X.shape[1])]
            
            # 各モデルの学習
            for model in self.models:
                logger.info(f"Training {model.name}")
                model.fit(X, y, validation_split)
            
            # 重みの計算
            self._calculate_model_weights(X, y)
            
            # アンサンブル性能の評価
            self._evaluate_ensemble(X, y)
            
            self.is_trained = True
            
            logger.info(f"Ensemble training completed. Score: {self.ensemble_score_:.4f}")
            return self
            
        except Exception as e:
            logger.error(f"Failed to train ensemble: {str(e)}")
            raise RuntimeError(f"アンサンブル学習に失敗しました: {str(e)}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        重み付きアンサンブル予測
        
        Args:
            X: 特徴量配列
            
        Returns:
            予測値配列
        """
        if not self.is_trained:
            raise RuntimeError("Ensemble predictor is not trained")
        
        try:
            predictions = []
            weights = []
            
            # 各モデルの予測と重みを取得
            for model in self.models:
                if model.is_trained:
                    pred = model.predict(X)
                    weight = self.model_weights.get(model.name, 0.0)
                    predictions.append(pred)
                    weights.append(weight)
            
            if not predictions:
                raise RuntimeError("No trained models available for prediction")
            
            # 重み付き平均でアンサンブル予測
            predictions_array = np.array(predictions)
            weights_array = np.array(weights)
            
            # 重みの正規化
            weights_array = weights_array / np.sum(weights_array)
            
            ensemble_pred = np.average(predictions_array, axis=0, weights=weights_array)
            
            logger.debug(f"Generated ensemble predictions for {len(X)} samples")
            return ensemble_pred
            
        except Exception as e:
            logger.error(f"Failed to predict using ensemble: {str(e)}")
            raise RuntimeError(f"アンサンブル予測に失敗しました: {str(e)}")
    
    def predict_single(self, features: List[float]) -> Tuple[float, float]:
        """
        単一サンプルの予測と信頼度
        
        Args:
            features: 特徴量リスト
            
        Returns:
            (予測値, 信頼度)
        """
        X = np.array([features])
        prediction = self.predict(X)[0]
        confidence = self.calculate_confidence(X)[0]
        
        return float(prediction), float(confidence)
    
    def calculate_confidence(self, X: np.ndarray) -> np.ndarray:
        """
        予測信頼度計算
        
        Args:
            X: 特徴量配列
            
        Returns:
            信頼度配列
        """
        if not self.is_trained:
            raise RuntimeError("Ensemble predictor is not trained")
        
        try:
            predictions = []
            weights = []
            
            # 各モデルの予測を取得
            for model in self.models:
                if model.is_trained:
                    pred = model.predict(X)
                    weight = self.model_weights.get(model.name, 0.0)
                    predictions.append(pred)
                    weights.append(weight)
            
            if len(predictions) < 2:
                # モデルが1つしかない場合は低い信頼度を返す
                return np.full(len(X), 0.5)
            
            predictions_array = np.array(predictions)
            weights_array = np.array(weights)
            
            # 重みの正規化
            weights_array = weights_array / np.sum(weights_array)
            
            # 予測値の分散による信頼度計算
            weighted_mean = np.average(predictions_array, axis=0, weights=weights_array)
            weighted_variance = np.average((predictions_array - weighted_mean) ** 2, axis=0, weights=weights_array)
            
            # モデル合意度による信頼度計算
            model_agreement = 1.0 / (1.0 + np.std(predictions_array, axis=0))
            
            # データ量による調整（簡易版）
            data_adjustment = min(1.0, len(self.models) / 4.0)
            
            # 総合信頼度
            confidence = model_agreement * data_adjustment * (1.0 / (1.0 + weighted_variance))
            
            # 信頼度を0-1の範囲に正規化
            confidence = np.clip(confidence, 0.0, 1.0)
            
            return confidence
            
        except Exception as e:
            logger.error(f"Failed to calculate confidence: {str(e)}")
            # エラー時はデフォルトの信頼度を返す
            return np.full(len(X), 0.5)
    
    def _calculate_model_weights(self, X: np.ndarray, y: np.ndarray):
        """
        モデル重みの計算
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
        """
        try:
            weights = {}
            
            for model in self.models:
                if model.is_trained:
                    # 交差検証で性能を評価
                    cv_scores = model.cross_validate(X, y, cv=3)
                    cv_mean = cv_scores['cv_mean']
                    
                    # MAEが小さいほど重みを大きくする
                    # MAEの逆数を重みとして使用
                    weight = 1.0 / (cv_mean + 1e-8)  # ゼロ除算を避ける
                    weights[model.name] = weight
                    
                    logger.info(f"{model.name} weight: {weight:.4f} (CV MAE: {cv_mean:.4f})")
            
            # 重みの正規化
            total_weight = sum(weights.values())
            if total_weight > 0:
                self.model_weights = {name: weight / total_weight for name, weight in weights.items()}
            else:
                # デフォルトの等重み
                self.model_weights = {name: 1.0 / len(weights) for name in weights.keys()}
            
            logger.info(f"Model weights: {self.model_weights}")
            
        except Exception as e:
            logger.error(f"Failed to calculate model weights: {str(e)}")
            # デフォルトの等重みを設定
            self.model_weights = {model.name: 1.0 / len(self.models) for model in self.models if model.is_trained}
    
    def _evaluate_ensemble(self, X: np.ndarray, y: np.ndarray):
        """
        アンサンブル性能の評価
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
        """
        try:
            predictions = self.predict(X)
            self.ensemble_score_ = mean_absolute_error(y, predictions)
            
            logger.info(f"Ensemble evaluation completed. MAE: {self.ensemble_score_:.4f}")
            
        except Exception as e:
            logger.error(f"Failed to evaluate ensemble: {str(e)}")
            self.ensemble_score_ = float('inf')
    
    def get_model_weights(self) -> Dict[str, float]:
        """
        モデル重みを取得
        
        Returns:
            モデル重み辞書
        """
        return self.model_weights.copy()
    
    def get_model_performance(self) -> Dict[str, Dict[str, Any]]:
        """
        各モデルの性能情報を取得
        
        Returns:
            モデル性能情報辞書
        """
        performance = {}
        
        for model in self.models:
            if model.is_trained:
                performance[model.name] = {
                    'weight': self.model_weights.get(model.name, 0.0),
                    'training_score': model.training_score_,
                    'validation_score': model.validation_score_,
                    'feature_importance': model.get_feature_importance()
                }
        
        return performance
    
    def get_ensemble_info(self) -> Dict[str, Any]:
        """
        アンサンブル情報の取得
        
        Returns:
            アンサンブル情報辞書
        """
        return {
            'name': self.name,
            'is_trained': self.is_trained,
            'n_models': len(self.models),
            'model_names': [model.name for model in self.models],
            'model_weights': self.model_weights,
            'ensemble_score': self.ensemble_score_,
            'feature_names': self.feature_names
        }
    
    def fallback_prediction(self, features: List[float]) -> float:
        """
        統計的フォールバック予測（AI予測失敗時）
        
        Args:
            features: 特徴量リスト
            
        Returns:
            フォールバック予測値
        """
        try:
            # 簡易的な統計的予測
            # 特徴量から基本的な統計的関係を使用
            
            # 距離とペースの関係を仮定
            if len(features) >= 3:  # 距離、ペース、頻度の特徴量があると仮定
                distance_feature = features[0] if features[0] > 0 else 5.0  # デフォルト5km
                pace_feature = features[2] if len(features) > 2 and features[2] > 0 else 300  # デフォルト5分/km
                
                # 簡易的な予測式（実際のデータに基づいて調整が必要）
                predicted_time = distance_feature * pace_feature
                
                logger.info(f"Fallback prediction: {predicted_time:.2f} seconds")
                return predicted_time
            
            # デフォルトの予測値
            return 1800.0  # 30分
            
        except Exception as e:
            logger.error(f"Fallback prediction failed: {str(e)}")
            return 1800.0  # デフォルト値
    
    def __repr__(self):
        return f"{self.name}(models={len(self.models)}, trained={self.is_trained}, score={self.ensemble_score_})"

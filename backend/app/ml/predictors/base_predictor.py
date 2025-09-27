"""
機械学習予測器の基底クラス

このモジュールには全ての予測器が継承する基底クラスが含まれます：
- 共通インターフェースの定義
- 基本的な機能の実装
- エラーハンドリング
"""

import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score

logger = logging.getLogger(__name__)


class BasePredictor(ABC):
    """機械学習予測器の基底クラス"""
    
    def __init__(self, name: str, **kwargs):
        """
        初期化
        
        Args:
            name: 予測器名
            **kwargs: ハイパーパラメータ
        """
        self.name = name
        self.model = None
        self.is_trained = False
        self.feature_importance_ = None
        self.training_score_ = None
        self.validation_score_ = None
        self.hyperparameters = kwargs
        
        logger.info(f"Initialized {self.name} predictor with parameters: {kwargs}")
    
    @abstractmethod
    def _create_model(self) -> Any:
        """
        モデルの作成（サブクラスで実装）
        
        Returns:
            作成されたモデルオブジェクト
        """
        pass
    
    def fit(self, X: np.ndarray, y: np.ndarray, validation_split: float = 0.2) -> 'BasePredictor':
        """
        モデル学習
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            validation_split: 検証データの割合
            
        Returns:
            学習済みの予測器
        """
        try:
            logger.info(f"Training {self.name} predictor with {len(X)} samples")
            
            # モデルの作成
            self.model = self._create_model()
            
            # データの分割
            split_idx = int(len(X) * (1 - validation_split))
            X_train, X_val = X[:split_idx], X[split_idx:]
            y_train, y_val = y[:split_idx], y[split_idx:]
            
            # 学習
            self.model.fit(X_train, y_train)
            
            # 性能評価
            train_pred = self.model.predict(X_train)
            val_pred = self.model.predict(X_val)
            
            self.training_score_ = self._calculate_score(y_train, train_pred)
            self.validation_score_ = self._calculate_score(y_val, val_pred)
            
            # 特徴量重要度の取得
            self._extract_feature_importance()
            
            self.is_trained = True
            
            logger.info(f"Training completed. Training score: {self.training_score_:.4f}, "
                       f"Validation score: {self.validation_score_:.4f}")
            
            return self
            
        except Exception as e:
            logger.error(f"Failed to train {self.name} predictor: {str(e)}")
            raise RuntimeError(f"モデル学習に失敗しました: {str(e)}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        予測実行
        
        Args:
            X: 特徴量配列
            
        Returns:
            予測値配列
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            predictions = self.model.predict(X)
            logger.debug(f"Generated {len(predictions)} predictions using {self.name}")
            return predictions
            
        except Exception as e:
            logger.error(f"Failed to predict using {self.name}: {str(e)}")
            raise RuntimeError(f"予測実行に失敗しました: {str(e)}")
    
    def predict_with_confidence(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        信頼度付き予測
        
        Args:
            X: 特徴量配列
            
        Returns:
            (予測値配列, 信頼度配列)
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            predictions = self.predict(X)
            # 簡易的な信頼度計算（実際の実装ではより複雑な計算が必要）
            confidence = np.full(len(predictions), 0.8)  # デフォルト信頼度
            return predictions, confidence
            
        except Exception as e:
            logger.error(f"Failed to predict with confidence using {self.name}: {str(e)}")
            raise RuntimeError(f"信頼度付き予測に失敗しました: {str(e)}")
    
    def predict_with_interval(self, X: np.ndarray, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        予測区間付き予測
        
        Args:
            X: 特徴量配列
            alpha: 信頼水準（デフォルト0.05 = 95%信頼区間）
            
        Returns:
            (予測値配列, 下限配列, 上限配列)
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            predictions = self.predict(X)
            # 簡易的な予測区間計算
            margin = np.std(predictions) * 1.96  # 95%信頼区間
            lower_bound = predictions - margin
            upper_bound = predictions + margin
            return predictions, lower_bound, upper_bound
            
        except Exception as e:
            logger.error(f"Failed to predict with interval using {self.name}: {str(e)}")
            raise RuntimeError(f"予測区間付き予測に失敗しました: {str(e)}")
    
    def predict_with_uncertainty(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        不確実性付き予測
        
        Args:
            X: 特徴量配列
            
        Returns:
            (予測値配列, 不確実性配列)
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            predictions = self.predict(X)
            # 簡易的な不確実性計算
            uncertainty = np.full(len(predictions), 0.1)  # デフォルト不確実性
            return predictions, uncertainty
            
        except Exception as e:
            logger.error(f"Failed to predict with uncertainty using {self.name}: {str(e)}")
            raise RuntimeError(f"不確実性付き予測に失敗しました: {str(e)}")
    
    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """
        特徴量重要度の取得
        
        Returns:
            特徴量重要度辞書
        """
        if not self.is_trained:
            logger.warning(f"{self.name} predictor is not trained")
            return None
        
        return self.feature_importance_
    
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        性能評価
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            
        Returns:
            評価指標辞書
        """
        if not self.is_trained:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            predictions = self.predict(X)
            
            metrics = {
                'mae': mean_absolute_error(y, predictions),
                'mse': mean_squared_error(y, predictions),
                'rmse': np.sqrt(mean_squared_error(y, predictions)),
                'r2': r2_score(y, predictions),
                'mape': self._calculate_mape(y, predictions)
            }
            
            logger.info(f"Evaluation metrics for {self.name}: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to evaluate {self.name}: {str(e)}")
            raise RuntimeError(f"性能評価に失敗しました: {str(e)}")
    
    def cross_validate(self, X: np.ndarray, y: np.ndarray, cv: int = 5) -> Dict[str, float]:
        """
        交差検証
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            cv: 交差検証の分割数
            
        Returns:
            交差検証結果
        """
        try:
            # 一時的にモデルを作成して交差検証
            temp_model = self._create_model()
            
            scores = cross_val_score(temp_model, X, y, cv=cv, scoring='neg_mean_absolute_error')
            
            cv_results = {
                'cv_mean': -scores.mean(),
                'cv_std': scores.std(),
                'cv_scores': -scores.tolist()
            }
            
            logger.info(f"Cross-validation results for {self.name}: {cv_results}")
            return cv_results
            
        except Exception as e:
            logger.error(f"Failed to cross-validate {self.name}: {str(e)}")
            raise RuntimeError(f"交差検証に失敗しました: {str(e)}")
    
    def _calculate_score(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        スコア計算（MAE）
        
        Args:
            y_true: 真の値
            y_pred: 予測値
            
        Returns:
            スコア
        """
        return mean_absolute_error(y_true, y_pred)
    
    def _calculate_mape(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        MAPE（平均絶対パーセント誤差）の計算
        
        Args:
            y_true: 真の値
            y_pred: 予測値
            
        Returns:
            MAPE
        """
        # ゼロ除算を避ける
        mask = y_true != 0
        if not np.any(mask):
            return 0.0
        
        return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    
    def _extract_feature_importance(self):
        """特徴量重要度の抽出（サブクラスでオーバーライド可能）"""
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance_ = {
                f'feature_{i}': importance 
                for i, importance in enumerate(self.model.feature_importances_)
            }
        elif hasattr(self.model, 'coef_'):
            self.feature_importance_ = {
                f'feature_{i}': abs(coef) 
                for i, coef in enumerate(self.model.coef_)
            }
        else:
            self.feature_importance_ = None
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        モデル情報の取得
        
        Returns:
            モデル情報辞書
        """
        return {
            'name': self.name,
            'is_trained': self.is_trained,
            'hyperparameters': self.hyperparameters,
            'training_score': self.training_score_,
            'validation_score': self.validation_score_,
            'feature_importance': self.feature_importance_
        }
    
    def __repr__(self):
        return f"{self.name}Predictor(trained={self.is_trained}, score={self.validation_score_})"

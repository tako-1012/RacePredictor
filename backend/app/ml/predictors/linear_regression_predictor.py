"""
線形回帰予測器

このモジュールには線形回帰アルゴリズムを使用した予測器が含まれます。
"""

import logging
from typing import Dict, Any
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV

from .base_predictor import BasePredictor

logger = logging.getLogger(__name__)


class LinearRegressionPredictor(BasePredictor):
    """線形回帰予測器"""
    
    def __init__(self, **kwargs):
        """
        初期化
        
        Args:
            **kwargs: ハイパーパラメータ
        """
        # デフォルトパラメータ
        default_params = {
            'fit_intercept': True,
            'copy_X': True,
            'n_jobs': -1
        }
        
        # ユーザー指定のパラメータでデフォルトを上書き
        default_params.update(kwargs)
        
        super().__init__("LinearRegression", **default_params)
        self.scaler = StandardScaler()
        self.use_scaling = kwargs.get('use_scaling', True)
    
    def _create_model(self) -> LinearRegression:
        """
        線形回帰モデルの作成
        
        Returns:
            作成された線形回帰モデル
        """
        return LinearRegression(**self.hyperparameters)
    
    def fit(self, X, y, validation_split: float = 0.2):
        """
        モデル学習（スケーリング対応）
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            validation_split: 検証データの割合
            
        Returns:
            学習済みの予測器
        """
        try:
            logger.info(f"Training {self.name} predictor with {len(X)} samples")
            
            # スケーリング
            if self.use_scaling:
                X_scaled = self.scaler.fit_transform(X)
            else:
                X_scaled = X
            
            # 親クラスのfitメソッドを呼び出し（スケーリングされたデータで）
            return super().fit(X_scaled, y, validation_split)
            
        except Exception as e:
            logger.error(f"Failed to train {self.name} predictor: {str(e)}")
            raise RuntimeError(f"モデル学習に失敗しました: {str(e)}")
    
    def predict(self, X):
        """
        予測実行（スケーリング対応）
        
        Args:
            X: 特徴量配列
            
        Returns:
            予測値配列
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError(f"{self.name} predictor is not trained")
        
        try:
            # スケーリング
            if self.use_scaling:
                X_scaled = self.scaler.transform(X)
            else:
                X_scaled = X
            
            predictions = self.model.predict(X_scaled)
            logger.debug(f"Generated {len(predictions)} predictions using {self.name}")
            return predictions
            
        except Exception as e:
            logger.error(f"Failed to predict using {self.name}: {str(e)}")
            raise RuntimeError(f"予測実行に失敗しました: {str(e)}")
    
    def get_coefficients(self) -> Dict[str, float]:
        """
        回帰係数の取得
        
        Returns:
            回帰係数辞書
        """
        if not self.is_trained or self.model is None:
            return {}
        
        coefficients = self.model.coef_
        feature_names = [f'feature_{i}' for i in range(len(coefficients))]
        
        return dict(zip(feature_names, coefficients))
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        特徴量重要度の取得（係数の絶対値）
        
        Returns:
            特徴量重要度辞書
        """
        if not self.is_trained or self.model is None:
            return {}
        
        coefficients = self.model.coef_
        feature_names = [f'feature_{i}' for i in range(len(coefficients))]
        
        # 係数の絶対値を重要度として使用
        importance_dict = dict(zip(feature_names, abs(coefficients)))
        
        # 重要度順にソート
        sorted_importance = dict(sorted(
            importance_dict.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return sorted_importance
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        モデル情報の取得
        
        Returns:
            モデル情報辞書
        """
        info = super().get_model_info()
        info.update({
            'coefficients': self.get_coefficients(),
            'intercept': float(self.model.intercept_) if self.is_trained else None,
            'use_scaling': self.use_scaling
        })
        return info
    
    def get_statistical_summary(self) -> Dict[str, Any]:
        """
        統計的サマリーの取得
        
        Returns:
            統計的サマリー辞書
        """
        if not self.is_trained or self.model is None:
            return {}
        
        return {
            'intercept': float(self.model.intercept_),
            'coefficients': self.model.coef_.tolist(),
            'rank': self.model.rank_,
            'singular_values': self.model.singular_.tolist() if hasattr(self.model, 'singular_') else None
        }

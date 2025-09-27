"""
勾配ブースティング予測器

このモジュールには勾配ブースティングアルゴリズムを使用した予測器が含まれます。
"""

import logging
from typing import Dict, Any
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import GridSearchCV

from .base_predictor import BasePredictor

logger = logging.getLogger(__name__)


class GradientBoostingPredictor(BasePredictor):
    """勾配ブースティング予測器"""
    
    def __init__(self, **kwargs):
        """
        初期化
        
        Args:
            **kwargs: ハイパーパラメータ
        """
        # デフォルトパラメータ
        default_params = {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 3,
            'min_samples_split': 2,
            'min_samples_leaf': 1,
            'subsample': 1.0,
            'random_state': 42
        }
        
        # ユーザー指定のパラメータでデフォルトを上書き
        default_params.update(kwargs)
        
        super().__init__("GradientBoosting", **default_params)
    
    def _create_model(self) -> GradientBoostingRegressor:
        """
        勾配ブースティングモデルの作成
        
        Returns:
            作成された勾配ブースティングモデル
        """
        return GradientBoostingRegressor(**self.hyperparameters)
    
    def optimize_hyperparameters(self, X, y, cv: int = 3) -> Dict[str, Any]:
        """
        ハイパーパラメータの最適化
        
        Args:
            X: 特徴量配列
            y: ターゲット値配列
            cv: 交差検証の分割数
            
        Returns:
            最適化されたパラメータ
        """
        try:
            logger.info(f"Optimizing hyperparameters for {self.name}")
            
            # グリッドサーチのパラメータ
            param_grid = {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7],
                'min_samples_split': [2, 5, 10],
                'subsample': [0.8, 0.9, 1.0]
            }
            
            # グリッドサーチ実行
            grid_search = GridSearchCV(
                GradientBoostingRegressor(random_state=42),
                param_grid,
                cv=cv,
                scoring='neg_mean_absolute_error',
                n_jobs=-1
            )
            
            grid_search.fit(X, y)
            
            # 最適パラメータの更新
            self.hyperparameters.update(grid_search.best_params_)
            
            logger.info(f"Best parameters found: {grid_search.best_params_}")
            logger.info(f"Best score: {-grid_search.best_score_:.4f}")
            
            return {
                'best_params': grid_search.best_params_,
                'best_score': -grid_search.best_score_,
                'cv_results': grid_search.cv_results_
            }
            
        except Exception as e:
            logger.error(f"Failed to optimize hyperparameters: {str(e)}")
            raise RuntimeError(f"ハイパーパラメータの最適化に失敗しました: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        特徴量重要度の取得
        
        Returns:
            特徴量重要度辞書
        """
        if not self.is_trained or self.model is None:
            return {}
        
        # 勾配ブースティングの特徴量重要度を取得
        importances = self.model.feature_importances_
        
        # 重要度の高い順にソート
        feature_names = [f'feature_{i}' for i in range(len(importances))]
        importance_dict = dict(zip(feature_names, importances))
        
        # 重要度順にソート
        sorted_importance = dict(sorted(
            importance_dict.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return sorted_importance
    
    def get_boosting_info(self) -> Dict[str, Any]:
        """
        ブースティング情報の取得
        
        Returns:
            ブースティング情報辞書
        """
        if not self.is_trained or self.model is None:
            return {}
        
        return {
            'n_estimators': self.model.n_estimators,
            'learning_rate': self.model.learning_rate,
            'max_depth': self.model.max_depth,
            'min_samples_split': self.model.min_samples_split,
            'min_samples_leaf': self.model.min_samples_leaf,
            'subsample': self.model.subsample
        }
    
    def get_training_loss(self) -> list:
        """
        学習損失の取得
        
        Returns:
            学習損失のリスト
        """
        if not self.is_trained or self.model is None:
            return []
        
        return self.model.train_score_.tolist()

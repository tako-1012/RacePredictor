"""
自動的にモデルを学習・評価するシステム

このモジュールには以下の機能が含まれます：
- 学習データの準備
- 訓練・検証・テストデータ分割
- 全モデルの学習実行
- モデル性能評価
- 最良モデルの保存
"""

import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

from .ensemble_predictor import EnsemblePredictor
from .predictors.random_forest_predictor import RandomForestPredictor
from .predictors.gradient_boosting_predictor import GradientBoostingPredictor
from .predictors.linear_regression_predictor import LinearRegressionPredictor
from .predictors.ridge_regression_predictor import RidgeRegressionPredictor

logger = logging.getLogger(__name__)


class TrainingPipeline:
    """モデル学習・評価パイプラインクラス"""
    
    def __init__(self):
        """初期化"""
        self.X_train = None
        self.X_val = None
        self.X_test = None
        self.y_train = None
        self.y_val = None
        self.y_test = None
        self.scaler = StandardScaler()
        self.models: Dict[str, Any] = {}
        self.results: Dict[str, Dict[str, Any]] = {}
        self.best_model = None
        self.best_score = float('inf')
        
        logger.info("Training pipeline initialized")
    
    def prepare_training_data(self, X: List[List[float]], y: List[float]) -> 'TrainingPipeline':
        """
        学習データの準備
        
        Args:
            X: 特徴量データ
            y: ターゲット値データ
            
        Returns:
            パイプライン
        """
        try:
            logger.info(f"Preparing training data: {len(X)} samples, {len(X[0]) if X else 0} features")
            
            # データのクリーニング
            X_clean, y_clean = self._clean_data(X, y)
            
            # numpy配列に変換
            X_array = np.array(X_clean)
            y_array = np.array(y_clean)
            
            # データの正規化
            X_scaled = self.scaler.fit_transform(X_array)
            
            logger.info(f"Data prepared: {X_scaled.shape[0]} samples, {X_scaled.shape[1]} features")
            
            return self
            
        except Exception as e:
            logger.error(f"Failed to prepare training data: {str(e)}")
            raise RuntimeError(f"学習データの準備に失敗しました: {str(e)}")
    
    def split_data(self, test_size: float = 0.2, val_size: float = 0.2, random_state: int = 42) -> 'TrainingPipeline':
        """
        訓練・検証・テストデータ分割
        
        Args:
            test_size: テストデータの割合
            val_size: 検証データの割合（訓練データから）
            random_state: 乱数シード
            
        Returns:
            パイプライン
        """
        try:
            # まずテストデータを分離
            X_temp, self.X_test, y_temp, self.y_test = train_test_split(
                self.X_train, self.y_train, 
                test_size=test_size, 
                random_state=random_state
            )
            
            # 残りを訓練・検証データに分割
            val_size_adjusted = val_size / (1 - test_size)
            self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
                X_temp, y_temp,
                test_size=val_size_adjusted,
                random_state=random_state
            )
            
            logger.info(f"Data split completed:")
            logger.info(f"  Training: {len(self.X_train)} samples")
            logger.info(f"  Validation: {len(self.X_val)} samples")
            logger.info(f"  Test: {len(self.X_test)} samples")
            
            return self
            
        except Exception as e:
            logger.error(f"Failed to split data: {str(e)}")
            raise RuntimeError(f"データ分割に失敗しました: {str(e)}")
    
    def train_models(self, optimize_hyperparams: bool = False) -> 'TrainingPipeline':
        """
        全モデルの学習実行
        
        Args:
            optimize_hyperparams: ハイパーパラメータ最適化の実行
            
        Returns:
            パイプライン
        """
        try:
            logger.info("Starting model training")
            
            # 個別モデルの学習
            individual_models = [
                RandomForestPredictor(n_estimators=100, max_depth=10),
                GradientBoostingPredictor(n_estimators=100, learning_rate=0.1),
                LinearRegressionPredictor(),
                RidgeRegressionPredictor(alpha=1.0)
            ]
            
            for model in individual_models:
                logger.info(f"Training {model.name}")
                
                # ハイパーパラメータ最適化
                if optimize_hyperparams and hasattr(model, 'optimize_hyperparameters'):
                    try:
                        model.optimize_hyperparameters(self.X_train, self.y_train)
                    except Exception as e:
                        logger.warning(f"Hyperparameter optimization failed for {model.name}: {str(e)}")
                
                # モデル学習
                model.fit(self.X_train, self.y_train)
                
                # 性能評価
                train_metrics = model.evaluate(self.X_train, self.y_train)
                val_metrics = model.evaluate(self.X_val, self.y_val)
                
                self.models[model.name] = {
                    'model': model,
                    'train_metrics': train_metrics,
                    'val_metrics': val_metrics
                }
                
                logger.info(f"{model.name} training completed. Val MAE: {val_metrics['mae']:.4f}")
            
            # アンサンブルモデルの学習
            logger.info("Training ensemble model")
            ensemble = EnsemblePredictor()
            ensemble.add_default_models()
            ensemble.fit(self.X_train, self.y_train)
            
            # アンサンブル性能評価
            ensemble_train_pred = ensemble.predict(self.X_train)
            ensemble_val_pred = ensemble.predict(self.X_val)
            
            ensemble_train_metrics = self._calculate_metrics(self.y_train, ensemble_train_pred)
            ensemble_val_metrics = self._calculate_metrics(self.y_val, ensemble_val_pred)
            
            self.models['EnsemblePredictor'] = {
                'model': ensemble,
                'train_metrics': ensemble_train_metrics,
                'val_metrics': ensemble_val_metrics
            }
            
            logger.info(f"Ensemble training completed. Val MAE: {ensemble_val_metrics['mae']:.4f}")
            
            return self
            
        except Exception as e:
            logger.error(f"Failed to train models: {str(e)}")
            raise RuntimeError(f"モデル学習に失敗しました: {str(e)}")
    
    def evaluate_models(self) -> Dict[str, Dict[str, Any]]:
        """
        モデル性能評価
        
        Returns:
            評価結果辞書
        """
        try:
            logger.info("Evaluating models on test data")
            
            for name, model_info in self.models.items():
                model = model_info['model']
                
                # テストデータでの評価
                test_pred = model.predict(self.X_test)
                test_metrics = self._calculate_metrics(self.y_test, test_pred)
                
                # 結果の保存
                self.results[name] = {
                    'train_metrics': model_info['train_metrics'],
                    'val_metrics': model_info['val_metrics'],
                    'test_metrics': test_metrics,
                    'model_info': model.get_model_info() if hasattr(model, 'get_model_info') else {}
                }
                
                logger.info(f"{name} test evaluation:")
                logger.info(f"  MAE: {test_metrics['mae']:.4f}")
                logger.info(f"  RMSE: {test_metrics['rmse']:.4f}")
                logger.info(f"  R²: {test_metrics['r2']:.4f}")
                logger.info(f"  MAPE: {test_metrics['mape']:.2f}%")
            
            return self.results
            
        except Exception as e:
            logger.error(f"Failed to evaluate models: {str(e)}")
            raise RuntimeError(f"モデル評価に失敗しました: {str(e)}")
    
    def save_best_model(self, metric: str = 'mae') -> Dict[str, Any]:
        """
        最良モデルの保存
        
        Args:
            metric: 評価指標名
            
        Returns:
            最良モデル情報
        """
        try:
            if not self.results:
                raise ValueError("No evaluation results available")
            
            # 最良モデルの選択
            best_name = min(self.results.keys(), 
                          key=lambda x: self.results[x]['test_metrics'][metric])
            
            self.best_model = self.models[best_name]['model']
            self.best_score = self.results[best_name]['test_metrics'][metric]
            
            best_model_info = {
                'name': best_name,
                'score': self.best_score,
                'metrics': self.results[best_name]['test_metrics'],
                'model': self.best_model
            }
            
            logger.info(f"Best model selected: {best_name} with {metric}={self.best_score:.4f}")
            
            return best_model_info
            
        except Exception as e:
            logger.error(f"Failed to save best model: {str(e)}")
            raise RuntimeError(f"最良モデルの保存に失敗しました: {str(e)}")
    
    def get_training_summary(self) -> Dict[str, Any]:
        """
        学習サマリーの取得
        
        Returns:
            学習サマリー辞書
        """
        try:
            summary = {
                'training_date': datetime.now().isoformat(),
                'data_info': {
                    'n_samples': len(self.X_train) if self.X_train is not None else 0,
                    'n_features': self.X_train.shape[1] if self.X_train is not None else 0,
                    'train_size': len(self.X_train) if self.X_train is not None else 0,
                    'val_size': len(self.X_val) if self.X_val is not None else 0,
                    'test_size': len(self.X_test) if self.X_test is not None else 0
                },
                'models_trained': list(self.models.keys()),
                'results': self.results,
                'best_model': {
                    'name': self.best_model.name if self.best_model else None,
                    'score': self.best_score
                }
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get training summary: {str(e)}")
            raise RuntimeError(f"学習サマリーの取得に失敗しました: {str(e)}")
    
    def _clean_data(self, X: List[List[float]], y: List[float]) -> Tuple[List[List[float]], List[float]]:
        """
        データのクリーニング
        
        Args:
            X: 特徴量データ
            y: ターゲット値データ
            
        Returns:
            クリーニングされたデータ
        """
        try:
            # 欠損値や異常値の処理
            X_clean = []
            y_clean = []
            
            for i, (features, target) in enumerate(zip(X, y)):
                # 特徴量の検証
                if (features and 
                    all(isinstance(f, (int, float)) and not np.isnan(f) and not np.isinf(f) for f in features) and
                    isinstance(target, (int, float)) and not np.isnan(target) and not np.isinf(target)):
                    
                    X_clean.append(features)
                    y_clean.append(target)
                else:
                    logger.warning(f"Skipping invalid data at index {i}")
            
            logger.info(f"Data cleaning completed: {len(X_clean)}/{len(X)} samples retained")
            return X_clean, y_clean
            
        except Exception as e:
            logger.error(f"Failed to clean data: {str(e)}")
            raise RuntimeError(f"データクリーニングに失敗しました: {str(e)}")
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        評価指標の計算
        
        Args:
            y_true: 真の値
            y_pred: 予測値
            
        Returns:
            評価指標辞書
        """
        try:
            metrics = {
                'mae': mean_absolute_error(y_true, y_pred),
                'mse': mean_squared_error(y_true, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
                'r2': r2_score(y_true, y_pred),
                'mape': self._calculate_mape(y_true, y_pred)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to calculate metrics: {str(e)}")
            return {'mae': float('inf'), 'mse': float('inf'), 'rmse': float('inf'), 'r2': -float('inf'), 'mape': float('inf')}
    
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

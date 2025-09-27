"""
シンプルなレースタイム予測システム

既存のAI機能を活用しつつ、収集したデータで機械学習モデルを学習
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import joblib
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import json

logger = logging.getLogger(__name__)

class SimpleRaceTimePredictor:
    """シンプルなレースタイム予測システム"""
    
    def __init__(self, data_dir: str = "ml_training_data"):
        """
        初期化
        
        Args:
            data_dir: 処理済みデータディレクトリ
        """
        self.data_dir = Path(data_dir)
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.model_performance = {}
        
        # 種目別の距離設定
        self.event_distances = {
            '800m': 0.8,
            '1500m': 1.5,
            '3000m': 3.0,
            '5000m': 5.0,
            '10000m': 10.0,
            '5kmroad': 5.0,
            '10kmroad': 10.0,
            'halfmarathon': 21.1,
            'marathon': 42.2
        }
        
        logger.info(f"SimpleRaceTimePredictor initialized with data_dir: {self.data_dir}")
    
    def load_processed_data(self) -> Dict[str, pd.DataFrame]:
        """
        処理済みデータを読み込み
        
        Returns:
            種目別のDataFrame辞書
        """
        data = {}
        
        for csv_file in self.data_dir.glob("*_processed.csv"):
            event_name = csv_file.stem.replace("_processed", "")
            logger.info(f"Loading processed data for {event_name}")
            
            try:
                df = pd.read_csv(csv_file)
                data[event_name] = df
                logger.info(f"Loaded {len(df)} records for {event_name}")
            except Exception as e:
                logger.error(f"Failed to load {csv_file}: {e}")
        
        return data
    
    def train_models(self) -> Dict[str, Dict[str, Any]]:
        """
        全種目のモデルを学習
        
        Returns:
            学習結果の辞書
        """
        logger.info("Starting model training for all events")
        
        # 処理済みデータを読み込み
        data = self.load_processed_data()
        
        results = {}
        
        for event_name, df in data.items():
            logger.info(f"Training model for {event_name}")
            
            try:
                # 特徴量とターゲットの分離
                if 'target_time_seconds' not in df.columns:
                    logger.warning(f"Target column not found in {event_name}, skipping")
                    continue
                
                # ターゲット列を除外
                feature_columns = [col for col in df.columns if col not in ['target_time_seconds', 'distance_km', 'target_pace', 'vdot']]
                X = df[feature_columns]
                y = df['target_time_seconds']
                
                # NaN値の処理
                X = X.fillna(X.median())
                y = y.fillna(y.median())
                
                # データが少なすぎる場合はスキップ
                if len(X) < 10:
                    logger.warning(f"Insufficient data for {event_name}: {len(X)} records")
                    continue
                
                # 訓練・テストデータの分割
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                
                # 特徴量の標準化
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                # 複数モデルの学習
                models = {
                    'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
                    'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
                    'linear_regression': LinearRegression(),
                    'ridge': Ridge(alpha=1.0)
                }
                
                trained_models = {}
                model_scores = {}
                
                for model_name, model in models.items():
                    try:
                        # モデル学習
                        if model_name in ['linear_regression', 'ridge']:
                            model.fit(X_train_scaled, y_train)
                            y_pred = model.predict(X_test_scaled)
                        else:
                            model.fit(X_train, y_train)
                            y_pred = model.predict(X_test)
                        
                        # 性能評価
                        mse = mean_squared_error(y_test, y_pred)
                        r2 = r2_score(y_test, y_pred)
                        
                        trained_models[model_name] = model
                        model_scores[model_name] = {
                            'mse': mse,
                            'r2': r2,
                            'rmse': np.sqrt(mse)
                        }
                        
                        logger.info(f"{event_name} - {model_name}: R² = {r2:.3f}, RMSE = {np.sqrt(mse):.3f}")
                        
                    except Exception as e:
                        logger.error(f"Failed to train {model_name} for {event_name}: {e}")
                
                # 最良のモデルを選択
                if model_scores:
                    best_model_name = max(model_scores.keys(), key=lambda k: model_scores[k]['r2'])
                    best_model = trained_models[best_model_name]
                    
                    # モデルとスケーラーを保存
                    self.models[event_name] = best_model
                    self.scalers[event_name] = scaler
                    self.model_performance[event_name] = model_scores[best_model_name]
                    
                    # 特徴量重要度の保存
                    if hasattr(best_model, 'feature_importances_'):
                        self.feature_importance[event_name] = dict(zip(feature_columns, best_model.feature_importances_))
                    
                    results[event_name] = {
                        'status': 'success',
                        'best_model': best_model_name,
                        'performance': model_scores[best_model_name],
                        'feature_count': len(feature_columns),
                        'sample_count': len(X)
                    }
                    
                    logger.info(f"Successfully trained {event_name} with {best_model_name}")
                else:
                    results[event_name] = {
                        'status': 'failed',
                        'error': 'No models could be trained'
                    }
                    
            except Exception as e:
                logger.error(f"Failed to train model for {event_name}: {e}")
                results[event_name] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        logger.info(f"Model training completed. Successfully trained {len(self.models)} models")
        return results
    
    def predict(self, event_name: str, features: Dict[str, float]) -> Dict[str, Any]:
        """
        種目別のタイム予測
        
        Args:
            event_name: 種目名
            features: 特徴量辞書
            
        Returns:
            予測結果
        """
        if event_name not in self.models:
            return {
                'error': f'Model not found for {event_name}',
                'available_events': list(self.models.keys())
            }
        
        try:
            model = self.models[event_name]
            scaler = self.scalers[event_name]
            
            # 特徴量を配列に変換（スケーラーの特徴量名の順序に合わせる）
            feature_array = np.array([features.get(col, 0.0) for col in scaler.feature_names_in_])
            feature_array = feature_array.reshape(1, -1)
            
            # 標準化
            feature_scaled = scaler.transform(feature_array)
            
            # 予測
            predicted_time = model.predict(feature_scaled)[0]
            
            # 信頼度の計算（簡易版）
            confidence = min(0.95, max(0.5, self.model_performance[event_name]['r2']))
            
            # 予測区間の計算
            distance = self.event_distances.get(event_name, 5.0)
            pace_per_km = predicted_time / distance
            interval_range = pace_per_km * 0.1  # ±10%
            
            return {
                'event': event_name,
                'predicted_time_seconds': predicted_time,
                'predicted_pace_per_km': pace_per_km,
                'confidence': confidence,
                'prediction_interval': {
                    'lower_bound': predicted_time - interval_range * distance,
                    'upper_bound': predicted_time + interval_range * distance
                },
                'model_performance': self.model_performance[event_name]
            }
            
        except Exception as e:
            logger.error(f"Prediction failed for {event_name}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'error': f'Prediction failed: {str(e)}'
            }
    
    def predict_all_events(self, features: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        """
        全種目の予測
        
        Args:
            features: 特徴量辞書
            
        Returns:
            全種目の予測結果
        """
        predictions = {}
        
        for event_name in self.models.keys():
            predictions[event_name] = self.predict(event_name, features)
        
        return predictions
    
    def save_models(self, output_dir: str = "trained_models"):
        """
        学習済みモデルを保存
        
        Args:
            output_dir: 出力ディレクトリ
        """
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        for event_name, model in self.models.items():
            model_path = output_path / f"{event_name}_model.joblib"
            scaler_path = output_path / f"{event_name}_scaler.joblib"
            
            joblib.dump(model, model_path)
            joblib.dump(self.scalers[event_name], scaler_path)
            
            logger.info(f"Saved model for {event_name}")
        
        # メタデータの保存
        metadata = {
            'model_performance': self.model_performance,
            'feature_importance': self.feature_importance,
            'event_distances': self.event_distances,
            'trained_at': datetime.now().isoformat()
        }
        
        metadata_path = output_path / "model_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Saved model metadata to {metadata_path}")
    
    def load_models(self, model_dir: str = "trained_models"):
        """
        学習済みモデルを読み込み
        
        Args:
            model_dir: モデルディレクトリ
        """
        model_path = Path(model_dir)
        
        # メタデータの読み込み
        metadata_path = model_path / "model_metadata.json"
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                self.model_performance = metadata.get('model_performance', {})
                self.feature_importance = metadata.get('feature_importance', {})
                logger.info(f"Loaded metadata for {len(self.model_performance)} models")
        
        # モデルとスケーラーの読み込み
        for model_file in model_path.glob("*_model.joblib"):
            event_name = model_file.stem.replace("_model", "")
            scaler_file = model_path / f"{event_name}_scaler.joblib"
            
            if scaler_file.exists():
                self.models[event_name] = joblib.load(model_file)
                self.scalers[event_name] = joblib.load(scaler_file)
                logger.info(f"Loaded model for {event_name}")
        
        logger.info(f"Loaded {len(self.models)} models")
    
    def get_model_summary(self) -> Dict[str, Any]:
        """
        モデルの要約情報を取得
        
        Returns:
            モデル要約
        """
        return {
            'trained_events': list(self.models.keys()),
            'model_performance': self.model_performance,
            'feature_importance': self.feature_importance,
            'total_models': len(self.models)
        }


def main():
    """メイン実行関数"""
    logging.basicConfig(level=logging.INFO)
    
    # 予測システムの初期化
    predictor = SimpleRaceTimePredictor()
    
    # モデル学習
    logger.info("Starting model training...")
    results = predictor.train_models()
    
    # 結果の表示
    logger.info("Training Results:")
    for event_name, result in results.items():
        if result['status'] == 'success':
            logger.info(f"{event_name}: {result['best_model']} - R² = {result['performance']['r2']:.3f}")
        else:
            logger.error(f"{event_name}: Failed - {result.get('error', 'Unknown error')}")
    
    # モデルの保存
    predictor.save_models()
    
    # テスト予測
    logger.info("Testing predictions...")
    test_features = {
        'age': 30.0,
        'gender': 1.0,
        'competition_level': 2.0,
        'vo2max': 50.0,
        'training_frequency': 3.0,
        'running_history': 2.0,
        'weekly_distance': 30.0,
        'monthly_distance': 120.0
    }
    
    predictions = predictor.predict_all_events(test_features)
    for event_name, prediction in predictions.items():
        if 'error' not in prediction:
            logger.info(f"{event_name}: {prediction['predicted_time_seconds']:.1f}s ({prediction['predicted_pace_per_km']:.1f}s/km)")


if __name__ == "__main__":
    main()

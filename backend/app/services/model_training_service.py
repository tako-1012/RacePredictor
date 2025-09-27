from typing import Dict, List, Optional, Tuple, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import joblib
import os
import logging
from app.models.workout import Workout, WorkoutType
from app.models.race import RaceResult
from app.models.user_profile import UserProfile
from app.schemas.prediction import TargetEventEnum

logger = logging.getLogger(__name__)


class ModelTrainingService:
    """機械学習モデルの学習と管理サービス"""

    def __init__(self, db: Session):
        self.db = db
        self.model_cache_dir = "models"
        self.scaler_cache_dir = "scalers"
        os.makedirs(self.model_cache_dir, exist_ok=True)
        os.makedirs(self.scaler_cache_dir, exist_ok=True)

    def train_models_for_event(self, target_event: TargetEventEnum) -> Dict[str, Any]:
        """特定の種目に対するモデルを学習"""
        try:
            # 1. 学習データの準備
            X, y = self._prepare_training_data(target_event)
            
            if len(X) < 50:  # 最小データ数チェック
                return {
                    'success': False,
                    'message': f'学習データが不足しています（{len(X)}件）',
                    'min_required': 50
                }
            
            # 2. データの分割
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # 3. 特徴量のスケーリング
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # 4. 複数モデルの学習
            models = self._train_multiple_models(X_train_scaled, y_train)
            
            # 5. モデルの評価
            model_scores = self._evaluate_models(models, X_test_scaled, y_test)
            
            # 6. 最良モデルの選択と保存
            best_model_name = max(model_scores.keys(), key=lambda k: model_scores[k]['r2_score'])
            best_model = models[best_model_name]
            
            # モデルとスケーラーの保存
            model_path = os.path.join(self.model_cache_dir, f"{target_event.value}_model.joblib")
            scaler_path = os.path.join(self.scaler_cache_dir, f"{target_event.value}_scaler.joblib")
            
            joblib.dump(best_model, model_path)
            joblib.dump(scaler, scaler_path)
            
            # 7. 特徴量重要度の計算
            feature_importance = self._get_feature_importance(best_model, X.columns)
            
            return {
                'success': True,
                'target_event': target_event.value,
                'training_samples': len(X),
                'test_samples': len(X_test),
                'best_model': best_model_name,
                'model_scores': model_scores,
                'feature_importance': feature_importance,
                'model_path': model_path,
                'scaler_path': scaler_path
            }
            
        except Exception as e:
            logger.error(f"Model training failed for {target_event.value}: {str(e)}")
            return {
                'success': False,
                'message': f'学習中にエラーが発生しました: {str(e)}',
                'error': str(e)
            }

    def _prepare_training_data(self, target_event: TargetEventEnum) -> Tuple[pd.DataFrame, pd.Series]:
        """学習データの準備"""
        # 過去1年のデータを取得
        start_date = date.today() - timedelta(days=365)
        
        # 該当種目のレース結果を取得
        races = (
            self.db.query(RaceResult)
            .filter(
                RaceResult.race_date >= start_date,
                RaceResult.distance_meters.isnot(None),
                RaceResult.time_seconds.isnot(None)
            )
            .all()
        )
        
        # 種目距離マッピング
        event_distances = {
            TargetEventEnum.event_800m: 800,
            TargetEventEnum.event_1500m: 1500,
            TargetEventEnum.event_3000m: 3000,
            TargetEventEnum.event_5000m: 5000,
            TargetEventEnum.event_10000m: 10000,
            TargetEventEnum.event_5km: 5000,
            TargetEventEnum.event_10km: 10000,
            TargetEventEnum.event_half: 21097.5,
            TargetEventEnum.event_full: 42195,
        }
        
        target_distance = event_distances[target_event]
        
        # 該当距離のレースをフィルタリング（±10%の範囲）
        tolerance = 0.1
        filtered_races = [
            race for race in races
            if abs(race.distance_meters - target_distance) / target_distance <= tolerance
        ]
        
        training_data = []
        
        for race in filtered_races:
            # 各レースの前12週間の練習データを取得
            race_date = race.race_date
            training_start = race_date - timedelta(days=84)
            
            workouts = (
                self.db.query(Workout)
                .join(WorkoutType)
                .filter(
                    Workout.user_id == race.user_id,
                    Workout.date >= training_start,
                    Workout.date < race_date
                )
                .order_by(Workout.date.desc())
                .all()
            )
            
            if len(workouts) < 5:  # 最小練習数チェック
                continue
            
            # 特徴量抽出
            features = self._extract_training_features(workouts, race.user_id)
            if features:
                features['target_time'] = race.time_seconds
                training_data.append(features)
        
        if not training_data:
            return pd.DataFrame(), pd.Series()
        
        # DataFrameに変換
        df = pd.DataFrame(training_data)
        X = df.drop('target_time', axis=1)
        y = df['target_time']
        
        return X, y

    def _extract_training_features(self, workouts: List[Workout], user_id: str) -> Optional[Dict[str, float]]:
        """学習用特徴量の抽出"""
        try:
            features = {}
            
            # 基本統計特徴量
            distances = [w.distance_meters for w in workouts if w.distance_meters]
            durations = [w.duration_seconds for w in workouts if w.duration_seconds]
            intensities = [w.intensity for w in workouts if w.intensity]
            
            if not distances or not durations:
                return None
            
            # ペース計算
            paces = []
            for w in workouts:
                if w.distance_meters and w.duration_seconds:
                    pace = (w.duration_seconds / w.distance_meters) * 1000
                    paces.append(pace)
            
            features.update({
                'total_workouts': len(workouts),
                'avg_distance': np.mean(distances),
                'avg_duration': np.mean(durations),
                'avg_pace': np.mean(paces) if paces else 0,
                'total_distance': sum(distances),
                'avg_intensity': np.mean(intensities) if intensities else 0,
                'pace_std': np.std(paces) if paces else 0,
                'distance_std': np.std(distances),
                'max_distance': max(distances),
                'min_distance': min(distances)
            })
            
            # 強度分布
            if intensities:
                easy_count = sum(1 for i in intensities if i <= 3)
                tempo_count = sum(1 for i in intensities if 4 <= i <= 6)
                interval_count = sum(1 for i in intensities if 7 <= i <= 8)
                race_count = sum(1 for i in intensities if i >= 9)
                total = len(intensities)
                
                features.update({
                    'easy_ratio': easy_count / total,
                    'tempo_ratio': tempo_count / total,
                    'interval_ratio': interval_count / total,
                    'race_ratio': race_count / total
                })
            
            # トレンド特徴量
            if len(workouts) >= 4:
                workout_data = []
                for w in workouts:
                    if w.distance_meters and w.duration_seconds:
                        pace = (w.duration_seconds / w.distance_meters) * 1000
                        workout_data.append({
                            'date': w.date,
                            'pace': pace,
                            'distance': w.distance_meters,
                            'intensity': w.intensity or 0
                        })
                
                if len(workout_data) >= 4:
                    workout_data.sort(key=lambda x: x['date'])
                    
                    dates = np.array([(d['date'] - workout_data[0]['date']).days for d in workout_data])
                    paces = np.array([d['pace'] for d in workout_data])
                    distances = np.array([d['distance'] for d in workout_data])
                    intensities = np.array([d['intensity'] for d in workout_data])
                    
                    features.update({
                        'pace_trend': np.polyfit(dates, paces, 1)[0] if len(dates) > 1 else 0,
                        'distance_trend': np.polyfit(dates, distances, 1)[0] if len(dates) > 1 else 0,
                        'intensity_trend': np.polyfit(dates, intensities, 1)[0] if len(dates) > 1 else 0
                    })
            
            # ユーザープロフィール特徴量
            profile = (
                self.db.query(UserProfile)
                .filter(UserProfile.user_id == user_id)
                .first()
            )
            
            if profile:
                features.update({
                    'age': profile.age or 30,
                    'bmi': profile.bmi or 22,
                    'height': profile.height_cm or 170,
                    'weight': profile.weight_kg or 65,
                    'resting_hr': profile.resting_hr or 60,
                    'max_hr': profile.max_hr or 190
                })
            else:
                features.update({
                    'age': 30,
                    'bmi': 22,
                    'height': 170,
                    'weight': 65,
                    'resting_hr': 60,
                    'max_hr': 190
                })
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {str(e)}")
            return None

    def _train_multiple_models(self, X_train: np.ndarray, y_train: np.ndarray) -> Dict[str, Any]:
        """複数モデルの学習"""
        models = {}
        
        # Random Forest
        models['random_forest'] = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        # Gradient Boosting
        models['gradient_boosting'] = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        # Linear Regression
        models['linear_regression'] = LinearRegression()
        
        # Ridge Regression
        models['ridge_regression'] = Ridge(alpha=1.0)
        
        # 各モデルを学習
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
            except Exception as e:
                logger.error(f"Failed to train {name}: {str(e)}")
                del models[name]
        
        return models

    def _evaluate_models(self, models: Dict[str, Any], X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Dict[str, float]]:
        """モデルの評価"""
        scores = {}
        
        for name, model in models.items():
            try:
                y_pred = model.predict(X_test)
                
                mae = mean_absolute_error(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                scores[name] = {
                    'mae': mae,
                    'mse': mse,
                    'rmse': np.sqrt(mse),
                    'r2_score': r2
                }
            except Exception as e:
                logger.error(f"Failed to evaluate {name}: {str(e)}")
                scores[name] = {'error': str(e)}
        
        return scores

    def _get_feature_importance(self, model: Any, feature_names: List[str]) -> Dict[str, float]:
        """特徴量重要度の取得"""
        try:
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
            elif hasattr(model, 'coef_'):
                importances = np.abs(model.coef_)
            else:
                return {}
            
            # 重要度を正規化
            importances = importances / np.sum(importances)
            
            feature_importance = dict(zip(feature_names, importances))
            
            # 重要度順にソート
            sorted_importance = dict(sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            ))
            
            return sorted_importance
            
        except Exception as e:
            logger.error(f"Failed to get feature importance: {str(e)}")
            return {}

    def load_trained_model(self, target_event: TargetEventEnum) -> Tuple[Optional[Any], Optional[Any]]:
        """学習済みモデルの読み込み"""
        try:
            model_path = os.path.join(self.model_cache_dir, f"{target_event.value}_model.joblib")
            scaler_path = os.path.join(self.scaler_cache_dir, f"{target_event.value}_scaler.joblib")
            
            if not os.path.exists(model_path) or not os.path.exists(scaler_path):
                return None, None
            
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            
            return model, scaler
            
        except Exception as e:
            logger.error(f"Failed to load model for {target_event.value}: {str(e)}")
            return None, None

    def predict_with_trained_model(self, features: Dict[str, float], target_event: TargetEventEnum) -> Tuple[Optional[float], float]:
        """学習済みモデルによる予測"""
        try:
            model, scaler = self.load_trained_model(target_event)
            
            if model is None or scaler is None:
                return None, 0.0
            
            # 特徴量を配列に変換
            feature_names = sorted(features.keys())
            feature_values = np.array([features.get(name, 0) for name in feature_names]).reshape(1, -1)
            
            # スケーリング
            feature_values_scaled = scaler.transform(feature_values)
            
            # 予測
            prediction = model.predict(feature_values_scaled)[0]
            
            # 信頼度（簡易版）
            confidence = 0.8  # 学習済みモデルなので高め
            
            return prediction, confidence
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return None, 0.0

    def get_model_performance(self, target_event: TargetEventEnum) -> Dict[str, Any]:
        """モデルの性能情報を取得"""
        try:
            model_path = os.path.join(self.model_cache_dir, f"{target_event.value}_model.joblib")
            
            if not os.path.exists(model_path):
                return {
                    'exists': False,
                    'message': 'モデルが存在しません'
                }
            
            # ファイルの更新日時
            model_mtime = os.path.getmtime(model_path)
            model_date = datetime.fromtimestamp(model_mtime)
            
            # ファイルサイズ
            model_size = os.path.getsize(model_path)
            
            return {
                'exists': True,
                'target_event': target_event.value,
                'last_trained': model_date.isoformat(),
                'model_size_bytes': model_size,
                'model_size_mb': round(model_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get model performance: {str(e)}")
            return {
                'exists': False,
                'error': str(e)
            }

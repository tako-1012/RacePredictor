"""
レースタイム予測システム

既存のAI予測エンジン（Random Forest、Gradient Boosting等）を使用し、
収集したデータポイント（deepresearchresult）で種目別予測モデルを構築

実装内容:
1. 特徴量エンジニアリング
2. 種目別モデル学習
3. アンサンブル予測
4. 既存AI機能との統合
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import joblib
from datetime import datetime
from sqlalchemy.orm import Session

# 既存のAI機能をインポート
from app.ml.ensemble_predictor import EnsemblePredictor
from app.ml.feature_store import FeatureStore
from app.services.ml_model_manager import MLModelManager
from app.models.ai import AIModel, PredictionResult, FeatureStore as FeatureStoreModel
from app.core.exceptions import DatabaseError, ValidationError, NotFoundError

logger = logging.getLogger(__name__)

class RaceTimePredictor:
    """レースタイム予測システム"""
    
    def __init__(self, db: Session = None):
        """
        初期化
        
        Args:
            db: データベースセッション
        """
        self.db = db
        self.model_manager = MLModelManager(db) if db else None
        self.feature_store = FeatureStore(db) if db else None
        
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
        
        # 種目別のモデル
        self.models: Dict[str, EnsemblePredictor] = {}
        self.is_trained = False
        
        logger.info("RaceTimePredictor initialized")
    
    def load_training_data(self, data_dir: str = "ml_training_data") -> Dict[str, pd.DataFrame]:
        """
        処理済みトレーニングデータを読み込み
        
        Args:
            data_dir: データディレクトリ
            
        Returns:
            種目別のDataFrame辞書
        """
        data_path = Path(data_dir)
        training_data = {}
        
        for csv_file in data_path.glob("*_processed.csv"):
            event_name = csv_file.stem.replace("_processed", "")
            logger.info(f"Loading training data for {event_name}")
            
            try:
                df = pd.read_csv(csv_file)
                training_data[event_name] = df
                logger.info(f"Loaded {len(df)} records for {event_name}")
            except Exception as e:
                logger.error(f"Failed to load {csv_file}: {e}")
        
        return training_data
    
    def train_models(self, training_data: Dict[str, pd.DataFrame]) -> Dict[str, Dict[str, Any]]:
        """
        収集したCSVデータでモデル学習
        
        Args:
            training_data: 種目別のトレーニングデータ
            
        Returns:
            学習結果辞書
        """
        logger.info("Starting model training for all events")
        training_results = {}
        
        for event_name, df in training_data.items():
            logger.info(f"Training model for {event_name}")
            
            try:
                # 特徴量とターゲットを分離
                target_col = 'target_time_seconds'
                if target_col not in df.columns:
                    logger.warning(f"Target column {target_col} not found in {event_name}")
                    continue
                
                X = df.drop(columns=[target_col])
                y = df[target_col]
                
                # アンサンブル予測器を初期化
                ensemble = EnsemblePredictor(name=f"{event_name}_predictor")
                ensemble.add_default_models()
                
                # モデル学習
                ensemble.fit(X.values, y.values)
                
                # モデルを保存
                self.models[event_name] = ensemble
                
                # 学習結果を記録
                training_results[event_name] = {
                    'model_name': ensemble.name,
                    'training_samples': len(X),
                    'feature_count': len(X.columns),
                    'ensemble_score': ensemble.ensemble_score_,
                    'model_weights': ensemble.get_model_weights(),
                    'feature_names': list(X.columns)
                }
                
                # データベースにモデル情報を保存
                if self.model_manager:
                    self._save_model_to_db(event_name, ensemble, training_results[event_name])
                
                logger.info(f"Completed training for {event_name}: MAE={ensemble.ensemble_score_:.4f}")
                
            except Exception as e:
                logger.error(f"Failed to train model for {event_name}: {e}")
                training_results[event_name] = {'error': str(e)}
        
        self.is_trained = True
        logger.info("Model training completed for all events")
        return training_results
    
    def _save_model_to_db(self, event_name: str, ensemble: EnsemblePredictor, training_info: Dict[str, Any]):
        """
        モデル情報をデータベースに保存
        
        Args:
            event_name: 種目名
            ensemble: 学習済みアンサンブルモデル
            training_info: 学習情報
        """
        try:
            # モデルファイルのパス
            model_path = f"ml_models/{event_name}_model.joblib"
            
            # AIModelレコードを作成
            ai_model = AIModel(
                name=f"{event_name}_race_predictor",
                version="1.0",
                algorithm="ensemble",
                performance_metrics={
                    'mae': ensemble.ensemble_score_,
                    'training_samples': training_info['training_samples'],
                    'feature_count': training_info['feature_count']
                },
                is_active=True,
                model_path=model_path,
                training_data_count=training_info['training_samples'],
                feature_count=training_info['feature_count'],
                hyperparameters=training_info['model_weights'],
                description=f"Race time predictor for {event_name} using ensemble learning"
            )
            
            self.db.add(ai_model)
            self.db.commit()
            
            # モデルファイルを保存
            self._save_model_file(ensemble, model_path)
            
            logger.info(f"Saved model for {event_name} to database")
            
        except Exception as e:
            logger.error(f"Failed to save model for {event_name} to database: {e}")
            self.db.rollback()
    
    def _save_model_file(self, ensemble: EnsemblePredictor, model_path: str):
        """
        モデルファイルを保存
        
        Args:
            ensemble: アンサンブルモデル
            model_path: 保存パス
        """
        try:
            # ml_modelsディレクトリを作成
            model_dir = Path("ml_models")
            model_dir.mkdir(exist_ok=True)
            
            # モデルを保存
            full_path = model_dir / Path(model_path).name
            joblib.dump(ensemble, full_path)
            
            logger.info(f"Saved model file to {full_path}")
            
        except Exception as e:
            logger.error(f"Failed to save model file: {e}")
    
    def predict(self, user_input: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        ユーザー入力から各種目のタイム予測
        
        Args:
            user_input: ユーザー入力データ
            
        Returns:
            種目別の予測結果
        """
        if not self.is_trained:
            raise RuntimeError("Models are not trained yet")
        
        logger.info("Starting race time predictions")
        predictions = {}
        
        # ユーザー特徴量を抽出
        user_features = self.extract_user_features(user_input)
        
        for event_name, model in self.models.items():
            try:
                # 特徴量をモデル用に変換
                model_features = self._prepare_features_for_model(user_features, model)
                
                # 予測実行
                pred_time, confidence = model.predict_single(model_features)
                
                # 信頼度区間を計算
                prediction_interval = self._calculate_prediction_interval(pred_time, confidence)
                
                predictions[event_name] = {
                    'predicted_time': pred_time,
                    'predicted_time_formatted': self._format_time(pred_time),
                    'confidence': confidence,
                    'prediction_interval': prediction_interval,
                    'distance': self.event_distances[event_name],
                    'predicted_pace': pred_time / self.event_distances[event_name]
                }
                
                logger.info(f"Predicted {event_name}: {self._format_time(pred_time)} (confidence: {confidence:.3f})")
                
            except Exception as e:
                logger.error(f"Failed to predict for {event_name}: {e}")
                predictions[event_name] = {'error': str(e)}
        
        return predictions
    
    def extract_user_features(self, user_input: Dict[str, Any]) -> Dict[str, float]:
        """
        ユーザー入力から特徴量を抽出
        
        Args:
            user_input: ユーザー入力データ
            
        Returns:
            特徴量辞書
        """
        features = {}
        
        # 基本情報
        features['age'] = user_input.get('age', 30)
        features['gender'] = 1 if user_input.get('gender') == 'Male' else 0
        
        # 競技レベル
        level_mapping = {
            'International Elite': 5,
            'National Elite': 4,
            'Elite': 4,
            'Collegiate/Club': 3,
            'Competitive Amateur': 2,
            'Recreational': 1
        }
        features['competition_level'] = level_mapping.get(user_input.get('competition_level', 'Recreational'), 1)
        
        # 身体データ
        features['vo2max'] = user_input.get('vo2max', 50)
        features['resting_hr'] = user_input.get('resting_hr', 60)
        
        # トレーニングデータ
        features['training_frequency'] = user_input.get('training_frequency', 3)
        features['running_history'] = user_input.get('running_history', 2)
        features['strength_frequency'] = user_input.get('strength_frequency', 1)
        
        # 練習量
        features['weekly_distance'] = user_input.get('weekly_distance', 30)
        features['monthly_distance'] = user_input.get('monthly_distance', 120)
        
        # 練習強度
        features['tempo_pace'] = user_input.get('tempo_pace', 240)
        features['long_run_pace'] = user_input.get('long_run_pace', 300)
        
        # インターバル練習
        features['interval_400m_time'] = user_input.get('interval_400m_time', 80)
        features['interval_800m_time'] = user_input.get('interval_800m_time', 150)
        
        # 計算特徴量
        features = self._calculate_user_derived_features(features, user_input)
        
        return features
    
    def _calculate_user_derived_features(self, features: Dict[str, float], user_input: Dict[str, Any]) -> Dict[str, float]:
        """ユーザーの計算特徴量を生成"""
        
        # 目標タイムからペースを計算（参考用）
        if 'target_time' in user_input and 'target_distance' in user_input:
            target_pace = user_input['target_time'] / user_input['target_distance']
            features['target_pace'] = target_pace
        
        # 練習強度比の計算
        if 'target_pace' in features:
            if 'tempo_pace' in features:
                features['tempo_ratio'] = features['tempo_pace'] / features['target_pace']
            if 'long_run_pace' in features:
                features['long_run_ratio'] = features['long_run_pace'] / features['target_pace']
            if 'interval_400m_time' in features:
                interval_pace = features['interval_400m_time'] / 0.4
                features['interval_400m_ratio'] = interval_pace / features['target_pace']
        
        # 練習量指標
        features['weekly_distance_density'] = features['weekly_distance']
        features['monthly_distance_density'] = features['monthly_distance']
        features['frequency_distance_product'] = (
            features['training_frequency'] * features['weekly_distance']
        )
        
        # 交互作用項
        features['age_gender_interaction'] = features['age'] * features['gender']
        features['age_experience_interaction'] = features['age'] * features['running_history']
        features['vo2max_age_interaction'] = features['vo2max'] * features['age']
        features['level_experience_interaction'] = (
            features['competition_level'] * features['running_history']
        )
        
        return features
    
    def _prepare_features_for_model(self, user_features: Dict[str, float], model: EnsemblePredictor) -> List[float]:
        """
        ユーザー特徴量をモデル用に準備
        
        Args:
            user_features: ユーザー特徴量
            model: 予測モデル
            
        Returns:
            モデル用特徴量リスト
        """
        # モデルの特徴量名を取得
        model_features = model.feature_names
        
        # 特徴量を順序通りに配置
        feature_vector = []
        for feature_name in model_features:
            if feature_name in user_features:
                feature_vector.append(user_features[feature_name])
            else:
                # 欠損特徴量はデフォルト値で補完
                default_value = self._get_default_feature_value(feature_name)
                feature_vector.append(default_value)
                logger.warning(f"Missing feature {feature_name}, using default value {default_value}")
        
        return feature_vector
    
    def _get_default_feature_value(self, feature_name: str) -> float:
        """特徴量のデフォルト値を取得"""
        defaults = {
            'age': 30,
            'gender': 0.5,
            'competition_level': 2,
            'vo2max': 50,
            'resting_hr': 60,
            'training_frequency': 3,
            'running_history': 2,
            'strength_frequency': 1,
            'weekly_distance': 30,
            'monthly_distance': 120,
            'tempo_pace': 240,
            'long_run_pace': 300,
            'interval_400m_time': 80,
            'interval_800m_time': 150
        }
        return defaults.get(feature_name, 0.0)
    
    def _calculate_prediction_interval(self, predicted_time: float, confidence: float) -> Tuple[float, float]:
        """
        予測区間を計算
        
        Args:
            predicted_time: 予測タイム
            confidence: 信頼度
            
        Returns:
            (下限, 上限)のタプル
        """
        # 信頼度に基づく区間幅の計算
        interval_width = predicted_time * (1 - confidence) * 0.1
        
        lower_bound = max(0, predicted_time - interval_width)
        upper_bound = predicted_time + interval_width
        
        return lower_bound, upper_bound
    
    def _format_time(self, seconds: float) -> str:
        """秒を時間形式に変換"""
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        
        if minutes >= 60:
            hours = minutes // 60
            minutes = minutes % 60
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"
    
    def get_model_performance(self) -> Dict[str, Dict[str, Any]]:
        """
        モデル性能情報を取得
        
        Returns:
            モデル性能情報辞書
        """
        performance = {}
        
        for event_name, model in self.models.items():
            performance[event_name] = {
                'model_name': model.name,
                'is_trained': model.is_trained,
                'ensemble_score': model.ensemble_score_,
                'model_count': len(model.models),
                'model_weights': model.get_model_weights(),
                'feature_count': len(model.feature_names)
            }
        
        return performance
    
    def save_predictions_to_db(self, user_id: str, predictions: Dict[str, Dict[str, Any]]) -> List[str]:
        """
        予測結果をデータベースに保存
        
        Args:
            user_id: ユーザーID
            predictions: 予測結果
            
        Returns:
            保存された予測IDのリスト
        """
        if not self.db:
            logger.warning("Database session not available, skipping save")
            return []
        
        saved_ids = []
        
        try:
            for event_name, pred_data in predictions.items():
                if 'error' in pred_data:
                    continue
                
                # アクティブなモデルを取得
                active_model = self.db.query(AIModel).filter(
                    AIModel.name == f"{event_name}_race_predictor",
                    AIModel.is_active == True
                ).first()
                
                if not active_model:
                    logger.warning(f"No active model found for {event_name}")
                    continue
                
                # 予測結果を保存
                prediction_result = PredictionResult(
                    user_id=user_id,
                    model_id=active_model.id,
                    race_type=event_name,
                    distance=self.event_distances[event_name],
                    predicted_time=pred_data['predicted_time'],
                    confidence=pred_data['confidence'],
                    features_used=pred_data.get('features_used', {})
                )
                
                self.db.add(prediction_result)
                saved_ids.append(prediction_result.id)
            
            self.db.commit()
            logger.info(f"Saved {len(saved_ids)} predictions to database")
            
        except Exception as e:
            logger.error(f"Failed to save predictions to database: {e}")
            self.db.rollback()
        
        return saved_ids
    
    def load_trained_models(self, model_dir: str = "ml_models") -> bool:
        """
        学習済みモデルを読み込み
        
        Args:
            model_dir: モデルディレクトリ
            
        Returns:
            読み込み成功フラグ
        """
        model_path = Path(model_dir)
        
        if not model_path.exists():
            logger.warning(f"Model directory {model_dir} does not exist")
            return False
        
        loaded_count = 0
        
        for model_file in model_path.glob("*_model.joblib"):
            event_name = model_file.stem.replace("_model", "")
            
            try:
                ensemble = joblib.load(model_file)
                self.models[event_name] = ensemble
                loaded_count += 1
                logger.info(f"Loaded model for {event_name}")
            except Exception as e:
                logger.error(f"Failed to load model {model_file}: {e}")
        
        if loaded_count > 0:
            self.is_trained = True
            logger.info(f"Loaded {loaded_count} trained models")
            return True
        
        return False
    
    def _generate_analysis(self, user_features: Dict[str, float], predictions: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        予測結果の分析情報を生成
        
        Args:
            user_features: ユーザー特徴量
            predictions: 予測結果
            
        Returns:
            分析情報辞書
        """
        analysis = {
            'user_profile': {
                'age': user_features.get('age', 30),
                'gender': 'Male' if user_features.get('gender', 0) == 1 else 'Female',
                'competition_level': self._get_competition_level_name(user_features.get('competition_level', 1)),
                'vo2max': user_features.get('vo2max', 50),
                'training_frequency': user_features.get('training_frequency', 3),
                'running_history': user_features.get('running_history', 2)
            },
            'strengths': [],
            'weaknesses': [],
            'recommendations': [],
            'prediction_summary': {}
        }
        
        # 予測結果のサマリー
        valid_predictions = {k: v for k, v in predictions.items() if 'error' not in v}
        
        if valid_predictions:
            # 最短・最長予測タイム
            times = [pred['predicted_time'] for pred in valid_predictions.values()]
            analysis['prediction_summary'] = {
                'fastest_event': min(valid_predictions.keys(), key=lambda k: valid_predictions[k]['predicted_time']),
                'slowest_event': max(valid_predictions.keys(), key=lambda k: valid_predictions[k]['predicted_time']),
                'average_confidence': np.mean([pred['confidence'] for pred in valid_predictions.values()]),
                'total_events_predicted': len(valid_predictions)
            }
            
            # 強み・弱みの分析
            analysis['strengths'] = self._analyze_strengths(user_features, valid_predictions)
            analysis['weaknesses'] = self._analyze_weaknesses(user_features, valid_predictions)
            analysis['recommendations'] = self._generate_recommendations(user_features, valid_predictions)
        
        return analysis
    
    def _get_competition_level_name(self, level: int) -> str:
        """競技レベルの数値を文字列に変換"""
        level_names = {
            1: 'Recreational',
            2: 'Competitive Amateur',
            3: 'Collegiate/Club',
            4: 'National Elite',
            5: 'International Elite'
        }
        return level_names.get(level, 'Recreational')
    
    def _analyze_strengths(self, user_features: Dict[str, float], predictions: Dict[str, Dict[str, Any]]) -> List[str]:
        """強みの分析"""
        strengths = []
        
        # VO2maxが高い場合
        if user_features.get('vo2max', 50) > 60:
            strengths.append("高いVO2max（有酸素能力）")
        
        # トレーニング頻度が高い場合
        if user_features.get('training_frequency', 3) >= 5:
            strengths.append("高いトレーニング頻度")
        
        # 経験年数が長い場合
        if user_features.get('running_history', 2) >= 5:
            strengths.append("豊富なランニング経験")
        
        # 筋力トレーニングをしている場合
        if user_features.get('strength_frequency', 1) >= 2:
            strengths.append("定期的な筋力トレーニング")
        
        return strengths
    
    def _analyze_weaknesses(self, user_features: Dict[str, float], predictions: Dict[str, Dict[str, Any]]) -> List[str]:
        """弱みの分析"""
        weaknesses = []
        
        # VO2maxが低い場合
        if user_features.get('vo2max', 50) < 45:
            weaknesses.append("VO2maxの向上が必要")
        
        # トレーニング頻度が低い場合
        if user_features.get('training_frequency', 3) < 3:
            weaknesses.append("トレーニング頻度の向上")
        
        # 経験年数が短い場合
        if user_features.get('running_history', 2) < 2:
            weaknesses.append("ランニング経験の蓄積")
        
        # 筋力トレーニングをしていない場合
        if user_features.get('strength_frequency', 1) == 0:
            weaknesses.append("筋力トレーニングの導入")
        
        return weaknesses
    
    def _generate_recommendations(self, user_features: Dict[str, float], predictions: Dict[str, Dict[str, Any]]) -> List[str]:
        """推奨事項の生成"""
        recommendations = []
        
        # トレーニング頻度の推奨
        if user_features.get('training_frequency', 3) < 4:
            recommendations.append("週4回以上のトレーニングを推奨")
        
        # インターバル練習の推奨
        if user_features.get('interval_400m_time', 0) == 0:
            recommendations.append("400mインターバル練習の導入を推奨")
        
        # ロング走の推奨
        if user_features.get('long_run_distance', 0) < 15:
            recommendations.append("ロング走距離の延長を推奨")
        
        # 筋力トレーニングの推奨
        if user_features.get('strength_frequency', 1) < 2:
            recommendations.append("週2回の筋力トレーニングを推奨")
        
        return recommendations


def main():
    """メイン実行関数"""
    logger.info("Starting race time predictor training")
    
    # 予測器を初期化
    predictor = RaceTimePredictor()
    
    # トレーニングデータを読み込み
    training_data = predictor.load_training_data()
    
    if not training_data:
        logger.error("No training data found")
        return
    
    # モデル学習
    training_results = predictor.train_models(training_data)
    
    # 結果を表示
    logger.info("Training Results:")
    for event_name, result in training_results.items():
        if 'error' in result:
            logger.error(f"{event_name}: {result['error']}")
        else:
            logger.info(f"{event_name}: MAE={result['ensemble_score']:.4f}, Samples={result['training_samples']}")
    
    logger.info("Race time predictor training completed")


if __name__ == "__main__":
    main()

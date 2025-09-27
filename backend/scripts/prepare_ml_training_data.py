"""
機械学習用トレーニングデータの準備スクリプト

このスクリプトは収集したCSVデータから機械学習用の特徴量を抽出し、
既存のFeatureStoreスキーマに適合する形式に変換します。

特徴量エンジニアリング:
- 練習強度比（インターバルペース/レースペース）
- 練習量指標（週間距離/体重、月間距離密度）
- 年齢・性別・経験年数の交互作用項
- VO2max推定値との相関特徴量
"""

import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, List, Tuple, Any
from pathlib import Path
import json
from datetime import datetime

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLTrainingDataPreparer:
    """機械学習用トレーニングデータ準備クラス"""
    
    def __init__(self, data_dir: str = "deepresearchresult"):
        """
        初期化
        
        Args:
            data_dir: CSVデータが格納されているディレクトリ
        """
        self.data_dir = Path(data_dir)
        self.processed_data = {}
        self.feature_mappings = {}
        
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
        
        logger.info(f"MLTrainingDataPreparer initialized with data_dir: {self.data_dir}")
    
    def load_all_data(self) -> Dict[str, pd.DataFrame]:
        """
        全種目のCSVデータを読み込み
        
        Returns:
            種目別のDataFrame辞書
        """
        data = {}
        
        # プロジェクトルートから相対パスでデータディレクトリを指定
        data_path = Path("../deepresearchresult")
        
        if not data_path.exists():
            logger.error(f"Data directory {data_path} does not exist")
            return data
        
        for csv_file in data_path.glob("*.csv"):
            if csv_file.name.endswith(":Zone.Identifier"):
                continue
                
            event_name = csv_file.stem.replace("_results", "")
            logger.info(f"Loading data for {event_name} from {csv_file}")
            
            try:
                df = pd.read_csv(csv_file)
                data[event_name] = df
                logger.info(f"Loaded {len(df)} records for {event_name}")
            except Exception as e:
                logger.error(f"Failed to load {csv_file}: {e}")
        
        return data
    
    def standardize_features(self, df: pd.DataFrame, event_name: str) -> pd.DataFrame:
        """
        種目別の特徴量を標準化
        
        Args:
            df: 元のDataFrame
            event_name: 種目名
            
        Returns:
            標準化されたDataFrame
        """
        standardized_df = pd.DataFrame()
        
        # 共通特徴量の抽出
        common_features = self._extract_common_features(df, event_name)
        standardized_df = pd.concat([standardized_df, common_features], axis=1)
        
        # 種目固有の特徴量
        event_specific_features = self._extract_event_specific_features(df, event_name)
        standardized_df = pd.concat([standardized_df, event_specific_features], axis=1)
        
        # 計算特徴量の追加（元のDataFrameを渡す）
        calculated_features = self._calculate_derived_features(df, event_name)
        standardized_df = pd.concat([standardized_df, calculated_features], axis=1)
        
        logger.info(f"Standardized features for {event_name}: {len(standardized_df.columns)} features")
        return standardized_df
    
    def _extract_common_features(self, df: pd.DataFrame, event_name: str) -> pd.DataFrame:
        """共通特徴量の抽出"""
        features = pd.DataFrame()
        
        # 基本情報 - 年齢
        age_cols = ['Age_years', 'Age']
        for col in age_cols:
            if col in df.columns:
                features['age'] = df[col]
                break
        
        # 性別（数値化）
        if 'Gender' in df.columns:
            features['gender'] = (df['Gender'] == 'Male').astype(int)
        elif 'Sex' in df.columns:
            features['gender'] = (df['Sex'] == 'M').astype(int)
        
        # 競技レベル（数値化）
        level_mapping = {
            'International Elite': 5,
            'National Elite': 4,
            'Elite': 4,
            'Collegiate/Club': 3,
            'Competitive Amateur': 2,
            'Recreational': 1
        }
        
        if 'Competition_Level' in df.columns:
            features['competition_level'] = df['Competition_Level'].map(level_mapping).fillna(1)
        
        # VO2max
        vo2max_cols = ['VO2max_est', 'VO2max_ml_kg_min']
        for col in vo2max_cols:
            if col in df.columns:
                features['vo2max'] = df[col]
                break
        
        # トレーニング頻度
        freq_cols = ['Training_Freq_per_week', 'Training_Frequency_days_per_week', 'Training_Frequency_days_week']
        for col in freq_cols:
            if col in df.columns:
                features['training_frequency'] = df[col]
                break
        
        # ランニング歴
        history_cols = ['Running_History_years', 'Running_History_years']
        for col in history_cols:
            if col in df.columns:
                features['running_history'] = df[col]
                break
        
        # 筋力トレーニング頻度
        strength_cols = ['Strength_Freq_per_week', 'Strength_Training_freq_per_week', 'Strength_Training_freq_week']
        for col in strength_cols:
            if col in df.columns:
                features['strength_frequency'] = df[col]
                break
        
        # 安静時心拍数
        hr_cols = ['Resting_HR_bpm', 'RestingHeartRate_bpm', 'Resting_Heart_Rate_bpm']
        for col in hr_cols:
            if col in df.columns:
                features['resting_hr'] = df[col]
                break
        
        return features
    
    def _extract_event_specific_features(self, df: pd.DataFrame, event_name: str) -> pd.DataFrame:
        """種目固有の特徴量抽出"""
        features = pd.DataFrame()
        
        # 週間・月間距離
        weekly_cols = ['Weekly_KM', 'Weekly_Mileage_km', 'Weekly_Distance_km']
        monthly_cols = ['Monthly_KM', 'Monthly_Mileage_km', 'Monthly_Distance_km']
        
        for col in weekly_cols:
            if col in df.columns:
                features['weekly_distance'] = df[col]
                break
        
        for col in monthly_cols:
            if col in df.columns:
                features['monthly_distance'] = df[col]
                break
        
        # テンポ走関連
        tempo_cols = [
            'Tempo_Run_Pace_sec_per_km', 'Tempo_Run_10k_pace_s_per_km',
            'Tempo_20_30km_pace_sec_km'
        ]
        tempo_dist_cols = [
            'Tempo_Run_Dist_km'
        ]
        
        for col in tempo_cols:
            if col in df.columns:
                features['tempo_pace'] = df[col]
                break
        
        for col in tempo_dist_cols:
            if col in df.columns:
                features['tempo_distance'] = df[col]
                break
        
        # ロング走関連
        long_run_cols = [
            'Long_Run_Dist_km', 'Long_Run_km', 'Long_Run_Max_Dist_km'
        ]
        long_pace_cols = [
            'Long_Run_Pace_sec_per_km', 'Long_Run_pace_s_per_km', 'Long_Run_pace_sec_km'
        ]
        
        for col in long_run_cols:
            if col in df.columns:
                features['long_run_distance'] = df[col]
                break
        
        for col in long_pace_cols:
            if col in df.columns:
                features['long_run_pace'] = df[col]
                break
        
        # インターバル関連（種目に応じて）
        self._extract_interval_features(df, features, event_name)
        
        return features
    
    def _extract_interval_features(self, df: pd.DataFrame, features: pd.DataFrame, event_name: str):
        """インターバル練習の特徴量抽出"""
        
        # 200mインターバル
        if 'Avg_200m_Rep_Time_sec' in df.columns:
            features['interval_200m_time'] = df['Avg_200m_Rep_Time_sec']
            features['interval_200m_rest'] = df['Rest_200m_Rep_sec']
        
        # 400mインターバル
        if 'Avg_400m_Interval_Time_sec' in df.columns:
            features['interval_400m_time'] = df['Avg_400m_Interval_Time_sec']
            features['interval_400m_rest'] = df['Rest_400m_Interval_sec']
        
        # 800mインターバル
        if 'Avg_800m_Interval_Time_sec' in df.columns:
            features['interval_800m_time'] = df['Avg_800m_Interval_Time_sec']
            features['interval_800m_rest'] = df['Rest_800m_Interval_sec']
        
        # 1000mインターバル
        if 'Interval_1000m_x10_12_avg_sec' in df.columns:
            features['interval_1000m_time'] = df['Interval_1000m_x10_12_avg_sec']
            features['interval_1000m_rest'] = df['Interval_1000m_x10_12_rest_sec']
        
        # 1600mインターバル
        if 'Interval_1600m_x6_8_avg_sec' in df.columns:
            features['interval_1600m_time'] = df['Interval_1600m_x6_8_avg_sec']
            features['interval_1600m_rest'] = df['Interval_1600m_x6_8_rest_sec']
    
    def _calculate_derived_features(self, df: pd.DataFrame, event_name: str) -> pd.DataFrame:
        """計算特徴量の生成"""
        features = pd.DataFrame()
        
        # 目標タイム（秒）- 種目別の列名マッピング
        target_col_mapping = {
            '800m': 'Target_Time_sec',
            '1500m': 'Target_Time_sec', 
            '3000m': 'Target_Time_sec',
            '5000m': 'TargetTime_s',
            '10000m': 'TargetTime_s',
            '5kmroad': 'TargetTime_s',
            '10kmroad': 'TargetTime_s',
            'halfmarathon': 'TargetTime_s',
            'marathon': 'FinishTime'
        }
        
        target_col = target_col_mapping.get(event_name)
        logger.info(f"Looking for target column '{target_col}' in {event_name}, available columns: {list(df.columns)}")
        
        if target_col and target_col in df.columns:
            if target_col == 'FinishTime':  # HH:MM:SS形式の場合
                features['target_time_seconds'] = self._convert_time_to_seconds(df[target_col])
            else:
                features['target_time_seconds'] = df[target_col]
            logger.info(f"Successfully extracted target column '{target_col}' for {event_name}")
        else:
            logger.warning(f"Target column '{target_col}' not found in {event_name}, available columns: {list(df.columns)}")
            # デフォルトのターゲットタイムを設定（距離に基づく）
            distance = self.event_distances.get(event_name, 5.0)
            default_pace = 300  # 5分/km
            features['target_time_seconds'] = distance * default_pace
        
        # 距離
        distance = self.event_distances.get(event_name, 5.0)
        features['distance_km'] = distance
        
        # 目標ペース（秒/km）
        if 'target_time_seconds' in features.columns:
            features['target_pace'] = features['target_time_seconds'] / distance
        
        # VDOT（既存の場合は使用、ない場合は推定）
        if 'VDOT_est' in df.columns:
            features['vdot'] = df['VDOT_est']
        elif 'VDOT' in df.columns:
            features['vdot'] = df['VDOT']
        else:
            # VDOT推定（簡易版）
            features['vdot'] = self._estimate_vdot(features)
        
        # 練習強度比の計算
        features = self._calculate_intensity_ratios(features)
        
        # 練習量指標の計算
        features = self._calculate_volume_metrics(features)
        
        # 年齢・性別・経験年数の交互作用項
        features = self._calculate_interaction_features(features)
        
        return features
    
    def _convert_time_to_seconds(self, time_series: pd.Series) -> pd.Series:
        """時間文字列を秒に変換"""
        def convert_time(time_str):
            if isinstance(time_str, str) and ':' in time_str:
                parts = time_str.split(':')
                if len(parts) == 3:  # HH:MM:SS
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                elif len(parts) == 2:  # MM:SS
                    return int(parts[0]) * 60 + int(parts[1])
            return time_str
        
        return time_series.apply(convert_time)
    
    def _estimate_vdot(self, features: pd.DataFrame) -> pd.Series:
        """VDOT推定（簡易版）"""
        # 実際のVDOT計算式を使用
        # ここでは簡易的な推定を使用
        if 'target_pace' in features.columns:
            # ペースからVDOTを推定（簡易版）
            vdot = 100 - (features['target_pace'] - 180) * 0.5
            return np.clip(vdot, 20, 100)
        return pd.Series([50] * len(features))
    
    def _calculate_intensity_ratios(self, features: pd.DataFrame) -> pd.DataFrame:
        """練習強度比の計算"""
        
        # インターバルペース/レースペース比
        if 'interval_400m_time' in features.columns and 'target_pace' in features.columns:
            interval_pace = features['interval_400m_time'] / 0.4  # 400m = 0.4km
            features['interval_400m_ratio'] = interval_pace / features['target_pace']
        
        if 'interval_800m_time' in features.columns and 'target_pace' in features.columns:
            interval_pace = features['interval_800m_time'] / 0.8  # 800m = 0.8km
            features['interval_800m_ratio'] = interval_pace / features['target_pace']
        
        # テンポ走ペース/レースペース比
        if 'tempo_pace' in features.columns and 'target_pace' in features.columns:
            features['tempo_ratio'] = features['tempo_pace'] / features['target_pace']
        
        # ロング走ペース/レースペース比
        if 'long_run_pace' in features.columns and 'target_pace' in features.columns:
            features['long_run_ratio'] = features['long_run_pace'] / features['target_pace']
        
        return features
    
    def _calculate_volume_metrics(self, features: pd.DataFrame) -> pd.DataFrame:
        """練習量指標の計算"""
        
        # 週間距離密度（週間距離/体重比）
        if 'weekly_distance' in features.columns:
            features['weekly_distance_density'] = features['weekly_distance']
        
        # 月間距離密度
        if 'monthly_distance' in features.columns:
            features['monthly_distance_density'] = features['monthly_distance']
        
        # 練習頻度×距離の積
        if 'training_frequency' in features.columns and 'weekly_distance' in features.columns:
            features['frequency_distance_product'] = (
                features['training_frequency'] * features['weekly_distance']
            )
        
        return features
    
    def _calculate_interaction_features(self, features: pd.DataFrame) -> pd.DataFrame:
        """交互作用項の計算"""
        
        # 年齢×性別
        if 'age' in features.columns and 'gender' in features.columns:
            features['age_gender_interaction'] = features['age'] * features['gender']
        
        # 年齢×経験年数
        if 'age' in features.columns and 'running_history' in features.columns:
            features['age_experience_interaction'] = features['age'] * features['running_history']
        
        # VO2max×年齢
        if 'vo2max' in features.columns and 'age' in features.columns:
            features['vo2max_age_interaction'] = features['vo2max'] * features['age']
        
        # 競技レベル×経験年数
        if 'competition_level' in features.columns and 'running_history' in features.columns:
            features['level_experience_interaction'] = (
                features['competition_level'] * features['running_history']
            )
        
        return features
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        データクリーニング
        
        Args:
            df: クリーニング対象のDataFrame
            
        Returns:
            クリーニング済みDataFrame
        """
        logger.info(f"Cleaning data: {len(df)} records")
        
        # 年齢データの前処理（文字列形式を数値に変換）
        if 'age' in df.columns:
            df['age'] = self._convert_age_to_numeric(df['age'])
        
        # 文字列データの数値変換
        df = self._convert_string_columns_to_numeric(df)
        
        # 欠損値の処理（数値列のみ）
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if df[col].isnull().any():
                median_value = df[col].median()
                if pd.isna(median_value):
                    # 中央値もNaNの場合はデフォルト値を使用
                    default_values = {
                        'age': 30.0,
                        'gender': 0.5,
                        'competition_level': 2.0,
                        'vo2max': 50.0,
                        'training_frequency': 3.0,
                        'running_history': 2.0,
                        'strength_frequency': 1.0,
                        'resting_hr': 60.0,
                        'weekly_distance': 30.0,
                        'monthly_distance': 120.0,
                        'tempo_pace': 240.0,
                        'long_run_pace': 300.0
                    }
                    median_value = default_values.get(col, 0.0)
                df[col] = df[col].fillna(median_value)
        
        # 外れ値の検出・除去（IQR法）
        for col in numeric_columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # 外れ値を中央値で置換
            outliers = (df[col] < lower_bound) | (df[col] > upper_bound)
            if outliers.sum() > 0:
                logger.info(f"Replacing {outliers.sum()} outliers in {col}")
                df.loc[outliers, col] = df[col].median()
        
        logger.info(f"Data cleaning completed: {len(df)} records")
        return df
    
    def _convert_string_columns_to_numeric(self, df: pd.DataFrame) -> pd.DataFrame:
        """文字列列を数値に変換"""
        for col in df.columns:
            if df[col].dtype == 'object':
                # 文字列データを数値に変換を試行
                try:
                    # 範囲形式（'170-210'）の処理
                    if df[col].str.contains('-', na=False).any():
                        df[col] = df[col].apply(self._convert_range_to_numeric)
                    else:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                except Exception as e:
                    logger.warning(f"Failed to convert column {col} to numeric: {e}")
                    # 変換できない場合はデフォルト値で埋める
                    df[col] = 0.0
        
        return df
    
    def _convert_range_to_numeric(self, value):
        """範囲形式の文字列を数値に変換"""
        if isinstance(value, str) and '-' in value:
            try:
                parts = value.split('-')
                if len(parts) == 2:
                    return (float(parts[0]) + float(parts[1])) / 2
            except ValueError:
                pass
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0
    
    def _convert_age_to_numeric(self, age_series: pd.Series) -> pd.Series:
        """年齢文字列を数値に変換"""
        def convert_age(age_str):
            if isinstance(age_str, str) and '-' in age_str:
                # '20-29' -> 25 (中央値)
                parts = age_str.split('-')
                if len(parts) == 2:
                    return (int(parts[0]) + int(parts[1])) / 2
            elif isinstance(age_str, (int, float)):
                return float(age_str)
            return 30.0  # デフォルト値
        
        return age_series.apply(convert_age)
    
    def prepare_all_data(self) -> Dict[str, pd.DataFrame]:
        """
        全種目のデータを準備
        
        Returns:
            種目別の準備済みDataFrame辞書
        """
        logger.info("Starting data preparation for all events")
        
        # 全データを読み込み
        raw_data = self.load_all_data()
        
        # 各種目のデータを標準化・クリーニング
        for event_name, df in raw_data.items():
            logger.info(f"Processing {event_name}")
            
            # 特徴量標準化
            standardized_df = self.standardize_features(df, event_name)
            
            # データクリーニング
            cleaned_df = self.clean_data(standardized_df)
            
            # 結果を保存
            self.processed_data[event_name] = cleaned_df
            
            logger.info(f"Completed processing {event_name}: {len(cleaned_df)} records, {len(cleaned_df.columns)} features")
        
        return self.processed_data
    
    def save_processed_data(self, output_dir: str = "ml_training_data"):
        """
        処理済みデータを保存
        
        Args:
            output_dir: 出力ディレクトリ
        """
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        for event_name, df in self.processed_data.items():
            output_file = output_path / f"{event_name}_processed.csv"
            df.to_csv(output_file, index=False)
            logger.info(f"Saved processed data for {event_name} to {output_file}")
        
        # 特徴量マッピングを保存
        mapping_file = output_path / "feature_mappings.json"
        with open(mapping_file, 'w') as f:
            json.dump(self.feature_mappings, f, indent=2)
        logger.info(f"Saved feature mappings to {mapping_file}")
    
    def get_feature_summary(self) -> Dict[str, Any]:
        """
        特徴量サマリーを取得
        
        Returns:
            特徴量サマリー辞書
        """
        summary = {}
        
        for event_name, df in self.processed_data.items():
            summary[event_name] = {
                'record_count': len(df),
                'feature_count': len(df.columns),
                'features': list(df.columns),
                'target_column': 'target_time_seconds' if 'target_time_seconds' in df.columns else None,
                'missing_values': df.isnull().sum().to_dict(),
                'data_types': df.dtypes.to_dict()
            }
        
        return summary


def main():
    """メイン実行関数"""
    logger.info("Starting ML training data preparation")
    
    # データ準備器を初期化
    preparer = MLTrainingDataPreparer()
    
    # 全データを準備
    processed_data = preparer.prepare_all_data()
    
    # 処理済みデータを保存
    preparer.save_processed_data()
    
    # 特徴量サマリーを表示
    summary = preparer.get_feature_summary()
    
    logger.info("Data preparation completed!")
    logger.info("Feature Summary:")
    for event_name, event_summary in summary.items():
        logger.info(f"{event_name}: {event_summary['record_count']} records, {event_summary['feature_count']} features")


if __name__ == "__main__":
    main()

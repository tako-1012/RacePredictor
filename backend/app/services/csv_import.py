"""
Garmin CSV インポートサービス
エンコーディング自動判定、28カラム完全対応
"""

import pandas as pd
import chardet
from typing import Dict, List, Tuple, Optional, Any
import re
from datetime import datetime, date
import io
import numpy as np
import codecs
import logging


def clean_for_json(data):
    """JSONシリアライズ可能にデータをクリーニング"""
    if isinstance(data, dict):
        return {k: clean_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_for_json(v) for v in data]
    elif pd.isna(data) or data == float('inf') or data == float('-inf'):
        return None
    elif isinstance(data, np.ndarray):
        return data.tolist()
    else:
        return data


def detect_encoding_robust(file_content: bytes) -> str:
    """
    より確実なエンコーディング検出（完全版）
    BOMチェック + 優先順位付き試行 + 日本語文字検証 + chardetフォールバック
    """
    # BOMチェック（最優先）
    if file_content.startswith(codecs.BOM_UTF8):
        logging.info("BOM検出: UTF-8-sig")
        return 'utf-8-sig'
    if file_content.startswith(codecs.BOM_UTF16_LE):
        logging.info("BOM検出: UTF-16-LE")
        return 'utf-16-le'
    if file_content.startswith(codecs.BOM_UTF16_BE):
        logging.info("BOM検出: UTF-16-BE")
        return 'utf-16-be'
    
    # 優先順位付きエンコーディング試行（日本語対応）
    encodings = ['shift_jis', 'cp932', 'utf-8-sig', 'utf-8', 'iso2022_jp', 'euc-jp']
    
    best_encoding = None
    best_score = 0
    
    for encoding in encodings:
        try:
            # デコードテスト
            decoded = file_content.decode(encoding)
            
            # 日本語文字検証スコア計算
            score = 0
            sample_text = decoded[:2000]  # 最初の2000文字をサンプル
            
            # 日本語文字の存在チェック
            japanese_chars = sum(1 for c in sample_text if ord(c) > 127)
            if japanese_chars > 0:
                score += japanese_chars * 2  # 日本語文字1つにつき2点
            
            # Garmin日本語カラム名の完全一致チェック
            garmin_columns = ['ラップ数', 'タイム', '平均ペース分／km', '平均心拍数bpm', '距離km', '累積時間']
            for col in garmin_columns:
                if col in sample_text:
                    score += 50  # Garminカラム名一致で50点
            
            # 文字化けパターンの減点
            garbled_patterns = ['ｽ', 'ｯ', '・', '郢', '繝', '隰', '昴', '晢', '�']
            garbled_count = sum(sample_text.count(pattern) for pattern in garbled_patterns)
            score -= garbled_count * 10  # 文字化け1つにつき10点減点
            
            # 半角文字比率チェック
            if len(sample_text) > 0:
                half_width_count = sum(1 for c in sample_text if ord(c) < 256)
                half_width_ratio = half_width_count / len(sample_text)
                if half_width_ratio > 0.7 and japanese_chars > 0:
                    score -= 100  # 日本語なのに半角文字が70%以上なら大幅減点
            
            logging.info(f"エンコーディング {encoding}: スコア {score}")
            
            if score > best_score:
                best_score = score
                best_encoding = encoding
                
        except UnicodeDecodeError:
            logging.debug(f"エンコーディング {encoding}: デコード失敗")
            continue
    
    # 最良のエンコーディングを採用
    if best_encoding and best_score > 0:
        logging.info(f"最良エンコーディング検出: {best_encoding} (スコア: {best_score})")
        return best_encoding
    
    # chardet でフォールバック
    detected = chardet.detect(file_content)
    fallback_encoding = detected['encoding'] or 'utf-8'
    confidence = detected.get('confidence', 0)
    logging.warning(f"chardetフォールバック: {fallback_encoding} (信頼度: {confidence:.2f})")
    
    # chardetの結果も検証
    if confidence > 0.7:
        try:
            decoded = file_content.decode(fallback_encoding)
            if validate_japanese_text(decoded[:500]):
                return fallback_encoding
        except UnicodeDecodeError:
            pass
    
    # 最終フォールバック
    logging.warning("最終フォールバック: utf-8")
    return 'utf-8'


def validate_japanese_text(text: str) -> bool:
    """日本語テキストの妥当性チェック（強化版）"""
    if not text:
        return True
    
    # 文字化けパターン（拡張版）
    garbled_patterns = [
        'ｽ', 'ｯ', '・', '郢', '繝', '隰', '昴', '晢',  # よくある文字化け文字
        '・ｻ', '・ｿ', '・ｰ', '・ｳ', '・ｱ',  # 半角カナ文字化け
        '�',  # 置換文字
        '繧', '繝', '縺', '縺', '縺',  # 追加の文字化けパターン
        '縺', '縺', '縺', '縺', '縺',  # Shift-JIS特有の文字化け
    ]
    
    # 文字化けパターンが含まれているか
    has_garbled = any(pattern in text for pattern in garbled_patterns)
    
    # 異常に多くの半角文字が含まれているか（日本語なのに）
    if len(text) > 0:
        half_width_count = sum(1 for c in text if ord(c) < 256)
        total_chars = len(text)
        half_width_ratio = half_width_count / total_chars
        
        # 日本語テキストなのに半角文字が70%以上
        if half_width_ratio > 0.7 and any(ord(c) > 127 for c in text):
            has_garbled = True
        
        # 連続する同じ文字（文字化けの特徴）
        if len(text) > 3:
            for i in range(len(text) - 2):
                if text[i] == text[i+1] == text[i+2] and ord(text[i]) > 127:
                    has_garbled = True
                    break
    
    # 日本語文字の妥当性チェック
    japanese_chars = [c for c in text if ord(c) > 127]
    if japanese_chars:
        # 日本語文字が含まれている場合、文字化けでないかチェック
        for char in japanese_chars:
            # 無効なUnicode文字
            if ord(char) > 0x10FFFF:
                has_garbled = True
                break
            # サロゲート文字
            if 0xD800 <= ord(char) <= 0xDFFF:
                has_garbled = True
                break
    
    return not has_garbled


class CSVImportService:
    """CSV インポートサービス"""

    # Garminカラムマッピング
    GARMIN_COLUMNS = {
        'ラップ数': 'lap_number',
        'タイム': 'lap_time',
        '累積時間': 'total_time',
        '距離km': 'distance_km',
        '平均ペース分／km': 'avg_pace_min_km',
        '勾配調整後のペース（GAP）平均分／km': 'avg_gap_min_km',
        '平均心拍数bpm': 'avg_heart_rate',
        '最大心拍数bpm': 'max_heart_rate',
        '総上昇量m': 'total_ascent',
        '総下降量m': 'total_descent',
        '平均パワーW': 'avg_power',
        '平均W/kg': 'avg_power_per_kg',
        '最大パワーW': 'max_power',
        '最大W/kg': 'max_power_per_kg',
        '平均ピッチspm': 'avg_cadence',
        '平均接地時間ms': 'avg_ground_contact_time',
        '平均GCTバランス%': 'avg_gct_balance',
        '平均歩幅m': 'avg_stride_length',
        '平均上下動cm': 'avg_vertical_oscillation',
        '平均上下動比%': 'avg_vertical_ratio',
        'カロリーC': 'calories',
        '平均気温': 'avg_temperature',
        '最高ペース分／km': 'best_pace_min_km',
        '最高ピッチspm': 'max_cadence',
        '移動時間': 'moving_time',
        '平均移動ペース分／km': 'avg_moving_pace',
        '平均ステップスピードロスcm/秒': 'avg_step_speed_loss',
        '平均ステップスピードロス率%': 'avg_step_speed_loss_rate'
    }

    def __init__(self):
        self.supported_encodings = ['utf-8', 'shift_jis', 'cp932', 'euc-jp']

    def is_garbled_text(self, text: str) -> bool:
        """文字化けテキストを検出"""
        # 文字化け特徴パターン
        garbled_patterns = [
            'ｽ', 'ｯ', '・', '郢', '繝', '隰', '昴', '晢',  # よくある文字化け文字
            '・ｻ', '・ｿ', '・ｰ', '・ｳ', '・ｱ',  # 半角カナ文字化け
        ]

        # 文字化けパターンが含まれているか
        has_garbled = any(pattern in text for pattern in garbled_patterns)

        # 異常に多くの半角文字が含まれているか（日本語なのに）
        half_width_count = sum(1 for c in text if ord(c) < 256)
        total_chars = len(text)
        if total_chars > 0:
            half_width_ratio = half_width_count / total_chars
            if half_width_ratio > 0.7 and any(ord(c) > 127 for c in text):
                has_garbled = True

        return has_garbled

    def detect_encoding(self, file_content: bytes) -> str:
        """エンコーディング自動判定（完全版）"""
        # 新しい堅牢なエンコーディング検出を使用
        detected_encoding = detect_encoding_robust(file_content)
        
        # 追加の検証: CSV読み込みテスト
        try:
            df_test = pd.read_csv(io.BytesIO(file_content), encoding=detected_encoding, nrows=0)
            columns = df_test.columns.tolist()
            
            # 日本語カラム名の妥当性チェック
            valid_japanese_count = 0
            garbled_columns = []
            for col in columns:
                col_str = str(col)
                if validate_japanese_text(col_str) and any(ord(c) > 127 for c in col_str):
                    valid_japanese_count += 1
                elif not validate_japanese_text(col_str):
                    garbled_columns.append(col_str)
            
            # Garmin日本語カラム名の完全一致チェック
            garmin_japanese_columns = ['ラップ数', 'タイム', '平均ペース分／km', '平均心拍数bpm', '距離km', '累積時間']
            exact_matches = sum(1 for col in garmin_japanese_columns if col in columns)
            
            logging.info(f"エンコーディング検証: {detected_encoding}, 日本語カラム: {valid_japanese_count}, Garmin一致: {exact_matches}")
            
            if garbled_columns:
                logging.warning(f"文字化けカラム検出: {garbled_columns}")
            
            # 検出結果が妥当な場合
            if valid_japanese_count > 0 and exact_matches > 0 and not garbled_columns:
                logging.info(f"エンコーディング確定: {detected_encoding}")
                return detected_encoding
            elif exact_matches > 0:
                logging.info(f"Garminカラム一致でエンコーディング採用: {detected_encoding}")
                return detected_encoding
            
        except Exception as e:
            logging.warning(f"CSV読み込みテスト失敗: {e}")
        
        # フォールバック: 従来の方法
        fallback_encoding = self._fallback_encoding_detection(file_content)
        logging.info(f"フォールバックエンコーディング採用: {fallback_encoding}")
        return fallback_encoding
    
    def _fallback_encoding_detection(self, file_content: bytes) -> str:
        """フォールバック用のエンコーディング検出"""
        priority_encodings = ['shift_jis', 'cp932', 'utf-8-sig', 'utf-8']
        
        for encoding in priority_encodings:
            try:
                df_test = pd.read_csv(io.BytesIO(file_content), encoding=encoding, nrows=0)
                columns = df_test.columns.tolist()
                
                # Garmin日本語カラム名の完全一致チェック
                garmin_japanese_columns = ['ラップ数', 'タイム', '平均ペース分／km', '平均心拍数bpm', '距離km']
                exact_matches = sum(1 for col in garmin_japanese_columns if col in columns)
                
                if exact_matches >= 3:  # 3つ以上一致すれば採用
                    logging.info(f"フォールバック検出成功: {encoding} (一致: {exact_matches})")
                    return encoding
                    
            except Exception:
                continue
        
        # 最終フォールバック
        result = chardet.detect(file_content)
        return result['encoding'] or 'utf-8'

    def parse_time_string(self, time_str: str) -> Optional[int]:
        """時間文字列を秒数に変換 (例: "5:30" -> 330, "1:23:45" -> 5025)"""
        if not time_str or pd.isna(time_str):
            return None

        try:
            # 文字列に変換
            time_str = str(time_str).strip()

            # コロン区切りで分割
            parts = time_str.split(':')

            if len(parts) == 2:  # MM:SS形式
                minutes, seconds = map(int, parts)
                return minutes * 60 + seconds
            elif len(parts) == 3:  # HH:MM:SS形式
                hours, minutes, seconds = map(int, parts)
                return hours * 3600 + minutes * 60 + seconds
            else:
                # 秒数のみの場合
                return int(float(time_str))

        except (ValueError, TypeError):
            return None

    def parse_pace_string(self, pace_str: str) -> Optional[int]:
        """ペース文字列を秒/kmに変換 (例: "5:30" -> 330)"""
        return self.parse_time_string(pace_str)

    def determine_format(self, df: pd.DataFrame) -> str:
        """CSVフォーマット判定"""
        columns = df.columns.tolist()

        # Garminフォーマット判定
        garmin_indicators = ['ラップ数', 'タイム', '平均ペース分／km', '平均心拍数bpm']
        if any(col in columns for col in garmin_indicators):
            return 'garmin'

        # 標準フォーマット判定
        standard_indicators = ['date', 'type', 'distance', 'time']
        if all(col in columns for col in standard_indicators):
            return 'standard'

        return 'unknown'

    def estimate_workout_type(self, row_data: Dict) -> str:
        """練習種別推定（控えめ）- 最終決定はユーザーに委ねる"""
        # データベース上のデフォルトとして軽い推定のみ
        return 'ジョギング'  # ユーザーがインポート時に適切な種別を選択

    def estimate_intensity(self, row_data: Dict) -> int:
        """強度推定（控えめ）- 最終決定はユーザーに委ねる"""
        # デフォルト強度のみ提供、ユーザーがインポート設定で調整
        return 3

    def process_garmin_csv(self, df: pd.DataFrame) -> List[Dict]:
        """Garmin CSV処理（概要行対応・全データ形式対応）"""
        processed_data = []

        # 概要行の存在確認
        has_summary = any(str(row.get('ラップ数', '')).strip() == "概要" for _, row in df.iterrows())

        # 概要行がある場合は概要行のみ、ない場合は全ラップを統合
        if has_summary:
            # 概要行のみを処理
            for _, row in df.iterrows():
                if str(row.get('ラップ数', '')).strip() == "概要":
                    processed_data.append(self._process_row(row, df))
                    break
        else:
            # 全ラップを統合して1つのワークアウトとして処理
            if len(df) > 0:
                # 最初の行をベースに統合データを作成
                base_row = df.iloc[0]
                processed_data.append(self._process_row(base_row, df, aggregate_all=True))

        return processed_data

    def _process_row(self, row, df: pd.DataFrame, aggregate_all: bool = False) -> Dict:
        """行データ処理（単一行または全ラップ統合）"""
        workout_data = {}
        extended_data = {}

        # 各カラムを処理
        for original_col, mapped_col in self.GARMIN_COLUMNS.items():
            if original_col in df.columns:
                value = row[original_col]

                # ペース文字列の変換
                if 'ペース' in original_col and pd.notna(value):
                    value = self.parse_pace_string(str(value))

                # 時間文字列の変換
                elif original_col in ['タイム', '累積時間', '移動時間'] and pd.notna(value):
                    value = self.parse_time_string(str(value))

                # 数値型の処理
                elif pd.notna(value) and str(value).replace('.', '').replace('-', '').isdigit():
                    try:
                        value = float(value)
                        if value.is_integer():
                            value = int(value)
                    except ValueError:
                        pass

                # NaN値を除外
                if pd.notna(value) and value != float('inf') and value != float('-inf'):
                    extended_data[mapped_col] = value

        # 基本workout情報の生成
        if '距離km' in df.columns:
            distance_km = row['距離km']
            if pd.notna(distance_km):
                workout_data['distance_meters'] = int(float(distance_km) * 1000)

        if 'タイム' in df.columns:
            total_time = self.parse_time_string(str(row['タイム']))
            if total_time:
                workout_data['times_seconds'] = [total_time]

        # 心拍数データ
        if '平均心拍数bpm' in df.columns and pd.notna(row['平均心拍数bpm']):
            workout_data['avg_heart_rate'] = int(row['平均心拍数bpm'])

        # ペースデータ
        if '平均ペース分／km' in df.columns:
            pace = self.parse_pace_string(str(row['平均ペース分／km']))
            if pace:
                workout_data['avg_pace_seconds'] = pace

        # 推定データ（控えめ）
        workout_data['estimated_type'] = self.estimate_workout_type(extended_data)
        workout_data['estimated_intensity'] = self.estimate_intensity(extended_data)
        workout_data['extended_data'] = extended_data

        return workout_data

    def process_standard_csv(self, df: pd.DataFrame) -> List[Dict]:
        """標準CSV処理"""
        processed_data = []

        for _, row in df.iterrows():
            workout_data = {
                'date': row.get('date'),
                'workout_type': row.get('type'),
                'distance_meters': int(row.get('distance', 0)),
                'intensity': int(row.get('intensity', 3)),
                'notes': row.get('notes', '')
            }

            # 時間データ処理
            if 'time' in row and pd.notna(row['time']):
                time_seconds = self.parse_time_string(str(row['time']))
                if time_seconds:
                    workout_data['times_seconds'] = [time_seconds]

            processed_data.append(workout_data)

        return processed_data

    def import_csv(self, file_content: bytes, filename: str = "") -> Tuple[bool, str, List[Dict]]:
        """
        CSVファイルをインポート

        Returns:
            (success, message, data)
        """
        try:
            # エンコーディング判定
            encoding = self.detect_encoding(file_content)

            # CSV読み込み
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
            except UnicodeDecodeError:
                # フォールバック
                df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8')

            if df.empty:
                return False, "CSVファイルが空です", []

            # フォーマット判定
            format_type = self.determine_format(df)

            if format_type == 'garmin':
                processed_data = self.process_garmin_csv(df)
                message = f"Garminデータを{len(processed_data)}件処理しました"
            elif format_type == 'standard':
                processed_data = self.process_standard_csv(df)
                message = f"標準データを{len(processed_data)}件処理しました"
            else:
                return False, "対応していないCSVフォーマットです", []

            return True, message, processed_data

        except Exception as e:
            return False, f"CSVインポートエラー: {str(e)}", []

    def analyze_laps(self, df: pd.DataFrame) -> List[Dict]:
        """ラップ分析（Garmin形式データ用）"""
        lap_analysis = []

        # Garminフォーマットのみ対応
        required_columns = ['ラップ数', '平均ペース分／km']
        if not all(col in df.columns for col in required_columns):
            return []

        # 概要行（ラップ数が"概要"の行）を特定
        summary_row = None
        summary_pace = None

        for _, row in df.iterrows():
            if str(row.get('ラップ数', '')).strip() == "概要":
                summary_row = row
                pace_str = str(row.get('平均ペース分／km', ''))
                summary_pace = self.parse_pace_string(pace_str)
                break

        # 各ラップを分析
        for _, row in df.iterrows():
            lap_number = str(row.get('ラップ数', '')).strip()

            # 分析データ作成
            analysis_data = {
                'ラップ数': lap_number,
                'タイム': str(row.get('タイム', '')).strip() if pd.notna(row.get('タイム')) else '-',
                '距離': str(row.get('距離km', '')).strip() if pd.notna(row.get('距離km')) else '-',
                '平均ペース': str(row.get('平均ペース分／km', '')).strip() if pd.notna(row.get('平均ペース分／km')) else '-',
                '心拍数': str(row.get('平均心拍数bpm', '')).strip() if pd.notna(row.get('平均心拍数bpm')) else '-'
            }

            # 判定ロジック
            if lap_number == "概要":
                analysis_data['判定'] = "概要"
            elif summary_pace is not None:
                pace_str = str(row.get('平均ペース分／km', ''))
                lap_pace = self.parse_pace_string(pace_str)

                if lap_pace is not None:
                    if lap_pace < summary_pace:
                        analysis_data['判定'] = "ダッシュ"
                    else:
                        analysis_data['判定'] = "レスト"
                else:
                    analysis_data['判定'] = "-"
            else:
                analysis_data['判定'] = "-"

            lap_analysis.append(analysis_data)

        return lap_analysis

    def preview_data(self, file_content: bytes, max_rows: int = None) -> Tuple[bool, str, Dict]:
        """
        CSVデータのプレビュー（強化版エラーハンドリング）

        Returns:
            (success, message, preview_info)
        """
        import time
        start_time = time.time()
        
        try:
            # エンコーディング検出
            encoding = self.detect_encoding(file_content)
            logging.info(f"検出されたエンコーディング: {encoding}")

            # CSV読み込み（複数のエラーハンドリング戦略）
            df = self._read_csv_with_fallback(file_content, encoding)
            
            if df is None or df.empty:
                return False, "CSVファイルが空または読み込めませんでした", {}

            # カラム名の妥当性チェック
            columns = df.columns.tolist()
            garbled_columns = []
            warnings = []
            
            for col in columns:
                col_str = str(col)
                if not validate_japanese_text(col_str):
                    garbled_columns.append(col_str)
            
            if garbled_columns:
                logging.warning(f"文字化けが検出されたカラム: {garbled_columns}")
                warnings.append({
                    "type": "garbled_columns",
                    "message": f"文字化けが検出されたカラムがあります: {', '.join(garbled_columns)}",
                    "affected_columns": garbled_columns,
                    "severity": "warning"
                })

            # フォーマット判定
            format_type = self.determine_format(df)
            logging.info(f"検出されたフォーマット: {format_type}")

            # データ検証
            valid_rows = self._validate_data_rows(df, format_type)
            invalid_rows = len(df) - valid_rows
            
            if invalid_rows > 0:
                warnings.append({
                    "type": "invalid_rows",
                    "message": f"{invalid_rows}/{len(df)}行のデータが無効です",
                    "invalid_count": invalid_rows,
                    "total_count": len(df),
                    "severity": "warning"
                })

            # プレビューデータの準備
            total_rows = len(df)
            if max_rows is None:
                sample_data = df.to_dict('records')
            else:
                sample_data = df.head(max_rows).to_dict('records')

            # ラップ分析（Garmin形式の場合のみ）
            lap_analysis = []
            dash_count = 0
            if format_type == 'garmin':
                lap_analysis = self.analyze_laps(df)
                dash_count = sum(1 for lap in lap_analysis if lap.get('判定') == 'ダッシュ')

            processing_time = int((time.time() - start_time) * 1000)

            preview_info = {
                'format': format_type,
                'encoding': encoding,
                'total_rows': total_rows,
                'valid_rows': valid_rows,
                'invalid_rows': invalid_rows,
                'columns': columns,
                'sample_data': sample_data,
                'lap_analysis': lap_analysis,
                'dash_count': dash_count,
                'garbled_columns': garbled_columns if garbled_columns else None,
                'warnings': warnings,
                'processing_time_ms': processing_time,
                'timestamp': time.time()
            }

            preview_info = clean_for_json(preview_info)
            return True, f"{format_type}形式を検出（{total_rows}行、{valid_rows}行有効）", preview_info

        except Exception as e:
            logging.error(f"プレビューエラー: {str(e)}")
            return False, f"プレビューエラー: {str(e)}", {}

    def _validate_data_rows(self, df: pd.DataFrame, format_type: str) -> int:
        """データ行の妥当性チェック"""
        valid_count = 0
        
        for _, row in df.iterrows():
            try:
                if format_type == 'garmin':
                    # Garmin形式の検証
                    if self._validate_garmin_row(row):
                        valid_count += 1
                elif format_type == 'standard':
                    # 標準形式の検証
                    if self._validate_standard_row(row):
                        valid_count += 1
                else:
                    # 不明な形式は有効として扱う
                    valid_count += 1
            except Exception:
                # 検証エラーは無効として扱う
                continue
        
        return valid_count

    def _validate_garmin_row(self, row: pd.Series) -> bool:
        """Garmin形式の行データ検証"""
        required_fields = ['ラップ数', 'タイム', '距離km']
        
        # 必須フィールドの存在チェック
        for field in required_fields:
            if field not in row.index or pd.isna(row[field]):
                return False
        
        # ラップ数の妥当性チェック
        lap_number = str(row['ラップ数']).strip()
        if lap_number in ['', 'nan', 'None']:
            return False
        
        # タイムの妥当性チェック
        time_str = str(row['タイム']).strip()
        if time_str in ['', 'nan', 'None']:
            return False
        
        # 距離の妥当性チェック
        try:
            distance = float(row['距離km'])
            if distance <= 0:
                return False
        except (ValueError, TypeError):
            return False
        
        return True

    def _validate_standard_row(self, row: pd.Series) -> bool:
        """標準形式の行データ検証"""
        required_fields = ['date', 'type', 'distance', 'time']
        
        # 必須フィールドの存在チェック
        for field in required_fields:
            if field not in row.index or pd.isna(row[field]):
                return False
        
        # 距離の妥当性チェック
        try:
            distance = float(row['distance'])
            if distance <= 0:
                return False
        except (ValueError, TypeError):
            return False
        
        return True

    def _read_csv_with_fallback(self, file_content: bytes, primary_encoding: str) -> Optional[pd.DataFrame]:
        """フォールバック機能付きCSV読み込み（完全版）"""
        # 第1試行: 検出されたエンコーディングで読み込み
        try:
            df = pd.read_csv(io.BytesIO(file_content), encoding=primary_encoding)
            
            # 読み込み後の文字化けチェック
            columns = df.columns.tolist()
            garbled_columns = [col for col in columns if not validate_japanese_text(str(col))]
            
            if not garbled_columns:
                logging.info(f"CSV読み込み成功: {primary_encoding} (文字化けなし)")
                return df
            else:
                logging.warning(f"第1試行で文字化け検出 ({primary_encoding}): {garbled_columns}")
                
        except Exception as e:
            logging.warning(f"第1試行失敗 ({primary_encoding}): {e}")

        # 第2試行: 代替エンコーディングで試行（スコアベース）
        fallback_encodings = ['shift_jis', 'cp932', 'utf-8-sig', 'utf-8', 'euc-jp', 'iso2022_jp']
        best_df = None
        best_score = 0
        best_encoding = None
        
        for encoding in fallback_encodings:
            if encoding == primary_encoding:
                continue
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                
                # 文字化けスコア計算
                columns = df.columns.tolist()
                score = 0
                
                # カラム名の妥当性チェック
                valid_columns = 0
                for col in columns:
                    col_str = str(col)
                    if validate_japanese_text(col_str):
                        valid_columns += 1
                        # Garminカラム名の一致チェック
                        if col_str in self.GARMIN_COLUMNS:
                            score += 100
                
                score += valid_columns * 10
                
                # データの妥当性チェック（最初の数行）
                if len(df) > 0:
                    sample_data = df.head(3).to_string()
                    if validate_japanese_text(sample_data):
                        score += 50
                
                logging.info(f"エンコーディング {encoding}: スコア {score}")
                
                if score > best_score:
                    best_score = score
                    best_df = df
                    best_encoding = encoding
                    
            except Exception as e:
                logging.debug(f"フォールバック試行失敗 ({encoding}): {e}")

        if best_df is not None and best_score > 0:
            logging.info(f"最良フォールバック読み込み成功: {best_encoding} (スコア: {best_score})")
            return best_df

        # 第3試行: エラーを無視して強制読み込み
        try:
            df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8')
            logging.warning("強制読み込み成功（エラー無視）")
            return df
        except Exception as e:
            logging.error(f"すべての読み込み試行が失敗: {e}")
            return None
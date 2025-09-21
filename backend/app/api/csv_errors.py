"""
CSVインポート関連のエラーハンドリング
"""

from fastapi import HTTPException, status
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class CSVImportError:
    """CSVインポートエラーの標準化"""
    
    @staticmethod
    def file_too_large(size_mb: float) -> HTTPException:
        """ファイルサイズ超過エラー"""
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "error_type": "file_too_large",
                "message": f"ファイルサイズが大きすぎます（{size_mb:.1f}MB）",
                "max_size_mb": 10,
                "current_size_mb": round(size_mb, 1)
            }
        )
    
    @staticmethod
    def invalid_file_format(reason: str) -> HTTPException:
        """ファイル形式不正エラー"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_type": "invalid_format",
                "message": f"CSVフォーマットが不正です: {reason}",
                "supported_formats": ["Garmin形式（28カラム）", "標準形式（date,type,distance,time,intensity,notes）"]
            }
        )
    
    @staticmethod
    def encoding_error(detected: str, file_name: str = "") -> HTTPException:
        """文字コード変換エラー"""
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_type": "encoding_error",
                "message": f"文字コードの変換に失敗しました",
                "detected_encoding": detected,
                "file_name": file_name,
                "suggestion": "UTF-8またはShift-JISで保存し直してください"
            }
        )
    
    @staticmethod
    def empty_file() -> HTTPException:
        """空ファイルエラー"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_type": "empty_file",
                "message": "CSVファイルが空です",
                "suggestion": "データが含まれたCSVファイルをアップロードしてください"
            }
        )
    
    @staticmethod
    def no_csv_file() -> HTTPException:
        """CSVファイル以外エラー"""
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_type": "no_csv_file",
                "message": "CSVファイルのみサポートされています",
                "supported_extensions": [".csv"],
                "suggestion": ".csv拡張子のファイルをアップロードしてください"
            }
        )
    
    @staticmethod
    def import_failed(reason: str, row_count: int = 0) -> HTTPException:
        """インポート実行エラー"""
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_type": "import_failed",
                "message": f"インポートに失敗しました: {reason}",
                "processed_rows": row_count,
                "suggestion": "ファイル形式を確認して再試行してください"
            }
        )
    
    @staticmethod
    def validation_error(field: str, value: Any, reason: str) -> HTTPException:
        """バリデーションエラー"""
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_type": "validation_error",
                "message": f"データの検証に失敗しました",
                "field": field,
                "value": str(value),
                "reason": reason,
                "suggestion": "正しい形式でデータを入力してください"
            }
        )


class CSVImportWarning:
    """CSVインポート警告の標準化"""
    
    @staticmethod
    def garbled_columns(columns: List[str]) -> Dict[str, Any]:
        """文字化けカラム警告"""
        return {
            "type": "garbled_columns",
            "message": f"文字化けが検出されたカラムがあります: {', '.join(columns)}",
            "affected_columns": columns,
            "severity": "warning"
        }
    
    @staticmethod
    def missing_columns(expected: List[str], found: List[str]) -> Dict[str, Any]:
        """不足カラム警告"""
        missing = set(expected) - set(found)
        return {
            "type": "missing_columns",
            "message": f"期待されるカラムが見つかりません: {', '.join(missing)}",
            "missing_columns": list(missing),
            "severity": "warning"
        }
    
    @staticmethod
    def invalid_rows(count: int, total: int) -> Dict[str, Any]:
        """無効行警告"""
        return {
            "type": "invalid_rows",
            "message": f"{count}/{total}行のデータが無効です",
            "invalid_count": count,
            "total_count": total,
            "severity": "warning"
        }
    
    @staticmethod
    def encoding_detection_low_confidence(encoding: str, confidence: float) -> Dict[str, Any]:
        """エンコーディング検出信頼度低警告"""
        return {
            "type": "low_confidence_encoding",
            "message": f"エンコーディング検出の信頼度が低いです: {encoding} ({confidence:.1%})",
            "detected_encoding": encoding,
            "confidence": confidence,
            "severity": "info"
        }


def create_success_response(data: Dict[str, Any], warnings: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """成功レスポンスの標準化"""
    response = {
        "success": True,
        "data": data,
        "timestamp": data.get("timestamp"),
        "processing_time_ms": data.get("processing_time_ms", 0)
    }
    
    if warnings:
        response["warnings"] = warnings
    
    return response


def log_csv_error(error_type: str, message: str, file_name: str = "", **kwargs):
    """CSVエラーのログ出力"""
    logger.error(f"CSV {error_type}: {message} | File: {file_name} | Details: {kwargs}")

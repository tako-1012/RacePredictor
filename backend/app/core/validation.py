"""
バリデーション関連のユーティリティ
"""

import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from pydantic import BaseModel, ValidationError as PydanticValidationError
from app.core.exceptions import ValidationError

def validate_email(email: str) -> bool:
    """メールアドレスのバリデーション"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> Dict[str, Any]:
    """パスワードのバリデーション"""
    errors = []
    
    if len(password) < 8:
        errors.append("パスワードは8文字以上である必要があります")
    
    if not re.search(r'[A-Z]', password):
        errors.append("パスワードには大文字を含める必要があります")
    
    if not re.search(r'[a-z]', password):
        errors.append("パスワードには小文字を含める必要があります")
    
    if not re.search(r'\d', password):
        errors.append("パスワードには数字を含める必要があります")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("パスワードには特殊文字を含める必要があります")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_date_range(start_date: date, end_date: date) -> bool:
    """日付範囲のバリデーション"""
    return start_date <= end_date

def validate_time_format(time_str: str) -> bool:
    """時間形式のバリデーション (HH:MM:SS または MM:SS)"""
    patterns = [
        r'^\d{1,2}:\d{2}:\d{2}$',  # HH:MM:SS
        r'^\d{1,2}:\d{2}$'          # MM:SS
    ]
    return any(re.match(pattern, time_str) for pattern in patterns)

def validate_distance(distance: float, unit: str = 'meters') -> bool:
    """距離のバリデーション"""
    if unit == 'meters':
        return 0 < distance <= 42195  # フルマラソン以下
    elif unit == 'kilometers':
        return 0 < distance <= 42.195
    return False

def validate_heart_rate(heart_rate: int) -> bool:
    """心拍数のバリデーション"""
    return 30 <= heart_rate <= 220

def validate_pace(pace_seconds: float) -> bool:
    """ペースのバリデーション（秒/km）"""
    return 120 <= pace_seconds <= 1200  # 2分/km 〜 20分/km

def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """ファイルサイズのバリデーション"""
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes

def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """ファイル拡張子のバリデーション"""
    if not filename:
        return False
    
    extension = filename.lower().split('.')[-1]
    return extension in [ext.lower() for ext in allowed_extensions]

def sanitize_string(value: str, max_length: int = 1000) -> str:
    """文字列のサニタイズ"""
    if not value:
        return ""
    
    # HTMLタグを除去
    import html
    sanitized = html.escape(value)
    
    # 長さ制限
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()

def validate_csv_headers(headers: List[str], required_headers: List[str]) -> Dict[str, Any]:
    """CSVヘッダーのバリデーション"""
    missing_headers = []
    invalid_headers = []
    
    for required in required_headers:
        if required not in headers:
            missing_headers.append(required)
    
    # 無効な文字が含まれているヘッダーをチェック
    for header in headers:
        if not re.match(r'^[a-zA-Z0-9_\-\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$', header):
            invalid_headers.append(header)
    
    return {
        "valid": len(missing_headers) == 0 and len(invalid_headers) == 0,
        "missing_headers": missing_headers,
        "invalid_headers": invalid_headers
    }

def validate_pagination_params(page: int, limit: int) -> Dict[str, Any]:
    """ページネーションパラメータのバリデーション"""
    errors = []
    
    if page < 1:
        errors.append("ページ番号は1以上である必要があります")
    
    if limit < 1:
        errors.append("件数は1以上である必要があります")
    elif limit > 100:
        errors.append("件数は100以下である必要があります")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_sort_params(sort_by: str, sort_order: str, allowed_fields: List[str]) -> Dict[str, Any]:
    """ソートパラメータのバリデーション"""
    errors = []
    
    if sort_by not in allowed_fields:
        errors.append(f"ソートフィールドは {', '.join(allowed_fields)} のいずれかである必要があります")
    
    if sort_order not in ['asc', 'desc']:
        errors.append("ソート順序は 'asc' または 'desc' である必要があります")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_filter_params(filters: Dict[str, Any], allowed_filters: List[str]) -> Dict[str, Any]:
    """フィルターパラメータのバリデーション"""
    errors = []
    invalid_filters = []
    
    for key in filters.keys():
        if key not in allowed_filters:
            invalid_filters.append(key)
    
    if invalid_filters:
        errors.append(f"無効なフィルター: {', '.join(invalid_filters)}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "invalid_filters": invalid_filters
    }

def validate_pydantic_model(data: Dict[str, Any], model_class: type) -> Dict[str, Any]:
    """Pydanticモデルのバリデーション"""
    try:
        model_class(**data)
        return {"valid": True, "errors": []}
    except PydanticValidationError as e:
        errors = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            message = error["msg"]
            errors.append(f"{field}: {message}")
        
        return {"valid": False, "errors": errors}

def validate_workout_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """ワークアウトデータのバリデーション"""
    errors = []
    
    # 必須フィールドのチェック
    required_fields = ['date', 'workout_type_id', 'distance_meters']
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"{field} は必須です")
    
    # 距離のバリデーション
    if 'distance_meters' in data and data['distance_meters'] is not None:
        if not validate_distance(data['distance_meters']):
            errors.append("距離は0より大きく42195メートル以下である必要があります")
    
    # 心拍数のバリデーション
    if 'avg_heart_rate' in data and data['avg_heart_rate'] is not None:
        if not validate_heart_rate(data['avg_heart_rate']):
            errors.append("平均心拍数は30-220の範囲である必要があります")
    
    # ペースのバリデーション
    if 'avg_pace_seconds' in data and data['avg_pace_seconds'] is not None:
        if not validate_pace(data['avg_pace_seconds']):
            errors.append("平均ペースは2-20分/kmの範囲である必要があります")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def validate_race_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """レースデータのバリデーション"""
    errors = []
    
    # 必須フィールドのチェック
    required_fields = ['race_name', 'race_date', 'distance_meters', 'finish_time_seconds']
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f"{field} は必須です")
    
    # 距離のバリデーション
    if 'distance_meters' in data and data['distance_meters'] is not None:
        if not validate_distance(data['distance_meters']):
            errors.append("距離は0より大きく42195メートル以下である必要があります")
    
    # タイムのバリデーション
    if 'finish_time_seconds' in data and data['finish_time_seconds'] is not None:
        if data['finish_time_seconds'] <= 0:
            errors.append("タイムは0より大きい値である必要があります")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

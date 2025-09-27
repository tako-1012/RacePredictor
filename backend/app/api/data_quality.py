from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ..core.auth import get_current_user_id_from_token
from ..services.data_quality_service import DataQualityService, DataQualityReport, DataQualityIssue
from ..schemas.data_quality import (
    DataQualityReportResponse,
    DataQualityIssueResponse,
    DataQualityStatsResponse,
    DuplicateDetectionRequest,
    DuplicateDetectionResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()

# データ品質サービスインスタンス
data_quality_service = DataQualityService()

@router.get("/quality/report", response_model=DataQualityReportResponse)
async def get_data_quality_report(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """データ品質レポート取得"""
    try:
        # 実際の実装では、データベースからユーザーの記録を取得
        # ここではサンプルデータを使用
        sample_workout = {
            "date": "2024-12-26",
            "distance_km": 5.0,
            "time_minutes": 25.0,
            "pace_per_km": 5.0,
            "avg_heart_rate": 150,
            "max_heart_rate": 170
        }
        
        report = data_quality_service.validate_workout_data(sample_workout)
        
        return DataQualityReportResponse(
            overall_score=report.overall_score,
            level=report.level.value,
            issues=[
                DataQualityIssueResponse(
                    id=issue.id,
                    level=issue.level.value,
                    title=issue.title,
                    description=issue.description,
                    suggestion=issue.suggestion,
                    field=issue.field,
                    value=issue.value,
                    expected_range=issue.expected_range
                ) for issue in report.issues
            ],
            total_records=report.total_records,
            valid_records=report.valid_records,
            generated_at=report.generated_at.isoformat()
        )
    except Exception as e:
        logger.error(f"データ品質レポート取得エラー: {e}")
        raise HTTPException(status_code=500, detail="データ品質レポートの取得に失敗しました")

@router.get("/quality/stats", response_model=DataQualityStatsResponse)
async def get_data_quality_stats(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """データ品質統計取得"""
    try:
        # 実際の実装では、データベースから統計を計算
        return DataQualityStatsResponse(
            total_records=100,
            valid_records=95,
            warning_records=3,
            error_records=2,
            overall_score=95.0,
            weekly_trend=[
                {"date": "2024-12-20", "score": 92.0},
                {"date": "2024-12-21", "score": 94.0},
                {"date": "2024-12-22", "score": 93.0},
                {"date": "2024-12-23", "score": 95.0},
                {"date": "2024-12-24", "score": 96.0},
                {"date": "2024-12-25", "score": 94.0},
                {"date": "2024-12-26", "score": 95.0}
            ],
            common_issues=[
                {"issue": "ペースの不整合", "count": 5},
                {"issue": "心拍数の異常値", "count": 3},
                {"issue": "距離の異常値", "count": 2}
            ]
        )
    except Exception as e:
        logger.error(f"データ品質統計取得エラー: {e}")
        raise HTTPException(status_code=500, detail="データ品質統計の取得に失敗しました")

@router.post("/quality/validate", response_model=DataQualityReportResponse)
async def validate_workout_data(
    workout_data: Dict[str, Any],
    user_id: str = Depends(get_current_user_id_from_token)
):
    """練習記録データの品質検証"""
    try:
        report = data_quality_service.validate_workout_data(workout_data)
        
        return DataQualityReportResponse(
            overall_score=report.overall_score,
            level=report.level.value,
            issues=[
                DataQualityIssueResponse(
                    id=issue.id,
                    level=issue.level.value,
                    title=issue.title,
                    description=issue.description,
                    suggestion=issue.suggestion,
                    field=issue.field,
                    value=issue.value,
                    expected_range=issue.expected_range
                ) for issue in report.issues
            ],
            total_records=report.total_records,
            valid_records=report.valid_records,
            generated_at=report.generated_at.isoformat()
        )
    except Exception as e:
        logger.error(f"データ品質検証エラー: {e}")
        raise HTTPException(status_code=500, detail="データ品質検証に失敗しました")

@router.post("/duplicates/detect", response_model=DuplicateDetectionResponse)
async def detect_duplicates(
    request: DuplicateDetectionRequest,
    user_id: str = Depends(get_current_user_id_from_token)
):
    """重複記録の検出"""
    try:
        # 実際の実装では、データベースからユーザーの記録を取得して重複検出
        # ここではサンプルデータを使用
        sample_duplicates = [
            {
                "id": "1",
                "date": "2024-12-26",
                "distance_km": 5.0,
                "time_minutes": 25.0,
                "pace_per_km": 5.0,
                "workout_name": "朝練",
                "similarity_score": 0.95
            },
            {
                "id": "2",
                "date": "2024-12-26",
                "distance_km": 5.0,
                "time_minutes": 25.0,
                "pace_per_km": 5.0,
                "workout_name": "朝練",
                "similarity_score": 0.95
            }
        ]
        
        return DuplicateDetectionResponse(
            duplicate_groups=[
                {
                    "id": "group_1",
                    "records": sample_duplicates,
                    "similarity_type": "exact",
                    "suggested_action": "delete_duplicates"
                }
            ],
            total_duplicates=2,
            total_groups=1,
            scan_completed_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"重複検出エラー: {e}")
        raise HTTPException(status_code=500, detail="重複検出に失敗しました")

@router.post("/duplicates/merge")
async def merge_duplicates(
    group_id: str,
    user_id: str = Depends(get_current_user_id_from_token)
):
    """重複記録の統合"""
    try:
        # 実際の実装では、データベースで重複記録を統合
        logger.info(f"重複グループ {group_id} を統合しました")
        return {"message": "重複記録を統合しました", "group_id": group_id}
    except Exception as e:
        logger.error(f"重複統合エラー: {e}")
        raise HTTPException(status_code=500, detail="重複統合に失敗しました")

@router.delete("/duplicates/delete")
async def delete_duplicates(
    record_ids: List[str],
    user_id: str = Depends(get_current_user_id_from_token)
):
    """重複記録の削除"""
    try:
        # 実際の実装では、データベースから重複記録を削除
        logger.info(f"重複記録 {record_ids} を削除しました")
        return {"message": "重複記録を削除しました", "deleted_count": len(record_ids)}
    except Exception as e:
        logger.error(f"重複削除エラー: {e}")
        raise HTTPException(status_code=500, detail="重複削除に失敗しました")

@router.get("/quality/tips")
async def get_data_quality_tips(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """データ品質向上のヒント取得"""
    try:
        tips = data_quality_service.get_data_quality_tips()
        return {"tips": tips}
    except Exception as e:
        logger.error(f"データ品質ヒント取得エラー: {e}")
        raise HTTPException(status_code=500, detail="データ品質ヒントの取得に失敗しました")

@router.get("/quality/weekly-report", response_model=DataQualityReportResponse)
async def get_weekly_quality_report(
    user_id: str = Depends(get_current_user_id_from_token)
):
    """週次データ品質レポート取得"""
    try:
        report = data_quality_service.generate_weekly_quality_report(user_id)
        
        return DataQualityReportResponse(
            overall_score=report.overall_score,
            level=report.level.value,
            issues=[
                DataQualityIssueResponse(
                    id=issue.id,
                    level=issue.level.value,
                    title=issue.title,
                    description=issue.description,
                    suggestion=issue.suggestion,
                    field=issue.field,
                    value=issue.value,
                    expected_range=issue.expected_range
                ) for issue in report.issues
            ],
            total_records=report.total_records,
            valid_records=report.valid_records,
            generated_at=report.generated_at.isoformat()
        )
    except Exception as e:
        logger.error(f"週次データ品質レポート取得エラー: {e}")
        raise HTTPException(status_code=500, detail="週次データ品質レポートの取得に失敗しました")

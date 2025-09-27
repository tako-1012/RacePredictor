from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.workout_import_data import WorkoutImportData, IntervalAnalysis
from app.services.interval_analysis import IntervalAnalyzer
from app.schemas.interval_analysis import (
    IntervalAnalysisRequest,
    IntervalAnalysisResponse,
    CorrectionApplyRequest,
    CorrectionApplyResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=IntervalAnalysisResponse)
async def analyze_interval_data(
    request: IntervalAnalysisRequest,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """インターバルデータの分析"""
    try:
        logger.info(f"🔍 インターバル分析開始: user_id={current_user_id}")
        
        # インターバル分析の実行
        analyzer = IntervalAnalyzer()
        analysis_result = analyzer.analyze_interval_data(
            request.lap_times,
            request.lap_distances
        )
        
        # パターン検証
        pattern_validation = analyzer.validate_interval_pattern(
            request.lap_times,
            request.lap_distances
        )
        
        # 分析結果をデータベースに保存
        db_analysis = IntervalAnalysis(
            workout_import_data_id=request.workout_import_data_id,
            total_laps=analysis_result['total_laps'],
            average_lap_time=analysis_result['average_lap_time'],
            average_lap_distance=analysis_result['average_lap_distance'],
            has_anomaly=analysis_result['has_anomaly'],
            anomaly_type=analysis_result['anomaly_type'],
            anomaly_lap_index=analysis_result['anomaly_lap_index'],
            anomaly_severity=analysis_result['anomaly_severity'],
            lap_times=analysis_result['lap_times'],
            lap_distances=analysis_result['lap_distances'],
            lap_paces=analysis_result['lap_paces'],
            suggested_corrections=analysis_result['suggested_corrections']
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        # レスポンスの構築
        response_data = {
            'analysis_id': db_analysis.id,
            'total_laps': analysis_result['total_laps'],
            'average_lap_time': analysis_result['average_lap_time'],
            'average_lap_distance': analysis_result['average_lap_distance'],
            'has_anomaly': analysis_result['has_anomaly'],
            'anomaly_type': analysis_result['anomaly_type'],
            'anomaly_lap_index': analysis_result['anomaly_lap_index'],
            'anomaly_severity': analysis_result['anomaly_severity'],
            'lap_times': analysis_result['lap_times'],
            'lap_distances': analysis_result['lap_distances'],
            'lap_paces': analysis_result['lap_paces'],
            'suggested_corrections': analysis_result['suggested_corrections'],
            'pattern_validation': pattern_validation,
            'analysis_metadata': analysis_result['analysis_metadata']
        }
        
        logger.info(f"✅ インターバル分析完了: 異常={analysis_result['has_anomaly']}")
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ インターバル分析エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze interval data"
        )


@router.post("/apply-correction", response_model=CorrectionApplyResponse)
async def apply_correction(
    request: CorrectionApplyRequest,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """修正の適用"""
    try:
        logger.info(f"🔍 修正適用開始: user_id={current_user_id}, correction_type={request.correction_type}")
        
        # 元データの取得
        import_data = db.query(WorkoutImportData).filter(
            WorkoutImportData.id == request.workout_import_data_id,
            WorkoutImportData.user_id == current_user_id
        ).first()
        
        if not import_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Import data not found"
            )
        
        # 修正の適用
        analyzer = IntervalAnalyzer()
        corrected_times, corrected_distances = analyzer.apply_correction(
            import_data.raw_data.get('lap_times', []),
            import_data.raw_data.get('lap_distances', []),
            request.correction_type
        )
        
        # 修正データの保存
        processed_data = import_data.raw_data.copy()
        processed_data['lap_times'] = corrected_times
        processed_data['lap_distances'] = corrected_distances
        
        import_data.processed_data = processed_data
        import_data.modifications = {
            'correction_type': request.correction_type,
            'applied_at': None,  # 実際の実装では現在時刻を設定
            'original_lap_count': len(import_data.raw_data.get('lap_times', [])),
            'corrected_lap_count': len(corrected_times)
        }
        
        db.commit()
        
        # レスポンスの構築
        response_data = {
            'workout_import_data_id': import_data.id,
            'correction_applied': True,
            'correction_type': request.correction_type,
            'original_lap_count': len(import_data.raw_data.get('lap_times', [])),
            'corrected_lap_count': len(corrected_times),
            'corrected_times': corrected_times,
            'corrected_distances': corrected_distances,
            'modifications': import_data.modifications
        }
        
        logger.info(f"✅ 修正適用完了: {len(corrected_times)}ラップ")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 修正適用エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply correction"
        )


@router.get("/analysis/{analysis_id}", response_model=IntervalAnalysisResponse)
async def get_analysis_result(
    analysis_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """分析結果の取得"""
    try:
        analysis = db.query(IntervalAnalysis).join(WorkoutImportData).filter(
            IntervalAnalysis.id == analysis_id,
            WorkoutImportData.user_id == current_user_id
        ).first()
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        return {
            'analysis_id': analysis.id,
            'total_laps': analysis.total_laps,
            'average_lap_time': analysis.average_lap_time,
            'average_lap_distance': analysis.average_lap_distance,
            'has_anomaly': analysis.has_anomaly,
            'anomaly_type': analysis.anomaly_type,
            'anomaly_lap_index': analysis.anomaly_lap_index,
            'anomaly_severity': analysis.anomaly_severity,
            'lap_times': analysis.lap_times,
            'lap_distances': analysis.lap_distances,
            'lap_paces': analysis.lap_paces,
            'suggested_corrections': analysis.suggested_corrections,
            'pattern_validation': {
                'pattern_type': 'unknown',
                'is_valid': True,
                'description': '分析済みデータ'
            },
            'analysis_metadata': {
                'confidence': 0.9,
                'description': '保存済みの分析結果',
                'analysis_timestamp': analysis.analysis_timestamp.isoformat() if analysis.analysis_timestamp else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 分析結果取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analysis result"
        )


@router.post("/set-user-choice")
async def set_user_choice(
    workout_import_data_id: str,
    user_choice: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザーの選択（元データ vs 修正データ）を設定"""
    try:
        if user_choice not in ['raw', 'processed']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User choice must be 'raw' or 'processed'"
            )
        
        import_data = db.query(WorkoutImportData).filter(
            WorkoutImportData.id == workout_import_data_id,
            WorkoutImportData.user_id == current_user_id
        ).first()
        
        if not import_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Import data not found"
            )
        
        import_data.user_choice = user_choice
        db.commit()
        
        return {
            'message': f'User choice set to {user_choice}',
            'workout_import_data_id': workout_import_data_id,
            'user_choice': user_choice
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ ユーザー選択設定エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set user choice"
        )

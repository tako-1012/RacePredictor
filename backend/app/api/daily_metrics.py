from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, and_
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from uuid import UUID
import logging
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.daily_metrics import DailyMetrics, WeeklyMetricsSummary, MonthlyMetricsSummary
from app.schemas.daily_metrics import (
    DailyMetricsCreate,
    DailyMetricsUpdate,
    DailyMetricsResponse,
    DailyMetricsListResponse,
    WeeklyMetricsSummaryResponse,
    MonthlyMetricsSummaryResponse,
    MetricsTrendResponse,
    HealthInsightsResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


def convert_daily_metrics_to_response(metrics: DailyMetrics) -> dict:
    """DailyMetricsオブジェクトをレスポンス用の辞書に変換"""
    return {
        "id": metrics.id,
        "user_id": metrics.user_id,
        "date": metrics.date,
        "weight_kg": metrics.weight_kg,
        "body_fat_percentage": metrics.body_fat_percentage,
        "muscle_mass_kg": metrics.muscle_mass_kg,
        "sleep_duration_hours": metrics.sleep_duration_hours,
        "sleep_quality_score": metrics.sleep_quality_score,
        "bedtime": metrics.bedtime,
        "wake_time": metrics.wake_time,
        "fatigue_level": metrics.fatigue_level,
        "motivation_level": metrics.motivation_level,
        "stress_level": metrics.stress_level,
        "energy_level": metrics.energy_level,
        "training_readiness": metrics.training_readiness,
        "recovery_status": metrics.recovery_status,
        "resting_heart_rate": metrics.resting_heart_rate,
        "blood_pressure_systolic": metrics.blood_pressure_systolic,
        "blood_pressure_diastolic": metrics.blood_pressure_diastolic,
        "notes": metrics.notes,
        "mood_tags": metrics.mood_tags,
        "is_estimated": metrics.is_estimated,
        "data_source": metrics.data_source,
        "created_at": metrics.created_at.isoformat(),
        "updated_at": metrics.updated_at.isoformat()
    }


@router.get("/", response_model=DailyMetricsListResponse)
async def get_daily_metrics(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """毎日のコンディション記録一覧取得"""
    try:
        logger.info(f"🔍 毎日のコンディション記録一覧取得開始: user_id={current_user_id}")
        
        # オフセット計算
        offset = (page - 1) * limit
        
        # クエリ構築
        query = db.query(DailyMetrics).filter(DailyMetrics.user_id == current_user_id)
        
        if start_date:
            query = query.filter(DailyMetrics.date >= start_date)
        if end_date:
            query = query.filter(DailyMetrics.date <= end_date)
        
        # ソート（日付の降順）
        query = query.order_by(desc(DailyMetrics.date))
        
        # ページネーション
        metrics = query.offset(offset).limit(limit).all()
        
        # 総数取得
        total = query.count()
        
        logger.info(f"✅ 毎日のコンディション記録一覧取得成功: {len(metrics)}件")
        
        # レスポンス用に変換
        metrics_responses = [convert_daily_metrics_to_response(metric) for metric in metrics]
        
        return {
            "items": metrics_responses,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"❌ 毎日のコンディション記録一覧取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch daily metrics"
        )


@router.post("/", response_model=DailyMetricsResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_metrics(
    metrics_data: DailyMetricsCreate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """毎日のコンディション記録作成"""
    try:
        logger.info(f"🔍 毎日のコンディション記録作成開始: user_id={current_user_id}, date={metrics_data.date}")
        
        # 同じ日付の記録が既に存在するかチェック
        existing = db.query(DailyMetrics).filter(
            DailyMetrics.user_id == current_user_id,
            DailyMetrics.date == metrics_data.date
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Daily metrics for this date already exist"
            )
        
        # 新しい記録作成
        db_metrics = DailyMetrics(
            user_id=current_user_id,
            date=metrics_data.date,
            weight_kg=metrics_data.weight_kg,
            body_fat_percentage=metrics_data.body_fat_percentage,
            muscle_mass_kg=metrics_data.muscle_mass_kg,
            sleep_duration_hours=metrics_data.sleep_duration_hours,
            sleep_quality_score=metrics_data.sleep_quality_score,
            bedtime=metrics_data.bedtime,
            wake_time=metrics_data.wake_time,
            fatigue_level=metrics_data.fatigue_level,
            motivation_level=metrics_data.motivation_level,
            stress_level=metrics_data.stress_level,
            energy_level=metrics_data.energy_level,
            training_readiness=metrics_data.training_readiness,
            recovery_status=metrics_data.recovery_status,
            resting_heart_rate=metrics_data.resting_heart_rate,
            blood_pressure_systolic=metrics_data.blood_pressure_systolic,
            blood_pressure_diastolic=metrics_data.blood_pressure_diastolic,
            notes=metrics_data.notes,
            mood_tags=metrics_data.mood_tags,
            data_source="manual"
        )
        
        db.add(db_metrics)
        db.commit()
        db.refresh(db_metrics)
        
        logger.info(f"✅ 毎日のコンディション記録作成成功: metrics_id={db_metrics.id}")
        
        return convert_daily_metrics_to_response(db_metrics)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 毎日のコンディション記録作成エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create daily metrics"
        )


@router.get("/{metrics_id}", response_model=DailyMetricsResponse)
async def get_daily_metrics_by_id(
    metrics_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """毎日のコンディション記録詳細取得"""
    try:
        metrics = db.query(DailyMetrics).filter(
            DailyMetrics.id == metrics_id,
            DailyMetrics.user_id == current_user_id
        ).first()
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Daily metrics not found"
            )
        
        return convert_daily_metrics_to_response(metrics)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 毎日のコンディション記録詳細取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch daily metrics"
        )


@router.put("/{metrics_id}", response_model=DailyMetricsResponse)
async def update_daily_metrics(
    metrics_id: str,
    metrics_data: DailyMetricsUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """毎日のコンディション記録更新"""
    try:
        metrics = db.query(DailyMetrics).filter(
            DailyMetrics.id == metrics_id,
            DailyMetrics.user_id == current_user_id
        ).first()
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Daily metrics not found"
            )
        
        # 更新データを適用
        update_data = metrics_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(metrics, field, value)
        
        db.commit()
        db.refresh(metrics)
        
        return convert_daily_metrics_to_response(metrics)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 毎日のコンディション記録更新エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update daily metrics"
        )


@router.delete("/{metrics_id}")
async def delete_daily_metrics(
    metrics_id: str,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """毎日のコンディション記録削除"""
    try:
        metrics = db.query(DailyMetrics).filter(
            DailyMetrics.id == metrics_id,
            DailyMetrics.user_id == current_user_id
        ).first()
        
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Daily metrics not found"
            )
        
        db.delete(metrics)
        db.commit()
        
        return {"message": "Daily metrics deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 毎日のコンディション記録削除エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete daily metrics"
        )


@router.get("/trends", response_model=MetricsTrendResponse)
async def get_metrics_trends(
    days: int = Query(30, ge=7, le=365),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """メトリクストレンド取得"""
    try:
        logger.info(f"🔍 メトリクストレンド取得開始: user_id={current_user_id}, days={days}")
        
        # 期間の計算
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)
        
        # データ取得
        metrics = db.query(DailyMetrics).filter(
            DailyMetrics.user_id == current_user_id,
            DailyMetrics.date >= start_date,
            DailyMetrics.date <= end_date
        ).order_by(asc(DailyMetrics.date)).all()
        
        # レスポンス用データの構築
        dates = []
        weight_kg = []
        sleep_duration_hours = []
        fatigue_level = []
        motivation_level = []
        stress_level = []
        energy_level = []
        training_readiness = []
        resting_heart_rate = []
        
        # 日付の範囲を生成
        current_date = start_date
        while current_date <= end_date:
            dates.append(current_date.isoformat())
            
            # その日のデータを検索
            day_metrics = next((m for m in metrics if m.date == current_date), None)
            
            if day_metrics:
                weight_kg.append(day_metrics.weight_kg)
                sleep_duration_hours.append(day_metrics.sleep_duration_hours)
                fatigue_level.append(day_metrics.fatigue_level)
                motivation_level.append(day_metrics.motivation_level)
                stress_level.append(day_metrics.stress_level)
                energy_level.append(day_metrics.energy_level)
                training_readiness.append(day_metrics.training_readiness)
                resting_heart_rate.append(day_metrics.resting_heart_rate)
            else:
                weight_kg.append(None)
                sleep_duration_hours.append(None)
                fatigue_level.append(None)
                motivation_level.append(None)
                stress_level.append(None)
                energy_level.append(None)
                training_readiness.append(None)
                resting_heart_rate.append(None)
            
            current_date += timedelta(days=1)
        
        logger.info(f"✅ メトリクストレンド取得成功: {len(dates)}日分")
        
        return {
            "dates": dates,
            "weight_kg": weight_kg,
            "sleep_duration_hours": sleep_duration_hours,
            "fatigue_level": fatigue_level,
            "motivation_level": motivation_level,
            "stress_level": stress_level,
            "energy_level": energy_level,
            "training_readiness": training_readiness,
            "resting_heart_rate": resting_heart_rate
        }
        
    except Exception as e:
        logger.error(f"❌ メトリクストレンド取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch metrics trends"
        )


@router.get("/weekly-summary/{week_start_date}", response_model=WeeklyMetricsSummaryResponse)
async def get_weekly_summary(
    week_start_date: date,
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """週間サマリー取得"""
    try:
        logger.info(f"🔍 週間サマリー取得開始: user_id={current_user_id}, week_start_date={week_start_date}")
        
        # 週の終了日を計算（日曜日）
        week_end_date = week_start_date + timedelta(days=6)
        
        # 週間データを取得
        weekly_metrics = db.query(DailyMetrics).filter(
            DailyMetrics.user_id == current_user_id,
            DailyMetrics.date >= week_start_date,
            DailyMetrics.date <= week_end_date
        ).all()
        
        if not weekly_metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data found for this week"
            )
        
        # 週間平均値を計算
        avg_weight_kg = None
        avg_sleep_duration_hours = None
        avg_fatigue_level = None
        avg_motivation_level = None
        avg_stress_level = None
        avg_energy_level = None
        avg_training_readiness = None
        avg_resting_heart_rate = None
        
        # 各メトリクスの平均値を計算
        weights = [m.weight_kg for m in weekly_metrics if m.weight_kg is not None]
        if weights:
            avg_weight_kg = sum(weights) / len(weights)
        
        sleep_hours = [m.sleep_duration_hours for m in weekly_metrics if m.sleep_duration_hours is not None]
        if sleep_hours:
            avg_sleep_duration_hours = sum(sleep_hours) / len(sleep_hours)
        
        fatigue_levels = [m.fatigue_level for m in weekly_metrics if m.fatigue_level is not None]
        if fatigue_levels:
            avg_fatigue_level = sum(fatigue_levels) / len(fatigue_levels)
        
        motivation_levels = [m.motivation_level for m in weekly_metrics if m.motivation_level is not None]
        if motivation_levels:
            avg_motivation_level = sum(motivation_levels) / len(motivation_levels)
        
        stress_levels = [m.stress_level for m in weekly_metrics if m.stress_level is not None]
        if stress_levels:
            avg_stress_level = sum(stress_levels) / len(stress_levels)
        
        energy_levels = [m.energy_level for m in weekly_metrics if m.energy_level is not None]
        if energy_levels:
            avg_energy_level = sum(energy_levels) / len(energy_levels)
        
        training_readiness_levels = [m.training_readiness for m in weekly_metrics if m.training_readiness is not None]
        if training_readiness_levels:
            avg_training_readiness = sum(training_readiness_levels) / len(training_readiness_levels)
        
        resting_heart_rates = [m.resting_heart_rate for m in weekly_metrics if m.resting_heart_rate is not None]
        if resting_heart_rates:
            avg_resting_heart_rate = sum(resting_heart_rates) / len(resting_heart_rates)
        
        # データ完全性を計算
        total_possible_data_points = len(weekly_metrics) * 8  # 8つの主要メトリクス
        actual_data_points = sum([
            len(weights),
            len(sleep_hours),
            len(fatigue_levels),
            len(motivation_levels),
            len(stress_levels),
            len(energy_levels),
            len(training_readiness_levels),
            len(resting_heart_rates)
        ])
        data_completeness = actual_data_points / total_possible_data_points if total_possible_data_points > 0 else 0
        
        logger.info(f"✅ 週間サマリー取得成功: {len(weekly_metrics)}日分")
        
        return {
            "id": f"weekly_{week_start_date}_{current_user_id}",
            "user_id": current_user_id,
            "week_start_date": week_start_date,
            "week_end_date": week_end_date,
            "avg_weight_kg": avg_weight_kg,
            "avg_sleep_duration_hours": avg_sleep_duration_hours,
            "avg_fatigue_level": avg_fatigue_level,
            "avg_motivation_level": avg_motivation_level,
            "avg_stress_level": avg_stress_level,
            "avg_energy_level": avg_energy_level,
            "avg_training_readiness": avg_training_readiness,
            "avg_resting_heart_rate": avg_resting_heart_rate,
            "weight_trend": None,  # 実装予定
            "sleep_trend": None,  # 実装予定
            "fatigue_trend": None,  # 実装予定
            "motivation_trend": None,  # 実装予定
            "data_completeness": data_completeness,
            "days_recorded": len(weekly_metrics),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 週間サマリー取得エラー: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch weekly summary"
        )

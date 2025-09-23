from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate, PredictionResponse, PredictionResult
from app.services.prediction_engine import PredictionEngine

router = APIRouter()


@router.post("/calculate", response_model=PredictionResult)
async def calculate_prediction(
    prediction_data: PredictionCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """予測計算"""
    try:
        # 予測エンジン初期化
        engine = PredictionEngine(db)

        # 予測計算実行
        predicted_time, confidence, base_info = engine.predict_time(
            current_user,
            prediction_data.target_event
        )

        # 予測結果をDBに保存
        db_prediction = Prediction(
            user_id=current_user,
            prediction_date=date.today(),
            target_event=prediction_data.target_event.value,
            predicted_time_seconds=predicted_time,
            confidence_level=confidence,
            model_version="v1_statistical",
            base_workouts=base_info
        )

        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)

        return PredictionResult(
            predicted_time_seconds=predicted_time,
            confidence_level=confidence,
            base_info=base_info
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate prediction"
        )


@router.get("/", response_model=List[PredictionResponse])
async def get_predictions(
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ユーザーの予測履歴取得"""
    try:
        predictions = (
            db.query(Prediction)
            .filter(Prediction.user_id == current_user)
            .order_by(desc(Prediction.created_at))
            .all()
        )

        return predictions

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch predictions"
        )
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
from app.services.ai_prediction_engine import AIPredictionEngine
from app.services.model_training_service import ModelTrainingService

router = APIRouter()


@router.post("/calculate", response_model=PredictionResult)
async def calculate_prediction(
    prediction_data: PredictionCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """AI予測計算"""
    try:
        # AI予測エンジンを優先使用
        ai_engine = AIPredictionEngine(db)
        
        try:
            # AI予測を試行
            predicted_time, confidence, base_info = ai_engine.predict_time(
                current_user,
                prediction_data.target_event
            )
            model_version = "v2_ai_ensemble"
        except Exception as ai_error:
            # AI予測が失敗した場合は統計的予測にフォールバック
            engine = PredictionEngine(db)
            predicted_time, confidence, base_info = engine.predict_time(
                current_user,
                prediction_data.target_event
            )
            model_version = "v1_statistical_fallback"

        # 予測結果をDBに保存
        db_prediction = Prediction(
            user_id=current_user,
            prediction_date=date.today(),
            target_event=prediction_data.target_event.value,
            predicted_time_seconds=predicted_time,
            confidence_level=confidence,
            model_version=model_version,
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


@router.post("/train-model")
async def train_model(
    target_event: str,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """機械学習モデルの学習"""
    try:
        # 管理者権限チェック（簡易実装）
        # 実際の実装では適切な権限管理を行う
        
        training_service = ModelTrainingService(db)
        
        # TargetEventEnumに変換
        try:
            event_enum = TargetEventEnum(target_event)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target event: {target_event}"
            )
        
        # モデル学習実行
        result = training_service.train_models_for_event(event_enum)
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train model: {str(e)}"
        )


@router.get("/model-performance/{target_event}")
async def get_model_performance(
    target_event: str,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """モデルの性能情報を取得"""
    try:
        training_service = ModelTrainingService(db)
        
        # TargetEventEnumに変換
        try:
            event_enum = TargetEventEnum(target_event)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target event: {target_event}"
            )
        
        performance = training_service.get_model_performance(event_enum)
        
        return performance

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model performance: {str(e)}"
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
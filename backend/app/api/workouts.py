from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import date
from uuid import UUID
import json
import logging
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.workout import Workout, WorkoutType
from app.schemas.workout import WorkoutCreate, WorkoutUpdate, WorkoutResponse
from app.services.csv_import import CSVImportService
from app.api.csv_errors import CSVImportError, CSVImportWarning, create_success_response, log_csv_error

router = APIRouter()


@router.get("/", response_model=List[WorkoutResponse])
async def get_workouts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ワークアウト一覧取得"""
    try:
        workouts = (
            db.query(Workout)
            .filter(Workout.user_id == current_user)
            .order_by(desc(Workout.date), desc(Workout.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return workouts

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workouts"
        )


@router.post("/", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_data: WorkoutCreate,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ワークアウト作成"""
    try:
        # 日付バリデーション（今日以前）
        if workout_data.date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workout date cannot be in the future"
            )

        # 練習種別存在チェック
        workout_type = db.query(WorkoutType).filter(
            WorkoutType.id == workout_data.workout_type_id
        ).first()

        if not workout_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout type not found"
            )

        # times_secondsのバリデーション
        if workout_data.times_seconds:
            if any(time <= 0 for time in workout_data.times_seconds):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All times must be positive numbers"
                )

        # ワークアウト作成
        db_workout = Workout(
            user_id=current_user,
            date=workout_data.date,
            workout_type_id=workout_data.workout_type_id,
            distance_meters=workout_data.distance_meters,
            times_seconds=workout_data.times_seconds,
            repetitions=workout_data.repetitions,
            rest_type=workout_data.rest_type,
            rest_duration=workout_data.rest_duration,
            intensity=workout_data.intensity,
            notes=workout_data.notes
        )

        db.add(db_workout)
        db.commit()
        db.refresh(db_workout)

        return db_workout

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workout"
        )


@router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout(
    workout_id: str,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ワークアウト詳細取得"""
    try:
        # UUID変換
        try:
            workout_uuid = UUID(workout_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workout ID format"
            )

        workout = (
            db.query(Workout)
            .filter(
                Workout.id == workout_uuid,
                Workout.user_id == current_user
            )
            .first()
        )

        if not workout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout not found"
            )

        return workout

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workout"
        )


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: str,
    workout_data: WorkoutUpdate,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ワークアウト更新"""
    try:
        # UUID変換
        try:
            workout_uuid = UUID(workout_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workout ID format"
            )

        # ワークアウト存在確認
        db_workout = (
            db.query(Workout)
            .filter(
                Workout.id == workout_uuid,
                Workout.user_id == current_user
            )
            .first()
        )

        if not db_workout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout not found"
            )

        # 日付バリデーション
        if workout_data.date and workout_data.date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workout date cannot be in the future"
            )

        # 練習種別存在チェック
        if workout_data.workout_type_id:
            workout_type = db.query(WorkoutType).filter(
                WorkoutType.id == workout_data.workout_type_id
            ).first()
            if not workout_type:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Workout type not found"
                )

        # times_secondsのバリデーション
        if workout_data.times_seconds:
            if any(time <= 0 for time in workout_data.times_seconds):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All times must be positive numbers"
                )

        # 更新データ適用
        update_data = workout_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_workout, field, value)

        db.commit()
        db.refresh(db_workout)

        return db_workout

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update workout"
        )


@router.delete("/{workout_id}")
async def delete_workout(
    workout_id: str,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ワークアウト削除"""
    try:
        # UUID変換
        try:
            workout_uuid = UUID(workout_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workout ID format"
            )

        # ワークアウト存在確認（削除権限チェック）
        db_workout = (
            db.query(Workout)
            .filter(
                Workout.id == workout_uuid,
                Workout.user_id == current_user
            )
            .first()
        )

        if not db_workout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout not found"
            )

        db.delete(db_workout)
        db.commit()

        return {"message": "Workout deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete workout"
        )


@router.get("/date/{workout_date}", response_model=List[WorkoutResponse])
async def get_workouts_by_date(
    workout_date: date,
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """特定日のワークアウト取得"""
    try:
        workouts = (
            db.query(Workout)
            .filter(
                Workout.date == workout_date,
                Workout.user_id == current_user
            )
            .order_by(Workout.created_at)
            .all()
        )

        return workouts

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workouts for date"
        )


@router.post("/import/csv")
async def import_csv_preview(
    file: UploadFile = File(...),
    current_user: UUID = Depends(get_current_user)
):
    """CSVファイルプレビュー（強化版エラーハンドリング）"""
    try:
        # ファイルサイズチェック (10MB制限)
        file_content = await file.read()
        size_mb = len(file_content) / (1024 * 1024)
        
        if size_mb > 10:
            log_csv_error("file_too_large", f"File size: {size_mb:.1f}MB", file.filename or "unknown")
            raise CSVImportError.file_too_large(size_mb)

        # CSVファイルチェック
        if not file.filename or not file.filename.lower().endswith('.csv'):
            log_csv_error("no_csv_file", "Non-CSV file uploaded", file.filename or "unknown")
            raise CSVImportError.no_csv_file()

        # 空ファイルチェック
        if len(file_content) == 0:
            log_csv_error("empty_file", "Empty file uploaded", file.filename or "unknown")
            raise CSVImportError.empty_file()

        # CSVインポートサービス
        csv_service = CSVImportService()
        success, message, preview_info = csv_service.preview_data(file_content)

        if not success:
            log_csv_error("preview_failed", message, file.filename or "unknown")
            raise CSVImportError.invalid_file_format(message)

        # 成功レスポンスの作成
        response_data = {
            "message": message,
            "preview": preview_info.get('sample_data', [])[:10],  # 最初の10件
            "statistics": {
                "total_rows": preview_info.get('total_rows', 0),
                "valid_rows": preview_info.get('valid_rows', 0),
                "invalid_rows": preview_info.get('invalid_rows', 0),
                "detected_encoding": preview_info.get('encoding', 'unknown'),
                "detected_format": preview_info.get('format', 'unknown'),
                "columns_count": len(preview_info.get('columns', [])),
                "processing_time_ms": preview_info.get('processing_time_ms', 0)
            },
            "warnings": preview_info.get('warnings', []),
            "lap_analysis": preview_info.get('lap_analysis', []),
            "dash_count": preview_info.get('dash_count', 0)
        }

        return create_success_response(response_data, preview_info.get('warnings', []))

    except HTTPException:
        raise
    except Exception as e:
        log_csv_error("unexpected_error", str(e), file.filename or "unknown")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_type": "unexpected_error",
                "message": "予期しないエラーが発生しました",
                "details": str(e),
                "suggestion": "ファイル形式を確認して再試行してください"
            }
        )


@router.post("/import/confirm")
async def import_csv_confirm(
    file: UploadFile = File(...),
    workout_date: str = Form(...),
    workout_type_id: str = Form(...),
    intensity: int = Form(...),
    current_user: UUID = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """CSVインポート実行（強化版エラーハンドリング）"""
    try:
        # バリデーション
        try:
            import_date = date.fromisoformat(workout_date)
        except ValueError:
            raise CSVImportError.validation_error("workout_date", workout_date, "日付形式が不正です（YYYY-MM-DD）")

        # 練習種別存在チェック - UUID変換
        try:
            workout_type_uuid = UUID(workout_type_id)
        except (ValueError, TypeError):
            raise CSVImportError.validation_error("workout_type_id", workout_type_id, "UUID形式が不正です")

        workout_type = db.query(WorkoutType).filter(
            WorkoutType.id == workout_type_uuid
        ).first()
        if not workout_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_type": "workout_type_not_found",
                    "message": "練習種別が見つかりません",
                    "workout_type_id": workout_type_id,
                    "suggestion": "有効な練習種別を選択してください"
                }
            )

        # 強度チェック
        if not (1 <= intensity <= 5):
            raise CSVImportError.validation_error("intensity", intensity, "強度は1-5の範囲で入力してください")

        # ファイル読み込み
        file_content = await file.read()
        
        # ファイルサイズチェック
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > 10:
            log_csv_error("file_too_large", f"File size: {size_mb:.1f}MB", file.filename or "unknown")
            raise CSVImportError.file_too_large(size_mb)

        # CSVインポート
        csv_service = CSVImportService()
        success, message, processed_data = csv_service.import_csv(file_content, file.filename)

        if not success:
            log_csv_error("import_failed", message, file.filename or "unknown")
            raise CSVImportError.import_failed(message, len(processed_data))

        # ワークアウトデータ作成
        created_workouts = []
        failed_workouts = []
        
        for i, data in enumerate(processed_data):
            try:
                # 基本データ
                workout = Workout(
                    user_id=current_user,
                    date=import_date,
                    workout_type_id=workout_type_uuid,
                    distance_meters=data.get('distance_meters'),
                    times_seconds=data.get('times_seconds'),
                    repetitions=data.get('repetitions', 1),
                    intensity=intensity,
                    notes=data.get('notes', ''),
                    extended_data=data.get('extended_data')
                )

                db.add(workout)
                created_workouts.append(workout)
                
            except Exception as e:
                logging.warning(f"ワークアウト作成失敗 (行 {i+1}): {str(e)}")
                failed_workouts.append({
                    "row": i + 1,
                    "error": str(e),
                    "data": data
                })

        db.commit()

        # レスポンス作成
        response_data = {
            "message": f"{len(created_workouts)}件のワークアウトをインポートしました",
            "statistics": {
                "total_processed": len(processed_data),
                "successful_imports": len(created_workouts),
                "failed_imports": len(failed_workouts),
                "workout_date": import_date.isoformat(),
                "workout_type": workout_type.name,
                "intensity": intensity
            },
            "workouts": [str(w.id) for w in created_workouts],
            "failed_workouts": failed_workouts if failed_workouts else None
        }

        # 警告の作成
        warnings = []
        if failed_workouts:
            warnings.append({
                "type": "partial_import_failure",
                "message": f"{len(failed_workouts)}件のワークアウトのインポートに失敗しました",
                "failed_count": len(failed_workouts),
                "severity": "warning"
            })

        return create_success_response(response_data, warnings)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_csv_error("unexpected_error", str(e), file.filename or "unknown")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_type": "unexpected_error",
                "message": "予期しないエラーが発生しました",
                "details": str(e),
                "suggestion": "ファイル形式を確認して再試行してください"
            }
        )
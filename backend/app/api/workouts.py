from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any
from datetime import date
from uuid import UUID
import json
import logging
from app.core.database import get_db
from app.core.security import get_current_user_from_token
from app.models.workout import Workout, WorkoutType
from app.schemas.workout import WorkoutCreate, WorkoutUpdate, WorkoutResponse, WorkoutListResponse
from app.services.csv_import import CSVImportService
from app.api.csv_errors import CSVImportError, CSVImportWarning, create_success_response, log_csv_error

def calculate_duration_seconds(times_seconds: Optional[List[float]]) -> Optional[float]:
    """times_seconds配列から総時間を計算"""
    if not times_seconds:
        return None
    return sum(times_seconds)


def convert_workout_to_response(workout: Workout, db: Session) -> dict:
    """Workoutオブジェクトをレスポンス用の辞書に変換"""
    try:
        # 実際のデータがある場合はそれを使用、なければ目標データを使用
        distance_meters = workout.actual_distance_meters or workout.target_distance_meters or 0
        times_seconds = workout.actual_times_seconds or workout.target_times_seconds or []
        
        # workout_type_nameを確実に取得
        workout_type_name = "その他"
        try:
            if hasattr(workout, 'workout_type') and workout.workout_type:
                workout_type_name = workout.workout_type.name
            elif workout.workout_type_id:
                # workout_type_idがある場合は、WorkoutTypeテーブルから取得を試行
                workout_type = db.query(WorkoutType).filter(WorkoutType.id == workout.workout_type_id).first()
                if workout_type:
                    workout_type_name = workout_type.name
        except Exception as e:
            logger.warning(f"⚠️ WorkoutType取得エラー: {e}")
            workout_type_name = "その他"
        
        # 英語の識別子を日本語の表示名に変換
        type_display_map = {
            'easy_run': 'イージーラン',
            'long_run': 'ロング走',
            'tempo_run': 'テンポ走',
            'interval': 'インターバル走',
            'repetition': 'レペティション',
            'fartlek': 'ファルトレク',
            'hill_training': '坂道練習',
            'strength': '筋力トレーニング',
            'recovery': '回復走',
            'other': 'その他'
        }
        
        workout_type_display = type_display_map.get(workout_type_name, workout_type_name)
        
        logger.info(f"🏃‍♂️ 練習種別名: {workout_type_name} -> {workout_type_display}")
        logger.info(f"📊 ワークアウトデータ - ID: {workout.id}, Date: {workout.date}, Type: {workout_type_display}, Intensity: {workout.intensity}")
        
        workout_dict = {
            "id": str(workout.id),
            "user_id": str(workout.user_id),
            "date": workout.date.isoformat() if workout.date else None,
            "workout_date": workout.date.isoformat() if workout.date else None,  # ISO形式の文字列に変換
            "workout_type_id": str(workout.workout_type_id) if workout.workout_type_id else None,
            "workout_type_name": workout_type_display,  # 日本語表示名
            "workout_type": workout_type_display,  # フロントエンド用の互換性フィールド
            "distance_meters": distance_meters,
            "times_seconds": times_seconds,
            "repetitions": workout.repetitions,
            "rest_type": workout.rest_type,
            "rest_duration": workout.rest_duration,
            "intensity": workout.intensity,
            "notes": workout.notes,
            "created_at": workout.created_at.isoformat() if workout.created_at else None,  # ISO形式の文字列に変換
            "duration_seconds": calculate_duration_seconds(times_seconds),
            # 新しいフィールドも含める
            "target_distance_meters": workout.target_distance_meters,
            "target_times_seconds": workout.target_times_seconds,
            "actual_distance_meters": workout.actual_distance_meters,
            "actual_times_seconds": workout.actual_times_seconds,
            "completed": workout.completed,
            "completion_rate": workout.completion_rate,
            # セッションデータ（extended_dataから）
            "session_data": workout.extended_data.get('session_data', []) if isinstance(workout.extended_data, dict) and workout.extended_data else [],
            # 後方互換性のためのフィールド
            "distances_km": [distance_meters / 1000] if distance_meters else [],
            "total_distance": distance_meters / 1000 if distance_meters else 0
        }
        
        logger.info(f"📊 変換されたワークアウトデータ: {workout_dict}")
        return workout_dict
        
    except Exception as e:
        logger.error(f"❌ ワークアウト変換エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        # エラー時は最小限のデータを返す
        return {
            "id": str(workout.id),
            "user_id": str(workout.user_id),
            "date": workout.date.isoformat() if workout.date else None,
            "workout_type": "その他",
            "distance_meters": 0,
            "times_seconds": [],
            "notes": workout.notes,
            "error": "データ変換中にエラーが発生しました"
        }


logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=WorkoutListResponse)
async def get_workouts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("date", pattern="^(date|distance_meters|times_seconds)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ワークアウト一覧取得"""
    try:
        logger.info(f"🔍 ワークアウト一覧取得開始: user_id={current_user_id}, page={page}, limit={limit}")
        
        # オフセット計算
        offset = (page - 1) * limit
        
        # ソート順の決定
        if sort_order == "desc":
            order_by = desc(getattr(Workout, sort_by))
        else:
            order_by = asc(getattr(Workout, sort_by))
        
        # クエリ実行
        workouts = db.query(Workout).filter(
            Workout.user_id == current_user_id
        ).order_by(order_by).offset(offset).limit(limit).all()
        
        # 総数取得
        total = db.query(Workout).filter(
            Workout.user_id == current_user_id
        ).count()
        
        logger.info(f"✅ ワークアウト一覧取得成功: {len(workouts)}件")
        
        # レスポンス用に変換
        workout_responses = [convert_workout_to_response(workout, db) for workout in workouts]
        
        return {
            "items": workout_responses,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }

    except Exception as e:
        logger.error(f"❌ ワークアウト一覧取得エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        # エラー時でも一貫したレスポンス構造を返す
        return {
            "items": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "error": str(e)
        }


@router.post("/", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_data: WorkoutCreate,
    current_user_id: str = Depends(get_current_user_from_token),
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
            WorkoutType.id == str(workout_data.workout_type_id)
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
            user_id=current_user_id,
            date=workout_data.date,
            workout_type_id=str(workout_data.workout_type_id),
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

        return convert_workout_to_response(db_workout, db)

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
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """ワークアウト詳細取得"""
    try:
        logger.info(f"🔍 ワークアウト詳細取得開始: workout_id={workout_id}, user_id={current_user_id}")
        
        # UUID形式の検証（文字列として保存されているため、文字列として比較）
        try:
            UUID(workout_id)  # 形式チェックのみ
        except ValueError:
            logger.warning(f"❌ 無効なワークアウトID形式: {workout_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid workout ID format"
            )

        workout = (
            db.query(Workout)
            .filter(
                Workout.id == workout_id,  # 文字列として比較
                Workout.user_id == current_user_id
            )
            .first()
        )

        if not workout:
            logger.warning(f"❌ ワークアウトが見つかりません: workout_id={workout_id}, user_id={current_user_id}")
            # デバッグ用: 該当ユーザーの全ワークアウトを確認
            user_workouts = db.query(Workout).filter(Workout.user_id == current_user_id).all()
            logger.info(f"🔍 ユーザーの全ワークアウト: {len(user_workouts)}件")
            for w in user_workouts:
                logger.info(f"  - ID: {w.id}, Date: {w.date}, Type: {w.workout_type_id}")
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout not found"
            )

        logger.info(f"✅ ワークアウト詳細取得成功: {workout_id}")
        logger.info(f"🏃‍♂️ 練習種別ID: {workout.workout_type_id}")
        logger.info(f"📝 拡張データ: {workout.extended_data}")
        
        try:
            response_data = convert_workout_to_response(workout, db)
            logger.info(f"📊 レスポンスデータ作成成功")
            return response_data
        except Exception as e:
            logger.error(f"❌ レスポンスデータ作成エラー: {e}")
            import traceback
            logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process workout data"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ワークアウト詳細取得エラー: {e}")
        logger.error(f"❌ エラー詳細: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"❌ スタックトレース: {traceback.format_exc()}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workout"
        )


@router.put("/{workout_id}", response_model=WorkoutResponse)
async def update_workout(
    workout_id: str,
    workout_data: WorkoutUpdate,
    current_user_id: str = Depends(get_current_user_from_token),
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
                Workout.user_id == current_user_id
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
                WorkoutType.id == str(workout_data.workout_type_id)
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

        return convert_workout_to_response(db_workout, db)

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
    current_user_id: str = Depends(get_current_user_from_token),
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
                Workout.user_id == current_user_id
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
    current_user_id: str = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """特定日のワークアウト取得"""
    try:
        workouts = (
            db.query(Workout)
            .filter(
                Workout.date == workout_date,
                Workout.user_id == current_user_id
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
    encoding: Optional[str] = Form(None),
    current_user = Depends(get_current_user_from_token)
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
        success, message, preview_info = csv_service.preview_data(file_content, encoding)

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
    current_user_id: str = Depends(get_current_user_from_token),
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
                    user_id=current_user_id,
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
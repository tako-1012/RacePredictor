"""
自己ベスト管理サービス
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import date
import logging
from app.models.personal_best import PersonalBest
from app.models.race import RaceResult

logger = logging.getLogger(__name__)


def update_personal_best_from_race_result(
    db: Session, 
    user_id: str, 
    race_result: RaceResult
) -> Optional[PersonalBest]:
    """
    レース結果から自己ベストを自動更新
    
    Args:
        db: データベースセッション
        user_id: ユーザーID
        race_result: レース結果
    
    Returns:
        更新された自己ベスト（新規作成または更新）
    """
    try:
        # 同じ種目・距離の既存の自己ベストを検索
        existing_pb = db.query(PersonalBest).filter(
            and_(
                PersonalBest.user_id == user_id,
                PersonalBest.race_type == race_result.race_type,
                PersonalBest.custom_distance_m == race_result.distance_meters
            )
        ).first()
        
        # 自己ベスト更新の判定
        should_update = False
        if existing_pb:
            # 既存の自己ベストより速い場合
            if race_result.time_seconds < existing_pb.time_seconds:
                should_update = True
                logger.info(f"🏆 自己ベスト更新: {race_result.distance_meters}m {race_result.time_seconds}s (前回: {existing_pb.time_seconds}s)")
        else:
            # 新しい種目の場合
            should_update = True
            logger.info(f"🆕 新しい自己ベスト: {race_result.distance_meters}m {race_result.time_seconds}s")
        
        if should_update:
            if existing_pb:
                # 既存の自己ベストを更新
                existing_pb.time_seconds = race_result.time_seconds
                existing_pb.achieved_date = race_result.race_date
                existing_pb.race_name = race_result.race_name
                
                db.commit()
                db.refresh(existing_pb)
                logger.info(f"✅ 自己ベスト更新完了: ID={existing_pb.id}")
                return existing_pb
            else:
                # 新しい自己ベストを作成
                new_pb = PersonalBest(
                    user_id=user_id,
                    race_type=race_result.race_type,
                    distance="custom",  # カスタム距離として設定
                    custom_distance_m=race_result.distance_meters,
                    time_seconds=race_result.time_seconds,
                    achieved_date=race_result.race_date,
                    race_name=race_result.race_name
                )
                
                db.add(new_pb)
                db.commit()
                db.refresh(new_pb)
                logger.info(f"✅ 自己ベスト新規作成完了: ID={new_pb.id}")
                return new_pb
        
        return None
        
    except Exception as e:
        logger.error(f"❌ 自己ベスト更新エラー: {str(e)}")
        db.rollback()
        raise


def get_personal_best_summary(db: Session, user_id: str) -> dict:
    """
    ユーザーの自己ベスト概要を取得
    
    Args:
        db: データベースセッション
        user_id: ユーザーID
    
    Returns:
        自己ベスト概要の辞書
    """
    try:
        personal_bests = db.query(PersonalBest).filter(
            PersonalBest.user_id == user_id
        ).order_by(PersonalBest.achieved_date.desc()).all()
        
        # 種目別にグループ化
        grouped_bests = {}
        for pb in personal_bests:
            if pb.race_type not in grouped_bests:
                grouped_bests[pb.race_type] = []
            grouped_bests[pb.race_type].append(pb)
        
        # 最新更新日を取得
        latest_update = None
        if personal_bests:
            latest_update = max(pb.achieved_date for pb in personal_bests)
        
        return {
            "total_count": len(personal_bests),
            "grouped_bests": grouped_bests,
            "latest_update": latest_update,
            "personal_bests": personal_bests
        }
        
    except Exception as e:
        logger.error(f"❌ 自己ベスト概要取得エラー: {str(e)}")
        raise

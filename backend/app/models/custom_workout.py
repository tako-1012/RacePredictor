from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class CustomWorkoutTemplate(Base):
    """カスタムワークアウトテンプレート"""
    __tablename__ = "custom_workout_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(20), nullable=False, default='full')  # warmup, main, cooldown, full
    created_from = Column(String(50), default='manual')  # manual, workout_session, pattern_analysis
    
    # テンプレートの基本設定
    workout_type_id = Column(String(36), ForeignKey("workout_types.id"), nullable=False)
    distance_meters = Column(Integer)
    times_seconds = Column(JSON)  # インターバル時間の配列
    repetitions = Column(Integer, default=1)
    rest_type = Column(String(50))  # active, passive, walk, jog
    rest_duration = Column(Integer)  # 秒
    intensity = Column(Integer)  # 1-10
    
    # 詳細設定
    session_period = Column(String(50))  # morning, afternoon, evening, night
    warmup_distance = Column(Integer)
    warmup_time = Column(Integer)  # 秒
    main_distance = Column(Integer)
    main_time = Column(Integer)  # 秒
    cooldown_distance = Column(Integer)
    cooldown_time = Column(Integer)  # 秒
    
    # メタデータ
    is_favorite = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)  # 使用回数
    last_used = Column(DateTime(timezone=True))  # 最終使用日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User", back_populates="custom_workout_templates")
    workout_type = relationship("WorkoutType")


class CustomWorkoutPlan(Base):
    """カスタムワークアウトプラン（複数のテンプレートを組み合わせた週間プランなど）"""
    __tablename__ = "custom_workout_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    plan_type = Column(String(50))  # weekly, monthly, custom
    
    # プランの設定
    duration_weeks = Column(Integer, default=1)
    target_distance_km = Column(Integer)  # 週間目標距離
    difficulty_level = Column(String(20))  # beginner, intermediate, advanced
    
    # メタデータ
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User", back_populates="custom_workout_plans")
    plan_items = relationship("CustomWorkoutPlanItem", back_populates="plan", cascade="all, delete-orphan")


class CustomWorkoutPlanItem(Base):
    """ワークアウトプランの個別アイテム"""
    __tablename__ = "custom_workout_plan_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(36), ForeignKey("custom_workout_plans.id"), nullable=False)
    template_id = Column(String(36), ForeignKey("custom_workout_templates.id"), nullable=False)
    
    # プラン内での設定
    day_of_week = Column(Integer)  # 0=月曜日, 6=日曜日
    week_number = Column(Integer, default=1)  # 何週目か
    order_in_day = Column(Integer, default=1)  # その日の何番目の練習か
    
    # オーバーライド設定（テンプレートの設定を上書き）
    distance_override = Column(Integer)
    intensity_override = Column(Integer)
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # リレーション
    plan = relationship("CustomWorkoutPlan", back_populates="plan_items")
    template = relationship("CustomWorkoutTemplate")


class CustomWorkoutTemplateNew(Base):
    """新しい形式のカスタムワークアウトテンプレート"""
    __tablename__ = "custom_workout_templates_new"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    template_type = Column(String(50), nullable=False)  # section, full_workout
    section_type = Column(String(50))  # warmup, main, cooldown
    sessions = Column(JSON)  # セッション情報
    steps = Column(JSON)  # ステップ情報
    is_favorite = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    user = relationship("User")

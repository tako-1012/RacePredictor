from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


class RaceScheduleBase(BaseModel):
    race_name: str = Field(..., min_length=1, max_length=200, description="レース名")
    race_type_id: UUID = Field(..., description="レース種目ID")
    race_date: date = Field(..., description="レース日")
    location: Optional[str] = Field(None, max_length=200, description="開催地")
    registration_url: Optional[str] = Field(None, max_length=500, description="申し込みURL")
    race_website: Optional[str] = Field(None, max_length=500, description="レース公式サイト")
    organizer: Optional[str] = Field(None, max_length=200, description="主催者")
    contact_email: Optional[str] = Field(None, max_length=255, description="連絡先メール")
    contact_phone: Optional[str] = Field(None, max_length=50, description="連絡先電話番号")
    registration_deadline: Optional[date] = Field(None, description="申し込み締切")
    early_bird_deadline: Optional[date] = Field(None, description="早期申し込み締切")
    early_bird_price: Optional[float] = Field(None, ge=0, description="早期申し込み価格")
    regular_price: Optional[float] = Field(None, ge=0, description="通常価格")
    late_registration_price: Optional[float] = Field(None, ge=0, description="遅延申し込み価格")
    currency: Optional[str] = Field("JPY", max_length=3, description="通貨")
    max_participants: Optional[int] = Field(None, ge=1, description="最大参加者数")
    current_participants: Optional[int] = Field(None, ge=0, description="現在の参加者数")
    course_map_url: Optional[str] = Field(None, max_length=500, description="コースマップURL")
    elevation_profile_url: Optional[str] = Field(None, max_length=500, description="標高プロファイルURL")
    course_description: Optional[str] = Field(None, max_length=2000, description="コース説明")
    aid_stations: Optional[str] = Field(None, max_length=1000, description="エイドステーション情報")
    time_limit: Optional[int] = Field(None, ge=1, description="制限時間（分）")
    age_restrictions: Optional[str] = Field(None, max_length=200, description="年齢制限")
    qualification_requirements: Optional[str] = Field(None, max_length=1000, description="参加資格要件")
    prize_money: Optional[str] = Field(None, max_length=500, description="賞金情報")
    awards: Optional[str] = Field(None, max_length=500, description="表彰情報")
    transportation: Optional[str] = Field(None, max_length=1000, description="交通手段")
    parking_info: Optional[str] = Field(None, max_length=500, description="駐車場情報")
    accommodation: Optional[str] = Field(None, max_length=1000, description="宿泊情報")
    weather_considerations: Optional[str] = Field(None, max_length=500, description="天候考慮事項")
    safety_measures: Optional[str] = Field(None, max_length=1000, description="安全対策")
    medical_support: Optional[str] = Field(None, max_length=500, description="医療サポート")
    notes: Optional[str] = Field(None, max_length=2000, description="メモ")
    tags: Optional[List[str]] = Field(None, description="タグ")
    is_confirmed: Optional[bool] = Field(False, description="確定フラグ")
    is_cancelled: Optional[bool] = Field(False, description="キャンセルフラグ")
    cancellation_reason: Optional[str] = Field(None, max_length=500, description="キャンセル理由")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceScheduleCreate(RaceScheduleBase):
    pass


class RaceScheduleUpdate(BaseModel):
    race_name: Optional[str] = Field(None, min_length=1, max_length=200)
    race_type_id: Optional[UUID] = None
    race_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=200)
    registration_url: Optional[str] = Field(None, max_length=500)
    race_website: Optional[str] = Field(None, max_length=500)
    organizer: Optional[str] = Field(None, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    registration_deadline: Optional[date] = None
    early_bird_deadline: Optional[date] = None
    early_bird_price: Optional[float] = Field(None, ge=0)
    regular_price: Optional[float] = Field(None, ge=0)
    late_registration_price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    max_participants: Optional[int] = Field(None, ge=1)
    current_participants: Optional[int] = Field(None, ge=0)
    course_map_url: Optional[str] = Field(None, max_length=500)
    elevation_profile_url: Optional[str] = Field(None, max_length=500)
    course_description: Optional[str] = Field(None, max_length=2000)
    aid_stations: Optional[str] = Field(None, max_length=1000)
    time_limit: Optional[int] = Field(None, ge=1)
    age_restrictions: Optional[str] = Field(None, max_length=200)
    qualification_requirements: Optional[str] = Field(None, max_length=1000)
    prize_money: Optional[str] = Field(None, max_length=500)
    awards: Optional[str] = Field(None, max_length=500)
    transportation: Optional[str] = Field(None, max_length=1000)
    parking_info: Optional[str] = Field(None, max_length=500)
    accommodation: Optional[str] = Field(None, max_length=1000)
    weather_considerations: Optional[str] = Field(None, max_length=500)
    safety_measures: Optional[str] = Field(None, max_length=1000)
    medical_support: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)
    tags: Optional[List[str]] = None
    is_confirmed: Optional[bool] = None
    is_cancelled: Optional[bool] = None
    cancellation_reason: Optional[str] = Field(None, max_length=500)


class RaceScheduleResponse(RaceScheduleBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceScheduleWithCountdown(RaceScheduleResponse):
    days_until_race: Optional[int] = Field(None, description="レースまでの日数")
    days_until_registration_deadline: Optional[int] = Field(None, description="申し込み締切までの日数")
    days_until_early_bird_deadline: Optional[int] = Field(None, description="早期申し込み締切までの日数")
    registration_status: Optional[str] = Field(None, description="申し込み状況")
    price_status: Optional[str] = Field(None, description="価格状況")
    urgency_level: Optional[str] = Field(None, description="緊急度")

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceScheduleListResponse(BaseModel):
    items: List[RaceScheduleResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False


class RaceScheduleStatsResponse(BaseModel):
    total_races_scheduled: int
    confirmed_races: int
    cancelled_races: int
    races_this_month: int
    races_next_month: int
    upcoming_registration_deadlines: int
    races_with_early_bird: int
    average_price: Optional[float] = None
    most_popular_race_type: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False
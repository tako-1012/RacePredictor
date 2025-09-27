# APIルーターのインポート
from . import auth, workouts, workout_types, predictions, races, race_types, dashboard, user_profile, personal_bests, race_schedules

__all__ = [
    "auth",
    "workouts", 
    "workout_types",
    "predictions",
    "races",
    "race_types",
    "dashboard",
    "user_profile",
    "personal_bests",
    "race_schedules"
]

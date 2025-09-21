# テストデータ準備ガイド

## 📋 テスト用データ

### 1. テスト用CSVファイル

#### Garmin形式CSV（garmin_test.csv）
```csv
ラップ数,タイム,累積時間,距離km,平均ペース分／km,勾配調整後のペース（GAP）平均分／km,平均心拍数bpm,最大心拍数bpm,総上昇量m,総下降量m,平均パワーW,平均W/kg,最大パワーW,最大W/kg,平均ピッチspm,平均接地時間ms,平均GCTバランス%,平均歩幅m,平均上下動cm,平均上下動比%,カロリーC,平均気温,最高ペース分／km,最高ピッチspm,移動時間,平均移動ペース分／km,平均ステップスピードロスcm/秒,平均ステップスピードロス率%
概要,30:00,30:00,5.0,6:00,6:00,150,170,50,30,200,3.0,250,4.0,180,250,50,1.2,8.0,15.0,300,20,5:30,190,30:00,6:00,2.0,5.0
1,6:00,6:00,1.0,6:00,6:00,145,160,10,5,180,2.8,200,3.5,175,240,50,1.1,7.5,14.0,50,20,5:45,185,6:00,6:00,1.5,4.0
2,6:00,12:00,1.0,6:00,6:00,150,165,10,5,190,3.0,210,3.8,180,245,50,1.2,8.0,15.0,50,20,5:30,190,6:00,6:00,2.0,5.0
3,6:00,18:00,1.0,6:00,6:00,155,170,10,5,200,3.2,220,4.0,185,250,50,1.3,8.5,16.0,50,20,5:15,195,6:00,6:00,2.5,6.0
4,6:00,24:00,1.0,6:00,6:00,160,175,10,5,210,3.4,230,4.2,190,255,50,1.4,9.0,17.0,50,20,5:00,200,6:00,6:00,3.0,7.0
5,6:00,30:00,1.0,6:00,6:00,165,180,10,5,220,3.6,240,4.4,195,260,50,1.5,9.5,18.0,50,20,4:45,205,6:00,6:00,3.5,8.0
```

#### 標準形式CSV（standard_test.csv）
```csv
date,type,distance,time,intensity,notes
2024-01-15,ジョギング,5.0,30:00,3,テスト練習1
2024-01-16,インターバル,8.0,45:00,5,テスト練習2
2024-01-17,ロング走,15.0,90:00,4,テスト練習3
2024-01-18,テンポ走,10.0,50:00,4,テスト練習4
2024-01-19,リカバリー,3.0,20:00,2,テスト練習5
```

### 2. テスト用ユーザーアカウント

#### 管理者アカウント
- **メール**: admin@test.com
- **パスワード**: Admin123!
- **名前**: テスト管理者

#### 一般ユーザーアカウント
- **メール**: user@test.com
- **パスワード**: User123!
- **名前**: テストユーザー

### 3. テスト用練習記録データ

#### 基本データ
```json
{
  "workouts": [
    {
      "date": "2024-01-15",
      "workout_type": "ジョギング",
      "distance_meters": 5000,
      "times_seconds": [1800],
      "intensity": 3,
      "notes": "テスト練習1"
    },
    {
      "date": "2024-01-16",
      "workout_type": "インターバル",
      "distance_meters": 8000,
      "times_seconds": [2700],
      "intensity": 5,
      "notes": "テスト練習2"
    },
    {
      "date": "2024-01-17",
      "workout_type": "ロング走",
      "distance_meters": 15000,
      "times_seconds": [5400],
      "intensity": 4,
      "notes": "テスト練習3"
    }
  ]
}
```

### 4. テスト用レース結果データ

#### 基本データ
```json
{
  "races": [
    {
      "race_name": "テストマラソン2024",
      "race_date": "2024-01-20",
      "distance_meters": 42195,
      "finish_time_seconds": 12600,
      "position": 100,
      "notes": "テストレース1"
    },
    {
      "race_name": "テストハーフマラソン2024",
      "race_date": "2024-01-25",
      "distance_meters": 21097,
      "finish_time_seconds": 6300,
      "position": 50,
      "notes": "テストレース2"
    }
  ]
}
```

## 🧪 テストシナリオ

### シナリオ1: 新規ユーザーの完全フロー
1. 新規登録
2. ログイン
3. 練習記録の作成
4. CSVインポート
5. ダッシュボード確認
6. ログアウト

### シナリオ2: 既存ユーザーのデータ管理
1. ログイン
2. 練習記録の編集
3. レース結果の追加
4. データの削除
5. ダッシュボード更新確認

### シナリオ3: エラーケースのテスト
1. 無効な認証情報でのログイン
2. 無効なデータでの登録
3. 無効なCSVファイルのアップロード
4. ネットワークエラーのシミュレーション

## 🔧 テスト環境セットアップ

### 1. データベースのリセット
```bash
# テスト用データベースの作成
cd backend
python -c "
from app.core.database import engine, Base
from app.models import *
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print('テスト用データベースをリセットしました')
"
```

### 2. テスト用データの投入
```bash
# テスト用データの投入スクリプト
python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.models.workout import Workout, WorkoutType
from app.models.race import RaceResult
from app.core.security import get_password_hash
import uuid

db = SessionLocal()

# テスト用ユーザーの作成
test_user = User(
    id=uuid.uuid4(),
    email='test@example.com',
    hashed_password=get_password_hash('Test123!'),
    full_name='テストユーザー'
)
db.add(test_user)
db.commit()

# テスト用練習種別の作成
workout_types = [
    WorkoutType(name='ジョギング', category='easy'),
    WorkoutType(name='インターバル', category='interval'),
    WorkoutType(name='ロング走', category='long'),
    WorkoutType(name='テンポ走', category='tempo'),
    WorkoutType(name='リカバリー', category='recovery')
]

for wt in workout_types:
    db.add(wt)

db.commit()
db.close()
print('テスト用データを投入しました')
"
```

### 3. テスト用ファイルの準備
```bash
# テスト用CSVファイルの作成
cd frontend-react
mkdir -p test-data

# Garmin形式CSVの作成
cat > test-data/garmin_test.csv << 'EOF'
ラップ数,タイム,累積時間,距離km,平均ペース分／km,平均心拍数bpm,最大心拍数bpm
概要,30:00,30:00,5.0,6:00,150,170
1,6:00,6:00,1.0,6:00,145,160
2,6:00,12:00,1.0,6:00,150,165
3,6:00,18:00,1.0,6:00,155,170
4,6:00,24:00,1.0,6:00,160,175
5,6:00,30:00,1.0,6:00,165,180
EOF

# 標準形式CSVの作成
cat > test-data/standard_test.csv << 'EOF'
date,type,distance,time,intensity,notes
2024-01-15,ジョギング,5.0,30:00,3,テスト練習1
2024-01-16,インターバル,8.0,45:00,5,テスト練習2
2024-01-17,ロング走,15.0,90:00,4,テスト練習3
EOF

echo "テスト用ファイルを準備しました"
```

## 📊 テスト結果の記録

### テスト実行ログ
```bash
# テスト実行ログの記録
echo "テスト開始: $(date)" >> test-results.log
echo "テスト環境: WSL2 Ubuntu" >> test-results.log
echo "ブラウザ: Chrome" >> test-results.log
echo "---" >> test-results.log
```

### 問題報告テンプレート
```
## 問題報告

### 問題の概要
- 機能: [機能名]
- ページ: [URL]
- 問題: [問題の説明]

### 再現手順
1. [手順1]
2. [手順2]
3. [手順3]

### 期待される動作
[期待される動作]

### 実際の動作
[実際の動作]

### 環境情報
- OS: [OS]
- ブラウザ: [ブラウザ]
- バージョン: [バージョン]

### スクリーンショット
[スクリーンショットの添付]

### ログ
[コンソールログやエラーログ]
```

## 🎯 テスト完了基準

### 機能テスト
- [ ] 全機能が正常に動作する
- [ ] エラーハンドリングが適切に機能する
- [ ] データの整合性が保たれる

### ユーザビリティテスト
- [ ] 直感的な操作が可能
- [ ] エラーメッセージが分かりやすい
- [ ] レスポンシブデザインが機能する

### パフォーマンステスト
- [ ] ページロード時間が3秒以内
- [ ] API応答時間が1秒以内
- [ ] メモリ使用量が適切

### セキュリティテスト
- [ ] 認証が適切に機能する
- [ ] 認可が正しく実装されている
- [ ] 入力値の検証が機能する

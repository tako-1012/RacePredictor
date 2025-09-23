# テストデータ説明

## テストデータディレクトリ構成

```
test_data/
├── encoding_samples/          # エンコーディングテスト用サンプル
│   ├── garmin_jp.csv        # Garmin日本語CSV
│   ├── shift_jis.csv        # Shift-JISエンコーディング
│   └── utf8_bom.csv         # UTF-8 BOM付き
├── error_cases/              # エラーケーステスト用
│   ├── empty_file.csv       # 空ファイル
│   └── invalid_data.csv     # 無効なデータ
├── sample_races.csv          # レース結果サンプル
└── sample_workouts.csv      # 練習記録サンプル
```

## テストデータの使用方法

### 1. CSVインポートテスト
- `encoding_samples/` のファイルを使用してエンコーディング検出テスト
- `error_cases/` のファイルを使用してエラーハンドリングテスト

### 2. データ整合性テスト
- `sample_workouts.csv` を使用して練習記録のCRUDテスト
- `sample_races.csv` を使用してレース結果のCRUDテスト

### 3. パフォーマンステスト
- 大量データのテスト用にサンプルデータを複製して使用

## テストデータの形式

### 練習記録CSV形式
```csv
Date,Activity Type,Distance,Time,Avg HR,Max HR,Notes
2024-01-15,Easy Run,5.0,30:00,140,160,テスト練習1
2024-01-16,Interval,8.0,45:00,150,180,テスト練習2
```

### レース結果CSV形式
```csv
Race Name,Race Type,Date,Time,Place,Total Participants,Weather,Temperature,Notes
テストレース1,5km,2024-02-15,20:00,10,100,晴れ,15.0,テストレース1
テストレース2,10km,2024-03-15,42:30,5,200,曇り,12.0,テストレース2
```

## 注意事項
- テストデータは本番環境では使用しないでください
- テスト実行後は適切にクリーンアップしてください
- 新しいテストケースが必要な場合は、このディレクトリに追加してください

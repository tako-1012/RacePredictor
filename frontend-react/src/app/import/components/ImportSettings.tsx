'use client'

import { WorkoutType } from '@/types'

interface ImportSettingsProps {
  workoutTypes: WorkoutType[]
  settings: {
    workoutDate: string
    workoutTypeId: string
    intensity: number
  }
  onSettingsChange: (settings: {
    workoutDate: string
    workoutTypeId: string
    intensity: number
  }) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ImportSettings({
  workoutTypes,
  settings,
  onSettingsChange,
  onConfirm,
  onCancel
}: ImportSettingsProps) {
  const handleInputChange = (field: keyof typeof settings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">インポート設定</h2>
        <p className="text-gray-600">練習記録の詳細を設定してください</p>
      </div>

      <div className="space-y-6">
        {/* 練習日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            練習日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={settings.workoutDate}
            onChange={(e) => handleInputChange('workoutDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            この日付がすべての練習記録に適用されます
          </p>
        </div>

        {/* 練習種別 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            練習種別 <span className="text-red-500">*</span>
          </label>
          <select
            value={settings.workoutTypeId}
            onChange={(e) => handleInputChange('workoutTypeId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {workoutTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            この種別がすべての練習記録に適用されます
          </p>
        </div>

        {/* 強度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            強度 (1-10) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="10"
                value={settings.intensity}
                onChange={(e) => handleInputChange('intensity', Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-medium text-gray-700 w-8">{settings.intensity}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (軽い)</span>
              <span>5 (中程度)</span>
              <span>10 (激しい)</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            この強度がすべての練習記録に適用されます
          </p>
        </div>

        {/* 強度の説明 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">強度の目安</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>1-3:</strong> ウォーミングアップ、クールダウン</p>
            <p><strong>4-6:</strong> ジョギング、LSD（ロング・スロー・ディスタンス）</p>
            <p><strong>7-8:</strong> ペース走、テンポ走</p>
            <p><strong>9-10:</strong> インターバル、レペティション</p>
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          戻る
        </button>
        <button
          onClick={onConfirm}
          disabled={!settings.workoutDate || !settings.workoutTypeId}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          インポート開始
        </button>
      </div>
    </div>
  )
}

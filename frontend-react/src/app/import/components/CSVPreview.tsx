'use client'

import { CSVImportPreview } from '@/types'

interface CSVPreviewProps {
  preview: CSVImportPreview
  onConfirm: () => void
  onCancel: () => void
}

export function CSVPreview({ preview, onConfirm, onCancel }: CSVPreviewProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`
  }

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">CSVファイルプレビュー</h2>
        <p className="text-gray-600">以下の内容でインポートを続行しますか？</p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{preview.statistics.total_rows}</div>
          <div className="text-sm text-blue-800">総行数</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{preview.statistics.valid_rows}</div>
          <div className="text-sm text-green-800">有効な行</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{preview.statistics.invalid_rows}</div>
          <div className="text-sm text-red-800">無効な行</div>
        </div>
      </div>

      {/* ファイル情報 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">ファイル情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">検出されたエンコーディング:</span>
            <span className="ml-2 font-medium">{preview.statistics.detected_encoding}</span>
          </div>
          <div>
            <span className="text-gray-600">検出された形式:</span>
            <span className="ml-2 font-medium">{preview.statistics.detected_format}</span>
          </div>
          <div>
            <span className="text-gray-600">列数:</span>
            <span className="ml-2 font-medium">{preview.statistics.columns_count}</span>
          </div>
          <div>
            <span className="text-gray-600">処理時間:</span>
            <span className="ml-2 font-medium">{preview.statistics.processing_time_ms}ms</span>
          </div>
        </div>
      </div>

      {/* ラップ分析 */}
      {preview.lap_analysis.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">ラップ分析</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">区間</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">タイム</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">距離</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ペース</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">心拍数</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">判定</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.lap_analysis.slice(0, 10).map((lap, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{lap.lap_number}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{lap.time}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{lap.distance}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{lap.pace}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{lap.heart_rate}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lap.judgment === '有効' ? 'bg-green-100 text-green-800' :
                        lap.judgment === '警告' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lap.judgment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.lap_analysis.length > 10 && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                他 {preview.lap_analysis.length - 10} 区間...
              </p>
            )}
          </div>
        </div>
      )}

      {/* 警告 */}
      {preview.warnings.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-yellow-800 mb-3">⚠️ 警告</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="space-y-2">
              {preview.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-800">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* プレビューデータ */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">プレビューデータ（最初の5件）</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">距離</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">合計タイム</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">平均ペース</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">区間数</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.data.slice(0, 5).map((workout, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(workout.date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatDistance(workout.distance_meters)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatTime(workout.times_seconds.reduce((a, b) => a + b, 0))}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {workout.avg_pace_seconds ? formatPace(workout.avg_pace_seconds) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {workout.times_seconds.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          続行
        </button>
      </div>
    </div>
  )
}

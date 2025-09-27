'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { useToastHelpers } from '@/components/UI/Toast'

interface RaceData {
  raceName: string
  date: string
  raceType: string
  distance: number
  raceSubType: string
  timeSeconds: number
  position: string
  participants: string
  notes: string
  lapTimes: Array<{lap: number, time: string, seconds: number, distance: number}>
  splits: Array<{distance: number, time: string, seconds: number}>
}

interface LapAnalysisStepProps {
  raceData: RaceData
  setRaceData: React.Dispatch<React.SetStateAction<RaceData>>
}

// ペース計算関数（分/km）
const formatPace = (seconds: number, distance: number): string => {
  if (distance === 0) return '0:00'
  const paceSecondsPerKm = (seconds / distance) * 1000
  const minutes = Math.floor(paceSecondsPerKm / 60)
  const secs = Math.floor(paceSecondsPerKm % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function LapAnalysisStep({ raceData, setRaceData }: LapAnalysisStepProps) {
  const [importMethod, setImportMethod] = useState<'manual' | 'csv' | 'splits'>('manual')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">ラップ・分析データ（任意）</h2>
      <p className="text-gray-600">
        ラップタイムやスプリットデータがある場合は入力してください。時計を持たない場合はスキップ可能です。
      </p>

      {/* 入力方法選択 */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">データ入力方法</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setImportMethod('manual')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              importMethod === 'manual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">手動入力</div>
            <div className="text-sm text-gray-600 mt-1">
              ラップタイムを個別に入力
            </div>
          </button>

          <button
            type="button"
            onClick={() => setImportMethod('csv')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              importMethod === 'csv' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">CSVインポート</div>
            <div className="text-sm text-gray-600 mt-1">
              Garmin Connect等からデータを取り込み
            </div>
          </button>

          <button
            type="button"
            onClick={() => setImportMethod('splits')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              importMethod === 'splits' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">スプリット入力</div>
            <div className="text-sm text-gray-600 mt-1">
              1km毎などの区間タイム
            </div>
          </button>
        </div>
      </div>

      {/* 入力方法別コンテンツ */}
      {importMethod === 'manual' && (
        <ManualLapEntry raceData={raceData} setRaceData={setRaceData} />
      )}

      {importMethod === 'csv' && (
        <CSVLapImport raceData={raceData} setRaceData={setRaceData} />
      )}

      {importMethod === 'splits' && (
        <SplitTimeEntry raceData={raceData} setRaceData={setRaceData} />
      )}

      {/* スキップオプション */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">💡 ラップデータについて</h4>
        <div className="text-sm text-blue-700 mt-1 space-y-1">
          <p>• <strong>入力しなくてもOK</strong> - AIコーチングやタイム予測は基本的なレース情報だけで利用可能</p>
          <p>• <strong>入力すると</strong> - より詳細な分析とグラフ表示が可能になります</p>
          <p>• <strong>時計を持たない場合</strong> - このステップをスキップして基本的なレース記録のみを保存できます</p>
        </div>
      </div>
    </div>
  )
}

// 手動ラップ入力
function ManualLapEntry({ raceData, setRaceData }: LapAnalysisStepProps) {
  const toast = useToastHelpers()
  const [currentLap, setCurrentLap] = useState('')
  const [currentLapDistance, setCurrentLapDistance] = useState('')

  // よくあるパターンのテンプレート
  const getCommonPatternTemplates = (): Array<{value: number[], label: string, description: string}> => {
    const { raceType, distance } = raceData
    
    if (raceType === 'track') {
      if (distance === 800) {
        return [
          { value: [400, 400], label: '400m×2', description: '400m×2本' },
          { value: [200, 200, 200, 200], label: '200m×4', description: '200m×4本' }
        ]
      } else if (distance === 1500) {
        return [
          { value: [300, 400, 400, 400], label: '300-400-400-400', description: 'スタート300m + 400m×3' },
          { value: [400, 400, 400, 300], label: '400-400-400-300', description: '400m×3 + フィニッシュ300m' }
        ]
      } else if (distance === 3000) {
        return [
          { value: [400, 400, 400, 400, 400, 400, 400, 200], label: '400m×7+200m', description: '400m×7本 + フィニッシュ200m' },
          { value: [1000, 1000, 1000], label: '1000m×3', description: '1000m×3本' }
        ]
      } else if (distance === 5000) {
        return [
          { value: [1000, 1000, 1000, 1000, 1000], label: '1000m×5', description: '1000m×5本' },
          { value: [400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 200], label: '400m×12+200m', description: '400m×12本 + フィニッシュ200m' }
        ]
      } else if (distance === 10000) {
        return [
          { value: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000], label: '1000m×10', description: '1000m×10本' },
          { value: [400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 200], label: '400m×25+200m', description: '400m×25本 + フィニッシュ200m' }
        ]
      }
    }
    
    return []
  }

  // ラップ距離テンプレート選択肢
  const getLapDistanceTemplates = (): Array<{value: number, label: string, description: string}> => {
    const { raceType, distance } = raceData
    
    if (raceType === 'track') {
      if (distance <= 800) {
        return [
          { value: 200, label: '200m', description: '400mトラックの半分' },
          { value: 400, label: '400m', description: '1周' }
        ]
      } else if (distance <= 1500) {
        return [
          { value: 300, label: '300m', description: '400mトラックの3/4' },
          { value: 400, label: '400m', description: '1周' }
        ]
      } else if (distance <= 3000) {
        return [
          { value: 400, label: '400m', description: '1周' },
          { value: 1000, label: '1000m', description: '2.5周' }
        ]
      } else if (distance <= 5000) {
        return [
          { value: 400, label: '400m', description: '1周' },
          { value: 1000, label: '1000m', description: '2.5周' }
        ]
      } else {
        return [
          { value: 400, label: '400m', description: '1周' },
          { value: 1000, label: '1000m', description: '2.5周' }
        ]
      }
    } else if (raceType === 'road') {
      if (distance <= 5000) {
        return [
          { value: 500, label: '500m', description: '500mラップ' },
          { value: 1000, label: '1000m', description: '1kmラップ' }
        ]
      } else if (distance <= 10000) {
        return [
          { value: 1000, label: '1000m', description: '1kmラップ' },
          { value: 2000, label: '2000m', description: '2kmラップ' }
        ]
      } else if (distance <= 21097) {
        return [
          { value: 1000, label: '1000m', description: '1kmラップ' },
          { value: 5000, label: '5000m', description: '5kmラップ' }
        ]
      } else {
        return [
          { value: 1000, label: '1000m', description: '1kmラップ' },
          { value: 5000, label: '5000m', description: '5kmラップ' }
        ]
      }
    } else if (raceType === 'relay') {
      if (distance <= 3000) {
        return [
          { value: 500, label: '500m', description: '500mラップ' },
          { value: 1000, label: '1000m', description: '1kmラップ' }
        ]
      } else if (distance <= 10000) {
        return [
          { value: 1000, label: '1000m', description: '1kmラップ' },
          { value: 2000, label: '2000m', description: '2kmラップ' }
        ]
      } else {
        return [
          { value: 2000, label: '2000m', description: '2kmラップ' },
          { value: 5000, label: '5000m', description: '5kmラップ' }
        ]
      }
    }
    
    return [
      { value: 500, label: '500m', description: '500mラップ' },
      { value: 1000, label: '1000m', description: '1kmラップ' }
    ]
  }

  // デフォルトテンプレート（最初の選択肢）
  const getDefaultTemplate = (): number => {
    const templates = getLapDistanceTemplates()
    return templates[0]?.value || 1000
  }

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr.trim()) return 0
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0])
      const seconds = parseFloat(parts[1])
      return minutes * 60 + seconds
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseFloat(parts[2])
      return hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }

  const addLapTime = () => {
    if (!currentLap.trim()) {
      toast.warning('入力エラー', 'ラップタイムを入力してください')
      return
    }
    
    const lapSeconds = parseTimeToSeconds(currentLap)
    const lapDistance = parseFloat(currentLapDistance) || getDefaultTemplate()
    
    if (lapSeconds <= 0) {
      toast.warning('入力エラー', '有効なラップタイムを入力してください')
      return
    }
    
    if (lapDistance <= 0) {
      toast.warning('入力エラー', '有効な距離を入力してください')
      return
    }
    
    // 距離超過チェック
    const currentTotalDistance = raceData.lapTimes.reduce((sum, lap) => sum + lap.distance, 0)
    const newTotalDistance = currentTotalDistance + lapDistance
    
    if (raceData.distance > 0 && newTotalDistance > raceData.distance) {
      const remaining = raceData.distance - currentTotalDistance
      const excess = newTotalDistance - raceData.distance
      const confirmMessage = `⚠️ 距離超過警告\n\nこのラップを追加すると：\n• 総距離: ${newTotalDistance}m\n• レース距離: ${raceData.distance}m\n• 超過: ${excess}m\n• 残り距離: ${remaining}m\n\n追加しますか？`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }
    
    setRaceData(prev => {
      const newLapTimes = [...prev.lapTimes, {
        lap: prev.lapTimes.length + 1,
        time: currentLap,
        seconds: lapSeconds,
        distance: lapDistance
      }]
      const calculatedSplits = calculateSplitsFromLapTimes(newLapTimes)
      
      return {
        ...prev,
        lapTimes: newLapTimes,
        splits: calculatedSplits // スプリットタイムを自動更新
      }
    })
    
    setCurrentLap('')
    // 距離はリセットしない（テンプレート選択を維持）
  }

  // ラップタイム入力時に距離が空の場合はデフォルトテンプレート距離を自動設定
  const handleLapTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // 秒数のみの入力（例: 300, 30000, 80.5）を分:秒.ミリ秒形式に自動変換
    if (/^\d+\.?\d*$/.test(value) && !value.includes(':')) {
      const numValue = value
      
      // 5桁以上の数字の場合（例: 30000 = 3:00.00）
      if (numValue.length >= 5) {
        const minutes = Math.floor(parseInt(numValue) / 10000)
        const seconds = Math.floor((parseInt(numValue) % 10000) / 100)
        const centiseconds = parseInt(numValue) % 100
        value = `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
      } else {
        // 4桁以下の場合は秒数として解釈（例: 80.5 → 1:20.5）
        const seconds = parseFloat(value)
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          const formattedSeconds = remainingSeconds % 1 === 0 
            ? remainingSeconds.toFixed(0).padStart(2, '0')
            : remainingSeconds.toFixed(2).padStart(5, '0')
          value = `${minutes}:${formattedSeconds}`
        } else {
          // 60秒未満の場合（例: 80.5 → 1:20.5）
          const formattedSeconds = seconds % 1 === 0 
            ? seconds.toFixed(0).padStart(2, '0')
            : seconds.toFixed(2).padStart(5, '0')
          value = `0:${formattedSeconds}`
        }
      }
    }
    
    // 分:秒形式の入力（例: 3:00）を正規化
    if (/^\d+:\d+$/.test(value)) {
      const [minutes, seconds] = value.split(':').map(Number)
      if (seconds >= 60) {
        const additionalMinutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        value = `${minutes + additionalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
      } else {
        value = `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    }
    
    setCurrentLap(value)
    if (!currentLapDistance && value.trim()) {
      setCurrentLapDistance(getDefaultTemplate().toString())
    }
  }

  // Enterキーでのラップ追加
  const handleLapKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLapTime()
    }
  }

  // ラップタイム更新時の処理（自動生成されたラップ用）
  const handleLapTimeUpdate = (index: number, value: string) => {
    // 秒数のみの入力（例: 300, 30000, 80.5）を分:秒.ミリ秒形式に自動変換
    let formattedValue = value
    if (/^\d+\.?\d*$/.test(value) && !value.includes(':')) {
      const numValue = value
      
      // 5桁以上の数字の場合（例: 30000 = 3:00.00）
      if (numValue.length >= 5) {
        const minutes = Math.floor(parseInt(numValue) / 10000)
        const seconds = Math.floor((parseInt(numValue) % 10000) / 100)
        const centiseconds = parseInt(numValue) % 100
        formattedValue = `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
      } else {
        // 4桁以下の場合は秒数として解釈（例: 80.5 → 1:20.5）
        const seconds = parseFloat(value)
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          const formattedSeconds = remainingSeconds % 1 === 0 
            ? remainingSeconds.toFixed(0).padStart(2, '0')
            : remainingSeconds.toFixed(2).padStart(5, '0')
          formattedValue = `${minutes}:${formattedSeconds}`
        } else {
          // 60秒未満の場合（例: 80.5 → 1:20.5）
          const formattedSeconds = seconds % 1 === 0 
            ? seconds.toFixed(0).padStart(2, '0')
            : seconds.toFixed(2).padStart(5, '0')
          formattedValue = `0:${formattedSeconds}`
        }
      }
    }
    
    // 分:秒形式の入力（例: 3:00）を正規化
    if (/^\d+:\d+$/.test(formattedValue)) {
      const [minutes, seconds] = formattedValue.split(':').map(Number)
      if (seconds >= 60) {
        const additionalMinutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        formattedValue = `${minutes + additionalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
      } else {
        formattedValue = `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    }
    
    updateLapTime(index, formattedValue)
  }

  // よくあるパターンテンプレート適用
  const applyCommonPattern = (pattern: number[]) => {
    if (raceData.lapTimes.length > 0) {
      const confirmMessage = `既存のラップデータがあります。\n\nよくあるパターン「${pattern.join('-')}m」を適用しますか？\n\n（既存のデータは上書きされます）`
      if (!confirm(confirmMessage)) return
    }
    
    const newLaps = pattern.map((distance, index) => ({
      lap: index + 1,
      time: '',
      seconds: 0,
      distance: distance
    }))
    
    setRaceData(prev => ({
      ...prev,
      lapTimes: newLaps
    }))
  }

  // テンプレート選択ハンドラー（自動ラップ生成機能付き）
  const handleTemplateSelect = (templateValue: number) => {
    setCurrentLapDistance(templateValue.toString())
    
    // 自動ラップ生成機能
    if (raceData.distance > 0 && templateValue > 0) {
      const expectedLaps = Math.floor(raceData.distance / templateValue)
      const currentLaps = raceData.lapTimes.length
      
      if (expectedLaps > 0 && currentLaps === 0) {
        const confirmMessage = `${raceData.distance}mのレースで${templateValue}mラップを選択しました。\n\n自動で${expectedLaps}個のラップ記入欄を生成しますか？\n\n（後から個別に追加・削除も可能です）`
        
        if (confirm(confirmMessage)) {
          // 空のラップ記入欄を生成
          const newLaps = Array.from({ length: expectedLaps }, (_, index) => ({
            lap: index + 1,
            time: '',
            seconds: 0,
            distance: templateValue
          }))
          
          setRaceData(prev => ({
            ...prev,
            lapTimes: newLaps
          }))
        }
      }
    }
  }

  // 自動生成されたラップのタイムを更新
  const updateLapTime = (index: number, time: string) => {
    const lapSeconds = parseTimeToSeconds(time)
    
    setRaceData(prev => {
      const newLapTimes = prev.lapTimes.map((lap, i) => 
        i === index 
          ? { ...lap, time, seconds: lapSeconds }
          : lap
      )
      const calculatedSplits = calculateSplitsFromLapTimes(newLapTimes)
      
      return {
        ...prev,
        lapTimes: newLapTimes,
        splits: calculatedSplits // スプリットタイムを自動更新
      }
    })
  }

  // ラップの距離を更新
  const updateLapDistance = (index: number, distance: number) => {
    // 距離超過チェック
    const currentTotalDistance = raceData.lapTimes.reduce((sum, lap, i) => 
      i === index ? sum : sum + lap.distance, 0
    )
    const newTotalDistance = currentTotalDistance + distance
    
    if (raceData.distance > 0 && newTotalDistance > raceData.distance) {
      const remaining = raceData.distance - currentTotalDistance
      const excess = newTotalDistance - raceData.distance
      const confirmMessage = `⚠️ 距離超過警告\n\nこの距離に変更すると：\n• 総距離: ${newTotalDistance}m\n• レース距離: ${raceData.distance}m\n• 超過: ${excess}m\n• 残り距離: ${remaining}m\n\n変更しますか？`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }
    
    setRaceData(prev => {
      const newLapTimes = prev.lapTimes.map((lap, i) => 
        i === index 
          ? { ...lap, distance }
          : lap
      )
      const calculatedSplits = calculateSplitsFromLapTimes(newLapTimes)
      
      return {
        ...prev,
        lapTimes: newLapTimes,
        splits: calculatedSplits // スプリットタイムを自動更新
      }
    })
  }

  // ラップタイムからスプリットタイムを計算
  const calculateSplitsFromLapTimes = (lapTimes: any[]) => {
    if (lapTimes.length === 0) return []
    
    const splits = []
    let cumulativeTime = 0
    
    for (let i = 0; i < lapTimes.length; i++) {
      cumulativeTime += lapTimes[i].seconds
      splits.push({
        distance: lapTimes[i].distance,
        time: formatTime(cumulativeTime),
        seconds: cumulativeTime
      })
    }
    
    return splits
  }

  const removeLapTime = (index: number) => {
    setRaceData(prev => {
      const newLapTimes = prev.lapTimes.filter((_, i) => i !== index)
      const calculatedSplits = calculateSplitsFromLapTimes(newLapTimes)
      
      return {
        ...prev,
        lapTimes: newLapTimes,
        splits: calculatedSplits // スプリットタイムを自動更新
      }
    })
  }


  return (
    <div className="space-y-4">
      <h3 className="font-medium">手動でラップタイムを入力</h3>
      <p className="text-sm text-gray-600">
        <span className="text-blue-600 font-medium">💡 ラップタイムを入力すると、スプリットタイムが自動計算されます</span>
      </p>
      
      {/* よくあるパターンテンプレート */}
      {getCommonPatternTemplates().length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3">よくあるパターン</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getCommonPatternTemplates().map((pattern, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyCommonPattern(pattern.value)}
                className="p-3 text-left border border-blue-300 rounded-lg bg-white hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-blue-700">{pattern.label}</div>
                <div className="text-sm text-blue-600">{pattern.description}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            💡 よくあるパターンを選択すると、ラップ記入欄が自動で生成されます<br/>
            📝 生成後は距離とタイムを個別に変更できます
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ラップタイム</label>
          <input
            type="text"
            value={currentLap}
            onChange={handleLapTimeChange}
            onKeyPress={handleLapKeyPress}
            placeholder="例: 1:20.5 または 300 または 80.5（1:20.5）"
            className="w-full p-3 border border-gray-300 rounded-md font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">距離 (m)</label>
          <input
            type="number"
            value={currentLapDistance}
            onChange={(e) => setCurrentLapDistance(e.target.value)}
            placeholder={`例: ${getDefaultTemplate()}`}
            className="w-full p-3 border border-gray-300 rounded-md mb-2"
          />
          
          {/* テンプレート選択ボタン */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">テンプレート選択:</p>
            <div className="flex gap-2 flex-wrap">
              {getLapDistanceTemplates().map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => handleTemplateSelect(template.value)}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                    currentLapDistance === template.value.toString()
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  title={template.description}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              推奨: {getLapDistanceTemplates()[0]?.label} ({getLapDistanceTemplates()[0]?.description})
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={addLapTime}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        ラップを追加
      </button>

      {/* 登録済みラップ一覧と分析 */}
      {raceData.lapTimes.length > 0 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-medium">登録済みラップ（{raceData.lapTimes.length}個）</h4>
                <p className="text-xs text-gray-500">距離とタイムを個別に編集できます</p>
              </div>
              <div className="text-sm text-gray-600">
                合計距離: {raceData.lapTimes.reduce((sum, lap) => sum + lap.distance, 0)}m
                {raceData.distance > 0 && (
                  <span className={`ml-2 ${raceData.lapTimes.reduce((sum, lap) => sum + lap.distance, 0) > raceData.distance ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                    ({raceData.lapTimes.reduce((sum, lap) => sum + lap.distance, 0) > raceData.distance ? '超過' : '残り'}: {Math.abs(raceData.distance - raceData.lapTimes.reduce((sum, lap) => sum + lap.distance, 0))}m)
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {raceData.lapTimes.map((lap, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 w-8">#{index + 1}</span>
                      <input
                        type="number"
                        value={lap.distance}
                        onChange={(e) => updateLapDistance(index, parseInt(e.target.value) || 0)}
                        className="font-mono text-sm p-1 border border-gray-300 rounded w-16 text-center"
                        min="1"
                        step="1"
                      />
                      <span className="text-sm text-gray-600">m:</span>
                    </div>
                    <input
                      type="text"
                      value={lap.time}
                      onChange={(e) => handleLapTimeUpdate(index, e.target.value)}
                      placeholder={lap.time ? lap.time : "例: 1:20.5 または 80.5（1:20.5）"}
                      className="font-mono text-sm p-1 border border-gray-300 rounded w-24"
                    />
                    {lap.time && lap.seconds > 0 && (
                      <span className="text-gray-500 text-xs">
                        (ペース: {formatPace(lap.seconds, lap.distance)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeLapTime(index)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ラップ分析グラフ */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-medium mb-3">ラップ分析</h4>
            <LapAnalysisChart lapTimes={raceData.lapTimes} />
          </div>
        </div>
      )}
    </div>
  )
}

// ラップ分析グラフコンポーネント
function LapAnalysisChart({ lapTimes }: { lapTimes: Array<{lap: number, time: string, seconds: number, distance: number}> }) {
  if (lapTimes.length === 0) return null

  // データの準備
  const maxTime = Math.max(...lapTimes.map(lap => lap.seconds))
  const minTime = Math.min(...lapTimes.map(lap => lap.seconds))
  const timeRange = maxTime - minTime

  return (
    <div className="space-y-4">
      {/* ペースグラフ */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">ラップペース推移</h5>
        <div className="h-32 bg-gray-50 rounded border p-2">
          <div className="flex items-end h-full space-x-1">
            {lapTimes.map((lap, index) => {
              const paceSecondsPerKm = (lap.seconds / lap.distance) * 1000
              const height = timeRange > 0 ? ((maxTime - lap.seconds) / timeRange) * 100 : 50
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-blue-500 w-full rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`ラップ${lap.lap}: ${lap.time} (${formatPace(lap.seconds, lap.distance)}/km)`}
                  />
                  <div className="text-xs text-gray-600 mt-1">{lap.lap}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-blue-600 font-medium">最速ラップ</div>
          <div className="text-sm font-mono">
            {formatPace(minTime, lapTimes.find(lap => lap.seconds === minTime)?.distance || 1000)}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <div className="text-xs text-red-600 font-medium">最遅ラップ</div>
          <div className="text-sm font-mono">
            {formatPace(maxTime, lapTimes.find(lap => lap.seconds === maxTime)?.distance || 1000)}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-xs text-green-600 font-medium">平均ペース</div>
          <div className="text-sm font-mono">
            {formatPace(
              lapTimes.reduce((sum, lap) => sum + lap.seconds, 0) / lapTimes.length,
              lapTimes.reduce((sum, lap) => sum + lap.distance, 0) / lapTimes.length
            )}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-xs text-purple-600 font-medium">ペース変動</div>
          <div className="text-sm font-mono">
            {timeRange > 0 ? `${(timeRange / 60).toFixed(1)}分` : '0分'}
          </div>
        </div>
      </div>
    </div>
  )
}

// CSVインポート
function CSVLapImport({ raceData, setRaceData }: LapAnalysisStepProps) {
  const toast = useToastHelpers()
  const [dragOver, setDragOver] = useState(false)
  const [csvData, setCsvData] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any[]>([])

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0])
      const seconds = parseFloat(parts[1])
      return minutes * 60 + seconds
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseFloat(parts[2])
      return hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      })
      
      setCsvData(parsed)
      
      // プレビューデータの生成
      const preview = parsed.data.slice(0, 5).map((row: any) => ({
        time: row.Time || row.時間 || row.time || '',
        distance: row.Distance || row.距離 || row.distance || '',
        pace: row.Pace || row.ペース || row.pace || '',
        heartRate: row['Heart Rate'] || row.心拍数 || row.heartRate || ''
      }))
      
      setPreviewData(preview)
    } catch (error) {
      toast.error('CSV読み込みエラー', 'CSVファイルの読み込みに失敗しました')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFileUpload(file)
    }
  }

  const applyCSVData = () => {
    if (csvData) {
      const lapTimes = csvData.data
        .filter((row: any) => row.Time || row.時間 || row.time)
        .map((row: any, index: number) => ({
          lap: index + 1,
          time: row.Time || row.時間 || row.time || '',
          seconds: parseTimeToSeconds(row.Time || row.時間 || row.time || ''),
          distance: parseFloat(row.Distance || row.距離 || row.distance || '400'),
          pace: row.Pace || row.ペース || row.pace || '',
          heartRate: row['Heart Rate'] || row.心拍数 || row.heartRate || null
        }))
      
      setRaceData(prev => ({
        ...prev,
        lapTimes: lapTimes
      }))
      
      toast.success('CSV取り込み完了', `${lapTimes.length}個のラップデータを取り込みました`)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">CSVファイルからラップデータを取り込み</h3>
      
      {/* ファイルドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="text-gray-600">
          <p className="text-lg font-medium">CSVファイルをドロップ</p>
          <p className="text-sm mt-1">または</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
          >
            ファイルを選択
          </label>
        </div>
      </div>

      {/* プレビュー */}
      {previewData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h4 className="font-medium">データプレビュー（最初の5行）</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">時間</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">距離</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ペース</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">心拍数</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2 text-sm font-mono">{row.time}</td>
                    <td className="px-3 py-2 text-sm">{row.distance}</td>
                    <td className="px-3 py-2 text-sm font-mono">{row.pace}</td>
                    <td className="px-3 py-2 text-sm">{row.heartRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-gray-50 border-t">
            <button
              onClick={applyCSVData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              データを取り込む
            </button>
          </div>
        </div>
      )}

      {/* 対応形式の説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">対応するCSV形式</h4>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• Garmin Connect エクスポートファイル</li>
          <li>• Time, Distance, Pace, Heart Rate 列を含むCSV</li>
          <li>• 日本語カラム名（時間、距離、ペース、心拍数）にも対応</li>
        </ul>
      </div>
    </div>
  )
}

// スプリット入力
function SplitTimeEntry({ raceData, setRaceData }: LapAnalysisStepProps) {
  const [currentSplit, setCurrentSplit] = useState('')
  const [currentSplitDistance, setCurrentSplitDistance] = useState('')

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr.trim()) return 0
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      const minutes = parseInt(parts[0])
      const seconds = parseFloat(parts[1])
      return minutes * 60 + seconds
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseFloat(parts[2])
      return hours * 3600 + minutes * 60 + seconds
    }
    return 0
  }

  // 秒数を時間:分:秒.ミリ秒形式に変換
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `0:${seconds.toFixed(2).padStart(5, '0')}`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      const formattedSeconds = remainingSeconds % 1 === 0 
        ? remainingSeconds.toFixed(0).padStart(2, '0')
        : remainingSeconds.toFixed(2).padStart(5, '0')
      return `${minutes}:${formattedSeconds}`
    } else {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      const formattedSeconds = remainingSeconds % 1 === 0 
        ? remainingSeconds.toFixed(0).padStart(2, '0')
        : remainingSeconds.toFixed(2).padStart(5, '0')
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${formattedSeconds}`
    }
  }

  // スプリットタイム入力時の時間フォーマット処理
  const handleSplitTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // 秒数のみの入力（例: 300, 30000, 80.5）を分:秒.ミリ秒形式に自動変換
    if (/^\d+\.?\d*$/.test(value) && !value.includes(':')) {
      const numValue = value
      
      // 5桁以上の数字の場合（例: 30000 = 3:00.00）
      if (numValue.length >= 5) {
        const minutes = Math.floor(parseInt(numValue) / 10000)
        const seconds = Math.floor((parseInt(numValue) % 10000) / 100)
        const centiseconds = parseInt(numValue) % 100
        value = `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
      } else {
        // 4桁以下の場合は秒数として解釈（例: 80.5 → 1:20.5）
        const seconds = parseFloat(value)
        if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          const formattedSeconds = remainingSeconds % 1 === 0 
            ? remainingSeconds.toFixed(0).padStart(2, '0')
            : remainingSeconds.toFixed(2).padStart(5, '0')
          value = `${minutes}:${formattedSeconds}`
        } else {
          // 60秒未満の場合（例: 80.5 → 1:20.5）
          const formattedSeconds = seconds % 1 === 0 
            ? seconds.toFixed(0).padStart(2, '0')
            : seconds.toFixed(2).padStart(5, '0')
          value = `0:${formattedSeconds}`
        }
      }
    }
    
    // 分:秒形式の入力（例: 3:00）を正規化
    if (/^\d+:\d+$/.test(value)) {
      const [minutes, seconds] = value.split(':').map(Number)
      if (seconds >= 60) {
        const additionalMinutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        value = `${minutes + additionalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
      } else {
        value = `${minutes}:${seconds.toString().padStart(2, '0')}`
      }
    }
    
    setCurrentSplit(value)
  }

  // スプリットタイムからラップタイムを計算
  const calculateLapTimesFromSplits = (splits: any[]) => {
    if (splits.length === 0) return []
    
    const lapTimes = []
    let previousTime = 0
    
    for (let i = 0; i < splits.length; i++) {
      const currentTime = splits[i].seconds
      const lapTime = currentTime - previousTime
      
      if (lapTime > 0) {
        lapTimes.push({
          distance: splits[i].distance,
          time: formatTime(lapTime),
          seconds: lapTime
        })
      }
      
      previousTime = currentTime
    }
    
    return lapTimes
  }

  const addSplitTime = () => {
    if (!currentSplit.trim()) return
    
    const splitSeconds = parseTimeToSeconds(currentSplit)
    const splitDistance = parseFloat(currentSplitDistance) || 1000 // デフォルト1km
    
    if (splitSeconds <= 0 || splitDistance <= 0) return
    
    const newSplits = [...raceData.splits, {
      distance: splitDistance,
      time: currentSplit,
      seconds: splitSeconds
    }]
    
    // スプリットタイムからラップタイムを自動計算
    const calculatedLapTimes = calculateLapTimesFromSplits(newSplits)
    
    setRaceData(prev => ({
      ...prev,
      splits: newSplits,
      lapTimes: calculatedLapTimes // ラップタイムを自動更新
    }))
    
    setCurrentSplit('')
    setCurrentSplitDistance('')
  }

  const removeSplitTime = (index: number) => {
    setRaceData(prev => {
      const newSplits = prev.splits.filter((_, i) => i !== index)
      const calculatedLapTimes = calculateLapTimesFromSplits(newSplits)
      
      return {
        ...prev,
        splits: newSplits,
        lapTimes: calculatedLapTimes // ラップタイムを自動更新
      }
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">スプリットタイムを入力</h3>
      <p className="text-sm text-gray-600">
        1km毎や5km毎などの区間タイムを入力してください。<br/>
        <span className="text-blue-600 font-medium">💡 スプリットタイムを入力すると、ラップタイムが自動計算されます</span>
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">スプリットタイム</label>
          <input
            type="text"
            value={currentSplit}
            onChange={handleSplitTimeChange}
            placeholder="例: 4:30 または 30000（3:00.00）または 80.5（1:20.5）"
            className="w-full p-3 border border-gray-300 rounded-md font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">距離 (m)</label>
          <input
            type="number"
            value={currentSplitDistance}
            onChange={(e) => setCurrentSplitDistance(e.target.value)}
            placeholder="例: 1000"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <button
        onClick={addSplitTime}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        スプリットを追加
      </button>

      {/* 登録済みスプリット一覧 */}
      {raceData.splits.length > 0 && (
        <div className="border border-gray-200 rounded-md p-3">
          <h4 className="font-medium mb-2">登録済みスプリット（{raceData.splits.length}個）</h4>
          <div className="space-y-1">
            {raceData.splits.map((split, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <div className="font-mono text-sm">
                  <span className="font-medium">{split.distance}m:</span> {split.time}
                </div>
                <button
                  onClick={() => removeSplitTime(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

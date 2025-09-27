'use client'

import React, { useState, useRef } from 'react'
import { DetailedWorkoutStep } from '@/types'
import { apiClient } from '@/lib/api'
import { CSVErrorHandler, convertTechnicalError, downloadSampleCSV } from '@/components/CSV/CSVErrorHandler'
import { CSVPreview } from '@/components/CSV/CSVPreview'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (stepData: Partial<DetailedWorkoutStep>) => void
  sectionType: 'warmup' | 'main' | 'cooldown'
  stepType?: string
}

interface CSVData {
  timestamp: string
  distance: number
  time: number
  pace: string
  heartRate: number
  speed: number
}

interface ImportPreview {
  detectedWorkout: {
    distance: number
    duration: number
    avgPace: string
    avgHeartRate: number
    maxHeartRate: number
  }
  timeRange: {
    start: string
    end: string
  }
  confidence: number
}

export function CSVImportModal({ isOpen, onClose, onImport, sectionType, stepType }: CSVImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVData[]>([])
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [previewData, setPreviewData] = useState<any | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [timeRange, setTimeRange] = useState({ start: '', end: '' })
  const [distanceRange, setDistanceRange] = useState({ start: '', end: '' })
  const [useTimeRange, setUseTimeRange] = useState(true)
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 練習種別のオプションを取得
  const getWorkoutTypeOptions = (sectionType: string) => {
    const options = {
      warmup: [
        { value: 'jogging', label: 'ジョギング' },
        { value: 'walking', label: 'ウォーキング' },
        { value: 'dynamic_stretch', label: '動的ストレッチ' },
        { value: 'flow_run', label: '流し' }
      ],
      main: [
        { value: 'easy_run', label: 'イージーラン' },
        { value: 'long_run', label: 'ロング走' },
        { value: 'medium_run', label: 'ミディアムラン' },
        { value: 'tempo_run', label: 'テンポ走' },
        { value: 'interval_run', label: 'インターバル走' },
        { value: 'repetition', label: 'レペティション' },
        { value: 'build_up', label: 'ビルドアップ走' },
        { value: 'fartlek', label: 'ファルトレク' },
        { value: 'pace_change', label: '変化走' },
        { value: 'hill_run', label: '坂道練習' },
        { value: 'stair_run', label: '階段練習' },
        { value: 'sand_run', label: '砂浜・芝生走' }
      ],
      cooldown: [
        { value: 'jogging', label: 'ジョギング' },
        { value: 'walking', label: 'ウォーキング' },
        { value: 'dynamic_stretch', label: '動的ストレッチ' },
        { value: 'cooldown', label: 'クールダウン' }
      ]
    }
    return options[sectionType as keyof typeof options] || []
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('ファイルサイズが大きすぎます（10MB以下にしてください）')
      return
    }

    // ファイル形式チェック
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('CSVファイルを選択してください')
      return
    }

    setSelectedFile(file)
    setError(null)
    setIsAnalyzing(true)

    try {
      // バックエンドAPIを使用してCSVプレビューを取得
      const encodings = ['shift_jis', 'utf-8', 'cp932', 'euc-jp']
      let previewData = null
      let lastError = null
      
      for (const encoding of encodings) {
        try {
          previewData = await apiClient.previewCSVImport(file, encoding)
          if (previewData && previewData.preview) {
            console.log(`CSV読み込み成功: ${encoding}`)
            break
          }
        } catch (error) {
          console.log(`エンコーディング ${encoding} で失敗:`, error)
          lastError = error
          continue
        }
      }
      
      if (!previewData || !previewData.preview) {
        throw new Error(`CSVファイルの解析に失敗しました。試行したエンコーディング: ${encodings.join(', ')}`)
      }
      
      // プレビューデータを保存
      setPreviewData(previewData)
      setShowPreview(true)
      
      // プレビューデータをCSVData形式に変換
      console.log('CSV変換 - プレビューデータ:', previewData.preview.slice(0, 3))
      
      const convertedData: CSVData[] = previewData.preview.map((row: any, index: number) => ({
        timestamp: row.time || row.timestamp || `${index}`,
        distance: row.distance || row.distance_km || 0,
        time: row.duration || row.time_seconds || 0,
        pace: row.pace || row.avg_pace || '0:00/km',
        heartRate: row.heart_rate || row.avg_hr || row.bpm || 0,
        speed: row.speed || row.velocity || 0
      }))
      
      console.log('CSV変換 - 変換後データ:', convertedData.slice(0, 3))
      
      setCsvData(convertedData)
      
      // 自動分析を実行
      const preview = analyzeCSVData(convertedData, sectionType, stepType)
      setImportPreview(preview)
      
      // デフォルトの時間範囲を設定
      if (convertedData.length > 0) {
        setTimeRange({
          start: convertedData[0].timestamp,
          end: convertedData[convertedData.length - 1].timestamp
        })
      }
    } catch (err) {
      console.error('CSV読み込みエラー:', err)
      setError(convertTechnicalError(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const parseCSV = (text: string): CSVData[] => {
    try {
      // 改行コードを統一
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const lines = normalizedText.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSVファイルに十分なデータがありません')
      }
      
      // ヘッダー行を解析（カンマ区切り、セミコロン区切り、タブ区切りに対応）
      const firstLine = lines[0]
      let delimiter = ','
      if (firstLine.includes(';')) delimiter = ';'
      else if (firstLine.includes('\t')) delimiter = '\t'
      
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''))
      
      if (headers.length < 2) {
        throw new Error('CSVファイルの形式が正しくありません')
      }
      
      const data: CSVData[] = []
      
      console.log('CSV解析 - ヘッダー:', headers) // デバッグ用
      console.log('CSV解析 - 総行数:', lines.length) // デバッグ用
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        
        headers.forEach((header, index) => {
          const value = values[index] || ''
          const cleanHeader = header.toLowerCase().replace(/[_\s]/g, '')
          
          switch (cleanHeader) {
            case 'time':
            case 'timestamp':
            case 'datetime':
              row.timestamp = value
              break
            case 'distance':
            case 'dist':
              row.distance = parseFloat(value) || 0
              break
            case 'duration':
            case 'timeseconds':
            case 'time_seconds':
            case 'elapsedtime':
              row.time = parseInt(value) || 0
              break
            case 'pace':
            case 'avgpace':
            case 'avg_pace':
            case 'paceperkm':
              row.pace = value
              break
            case 'heartrate':
            case 'heart_rate':
            case 'hr':
            case 'avghr':
            case 'avg_hr':
            case 'bpm':
              row.heartRate = parseInt(value) || 0
              break
            case 'speed':
            case 'velocity':
              row.speed = parseFloat(value) || 0
              break
          }
        })
        
        // 有効なデータのみを追加
        if (row.timestamp && (row.distance > 0 || row.time > 0)) {
          data.push(row as CSVData)
        } else {
          console.log('CSV解析 - 無効な行をスキップ:', row) // デバッグ用
        }
      }
      
      if (data.length === 0) {
        throw new Error('有効なデータが見つかりませんでした')
      }
      
      console.log('CSV解析 - 有効なデータ数:', data.length) // デバッグ用
      console.log('CSV解析 - 最初の3行:', data.slice(0, 3)) // デバッグ用
      
      return data
    } catch (error) {
      console.error('CSV解析エラー:', error)
      throw new Error(`CSVファイルの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  const analyzeCSVData = (data: CSVData[], sectionType: string, stepType?: string): ImportPreview => {
    if (data.length === 0) {
      throw new Error('有効なデータが見つかりません')
    }

    // セクションタイプに応じた自動分析
    let filteredData = data
    
    if (useTimeRange && timeRange.start && timeRange.end) {
      filteredData = data.filter(row => 
        row.timestamp >= timeRange.start && row.timestamp <= timeRange.end
      )
    } else if (!useTimeRange && distanceRange.start && distanceRange.end) {
      const startDist = parseFloat(distanceRange.start)
      const endDist = parseFloat(distanceRange.end)
      filteredData = data.filter(row => 
        row.distance >= startDist && row.distance <= endDist
      )
    }

    if (filteredData.length === 0) {
      throw new Error('指定された範囲にデータがありません')
    }

    // 自動練習区分認識を実行
    const autoDetection = performAutoDetection(filteredData, sectionType, stepType)
    
    // 基本統計を計算
    console.log('CSV分析 - filteredData:', filteredData.slice(0, 3)) // デバッグ用
    console.log('CSV分析 - filteredData.length:', filteredData.length)
    
    const totalDistance = filteredData.reduce((sum, row) => sum + (row.distance || 0), 0)
    const totalTime = filteredData.reduce((sum, row) => sum + (row.time || 0), 0)
    const avgHeartRate = filteredData.length > 0 
      ? filteredData.reduce((sum, row) => sum + (row.heartRate || 0), 0) / filteredData.length 
      : 0
    const maxHeartRate = filteredData.length > 0 
      ? Math.max(...filteredData.map(row => row.heartRate || 0)) 
      : 0
    
    console.log('CSV分析 - totalDistance:', totalDistance)
    console.log('CSV分析 - totalTime:', totalTime)
    console.log('CSV分析 - avgHeartRate:', avgHeartRate)
    
    // 平均ペースを計算
    const avgPace = totalTime > 0 && totalDistance > 0 
      ? formatPace(totalTime / totalDistance * 1000) 
      : '0:00/km'

    return {
      detectedWorkout: {
        distance: totalDistance,
        duration: totalTime,
        avgPace,
        avgHeartRate: Math.round(avgHeartRate),
        maxHeartRate
      },
      timeRange: {
        start: filteredData[0].timestamp,
        end: filteredData[filteredData.length - 1].timestamp
      },
      confidence: autoDetection.confidence
    }
  }

  // 自動練習区分認識機能
  const performAutoDetection = (data: CSVData[], sectionType: string, stepType?: string) => {
    let confidence = 0.8
    let detectedType = 'unknown'
    let analysisDetails = ''

    if (sectionType === 'warmup') {
      // ウォームアップの自動認識
      const hrStability = analyzeHeartRateStability(data)
      const paceConsistency = analyzePaceConsistency(data)
      
      if (hrStability > 0.8 && paceConsistency > 0.7) {
        detectedType = 'jogging'
        confidence = 0.9
        analysisDetails = '心拍とペースが安定しており、ジョギングと判定されます'
      } else if (data.length > 10 && analyzePaceVariations(data) > 5) {
        detectedType = 'movement_prep'
        confidence = 0.8
        analysisDetails = 'ペース変化が多く、動き作り系のウォームアップと判定されます'
      } else {
        detectedType = 'walking'
        confidence = 0.7
        analysisDetails = '低強度のウォームアップと判定されます'
      }
    } else if (sectionType === 'main') {
      // メイン練習の自動認識
      const paceVariations = analyzePaceVariations(data)
      const hrVariations = analyzeHeartRateVariations(data)
      const avgPace = data.reduce((sum, row) => sum + parsePaceToSeconds(row.pace), 0) / data.length
      
      if (paceVariations > 8 && hrVariations > 0.3) {
        // インターバル練習の判定
        const intervalPattern = detectIntervalPattern(data)
        if (intervalPattern.detected) {
          detectedType = 'interval_run'
          confidence = intervalPattern.confidence
          analysisDetails = `${intervalPattern.sets}セットのインターバル練習と判定されます`
        } else {
          detectedType = 'fartlek'
          confidence = 0.8
          analysisDetails = '不規則なペース変化からファルトレクと判定されます'
        }
      } else if (paceVariations < 3 && hrVariations < 0.2) {
        // テンポ走の判定
        if (avgPace < 240) { // 4:00/km未満
          detectedType = 'tempo_run'
          confidence = 0.9
          analysisDetails = '一定ペースでの高強度走からテンポ走と判定されます'
        } else {
          detectedType = 'easy_run'
          confidence = 0.8
          analysisDetails = '楽なペースでのランニングと判定されます'
        }
      } else {
        detectedType = 'medium_run'
        confidence = 0.7
        analysisDetails = '中程度の強度でのランニングと判定されます'
      }
    } else if (sectionType === 'cooldown') {
      // クールダウンの自動認識
      const hrTrend = analyzeHeartRateTrend(data)
      const paceTrend = analyzePaceTrend(data)
      
      if (hrTrend < -0.5 && paceTrend > 0.3) {
        detectedType = 'jogging'
        confidence = 0.9
        analysisDetails = '心拍が下がり、ペースが上がる典型的なクールダウンと判定されます'
      } else {
        detectedType = 'walking'
        confidence = 0.8
        analysisDetails = '低強度のクールダウンと判定されます'
      }
    }

    return {
      detectedType,
      confidence,
      analysisDetails
    }
  }

  // インターバルパターンの検出
  const detectIntervalPattern = (data: CSVData[]) => {
    const paceChanges = []
    let currentSegment = { start: 0, end: 0, avgPace: 0, avgHR: 0 }
    
    for (let i = 1; i < data.length; i++) {
      const prevPace = parsePaceToSeconds(data[i-1].pace)
      const currPace = parsePaceToSeconds(data[i].pace)
      const paceChange = Math.abs(prevPace - currPace)
      
      if (paceChange > 30) { // 30秒以上の変化
        paceChanges.push(i)
      }
    }
    
    // セット数を推定（ペース変化点の数から）
    const estimatedSets = Math.floor(paceChanges.length / 2) + 1
    const confidence = estimatedSets >= 3 && estimatedSets <= 10 ? 0.9 : 0.6
    
    return {
      detected: estimatedSets >= 3,
      sets: estimatedSets,
      confidence
    }
  }

  // 心拍数の安定性分析
  const analyzeHeartRateStability = (data: CSVData[]): number => {
    if (data.length < 2) return 1
    const heartRates = data.map(row => row.heartRate)
    const avg = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
    const variance = heartRates.reduce((sum, hr) => sum + Math.pow(hr - avg, 2), 0) / heartRates.length
    const stability = 1 - (Math.sqrt(variance) / avg)
    return Math.max(0, Math.min(1, stability))
  }

  // ペースの一貫性分析
  const analyzePaceConsistency = (data: CSVData[]): number => {
    if (data.length < 2) return 1
    const paces = data.map(row => parsePaceToSeconds(row.pace))
    const avg = paces.reduce((sum, pace) => sum + pace, 0) / paces.length
    const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - avg, 2), 0) / paces.length
    const consistency = 1 - (Math.sqrt(variance) / avg)
    return Math.max(0, Math.min(1, consistency))
  }

  // 心拍数の変化分析
  const analyzeHeartRateVariations = (data: CSVData[]): number => {
    if (data.length < 2) return 0
    const heartRates = data.map(row => row.heartRate)
    const min = Math.min(...heartRates)
    const max = Math.max(...heartRates)
    return (max - min) / min
  }

  // 心拍数のトレンド分析
  const analyzeHeartRateTrend = (data: CSVData[]): number => {
    if (data.length < 3) return 0
    const firstThird = data.slice(0, Math.floor(data.length / 3))
    const lastThird = data.slice(-Math.floor(data.length / 3))
    
    const firstAvg = firstThird.reduce((sum, row) => sum + row.heartRate, 0) / firstThird.length
    const lastAvg = lastThird.reduce((sum, row) => sum + row.heartRate, 0) / lastThird.length
    
    return (lastAvg - firstAvg) / firstAvg
  }

  // ペースのトレンド分析
  const analyzePaceTrend = (data: CSVData[]): number => {
    if (data.length < 3) return 0
    const firstThird = data.slice(0, Math.floor(data.length / 3))
    const lastThird = data.slice(-Math.floor(data.length / 3))
    
    const firstAvg = firstThird.reduce((sum, row) => sum + parsePaceToSeconds(row.pace), 0) / firstThird.length
    const lastAvg = lastThird.reduce((sum, row) => sum + parsePaceToSeconds(row.pace), 0) / lastThird.length
    
    return (lastAvg - firstAvg) / firstAvg
  }

  const analyzePaceVariations = (data: CSVData[]): number => {
    // ペース変化の回数をカウント（簡易実装）
    let variations = 0
    for (let i = 1; i < data.length; i++) {
      const prevPace = parsePaceToSeconds(data[i-1].pace)
      const currPace = parsePaceToSeconds(data[i].pace)
      if (Math.abs(prevPace - currPace) > 30) { // 30秒以上の変化
        variations++
      }
    }
    return variations
  }

  const parsePaceToSeconds = (pace: string): number => {
    if (!pace) return 0
    const match = pace.match(/(\d+):(\d+)/)
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2])
    }
    return 0
  }

  const formatPace = (secondsPerKm: number): string => {
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const handleImport = () => {
    if (!importPreview || !selectedWorkoutType) return

    const stepData: Partial<DetailedWorkoutStep> = {
      type: selectedWorkoutType,
      name: `${sectionType === 'warmup' ? 'ウォームアップ' : sectionType === 'main' ? 'メイン練習' : 'クールダウン'}`,
      distance_meters: Math.round(parseFloat(importPreview.detectedWorkout.distance) * 1000),
      duration_seconds: parseFloat(importPreview.detectedWorkout.duration),
      target_pace: importPreview.detectedWorkout.avgPace,
      intensity_rpe: calculateRPE(parseFloat(importPreview.detectedWorkout.avgHeartRate)),
      notes: `CSVからインポート (信頼度: ${Math.round(importPreview.confidence * 100)}%)`
    }

    onImport(stepData)
    onClose()
  }

  const calculateRPE = (heartRate: number): number => {
    // 簡易的なRPE計算（最大心拍数200を仮定）
    const maxHR = 200
    const hrPercent = heartRate / maxHR
    return Math.round(hrPercent * 10)
  }

  const handleReanalyze = () => {
    if (!csvData.length) return
    
    try {
      const preview = analyzeCSVData(csvData, sectionType, stepType)
      setImportPreview(preview)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析に失敗しました')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 CSVから読み込み - {sectionType === 'warmup' ? 'ウォームアップ' : sectionType === 'main' ? 'メイン練習' : 'クールダウン'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* ファイル選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ファイル選択
              </label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    <p>選択されたファイル: <span className="font-medium">{selectedFile.name}</span></p>
                    <p>ファイルサイズ: <span className="font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span></p>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  <p>• CSVファイル（.csv）のみ対応</p>
                  <p>• ファイルサイズ: 10MB以下</p>
                  <p>• 対応カラム: time, distance, duration, pace, heart_rate, speed</p>
                  <p>• <strong>文字化けファイル対応:</strong> Garmin等の日本語CSVファイルも自動修正</p>
                  <p>• エンコーディング: Shift_JIS、UTF-8、CP932、EUC-JPを自動試行</p>
                </div>
              </div>
            </div>

            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">CSVデータを分析中...</p>
              </div>
            )}

            {error && (
              <CSVErrorHandler
                error={error}
                onRetry={() => {
                  setError(null)
                  setShowPreview(false)
                  setPreviewData(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                onDownloadSample={() => downloadSampleCSV('workout')}
                onShowHelp={() => {
                  // ヘルプモーダルを表示する処理
                  alert('CSVインポートのヘルプ:\n\n1. CSVファイル（.csv）のみ対応\n2. ファイルサイズ: 10MB以下\n3. 対応カラム: time, distance, duration, pace, heart_rate, speed\n4. 文字化けファイル対応: Garmin等の日本語CSVファイルも自動修正\n5. エンコーディング: Shift_JIS、UTF-8、CP932、EUC-JPを自動試行')
                }}
              />
            )}

            {showPreview && previewData && (
              <CSVPreview
                previewData={previewData}
                onConfirm={() => {
                  setShowPreview(false)
                  // プレビューから詳細設定に進む
                }}
                onCancel={() => {
                  setShowPreview(false)
                  setPreviewData(null)
                }}
                onRetry={() => {
                  setShowPreview(false)
                  setPreviewData(null)
                  if (selectedFile) {
                    handleFileSelect({ target: { files: [selectedFile] } } as any)
                  }
                }}
              />
            )}

            {csvData.length > 0 && !showPreview && (
              <div className="space-y-4">
                {/* インポート範囲指定 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">インポート範囲指定</h3>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={useTimeRange}
                          onChange={() => setUseTimeRange(true)}
                          className="mr-2"
                        />
                        時間範囲
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!useTimeRange}
                          onChange={() => setUseTimeRange(false)}
                          className="mr-2"
                        />
                        距離範囲
                      </label>
                    </div>

                    {useTimeRange ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            開始時間
                          </label>
                          <input
                            type="time"
                            value={timeRange.start}
                            onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            終了時間
                          </label>
                          <input
                            type="time"
                            value={timeRange.end}
                            onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            開始距離 (km)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={distanceRange.start}
                            onChange={(e) => setDistanceRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            終了距離 (km)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={distanceRange.end}
                            onChange={(e) => setDistanceRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleReanalyze}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      🔄 再分析
                    </button>
                  </div>
                </div>

                {/* プレビュー */}
                {importPreview && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">プレビュー</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">検出された練習</p>
                        <p className="text-lg font-semibold">
                          {parseFloat(importPreview.detectedWorkout.distance).toFixed(1)}km ({Math.floor(parseFloat(importPreview.detectedWorkout.duration) / 60)}分)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">平均ペース</p>
                        <p className="text-lg font-semibold">{importPreview.detectedWorkout.avgPace}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">平均心拍</p>
                        <p className="text-lg font-semibold">{importPreview.detectedWorkout.avgHeartRate} bpm</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">信頼度</p>
                        <p className="text-lg font-semibold">{Math.round(importPreview.confidence * 100)}%</p>
                      </div>
                    </div>

                    {/* 自動認識結果の表示 */}
                    {/* 練習種別選択 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        練習種別を選択 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedWorkoutType}
                        onChange={(e) => setSelectedWorkoutType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">練習種別を選択してください</option>
                        {getWorkoutTypeOptions(sectionType).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AI自動認識結果の表示 */}
                    {csvData.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">🤖 AI自動認識結果</h4>
                        <div className="text-sm text-blue-800">
                          {(() => {
                            const autoDetection = performAutoDetection(
                              csvData.filter(row => 
                                useTimeRange 
                                  ? (row.timestamp >= timeRange.start && row.timestamp <= timeRange.end)
                                  : (row.distance >= parseFloat(distanceRange.start) && row.distance <= parseFloat(distanceRange.end))
                              ),
                              sectionType,
                              stepType
                            )
                            return (
                              <div>
                                <p className="mb-1">
                                  <span className="font-medium">判定種別:</span> {autoDetection.detectedType}
                                </p>
                                <p className="text-xs text-blue-700">{autoDetection.analysisDetails}</p>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                          💡 上記の判定結果を参考に、適切な練習種別を選択してください
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleImport}
                        disabled={!selectedWorkoutType}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                          selectedWorkoutType 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        ✅ インポートして現在の練習に適用
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToastHelpers } from '@/components/UI/Toast'
import { formatDateToSlash, formatDateFromSlash, getCurrentDateSlash } from '@/utils/dateFormat'
import { DateInput } from '@/components/UI/DateInput'

export function DetailedRaceForm() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const toast = useToastHelpers()
  const [formData, setFormData] = useState({
    raceName: '',
    date: getCurrentDateSlash(),
    raceType: 'track',
    distance: 0,
    raceSubType: '', // 予選・決勝・記録会の情報
    timeSeconds: 0,
    pace: '',
    position: '',
    participants: '',
    notes: ''
  });

  const [timeString, setTimeString] = useState('');
  const [timeError, setTimeError] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [customDistance, setCustomDistance] = useState('');
  
  // ラップタイム機能
  const [lapTimes, setLapTimes] = useState<Array<{lap: number, time: string, seconds: number, distance: number}>>([]);
  const [currentLap, setCurrentLap] = useState('');
  const [currentLapDistance, setCurrentLapDistance] = useState('');
  
  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])

  // 自動保存機能
  const AUTO_SAVE_KEY = 'detailed_race_form_draft'
  
  // 初期化時に保存されたデータを復元（新しいレース追加時はクリア）
  useEffect(() => {
    try {
      // URLパスを確認して、新しいレース追加の場合は自動保存データをクリア
      const isNewRace = window.location.pathname.includes('/races/create')
      
      if (isNewRace) {
        // 新しいレース追加時は自動保存データをクリア
        localStorage.removeItem(AUTO_SAVE_KEY)
        console.log('🆕 新しいレース追加: 自動保存データをクリアしました')
        return
      }
      
      // 編集時のみ自動保存データを復元
      const savedData = localStorage.getItem(AUTO_SAVE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData.formData || formData)
        setTimeString(parsedData.timeString || '')
        setSelectedDistance(parsedData.selectedDistance || '')
        setSelectedSubType(parsedData.selectedSubType || '')
        setCustomDistance(parsedData.customDistance || '')
        setLapTimes(parsedData.lapTimes || [])
        console.log('📝 自動保存データを復元しました')
      }
    } catch (error) {
      console.error('自動保存データの復元に失敗:', error)
    }
  }, [])

  // データ変更時に自動保存
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const saveData = {
          formData,
          timeString,
          selectedDistance,
          selectedSubType,
          customDistance,
          lapTimes
        }
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData))
        console.log('💾 自動保存しました')
      } catch (error) {
        console.error('自動保存に失敗:', error)
      }
    }, 1000) // 1秒後に保存

    return () => clearTimeout(timeoutId)
  }, [formData, timeString, selectedDistance, selectedSubType, customDistance, lapTimes])

  // 距離に基づくラップ距離テンプレート
  const getLapDistanceTemplate = () => {
    if (formData.raceType === 'track') {
      switch(formData.distance) {
        case 800: return 400; // 400m × 2周
        case 1500: return 400; // 400m × 3.75周
        case 3000: return 1000; // 1000m × 3周
        case 5000: return 1000; // 1000m × 5周
        case 10000: return 1000; // 1000m × 10周
        default: return 400;
      }
    } else if (formData.raceType === 'road') {
      switch(formData.distance) {
        case 5000: return 1000; // 1km刻み
        case 10000: return 1000; // 1km刻み
        case 21097: return 5000; // 5km刻み
        case 42195: return 5000; // 5km刻み
        default: return 1000;
      }
    } else {
      return 1000; // 駅伝デフォルト
    }
  };

  // 秒数を時間文字列に変換（表示用）
  const formatSecondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
    } else {
      return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
    }
  };

  // よくあるパターンのテンプレート
  const getCommonPatternTemplates = (): Array<{value: number[], label: string, description: string}> => {
    const { raceType, distance } = formData
    
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
    const { raceType, distance } = formData
    
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

  // ペース計算関数（分/km）
  const formatPace = (seconds: number, distance: number): string => {
    if (distance === 0) return '0:00'
    const paceSecondsPerKm = (seconds / distance) * 1000
    const minutes = Math.floor(paceSecondsPerKm / 60)
    const secs = Math.floor(paceSecondsPerKm % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // ラップタイム入力ハンドラー（改良版）
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
  };

  // ラップ追加処理（シンプル版）
  const addLapTime = () => {
    if (!currentLap.trim()) return;
    
    const lapSeconds = parseTimeToSeconds(currentLap);
    const lapDistance = parseFloat(currentLapDistance) || getLapDistanceTemplate();
    
    if (lapSeconds <= 0 || lapDistance <= 0) {
      alert('有効なタイムと距離を入力してください');
      return;
    }
    
    // 距離超過チェック
    const currentTotalDistance = lapTimes.reduce((sum, lap) => sum + lap.distance, 0);
    const newTotalDistance = currentTotalDistance + lapDistance;
    
    if (formData.distance > 0 && newTotalDistance > formData.distance) {
      const remaining = formData.distance - currentTotalDistance;
      const confirmMessage = `このラップを追加すると総距離が${newTotalDistance}mとなり、レース距離${formData.distance}mを${newTotalDistance - formData.distance}m超過します。\n\n残り距離: ${remaining}m\n\n追加しますか？`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    setLapTimes(prev => [...prev, { 
      lap: prev.length + 1, 
      time: currentLap, // 入力された形式をそのまま保持
      seconds: lapSeconds,
      distance: lapDistance 
    }]);
    setCurrentLap('');
  };

  // Enterキーでのラップ追加
  const handleLapKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLapTime();
    }
  };

  // ラップ削除処理
  const removeLapTime = (index: number) => {
    setLapTimes(prev => prev.filter((_, i) => i !== index));
  };

  // よくあるパターンテンプレート適用
  const applyCommonPattern = (pattern: number[]) => {
    if (lapTimes.length > 0) {
      const confirmMessage = `既存のラップデータがあります。\n\nよくあるパターン「${pattern.join('-')}m」を適用しますか？\n\n（既存のデータは上書きされます）`
      if (!confirm(confirmMessage)) return
    }
    
    const newLaps = pattern.map((distance, index) => ({
      lap: index + 1,
      time: '',
      seconds: 0,
      distance: distance
    }))
    
    setLapTimes(newLaps)
  }

  // テンプレート選択ハンドラー（自動ラップ生成機能付き）
  const handleTemplateSelect = (templateValue: number) => {
    setCurrentLapDistance(templateValue.toString())
    
    // 自動ラップ生成機能
    if (formData.distance > 0 && templateValue > 0) {
      const expectedLaps = Math.floor(formData.distance / templateValue)
      const currentLaps = lapTimes.length
      
      if (expectedLaps > 0 && currentLaps === 0) {
        const confirmMessage = `${formData.distance}mのレースで${templateValue}mラップを選択しました。\n\n自動で${expectedLaps}個のラップ記入欄を生成しますか？\n\n（後から個別に追加・削除も可能です）`
        
        if (confirm(confirmMessage)) {
          // 空のラップ記入欄を生成
          const newLaps = Array.from({ length: expectedLaps }, (_, index) => ({
            lap: index + 1,
            time: '',
            seconds: 0,
            distance: templateValue
          }))
          
          setLapTimes(newLaps)
        }
      }
    }
  }

  // 自動生成されたラップのタイムを更新
  const handleLapTimeUpdate = (index: number, time: string) => {
    // 秒数のみの入力（例: 300, 30000, 80.5）を分:秒.ミリ秒形式に自動変換
    let formattedValue = time
    if (/^\d+\.?\d*$/.test(time) && !time.includes(':')) {
      const numValue = time
      
      // 5桁以上の数字の場合（例: 30000 = 3:00.00）
      if (numValue.length >= 5) {
        const minutes = Math.floor(parseInt(numValue) / 10000)
        const seconds = Math.floor((parseInt(numValue) % 10000) / 100)
        const centiseconds = parseInt(numValue) % 100
        formattedValue = `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
      } else {
        // 4桁以下の場合は秒数として解釈（例: 80.5 → 1:20.5）
        const seconds = parseFloat(time)
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

  // ラップタイム更新時の処理（自動生成されたラップ用）
  const updateLapTime = (index: number, time: string) => {
    const lapSeconds = parseTimeToSeconds(time)
    
    setLapTimes(prev => prev.map((lap, i) => 
      i === index 
        ? { ...lap, time, seconds: lapSeconds }
        : lap
    ))
  }

  // ラップの距離を更新
  const updateLapDistance = (index: number, distance: number) => {
    // 距離超過チェック
    const currentTotalDistance = lapTimes.reduce((sum, lap, i) => 
      i === index ? sum : sum + lap.distance, 0
    )
    const newTotalDistance = currentTotalDistance + distance
    
    if (formData.distance > 0 && newTotalDistance > formData.distance) {
      const remaining = formData.distance - currentTotalDistance
      const excess = newTotalDistance - formData.distance
      const confirmMessage = `⚠️ 距離超過警告\n\nこの距離に変更すると：\n• 総距離: ${newTotalDistance}m\n• レース距離: ${formData.distance}m\n• 超過: ${excess}m\n• 残り距離: ${remaining}m\n\n変更しますか？`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }
    
    setLapTimes(prev => prev.map((lap, i) => 
      i === index 
        ? { ...lap, distance }
        : lap
    ))
  }

  // 距離変更時にラップ距離テンプレートをリセット
  React.useEffect(() => {
    if (formData.distance > 0) {
      setCurrentLapDistance(getLapDistanceTemplate().toString());
    }
  }, [formData.distance, formData.raceType]);

  // トラック種目の詳細選択肢（予選・決勝・記録会）
  const trackDistances = [
    { value: '800_preliminary', label: '800m（予選）', distance: 800 },
    { value: '800_final', label: '800m（決勝）', distance: 800 },
    { value: '800_time_trial', label: '800m（記録会）', distance: 800 },
    { value: '1500_preliminary', label: '1500m（予選）', distance: 1500 },
    { value: '1500_final', label: '1500m（決勝）', distance: 1500 },
    { value: '1500_time_trial', label: '1500m（記録会）', distance: 1500 },
    { value: '3000_preliminary', label: '3000m（予選）', distance: 3000 },
    { value: '3000_final', label: '3000m（決勝）', distance: 3000 },
    { value: '3000_time_trial', label: '3000m（記録会）', distance: 3000 },
    { value: '5000_preliminary', label: '5000m（予選）', distance: 5000 },
    { value: '5000_final', label: '5000m（決勝）', distance: 5000 },
    { value: '5000_time_trial', label: '5000m（記録会）', distance: 5000 },
    { value: '10000_preliminary', label: '10000m（予選）', distance: 10000 },
    { value: '10000_final', label: '10000m（決勝）', distance: 10000 },
    { value: '10000_time_trial', label: '10000m（記録会）', distance: 10000 },
    { value: 'custom', label: 'その他（手入力）', distance: 0 }
  ];

  // ロード種目の選択肢
  const roadDistances = [
    { value: '5km', label: '5km', distance: 5000 },
    { value: '10km', label: '10km', distance: 10000 },
    { value: 'half_marathon', label: 'ハーフマラソン', distance: 21097 },
    { value: 'full_marathon', label: 'フルマラソン', distance: 42195 },
    { value: 'custom', label: 'その他（手入力）', distance: 0 }
  ];

  // 駅伝は区間距離入力のみ
  const ekidenDistances = [
    { value: 'custom', label: '区間距離を入力', distance: 0 }
  ];

  const getDistanceOptions = () => {
    switch(formData.raceType) {
      case 'track': return trackDistances;
      case 'road': return roadDistances;
      case 'relay': return ekidenDistances;
      default: return [];
    }
  };

  // タイム文字列の検証
  const validateTimeString = (timeStr: string) => {
    if (!timeStr.trim()) return '';
    
    // トラック種目用正規表現（小数第二位対応）
    const trackRegex = /^(\d{1,2}):([0-5]?\d(?:\.\d{1,2})?)$|^(\d{1,2}):([0-5]?\d):([0-5]?\d(?:\.\d{1,2})?)$/;
    // ロード・駅伝用正規表現（整数秒のみ）
    const roadRegex = /^(\d{1,2}):([0-5]?\d)$|^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/;
    
    const regex = formData.raceType === 'track' ? trackRegex : roadRegex;
    
    if (!regex.test(timeStr)) {
      return formData.raceType === 'track' 
        ? '正しい形式で入力してください（例: 12.50 または 2:15.34）'
        : '正しい形式で入力してください（例: 25:30 または 1:25:30）';
    }
    
    return '';
  };

  // タイム変換の改善版
  const parseTimeToSeconds = (timeStr: string) => {
    if (!timeStr.trim()) return 0;
    
    const parts = timeStr.split(':');
    
    try {
      if (parts.length === 2) {
        // MM:SS または MM:SS.XX
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        
        if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds >= 60) {
          return 0;
        }
        
        return minutes * 60 + seconds;
      } else if (parts.length === 3) {
        // HH:MM:SS または HH:MM:SS.XX
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseFloat(parts[2]);
        
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || 
            hours < 0 || minutes >= 60 || seconds >= 60) {
          return 0;
        }
        
        return hours * 3600 + minutes * 60 + seconds;
      }
    } catch (error) {
      return 0;
    }
    
    return 0;
  };

  // タイム入力ハンドラーの改善版
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeString(value);
    
    // バリデーション実行
    const error = validateTimeString(value);
    setTimeError(error);
    
    // エラーがない場合のみ秒数変換
    if (!error && value.trim()) {
      const seconds = parseTimeToSeconds(value);
      if (seconds > 0) {
        setFormData(prev => ({ ...prev, timeSeconds: seconds }));
      }
    } else if (!value.trim()) {
      setFormData(prev => ({ ...prev, timeSeconds: 0 }));
    }
  };

  // リアルタイム入力制限（キーボード入力時の制御）
  const handleTimeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedChars = /[0-9:.]/;
    if (!allowedChars.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  // 予選・決勝・記録会に応じたクイックタイム
  const getQuickTimesByDistance = () => {
    if (formData.raceType === 'track') {
      const baseDistance = formData.distance;
      const isTimeTrialOrPreliminary = formData.raceSubType?.includes('time_trial') || formData.raceSubType?.includes('preliminary');
      
      // 基本タイム設定
      let baseTimes = [];
      switch(baseDistance) {
        case 800:
          baseTimes = ['1:45.00', '2:00.00', '2:15.00', '2:30.00', '2:45.00', '3:00.00'];
          break;
        case 1500:
          baseTimes = ['3:30.00', '4:00.00', '4:30.00', '5:00.00', '5:30.00', '6:00.00'];
          break;
        case 3000:
          baseTimes = ['8:00.00', '9:00.00', '10:00.00', '11:00.00', '12:00.00', '13:00.00'];
          break;
        case 5000:
          baseTimes = ['14:00.00', '15:30.00', '17:00.00', '18:30.00', '20:00.00', '22:00.00'];
          break;
        case 10000:
          baseTimes = ['30:00.00', '33:00.00', '36:00.00', '40:00.00', '44:00.00', '48:00.00'];
          break;
        default:
          return [];
      }
      
      // 記録会や予選の場合は少し遅めのタイムも追加
      if (isTimeTrialOrPreliminary && baseTimes.length > 0) {
        // より幅広いタイム範囲を提供
        return baseTimes;
      }
      
      return baseTimes;
    } else if (formData.raceType === 'road') {
      switch(formData.distance) {
        case 5000: // 5km
          // トラック5000mと同じタイムに統一
          return ['14:00', '15:30', '17:00', '18:30', '20:00', '22:00'];
        case 10000: // 10km
          // トラック10000mと同じタイムに統一
          return ['30:00', '33:00', '36:00', '40:00', '44:00', '48:00'];
        case 21097: // ハーフマラソン
          // 一般市民ランナーのハーフ：1時間10分～2時間30分
          return ['1:10:00', '1:25:00', '1:40:00', '1:55:00', '2:10:00', '2:25:00'];
        case 42195: // フルマラソン
          // 一般市民ランナーのフル：2時間30分～5時間30分
          return ['2:30:00', '3:15:00', '3:45:00', '4:15:00', '4:45:00', '5:15:00'];
        default:
          return [];
      }
    } else {
      // 駅伝 - 区間距離により変動するため汎用的な範囲
      return ['8:00', '12:00', '16:00', '20:00', '25:00', '30:00'];
    }
  };

  // クイックタイム選択の改善版
  const handleQuickTime = (timeValue: string) => {
    setTimeString(timeValue);
    setTimeError('');
    const seconds = parseTimeToSeconds(timeValue);
    setFormData(prev => ({ ...prev, timeSeconds: seconds }));
  };

  // 距離選択（第1段階）
  const handleDistanceSelect = (distance: number | string) => {
    setSelectedDistance(distance.toString());
    setSelectedSubType(''); // 距離変更時は種別をリセット
    
    if (formData.raceType !== 'track' && distance !== 'custom') {
      // トラック以外は距離選択だけで完了
      setFormData(prev => ({
        ...prev,
        distance: distance as number,
        raceSubType: 'standard'
      }));
    }
  };

  // 種別選択（第2段階）
  const handleSubTypeSelect = (subType: string) => {
    setSelectedSubType(subType);
    
    if (selectedDistance && selectedDistance !== 'custom') {
      setFormData(prev => ({
        ...prev,
        distance: parseFloat(selectedDistance),
        raceSubType: `${selectedDistance}_${subType}`
      }));
    }
  };

  // カスタム距離
  const handleCustomDistance = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDistance(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const meters = formData.raceType === 'relay' ? numValue * 1000 : numValue;
      setFormData(prev => ({
        ...prev,
        distance: meters,
        raceSubType: 'custom'
      }));
    }
  };

  // レース種目変更処理
  const handleRaceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      raceType: e.target.value,
      distance: 0,
      raceSubType: ''
    }));
    setSelectedDistance('');
    setSelectedSubType('');
    setCustomDistance('');
    setTimeError('');
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.raceName.trim()) {
      toast.warning('入力エラー', '大会名を入力してください')
      return
    }
    
    if (formData.timeSeconds <= 0) {
      toast.warning('入力エラー', 'タイムを入力してください')
      return
    }

    if (formData.distance <= 0) {
      toast.warning('入力エラー', '距離を選択してください')
      return
    }

    // トラック種目の種別選択チェック
    if (formData.raceType === 'track' && !formData.raceSubType) {
      toast.warning('入力エラー', '種別（予選・決勝・記録会）を選択してください')
      return
    }

    // API送信用データ準備
    // 日付の処理
    let formattedDate = ''
    if (formData.date) {
      if (typeof formData.date === 'string') {
        formattedDate = formatDateFromSlash(formData.date)
      } else if (formData.date instanceof Date) {
        formattedDate = formData.date.toISOString().split('T')[0]
      } else {
        console.warn('Invalid date format:', formData.date)
        formattedDate = new Date().toISOString().split('T')[0] // デフォルトは今日の日付
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0] // デフォルトは今日の日付
    }
    
      const submitData = {
        race_name: formData.raceName,
        race_date: formattedDate,
        race_type: formData.raceType,
        distance_meters: formData.distance,
        time_seconds: formData.timeSeconds,
        place: formData.position ? parseInt(formData.position) : null,
        total_participants: formData.participants ? parseInt(formData.participants) : null,
        notes: formData.notes || null
      };

    console.log('送信前データ詳細:', submitData);

    try {
      // apiClientを使用して認証ヘッダーを自動追加
      const { apiClient } = await import('@/lib/api')
      
      await apiClient.createRace(submitData)
      
      toast.success('保存完了', 'レース結果を保存しました！')
      
      // 自動保存データをクリア
      localStorage.removeItem(AUTO_SAVE_KEY)
      
      // フォームリセット
      setFormData({
        raceName: '',
        date: getCurrentDateSlash(),
        raceType: 'track',
        distance: 0,
        raceSubType: '',
        timeSeconds: 0,
        pace: '',
        position: '',
        participants: '',
        notes: ''
      });
      setTimeString('');
      setTimeError('');
      setSelectedDistance('');
      setSelectedSubType('');
      setCustomDistance('');
      setLapTimes([]);
      setCurrentLap('');
      setCurrentLapDistance('');
      
    } catch (error) {
      console.error('レース保存エラー:', error);
      toast.error('保存失敗', `保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  };

  const isCustomSelected = selectedDistance === 'custom';

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">ログインが必要です</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新しいレース結果</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">日付 *</label>
                <DateInput
                  value={formData.date}
                  onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                  placeholder="2024/1/1"
                />
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">大会名 *</label>
                <input
                  type="text"
            value={formData.raceName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, raceName: e.target.value }))}
                  placeholder="例: 東京マラソン"
            className="w-full p-3 border border-gray-300 rounded-md"
            required
                />
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">レース種目 *</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'track', label: 'トラック', icon: '🏃‍♂️' },
              { value: 'road', label: 'ロード', icon: '🏃‍♀️' },
              { value: 'relay', label: '駅伝', icon: '🏃‍♂️' }
            ].map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    raceType: type.value,
                    distance: 0,
                    raceSubType: ''
                  }));
                  setSelectedDistance('');
                  setSelectedSubType('');
                  setCustomDistance('');
                  setTimeError('');
                }}
                className={`p-4 text-sm border rounded-lg transition-all ${
                  formData.raceType === type.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl mb-1">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2段階距離選択 */}
        {formData.raceType === 'relay' ? (
          // 駅伝は区間距離入力のみ
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">区間距離 * (km)</label>
                        <input
              type="number"
              step="0.1"
              value={customDistance}
              onChange={handleCustomDistance}
              placeholder="例: 5.8"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              あなたが走った区間の距離をkm単位で入力してください
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              距離 *
                      </label>
            
            {/* 第1段階：距離選択 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(formData.raceType === 'track' ? [
                { value: 800, label: '800m' },
                { value: 1500, label: '1500m' },
                { value: 3000, label: '3000m' },
                { value: 5000, label: '5000m' },
                { value: 10000, label: '10000m' },
                { value: 'custom', label: 'その他' }
              ] : [
                { value: 5000, label: '5km', icon: '🏃‍♂️' },
                { value: 10000, label: '10km', icon: '🏃‍♀️' },
                { value: 21097, label: 'ハーフマラソン', icon: '🏃‍♂️' },
                { value: 42195, label: 'フルマラソン', icon: '🏃‍♀️' },
                { value: 'custom', label: 'その他', icon: '📏' }
              ]).map((distance) => (
                <button
                  key={distance.value}
                  type="button"
                  onClick={() => handleDistanceSelect(distance.value)}
                  className={`p-3 text-sm border rounded-lg transition-all ${
                    selectedDistance === distance.value.toString()
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {formData.raceType === 'track' ? (
                    distance.label
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-lg mb-1">{distance.icon}</span>
                      <span className="font-medium">{distance.label}</span>
                    </div>
                  )}
                </button>
                    ))}
                  </div>

            {/* 第2段階：トラック種目の種別選択 */}
            {formData.raceType === 'track' && selectedDistance && selectedDistance !== 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種別 *
                  </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'preliminary', label: '予選', icon: '🏃‍♂️' },
                    { value: 'final', label: '決勝', icon: '🏆' },
                    { value: 'time_trial', label: '記録会', icon: '⏱️' }
                  ].map((subType) => (
                    <button
                      key={subType.value}
                      type="button"
                      onClick={() => handleSubTypeSelect(subType.value)}
                      className={`p-3 text-sm border rounded-lg transition-all ${
                        selectedSubType === subType.value
                          ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg mb-1">{subType.icon}</span>
                        <span>{subType.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              )}

            {/* カスタム距離入力 */}
            {selectedDistance === 'custom' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  距離を入力 (m)
                </label>
                <input
                  type="number"
                  step="1"
                  value={customDistance}
                  onChange={handleCustomDistance}
                  placeholder="例: 800"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>
            )}

            {/* 選択確認表示 */}
            {selectedDistance && selectedDistance !== 'custom' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">選択中:</span> 
                  {formData.raceType === 'track' 
                    ? `${selectedDistance}m${selectedSubType ? ` (${selectedSubType === 'preliminary' ? '予選' : selectedSubType === 'final' ? '決勝' : '記録会'})` : ''}`
                    : `${selectedDistance === '5000' ? '5km' : selectedDistance === '10000' ? '10km' : selectedDistance === '21097' ? 'ハーフマラソン' : selectedDistance === '42195' ? 'フルマラソン' : selectedDistance + 'm'}`
                  }
                </p>
                {formData.raceType === 'track' && !selectedSubType && (
                  <p className="text-blue-600 text-xs mt-1">種別を選択してください</p>
                )}
              </div>
            )}
                  </div>
        )}

        {/* タイム入力セクション */}
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">タイム *</label>
                    <input
                      type="text"
            value={timeString}
            onChange={handleTimeChange}
            onKeyPress={handleTimeKeyPress}
            placeholder={formData.raceType === 'track' ? "MM:SS.XX または HH:MM:SS.XX" : "MM:SS または HH:MM:SS"}
            className={`w-full p-3 border rounded-md font-mono text-lg ${
              timeError 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
            required
          />
          
          {/* エラー表示 */}
          {timeError && (
            <p className="text-red-500 text-sm mt-1">{timeError}</p>
          )}
          
          {/* 入力ガイド */}
          <p className="text-gray-500 text-sm mt-1">
            {formData.raceType === 'track' 
              ? 'トラック種目は小数第二位まで入力可能（例: 12.50、2:15.34）'
              : 'ロード・駅伝は秒単位で入力（例: 25:30、1:25:30）'
            }
          </p>

          {/* 現実的なタイム表示 */}
          {formData.distance > 0 && getQuickTimesByDistance().length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">
                {formData.raceType === 'track' 
                  ? `${formData.distance}m 一般的なタイム:` 
                  : formData.raceType === 'road'
                  ? `${formData.distance === 5000 ? '5km' : 
                       formData.distance === 10000 ? '10km' :
                       formData.distance === 21097 ? 'ハーフマラソン' :
                       formData.distance === 42195 ? 'フルマラソン' : 
                       `${(formData.distance/1000).toFixed(1)}km`} 一般的なタイム:`
                  : '駅伝区間 一般的なタイム:'
                }
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {getQuickTimesByDistance().map((time, index) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleQuickTime(time)}
                    className={`p-2 text-xs border border-gray-300 rounded hover:bg-blue-50 font-mono transition-colors ${
                      index < 2 ? 'bg-green-50' : index < 4 ? 'bg-yellow-50' : 'bg-orange-50'
                    }`}
                    title={index < 2 ? '速い' : index < 4 ? '平均的' : 'ゆっくり'}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                左から：速い・平均的・ゆっくりなタイム
              </p>
                  </div>
          )}

          {/* 現在の入力確認 */}
          {timeString && !timeError && (
            <div className="bg-blue-50 p-3 rounded-md mt-3">
              <p className="text-blue-800 text-sm">
                <span className="font-semibold">入力されたタイム:</span> {timeString}
                <span className="text-blue-600 ml-2">
                  ({formData.timeSeconds.toFixed(2)}秒)
                </span>
              </p>
            </div>
          )}
                  </div>

        {/* ラップタイム登録 */}
        <div className="space-y-4">
          <h3 className="font-medium">ラップタイム（任意）</h3>
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
                placeholder={`例: ${getLapDistanceTemplate()}`}
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
          {lapTimes.length > 0 && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">登録済みラップ（{lapTimes.length}個）</h4>
                    <p className="text-xs text-gray-500">距離とタイムを個別に編集できます</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    合計距離: {lapTimes.reduce((sum, lap) => sum + lap.distance, 0)}m
                    {formData.distance > 0 && (
                      <span className={`ml-2 ${lapTimes.reduce((sum, lap) => sum + lap.distance, 0) > formData.distance ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                        ({lapTimes.reduce((sum, lap) => sum + lap.distance, 0) > formData.distance ? '超過' : '残り'}: {Math.abs(formData.distance - lapTimes.reduce((sum, lap) => sum + lap.distance, 0))}m)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  {lapTimes.map((lap, index) => (
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

            </div>
          )}
        </div>

        {/* その他フィールド */}
        <div className="grid grid-cols-2 gap-4">
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ペース</label>
                <input
                  type="text"
              value={formData.pace}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
              placeholder="例: 4:30/km"
              className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">順位</label>
                <input
                  type="text"
              value={formData.position}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="例: 5位"
              className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参加者数</label>
          <input
            type="text"
            value={formData.participants}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            placeholder="例: 500人"
            className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
          <textarea
            value={formData.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="レースの感想や気づいたことを..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
                  </div>

        {/* デバッグ情報 */}
        <div className="bg-gray-100 p-3 rounded text-sm">
          <strong>入力確認:</strong> 
          タイム: {formData.timeSeconds}秒 | 
          距離: {formData.distance}m | 
          種目: {formData.raceType}
          </div>

          <button
            type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
          >
          レース結果を保存
          </button>
      </form>
    </div>
  );
}
'use client'

import React, { useState, useEffect } from 'react'
import { useToastHelpers } from '@/components/UI/Toast'
import { formatDateToSlash, formatDateFromSlash, getCurrentDateSlash } from '@/utils/dateFormat'
import { DateInput } from '@/components/UI/DateInput'

const RaceForm = () => {
  const toast = useToastHelpers()
  const [formData, setFormData] = useState({
    raceName: '',
    date: getCurrentDateSlash(),
    raceType: 'track',
    distance: 0,
    timeSeconds: 0,
    pace: '',
    position: '',
    participants: '',
    notes: ''
  });

  const [timeString, setTimeString] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('');
  const [customDistance, setCustomDistance] = useState('');

  // 自動保存機能
  const AUTO_SAVE_KEY = 'race_form_draft'
  
  // 初期化時に保存されたデータを復元
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setFormData(parsedData.formData || formData)
        setTimeString(parsedData.timeString || '')
        setSelectedDistance(parsedData.selectedDistance || '')
        setCustomDistance(parsedData.customDistance || '')
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
          customDistance
        }
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData))
        console.log('💾 自動保存しました')
      } catch (error) {
        console.error('自動保存に失敗:', error)
      }
    }, 1000) // 1秒後に保存

    return () => clearTimeout(timeoutId)
  }, [formData, timeString, selectedDistance, customDistance])

  // 距離選択肢
  const distanceOptions = {
    track: [
      { value: 800, label: '800m' },
      { value: 1500, label: '1500m' },
      { value: 3000, label: '3000m' },
      { value: 5000, label: '5000m' },
      { value: 10000, label: '10000m' },
      { value: 'custom', label: 'その他（手入力）' }
    ],
    road: [
      { value: 5000, label: '5km' },
      { value: 10000, label: '10km' },
      { value: 21097, label: 'ハーフマラソン' },
      { value: 42195, label: 'フルマラソン' },
      { value: 'custom', label: 'その他（手入力）' }
    ],
    relay: [
      { value: 'custom', label: '区間距離を入力' }
    ]
  };

  // タイム文字列を秒数に変換
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr.trim()) return 0;
    
    const parts = timeStr.split(':');
    
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
  };

  // タイム入力処理
  const handleTimeChange = (e) => {
    const value = e.target.value;
    setTimeString(value);
    const seconds = parseTimeToSeconds(value);
    setFormData(prev => ({ ...prev, timeSeconds: seconds }));
  };

  // 距離選択処理
  const handleDistanceChange = (e) => {
    const value = e.target.value;
    setSelectedDistance(value);
    
    if (value !== 'custom') {
      setFormData(prev => ({ ...prev, distance: value }));
      setCustomDistance('');
    }
  };

  // カスタム距離入力処理
  const handleCustomDistanceChange = (e) => {
    const value = e.target.value;
    setCustomDistance(value);
    const numValue = parseFloat(value) || 0;
    
    // 駅伝の場合はkm→m変換
    const distance = formData.raceType === 'relay' ? numValue * 1000 : numValue;
    setFormData(prev => ({ ...prev, distance }));
  };

  // レース種目変更処理
  const handleRaceTypeChange = (e) => {
    setFormData(prev => ({ ...prev, raceType: e.target.value, distance: 0 }));
    setSelectedDistance('');
    setCustomDistance('');
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

    const submitData = {
      race_name: formData.raceName,
      race_date: formatDateFromSlash(formData.date),
      race_type: formData.raceType,
      distance: formData.distance,
      time_seconds: formData.timeSeconds,
      pace: formData.pace || null,
      position: formData.position || null,
      participants: formData.participants || null,
      notes: formData.notes || null
    };

    try {
      // apiClientを使用して認証ヘッダーを自動追加
      const { apiClient } = await import('@/lib/api')
      
      await apiClient.createRace(submitData)
      
      toast.success('保存完了', 'レース結果を保存しました！')
      
      // 自動保存データをクリア
      localStorage.removeItem(AUTO_SAVE_KEY)
      
      window.location.href = '/races'
    } catch (error) {
      console.error('レース保存エラー:', error)
      toast.error('保存失敗', `保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  };

  const isTrack = formData.raceType === 'track';
  const isCustomSelected = selectedDistance === 'custom';
  const distances = distanceOptions[formData.raceType] || [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新しいレース結果</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">日付 *</label>
          <DateInput
            value={formData.date}
            onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
            placeholder="2024/1/1"
          />
        </div>

        {/* 大会名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">大会名 *</label>
          <input
            type="text"
            value={formData.raceName}
            onChange={(e) => setFormData(prev => ({ ...prev, raceName: e.target.value }))}
            placeholder="例: 東京マラソン"
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* レース種目 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">レース種目 *</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="raceType"
                value="track"
                checked={formData.raceType === 'track'}
                onChange={handleRaceTypeChange}
                className="mr-2"
              />
              トラック
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="raceType"
                value="road"
                checked={formData.raceType === 'road'}
                onChange={handleRaceTypeChange}
                className="mr-2"
              />
              ロード
          </label>
            <label className="flex items-center">
                <input
                  type="radio"
                name="raceType"
                value="relay"
                checked={formData.raceType === 'relay'}
                onChange={handleRaceTypeChange}
                  className="mr-2"
                />
              駅伝
              </label>
          </div>
        </div>

        {/* 距離選択（プルダウン） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.raceType === 'relay' ? '区間距離 *' : '距離 *'}
          </label>
          
          <select
            value={selectedDistance}
            onChange={handleDistanceChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          >
            <option value="">選択してください</option>
            {distances.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* カスタム距離入力 */}
          {isCustomSelected && (
            <div className="mt-3">
            <input
                type="number"
                step={formData.raceType === 'relay' ? '0.1' : '1'}
                value={customDistance}
                onChange={handleCustomDistanceChange}
                placeholder={formData.raceType === 'relay' ? '例: 5.8' : '例: 800'}
                className="w-full p-3 border border-gray-300 rounded-md"
              required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.raceType === 'relay' 
                  ? 'km単位で入力してください'
                  : 'メートル単位で入力してください'
                }
              </p>
            </div>
          )}
        </div>

        {/* タイム入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">タイム *</label>
          <input
            type="text"
            value={timeString}
            onChange={handleTimeChange}
            placeholder={isTrack ? "MM:SS.XX または HH:MM:SS.XX" : "MM:SS または HH:MM:SS"}
            className="w-full p-3 border border-gray-300 rounded-md font-mono text-lg"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {isTrack 
              ? 'トラック種目は小数第二位まで入力可能（例: 12.50、2:15.34）'
              : '例: 25:30（25分30秒）、1:25:30（1時間25分30秒）'
            }
          </p>
          
          {/* クイックタイム */}
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">よく使われるタイム:</p>
            <div className="grid grid-cols-3 gap-2">
              {(isTrack 
                ? ['12.50', '25.00', '50.00', '2:00.00', '4:00.00', '15:00.00']
                : ['15:00', '20:00', '30:00', '1:30:00', '3:00:00', '4:00:00']
              ).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setTimeString(time);
                    setFormData(prev => ({ ...prev, timeSeconds: parseTimeToSeconds(time) }));
                  }}
                  className="p-2 text-sm border border-gray-300 rounded hover:bg-gray-50 font-mono"
                >
                  {time}
                </button>
              ))}
        </div>
        </div>
      </div>

        {/* その他フィールド */}
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ペース</label>
              <input
                type="text"
              value={formData.pace}
              onChange={(e) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
              placeholder="例: 4:30/km"
              className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">順位</label>
              <input
                type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            placeholder="例: 500人"
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

      <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
        <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="レースの感想や気づいたことを..."
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

        {/* デバッグ情報 */}
        <div className="bg-gray-100 p-3 rounded text-sm">
          タイム: {formData.timeSeconds}秒 | 距離: {formData.distance}m
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
};

export default RaceForm;
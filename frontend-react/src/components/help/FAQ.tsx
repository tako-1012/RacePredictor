'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/UI/Icons'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

interface FAQProps {
  items: FAQItem[]
  maxItems?: number
  showCategory?: boolean
  showTags?: boolean
  searchable?: boolean
}

export function FAQ({ 
  items, 
  maxItems = 5, 
  showCategory = true, 
  showTags = true,
  searchable = true 
}: FAQProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true
    
    return item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const displayedItems = maxItems ? filteredItems.slice(0, maxItems) : filteredItems

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      {searchable && (
        <div className="relative">
          <Icons.Search size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="FAQを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* FAQ一覧 */}
      {displayedItems.length > 0 ? (
        displayedItems.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleExpanded(item.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {item.question}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {showCategory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    )}
                    {showTags && (
                      <div className="flex space-x-1">
                        {item.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {expandedItems.has(item.id) ? (
                    <Icons.ChevronUp size="sm" className="text-gray-400" />
                  ) : (
                    <Icons.ChevronDown size="sm" className="text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {expandedItems.has(item.id) && (
              <div className="px-4 pb-3 border-t border-gray-200">
                <div className="pt-3">
                  <div className="prose prose-sm max-w-none">
                    {item.answer.split('\n').map((line, index) => (
                      <p key={index} className="text-gray-600 mb-2 text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Icons.Search size="xl" className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-sm">
            該当する質問が見つかりません
          </p>
        </div>
      )}

      {/* もっと見るボタン */}
      {maxItems && filteredItems.length > maxItems && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            もっと見る ({filteredItems.length - maxItems}件)
          </button>
        </div>
      )}
    </div>
  )
}

// よくある質問のデータ
export const commonFAQs: FAQItem[] = [
  {
    id: 'getting-started',
    question: 'RunMasterの使い方を教えてください',
    answer: 'RunMasterは以下の手順で使用できます：\n1. プロフィールで基本情報を設定\n2. 練習記録で日々の練習を記録\n3. レース結果でレース記録を管理\n4. ダッシュボードで統計を確認\n5. AI予測で目標タイムを設定',
    category: '基本操作',
    tags: ['使い方', '基本操作', '初心者']
  },
  {
    id: 'profile-setup',
    question: 'プロフィールの設定は必要ですか？',
    answer: 'プロフィールの設定は必須ではありませんが、AI予測の精度向上のために以下の情報を設定することをお勧めします：\n- 身長・体重・年齢\n- 自己ベスト記録\n- 目標設定',
    category: 'プロフィール',
    tags: ['プロフィール', '設定', 'AI予測']
  },
  {
    id: 'workout-record',
    question: '練習記録はどのように記録しますか？',
    answer: '練習記録は以下の方法で記録できます：\n1. 手動入力：練習の詳細を直接入力\n2. CSVインポート：Garmin Connectなどの既存データをインポート\n3. セッション分割：ウォームアップ・メイン・クールダウンに分けて記録',
    category: '練習記録',
    tags: ['練習記録', '入力', 'CSV']
  },
  {
    id: 'csv-import',
    question: 'CSVインポートはどのような形式に対応していますか？',
    answer: 'CSVインポートは以下の形式に対応しています：\n- Garmin Connectエクスポート形式\n- 一般的なCSV形式（日付、距離、時間、ペース）\n- UTF-8エンコーディング推奨',
    category: 'データ管理',
    tags: ['CSV', 'インポート', 'Garmin']
  },
  {
    id: 'ai-prediction',
    question: 'AI予測はどのように機能しますか？',
    answer: 'AI予測は以下のデータを基に目標タイムを予測します：\n- 過去の練習記録\n- レース結果\n- プロフィール情報\n- 練習の継続性\n予測精度はデータの量と質に依存します。',
    category: 'AI機能',
    tags: ['AI', '予測', '目標タイム']
  }
]

// カテゴリー別FAQ
export const categoryFAQs = {
  '基本操作': commonFAQs.filter(faq => faq.category === '基本操作'),
  'プロフィール': commonFAQs.filter(faq => faq.category === 'プロフィール'),
  '練習記録': commonFAQs.filter(faq => faq.category === '練習記録'),
  'データ管理': commonFAQs.filter(faq => faq.category === 'データ管理'),
  'AI機能': commonFAQs.filter(faq => faq.category === 'AI機能')
}

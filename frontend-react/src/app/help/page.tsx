'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/UI/Icons'
import { Breadcrumb } from '@/components/Layout/Breadcrumb'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

const faqData: FAQItem[] = [
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
  },
  {
    id: 'data-privacy',
    question: 'データのプライバシーは保護されていますか？',
    answer: 'はい、RunMasterは以下のプライバシー保護を実施しています：\n- 個人情報の暗号化\n- データの匿名化\n- 第三者とのデータ共有なし\n- ユーザーの同意に基づくデータ使用',
    category: 'プライバシー',
    tags: ['プライバシー', 'セキュリティ', 'データ保護']
  },
  {
    id: 'mobile-support',
    question: 'スマートフォンでも使用できますか？',
    answer: 'はい、RunMasterはレスポンシブデザインに対応しており、スマートフォン・タブレット・PCで使用できます。ブラウザベースのアプリケーションのため、アプリのインストールは不要です。',
    category: 'デバイス',
    tags: ['スマートフォン', 'モバイル', 'レスポンシブ']
  },
  {
    id: 'data-export',
    question: 'データをエクスポートできますか？',
    answer: 'はい、以下の方法でデータをエクスポートできます：\n- 練習記録のCSVエクスポート\n- レース結果のCSVエクスポート\n- 統計データの印刷\n- 個別データのコピー',
    category: 'データ管理',
    tags: ['エクスポート', 'CSV', 'データ']
  },
  {
    id: 'troubleshooting',
    question: 'エラーが発生した場合はどうすればよいですか？',
    answer: 'エラーが発生した場合は以下の手順を試してください：\n1. ページを再読み込み\n2. ブラウザのキャッシュをクリア\n3. 別のブラウザで試す\n4. 問題が解決しない場合はお問い合わせください',
    category: 'トラブルシューティング',
    tags: ['エラー', 'トラブル', '解決']
  },
  {
    id: 'future-features',
    question: '今後の機能予定はありますか？',
    answer: '今後の機能予定：\n- より高度なAI予測\n- ソーシャル機能\n- トレーニングプラン自動生成\n- ウェアラブルデバイス連携\n- より詳細な分析機能',
    category: '今後の予定',
    tags: ['今後の予定', '新機能', '開発']
  }
]

const categories = [
  '基本操作',
  'プロフィール',
  '練習記録',
  'データ管理',
  'AI機能',
  'プライバシー',
  'デバイス',
  'トラブルシューティング',
  '今後の予定'
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

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

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* パンくずナビゲーション */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ヘルプ・サポート</h1>
          <p className="text-gray-600">
            RunMasterの使い方やよくある質問をまとめました。お困りの際はこちらをご確認ください。
          </p>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索 */}
            <div className="flex-1">
              <div className="relative">
                <Icons.Search size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="質問を検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* カテゴリーフィルター */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべてのカテゴリー</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* クリアボタン */}
            {(searchTerm || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* 検索結果 */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              「{searchTerm}」の検索結果: {filteredFAQs.length}件
            </p>
          </div>
        )}

        {/* FAQ一覧 */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(faq => (
              <div
                key={faq.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {faq.question}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {faq.category}
                        </span>
                        <div className="flex space-x-1">
                          {faq.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedItems.has(faq.id) ? (
                        <Icons.ChevronUp size="sm" className="text-gray-400" />
                      ) : (
                        <Icons.ChevronDown size="sm" className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedItems.has(faq.id) && (
                  <div className="px-6 pb-4 border-t border-gray-200">
                    <div className="pt-4">
                      <div className="prose prose-sm max-w-none">
                        {faq.answer.split('\n').map((line, index) => (
                          <p key={index} className="text-gray-600 mb-2">
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
            <div className="text-center py-12">
              <Icons.Search size="2xl" className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                該当する質問が見つかりません
              </h3>
              <p className="text-gray-600 mb-4">
                検索条件を変更するか、お問い合わせフォームからご質問ください。
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>

        {/* お問い合わせ */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Icons.MessageCircle size="md" className="text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">
              まだ解決しませんか？
            </h3>
          </div>
          <p className="text-blue-800 mb-4">
            上記のFAQで解決しない場合は、お気軽にお問い合わせください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              お問い合わせフォーム
            </button>
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
              バグレポート
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

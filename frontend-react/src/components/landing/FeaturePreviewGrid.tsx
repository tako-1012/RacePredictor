'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  PlayIcon,
  CalendarIcon,
  HeartIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const features = [
      {
        id: 'dashboard',
        name: 'ダッシュボード',
        icon: ChartBarIcon,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        description: '練習データの可視化と分析'
      },
      {
        id: 'workout',
        name: 'セッション分割記録',
        icon: PlayIcon,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        description: '朝練・午後練も記録できます'
      },
      {
        id: 'race',
        name: 'レース管理',
        icon: CalendarIcon,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        description: '大会記録と目標管理'
      },
      {
        id: 'health',
        name: '体調管理',
        icon: HeartIcon,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-50',
        description: '睡眠・疲労・心拍管理'
      },
      {
        id: 'ai',
        name: 'AI予測・コーチング',
        icon: CpuChipIcon,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-50',
        description: '競技者には競技戦略を、初心者にはAIコーチングを提供'
      }
    ]

const featureData = {
  dashboard: {
    title: 'ダッシュボード統計',
    stats: [
      { label: '総練習回数', value: '3回', icon: 'chart' },
      { label: '総走行距離', value: '14.5km', icon: 'target' },
      { label: '総練習時間', value: '1時間', icon: 'clock' },
      { label: '今週の走行距離', value: '9.7km', icon: 'running' }
    ],
    weekly: {
      total: '9.7km',
      count: '2回',
      time: '55分',
      pace: '5:41/km'
    },
    goals: {
      distance: { current: '9.7', target: '50', unit: 'km', percentage: 19 },
      count: { current: '2', target: '4', unit: '回', percentage: 50 },
      time: { current: '55', target: '300', unit: '分', percentage: 18 },
      overall: 29
    }
  },
  workout: {
    title: 'セッション分割記録',
    description: 'ウォームアップ・メイン・クールダウンを詳細記録',
        sessions: [
          {
            name: '朝練',
            warmup: 'ジョギング 2km (5:00/km)',
            main: 'ジョギング 5km (4:30/km)',
            cooldown: 'ストレッチ 10分',
            total: '7km / 35分'
          },
          {
            name: '午後練',
            warmup: '動き作り 20分',
            main: 'テンポ走 8km (3:40/km) + 1000m×3本 (3:00/km)',
            rest: 'レスト 200m(1:00)',
            cooldown: 'ストレッチ 15分',
            total: '11km / 55分'
          }
        ],
    features: [
      'ウォームアップ・メイン・クールダウンを分離記録',
      'インターバル走の詳細設定（セット×ラップ）',
      '心拍ゾーン・RPE記録',
      'カスタムワークアウトテンプレート'
    ]
  },
  race: {
    title: 'レース管理',
    description: '大会記録と目標管理',
        upcoming: [
          { name: '5000m記録会', date: '2024/10/15', distance: '5000m', target: '16:30' },
          { name: '10000m記録会', date: '2024/05/20', distance: '10000m', target: '34:00' }
        ],
        personalBests: [
          { distance: '5000m', time: '16:45', date: '2024/03/15' },
          { distance: '10000m', time: '34:20', date: '2024/02/10' },
          { distance: 'ハーフ', time: '1:18:30', date: '2024/01/20' }
        ],
    features: [
      'トラック・ロード・駅伝全種目対応',
      '自己ベスト更新履歴',
      '大会目標設定と進捗管理',
      'レース結果の詳細記録'
    ]
  },
  health: {
    title: '体調管理',
    description: '睡眠・疲労・心拍管理',
    metrics: [
      { name: '睡眠時間', value: '7.5時間', trend: 'up', quality: '良好' },
      { name: '疲労度', value: '3/10', trend: 'down', quality: '良好' },
      { name: 'ストレス', value: '2/10', trend: 'down', quality: '良好' },
      { name: '体重', value: '65.2kg', trend: 'stable', quality: '良好' }
    ],
    heartRateZones: [
      { zone: 'Zone 1', range: '120-140bpm', percentage: '65%', description: '有酸素ベース' },
      { zone: 'Zone 2', range: '140-160bpm', percentage: '20%', description: '有酸素パワー' },
      { zone: 'Zone 3', range: '160-180bpm', percentage: '15%', description: '無酸素閾値' }
    ],
    features: [
      '睡眠・疲労・ストレス記録',
      '心拍ゾーン管理',
      '体重・BMI追跡',
      '体調と練習の相関分析'
    ]
  },
  ai: {
    title: 'AI予測・コーチング',
    status: 'ベータ版で一部機能提供中',
    description: '競技者には競技戦略を、初心者にはAIコーチングを提供',
    features: [
      '800m〜フルマラソン目標タイム予測（競技者向け）',
      '種目別競技戦略・駅伝区間戦略の個別提案',
      'AIコーチによる適切な練習指導（初心者向け）',
      '怪我リスク予測と予防アドバイス'
    ]
  }
}

export default function FeaturePreviewGrid() {
      const [activeFeature, setActiveFeature] = useState('dashboard')

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            RunMasterの機能
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            競技者から初心者まで、すべてのランナーに。
            <br />
            あなたのレベルに合わせた機能を提供します。
          </p>
        </motion.div>

        {/* 機能タブ */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeFeature === feature.id
                  ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <feature.icon className="w-5 h-5 inline mr-2" />
              {feature.name}
            </button>
          ))}
        </div>

        {/* 機能プレビュー */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            {activeFeature === 'dashboard' && <DashboardPreview data={featureData.dashboard} />}
            {activeFeature === 'workout' && <WorkoutPreview data={featureData.workout} />}
            {activeFeature === 'race' && <RacePreview data={featureData.race} />}
            {activeFeature === 'health' && <HealthPreview data={featureData.health} />}
            {activeFeature === 'ai' && <AIPreview data={featureData.ai} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function WorkoutPreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h3>
      <p className="text-gray-600 mb-6">{data.description}</p>
      
      {/* セッション例 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {data.sessions.map((session: any, index: number) => (
          <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">{session.name}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ウォームアップ:</span>
                <span className="text-gray-900">{session.warmup}</span>
              </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">メイン:</span>
                    <span className="text-gray-900">{session.main}</span>
                  </div>
                  {session.rest && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">レスト:</span>
                      <span className="text-gray-900">{session.rest}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">クールダウン:</span>
                    <span className="text-gray-900">{session.cooldown}</span>
                  </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-green-200">
                <span className="text-gray-600">合計:</span>
                <span className="text-green-700">{session.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 機能一覧 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">主な機能</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function RacePreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h3>
      <p className="text-gray-600 mb-6">{data.description}</p>
      
      {/* 予定レース */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">予定レース</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.upcoming.map((race: any, index: number) => (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
              <div className="font-semibold text-gray-900">{race.name}</div>
              <div className="text-sm text-gray-600">{race.date} - {race.distance}</div>
              <div className="text-sm text-purple-600 font-medium">目標: {race.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 自己ベスト */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">自己ベスト</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.personalBests.map((pb: any, index: number) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
              <div className="font-semibold text-gray-900">{pb.distance}</div>
              <div className="text-lg font-bold text-blue-600">{pb.time}</div>
              <div className="text-sm text-gray-600">{pb.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 機能一覧 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">主な機能</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-purple-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function HealthPreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h3>
      <p className="text-gray-600 mb-6">{data.description}</p>
      
      {/* 体調指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.metrics.map((metric: any, index: number) => (
          <div key={index} className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">{metric.name}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600">{metric.quality}</div>
          </div>
        ))}
      </div>

      {/* 心拍ゾーン */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">心拍ゾーン分布</h4>
        <div className="space-y-3">
          {data.heartRateZones.map((zone: any, index: number) => (
            <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">{zone.zone}</span>
                <span className="text-sm text-gray-600">{zone.range}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{zone.description}</span>
                <span className="font-semibold text-red-600">{zone.percentage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 機能一覧 */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">主な機能</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-red-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DashboardPreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h3>
      
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.stats.map((stat: any, index: number) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            {stat.target && (
              <div className="text-sm text-gray-600">
                目標: {stat.target} {stat.achieved ? '✅' : '❌'}
              </div>
            )}
            {stat.improvement && (
              <div className="text-sm text-green-600">{stat.improvement}</div>
            )}
          </div>
        ))}
      </div>

      {/* 週間活動 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">週間活動</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">週間合計:</span>
              <span className="font-semibold">{data.weekly.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">練習回数:</span>
              <span className="font-semibold">{data.weekly.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">練習時間:</span>
              <span className="font-semibold">{data.weekly.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均ペース:</span>
              <span className="font-semibold">{data.weekly.pace}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">週間目標</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>距離</span>
                <span>{data.goals.distance.current} / {data.goals.distance.target} {data.goals.distance.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.goals.distance.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>練習回数</span>
                <span>{data.goals.count.current} / {data.goals.count.target} {data.goals.count.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${data.goals.count.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>練習時間</span>
                <span>{data.goals.time.current} / {data.goals.time.target} {data.goals.time.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.goals.time.percentage}%` }}></div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="text-center">
                <span className="text-sm text-gray-600">週間目標達成率</span>
                <div className="text-2xl font-bold text-green-600">{data.goals.overall}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AIPreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h3>
      
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CpuChipIcon className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">{data.status}</h4>
          <p className="text-gray-600">競技者には競技戦略を、初心者にはAIコーチングを提供</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 競技者向け機能 */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">競</span>
            競技者向けAI機能
          </h5>
          <ul className="space-y-3">
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">800m〜フルマラソン目標タイム予測</span>
            </li>
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">種目別競技戦略の最適化</span>
            </li>
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">駅伝区間戦略の個別提案</span>
            </li>
          </ul>
        </div>

        {/* 初心者向け機能 */}
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h5 className="font-semibold text-purple-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">初</span>
            初心者向けAI機能
          </h5>
          <ul className="space-y-3">
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-purple-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">個人の体力に合わせた練習計画</span>
            </li>
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-purple-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">正しいフォームの指導</span>
            </li>
            <li className="flex items-start">
              <ArrowRightIcon className="w-4 h-4 text-purple-600 mr-2 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">怪我予防のアドバイス</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center">
        <div className="text-lg font-semibold mb-2">あなたのレベルに最適化されたAIサポート</div>
        <div className="text-sm opacity-90">競技者も初心者も、それぞれの目標達成をサポートします</div>
      </div>
    </div>
  )
}
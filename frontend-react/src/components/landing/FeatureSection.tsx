'use client'

import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CogIcon,
  DocumentTextIcon,
  TrendingUpIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: DocumentTextIcon,
    title: 'セッション分割型記録',
    description: 'インターバル走やペース走など、練習内容ごとに細かく記録・分析',
    details: [
      'インターバル走の詳細記録',
      'ペース・心拍数の分秒単位管理',
      'セクション別の分析データ',
      'カスタムワークアウト対応'
    ],
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    value: 'プロレベルの練習管理'
  },
  {
    icon: ChartBarIcon,
    title: 'ダッシュボード',
    description: '練習データを分かりやすく可視化して、成長を実感',
    details: [
      '練習完了率の推移',
      '走行距離の成長',
      '練習種別のバランス',
      '目標達成の進捗'
    ],
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    value: 'あなたの成長を分かりやすく表示'
  },
  {
    icon: CogIcon,
    title: 'カスタムワークアウト',
    description: '練習メニューをテンプレート化して、効率的なトレーニング計画を実現',
    details: [
      '練習メニューの保存・共有',
      '段階的な練習計画',
      '目標設定と進捗管理',
      'コミュニティテンプレート'
    ],
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    value: '競技に向けた計画的なトレーニング'
  }
]

export default function FeatureSection() {
  return (
    <section id="features" className="py-20 bg-white">
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
            RunMasterの解決策
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            データドリブンなアプローチで、あなたのランニングを次のレベルへ
          </p>
        </motion.div>

        {/* 機能紹介 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className={`${feature.bgColor} rounded-2xl p-8 h-full transform group-hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-3 mb-6">
                  <div className="text-sm font-semibold text-gray-800">
                    💡 {feature.value}
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start">
                      <ArrowRightIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Before/After 比較 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Before vs After
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-red-50 rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-red-800 mb-6 flex items-center">
                <span className="text-2xl mr-3">❌</span>
                従来の方法
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">手動で記録、入力ミスが多い</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">データが散在、分析が困難</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">成長実感が得られない</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">練習計画が立てにくい</span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="bg-green-50 rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-green-800 mb-6 flex items-center">
                <span className="text-2xl mr-3">✅</span>
                RunMaster
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">自動記録、高精度なデータ</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">統合された分析ダッシュボード</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">AI予測で成長を可視化</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">データに基づく最適な練習計画</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

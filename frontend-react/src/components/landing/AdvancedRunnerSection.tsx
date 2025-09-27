'use client'

import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  ClockIcon, 
  LightBulbIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function AdvancedRunnerSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            <ArrowTrendingUpIcon className="w-4 h-4 mr-2" />
            競技者向け
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            競技レベルを目指す<span className="text-blue-600">ランナー</span>向け
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            トラック・ロード・駅伝すべての競技種目に対応。
            <br />
            シンプルで分かりやすいダッシュボードとAI予測で、競技力を向上させます。
          </p>
        </motion.div>

        {/* 3つの核心機能 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* シンプルなダッシュボード */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-4">
               分かりやすいダッシュボード
             </h3>
             <p className="text-gray-600 mb-6">
               練習データを分かりやすく可視化。複雑な分析ではなく、誰でも理解できる形で成長を実感できます。
             </p>
             <ul className="space-y-3">
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">練習完了率の推移</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">走行距離の成長</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">練習種別のバランス</span>
               </li>
             </ul>
          </motion.div>

          {/* AIタイム予測 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-4">
               競技レベルのAI予測
             </h3>
             <p className="text-gray-600 mb-6">
               800m〜フルマラソンまで、すべての競技種目の目標タイム達成確率を予測。
               種目別の競技戦略まで含めた最適な練習計画をAIが提案します。
             </p>
             <ul className="space-y-3">
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">800m〜フルマラソン目標タイム予測</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">種目別競技戦略の最適化</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">駅伝区間戦略の個別提案</span>
               </li>
             </ul>
          </motion.div>

          {/* コミュニティ知見 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-4">
               競技者コミュニティ
             </h3>
             <p className="text-gray-600 mb-6">
               トラック・ロード・駅伝すべての競技種目で同じ目標を持つランナーの練習法を発見。
               種目別の競技出場者の知見で、競技力を向上させます。
             </p>
             <ul className="space-y-3">
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">種目別競技出場者の練習メニュー</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">駅伝区間別調整方法の共有</span>
               </li>
               <li className="flex items-start">
                 <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                 <span className="text-gray-700">最新の競技トレーニング手法の提案</span>
               </li>
             </ul>
          </motion.div>
        </div>

        {/* 期待される効果 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center mb-8">
            <LightBulbIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">期待される効果</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  競技者
                </div>
                <div>
                  <div className="font-semibold text-gray-900">競技出場者</div>
                  <div className="text-sm text-gray-600">5000m 15:25.30</div>
                </div>
              </div>
              <p className="text-gray-700">
                分かりやすいダッシュボードによる練習管理。練習データから競技力向上のポイントを発見。
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  競技者
                </div>
                <div>
                  <div className="font-semibold text-gray-900">競技入賞者</div>
                  <div className="text-sm text-gray-600">10000m 31:15.80</div>
                </div>
              </div>
              <p className="text-gray-700">
                競技者コミュニティとの情報共有による新しい練習方法の習得。同じ目標を持つ仲間との交流による競技力向上。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

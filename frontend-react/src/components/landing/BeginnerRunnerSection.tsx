'use client'

import { motion } from 'framer-motion'
import { 
  AcademicCapIcon, 
  HeartIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function BeginnerRunnerSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4">
            <SparklesIcon className="w-4 h-4 mr-2" />
            初心者向け
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ランニングを始めたい<span className="text-purple-600">初心者</span>向け
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AIコーチがあなたのペースに合わせて適切な練習を指導。
            <br />
            正しいフォームと練習方法を身につけて、安全に上達しましょう。
          </p>
        </motion.div>

        {/* 3つの核心機能 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* AIコーチ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <AcademicCapIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              AIコーチ指導
            </h3>
            <p className="text-gray-600 mb-6">
              あなたの体力レベルに合わせて、最適な練習メニューを自動生成。
              無理のないペースで確実に上達できます。
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">個人の体力に合わせた練習計画</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">段階的な距離・時間の増加</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">モチベーション維持のサポート</span>
              </li>
            </ul>
          </motion.div>

          {/* 適切な練習指導 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              適切な練習指導
            </h3>
            <p className="text-gray-600 mb-6">
              怪我を防ぎ、効率的に上達するための正しい練習方法を指導。
              フォーム改善からペース管理まで、基礎をしっかり身につけます。
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">正しいランニングフォームの指導</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">適切なペース設定と管理</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">ウォームアップ・クールダウンの重要性</span>
              </li>
            </ul>
          </motion.div>

          {/* 安全な上達 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              安全な上達
            </h3>
            <p className="text-gray-600 mb-6">
              体調管理と怪我予防を重視した練習計画。
              無理をせず、長期的に楽しめるランニングライフをサポートします。
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">体調に応じた練習調整</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">怪我リスクの早期発見</span>
              </li>
              <li className="flex items-start">
                <ArrowRightIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">休息と回復の重要性指導</span>
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
            <SparklesIcon className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">期待される効果</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  初心者
                </div>
                <div>
                  <div className="font-semibold text-gray-900">ランニング初心者</div>
                  <div className="text-sm text-gray-600">3ヶ月で5km完走</div>
                </div>
              </div>
              <p className="text-gray-700">
                AIコーチによる適切な指導での継続。個人の体力レベルに合わせた練習計画による安全な上達。
              </p>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  初心者
                </div>
                <div>
                  <div className="font-semibold text-gray-900">ランニング初心者</div>
                  <div className="text-sm text-gray-600">6ヶ月で10km完走</div>
                </div>
              </div>
              <p className="text-gray-700">
                正しいフォームと練習方法の習得による怪我リスクの軽減。目標達成への安全なアプローチ。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

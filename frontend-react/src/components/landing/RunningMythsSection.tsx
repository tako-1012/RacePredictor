'use client'

import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function RunningMythsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションタイトル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ランニング改善の<span className="text-red-600">3つの間違い</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            科学的データが証明する、ランニングの真実
          </p>
        </motion.div>

        {/* 3つの間違い */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* 間違い1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">間違い1</h3>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                ❌ とにかくたくさん走る
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ 質の高い練習を適切な量で
              </p>
            </div>
          </motion.div>

          {/* 間違い2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">間違い2</h3>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                ❌ ジョグを速く走る
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ ジョグは回復とベース作りが目的
              </p>
            </div>
          </motion.div>

          {/* 間違い3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">間違い3</h3>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">
                ❌ 毎日同じペースで走る
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ 目的に応じた強度管理が重要
              </p>
            </div>
          </motion.div>
        </div>

        {/* データが証明した事実 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-lg mb-16"
        >
          <div className="flex items-center mb-8">
            <ChartBarIcon className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">データが証明した事実</h3>
          </div>
          
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">練習量の80%</h4>
                <div className="text-3xl font-bold text-blue-600 mb-2">ジョグ</div>
                <p className="text-blue-800">プロランナーの練習構成</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">練習量の20%</h4>
                <div className="text-3xl font-bold text-green-600 mb-2">高強度</div>
                <p className="text-green-800">インターバル・ペース走</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">週3-4日</h4>
                <div className="text-3xl font-bold text-purple-600 mb-2">休息日</div>
                <p className="text-purple-800">回復と超回復の時間</p>
              </div>
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <p className="text-xl font-semibold text-gray-900">
                → バランスの取れた練習が最強
              </p>
              <p className="text-gray-600 mt-2">
                （量より質、強度管理が成長の鍵）
              </p>
            </div>
          </div>
        </motion.div>

        {/* なぜほとんどの人が伸び悩むのか */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center mb-8">
            <LightBulbIcon className="w-8 h-8 text-orange-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">なぜほとんどの人が伸び悩むのか</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">中途半端な強度</h4>
              <p className="text-gray-600 text-sm">有酸素能力向上には負荷不足、回復には負荷過多</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">毎日同じペース</h4>
              <p className="text-gray-600 text-sm">目的のない練習で効果が薄い</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😰</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">回復不足</h4>
              <p className="text-gray-600 text-sm">超回復が起きず成長が鈍化</p>
            </div>
          </div>
          
          {/* 解決策への橋渡し */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h4 className="text-xl font-semibold mb-2">だからRunMasterが必要なんです</h4>
              <p className="text-blue-100">
                科学的なデータ分析で、あなたの練習を最適化します
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

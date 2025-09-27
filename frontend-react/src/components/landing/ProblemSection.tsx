'use client'

import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function ProblemSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
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
            こんな悩み<span className="text-red-600">ありませんか？</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            多くのランナーが抱える共通の悩みと、その根本的な原因
          </p>
        </motion.div>

        {/* 3つの悩み */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* 悩み1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ClockIcon className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">悩み1</h3>
            </div>
            <div className="bg-red-50 rounded-lg p-6">
              <p className="text-red-800 font-medium text-lg">
                記録が面倒で続かない
              </p>
              <p className="text-red-700 text-sm mt-2">
                毎回同じことを入力するのが面倒で、結局記録をやめてしまう
              </p>
            </div>
          </motion.div>

          {/* 悩み2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ChartBarIcon className="w-8 h-8 text-orange-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">悩み2</h3>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <p className="text-orange-800 font-medium text-lg">
                モチベーションが続かない
              </p>
              <p className="text-orange-700 text-sm mt-2">
                一人で練習していても目標が見えず、やる気が続かない
              </p>
            </div>
          </motion.div>

          {/* 悩み3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">悩み3</h3>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <p className="text-yellow-800 font-medium text-lg">
                練習方法がわからない
              </p>
              <p className="text-yellow-700 text-sm mt-2">
                何をどう練習すればいいかわからず、効率的なトレーニングができない
              </p>
            </div>
          </motion.div>
        </div>

        {/* RunMasterの解決策 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center mb-8">
            <LightBulbIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">RunMasterの3つの解決策</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">簡単記録</h4>
              <p className="text-gray-600 text-sm">テンプレートで3秒で記録完了</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">科学的分析</h4>
              <p className="text-gray-600 text-sm">データから改善点を自動発見</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">明確な改善</h4>
              <p className="text-gray-600 text-sm">具体的なアドバイスで確実に向上</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
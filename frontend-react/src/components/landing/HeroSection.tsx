'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  PlayIcon, 
  ChartBarIcon, 
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左側: テキストコンテンツ */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                ベータ版リリース
              </span>
            </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
    >
      競技者から初心者まで
      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
        すべてのランナーへ
      </span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-xl text-gray-600 mb-8 max-w-2xl"
    >
      競技レベルを目指すランナーには高度なデータ分析を、
      <br />
      ランニングを始めたい方にはAIコーチによる適切な指導を提供。
      <br />
      あなたのレベルに合わせたサポートをします。
    </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                無料でベータテスト参加
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button
                onClick={() => setIsVideoPlaying(true)}
                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <PlayIcon className="mr-2 w-5 h-5" />
                デモを見る
              </button>
            </motion.div>

            {/* 統計情報 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 grid grid-cols-3 gap-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">ベータテスター</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10,000+</div>
                <div className="text-sm text-gray-600">練習ログを分析</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">満足度</div>
                <div className="text-xs text-gray-500 mt-1">※ベータテスターアンケート結果</div>
              </div>
            </motion.div>
          </motion.div>

          {/* 右側: ビジュアルコンテンツ */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* メインビジュアル */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">セッション分割記録</h3>
                  <PlayIcon className="w-5 h-5" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>ウォームアップ</span>
                    <span className="font-bold">3km (4:30/km)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>メイン</span>
                    <span className="font-bold">400m×12本 (1:10/400m) レスト200m(1:00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>クールダウン</span>
                    <span className="font-bold">2km (5:00/km)</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-white/20">
                    <span>合計</span>
                    <span className="font-bold">7.8km / 38分</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-sm opacity-90">AI予測: 5000m 14:45</div>
                </div>
              </div>
            </div>

            {/* フローティング要素 - 複数の機能カード */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="text-xs text-gray-600 mb-1">インターバル</div>
              <PlayIcon className="w-8 h-8 text-green-600" />
            </motion.div>

            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="text-xs text-gray-600 mb-1">テンポ走</div>
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </motion.div>

            <motion.div
              animate={{ y: [-5, 15, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 -right-8 bg-white rounded-xl shadow-lg p-3"
            >
              <div className="text-xs text-gray-600 mb-1">ジョグ</div>
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* デモ動画モーダル */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">RunMaster デモ</h3>
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">デモ動画は準備中です</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

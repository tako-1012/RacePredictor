'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowRightIcon, 
  CheckCircleIcon,
  GiftIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const finalBenefits = [
  '全機能無料利用',
  'AI機能の優先体験',
  '開発チームとの直接交流',
  '本格リリース後の特別待遇'
]

export default function CTAFooter() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* メインメッセージ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              今すぐ始めませんか？
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              ベータテスターとして参加し、ランニングアプリの未来を一緒に創りましょう。
              <br />
              あなたのデータが、より良いランニング体験の実現に貢献します。
            </p>
          </motion.div>

          {/* 特典の再確認 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold mb-6">ベータテスター特典</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {finalBenefits.map((benefit, index) => (
                <div key={benefit} className="flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 限定感の演出 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-lg font-semibold shadow-lg mb-4">
              <ClockIcon className="w-5 h-5 mr-2" />
              限定500名まで
            </div>
            <p className="text-gray-300">
              現在 <span className="font-bold text-blue-400">347名</span> が参加中
            </p>
          </motion.div>

          {/* メインCTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center px-12 py-6 border border-transparent text-2xl font-bold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            >
              <GiftIcon className="w-8 h-8 mr-3" />
              無料でベータテスト参加
              <ArrowRightIcon className="ml-3 w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <p className="text-gray-400 text-sm">
              参加は完全無料 • いつでも退会可能 • 個人情報は厳重に保護
            </p>
          </motion.div>

          {/* 信頼性の訴求 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-16 pt-8 border-t border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-2">100%</div>
                <div className="text-gray-300">データ暗号化</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400 mb-2">GDPR</div>
                <div className="text-gray-300">準拠</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-gray-300">サポート</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { 
  GiftIcon, 
  StarIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const benefits = [
  {
    icon: GiftIcon,
    title: '全機能無料利用',
    description: 'ベータ期間中はすべての機能を無料でお使いいただけます',
    color: 'text-green-600'
  },
  {
    icon: StarIcon,
    title: '将来のAI機能を最初に体験',
    description: '最新のAI機能を他のユーザーより先に体験できます',
    color: 'text-purple-600'
  },
  {
    icon: UserGroupIcon,
    title: '開発チームとの直接フィードバック',
    description: '開発チームと直接やり取りし、アプリの改善に参加できます',
    color: 'text-blue-600'
  },
  {
    icon: ChartBarIcon,
    title: '本格リリース後の特別待遇',
    description: '正式リリース後も継続的な特典とサポートを受けられます',
    color: 'text-indigo-600'
  }
]

const contributions = [
  'より精度の高いAI機能開発に貢献',
  'ランナーコミュニティ全体の価値向上に寄与',
  'あなた自身の走りの改善にも直結',
  'データサイエンスの最先端技術に触れる機会'
]

export default function BetaTesterSection() {
  return (
    <section id="beta" className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* メインメッセージ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            一緒にランニングアプリの未来を創りませんか？
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            あなたの詳細な練習記録が、より良いランニング体験の実現に貢献します。
            <br />
            ベータテスターとして参加し、アプリの進化を一緒に体験しましょう。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左側: 貢献内容 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              あなたのデータが実現すること
            </h3>
            
            <div className="space-y-6">
              {contributions.map((contribution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">{contribution}</span>
                </motion.div>
              ))}
            </div>

            {/* 信頼性・安心感 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-12 p-6 bg-white rounded-xl shadow-lg"
            >
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900">データプライバシー保護</h4>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• エンドツーエンド暗号化</li>
                <li>• GDPR準拠のデータ管理</li>
                <li>• 個人情報の匿名化処理</li>
                <li>• データ削除権の保証</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* 右側: ベータテスター特典 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              ベータテスター特典
            </h3>
            
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-start">
                  <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-8"
            >
              <a
                href="/register"
                className="group inline-flex items-center justify-center w-full px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                今すぐベータテスターに参加
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                参加は完全無料 • いつでも退会可能
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* 限定感の演出 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-lg font-semibold shadow-lg">
            <ClockIcon className="w-5 h-5 mr-2" />
            限定500名まで
          </div>
          <p className="text-gray-600 mt-4">
            現在 <span className="font-bold text-blue-600">347名</span> が参加中
          </p>
        </motion.div>
      </div>
    </section>
  )
}

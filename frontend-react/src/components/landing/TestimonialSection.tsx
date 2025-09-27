'use client'

import { motion } from 'framer-motion'
import { StarIcon, UserIcon } from '@heroicons/react/24/solid'

const testimonials = [
  {
    name: 'T.K.',
    role: '30代・市民ランナー',
    avatar: '👨‍💼',
    rating: 5,
    content: '詳細な記録がとても簡単になりました。セッション分割で、ウォームアップからクールダウンまで正確に記録できるのが気に入っています。自分の成長が数字で見えるようになり、モチベーションが上がりました。',
    highlight: '記録の詳細さが成長実感につながる'
  },
  {
    name: 'S.M.',
    role: '20代・マラソン初心者',
    avatar: '👩‍🏃‍♀️',
    rating: 5,
    content: '練習記録が簡単で継続しやすいです。自分の成長が数字で見えるようになり、モチベーションが上がりました。ベータ版なので、開発チームと直接やり取りできるのも嬉しいです。',
    highlight: '練習記録が簡単で継続しやすい'
  },
  {
    name: 'Y.T.',
    role: '40代・ランニングコーチ',
    avatar: '👨‍🏫',
    rating: 5,
    content: '選手の練習管理に活用しています。データ分析機能で、効果的な練習メニューを組みやすくなりました。フィードバックが実際に機能改善につながるのを見るのが楽しいです。',
    highlight: 'データ分析機能で効果的な指導'
  }
]

export default function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20 bg-white">
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
            利用者の声
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            実際にRunMasterを使用しているランナーからの声をお聞きください
          </p>
        </motion.div>

        {/* テストモニアルカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
            >
              {/* 評価 */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>

              {/* アバターと名前 */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>

              {/* ハイライト */}
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                {testimonial.highlight}
              </div>

              {/* コメント */}
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.content}"
              </p>
            </motion.div>
          ))}
        </div>

        {/* 統計情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
            <div className="text-gray-600">満足度</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
            <div className="text-gray-600">ベータテスター</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1,500+</div>
            <div className="text-gray-600">記録された練習</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">-</div>
            <div className="text-gray-600">データ収集中</div>
          </div>
        </motion.div>

        {/* ベータテスター体験談 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            ベータテスターの特別な体験
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🚀</div>
              <h4 className="font-semibold text-gray-900 mb-2">開発途中のアプリを試せる特別感</h4>
              <p className="text-sm text-gray-600">最新機能を他のユーザーより先に体験できます</p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">💬</div>
              <h4 className="font-semibold text-gray-900 mb-2">フィードバックが機能改善につながる</h4>
              <p className="text-sm text-gray-600">あなたの声が実際にアプリの改善に反映されます</p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🤝</div>
              <h4 className="font-semibold text-gray-900 mb-2">コミュニティの一員として参加</h4>
              <p className="text-sm text-gray-600">一緒にアプリを育てる仲間として活動できます</p>
            </div>
          </div>
        </motion.div>

        {/* コミュニティ感の醸成 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              一緒にアプリを育てる仲間募集中
            </h3>
            <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
              まだ発展途上のアプリですが、一緒に最高のランニングアプリを創りませんか？
              <br />
              あなたのデータ提供で、ランニング界全体に貢献できます。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">あなたの声が</div>
                <div className="font-semibold text-gray-900">次の機能になるかも</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">データ提供で</div>
                <div className="font-semibold text-gray-900">ランニング界全体に貢献</div>
              </div>
            </div>
            
            <a
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ベータテスターとして参加する
            </a>
            
            <p className="text-sm text-gray-500 mt-4">
              参加は完全無料 • いつでも退会可能 • 個人情報は厳重に保護
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

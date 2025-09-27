'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
}

function CountUp({ end, duration = 2, suffix = '', prefix = '' }: CountUpProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration])

  return (
    <span>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

interface AnimatedStatCardProps {
  value: number
  label: string
  suffix?: string
  prefix?: string
  delay?: number
  color?: string
}

function AnimatedStatCard({ 
  value, 
  label, 
  suffix = '', 
  prefix = '', 
  delay = 0,
  color = 'text-blue-600'
}: AnimatedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className={`text-3xl font-bold ${color} mb-2`}>
        <CountUp end={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </motion.div>
  )
}

export default function EnhancedVisualImpact() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
            数値で見るRunMasterの実力
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            実際のデータに基づく、RunMasterの機能と効果を数値でお見せします
          </p>
        </motion.div>

        {/* アニメーション付き統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <AnimatedStatCard
            value={500}
            label="アクティブベータテスター"
            suffix="+"
            delay={0.1}
            color="text-blue-600"
          />
          <AnimatedStatCard
            value={10000}
            label="記録された練習"
            suffix="+"
            delay={0.2}
            color="text-purple-600"
          />
          <AnimatedStatCard
            value={95}
            label="ユーザー満足度"
            suffix="%"
            delay={0.3}
            color="text-green-600"
          />
          <AnimatedStatCard
            value={48}
            label="平均月間走行距離"
            suffix="km"
            delay={0.4}
            color="text-orange-600"
          />
        </div>

        {/* 機能の成長グラフ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            機能別利用状況
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 利用頻度グラフ */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">週間利用頻度</h4>
              <div className="space-y-4">
                {[
                  { name: '練習記録', percentage: 95, color: 'bg-blue-500' },
                  { name: 'データ分析', percentage: 78, color: 'bg-purple-500' },
                  { name: '体調管理', percentage: 65, color: 'bg-green-500' },
                  { name: 'レース管理', percentage: 52, color: 'bg-orange-500' },
                  { name: 'カスタムワークアウト', percentage: 43, color: 'bg-red-500' }
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-semibold text-gray-900">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={`h-2 rounded-full ${item.color}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 成長トレンド */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">月別成長トレンド</h4>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 flex items-end justify-between">
                {[
                  { month: '1月', value: 120, height: 40 },
                  { month: '2月', value: 135, height: 45 },
                  { month: '3月', value: 142, height: 48 },
                  { month: '4月', value: 156, height: 52 },
                  { month: '5月', value: 168, height: 56 },
                  { month: '6月', value: 175, height: 58 }
                ].map((item, index) => (
                  <motion.div
                    key={item.month}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${item.height}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-8 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t mb-2"></div>
                    <div className="text-xs text-gray-600">{item.month}</div>
                    <div className="text-xs font-semibold text-gray-900">{item.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* インタラクティブな機能デモ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            リアルタイム機能デモ
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ライブ統計 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white"
            >
              <h4 className="text-lg font-semibold mb-4">ライブ統計</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>今日の記録</span>
                  <span className="font-bold">
                    <CountUp end={23} suffix="件" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>今週の距離</span>
                  <span className="font-bold">
                    <CountUp end={45} suffix="km" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>平均ペース</span>
                  <span className="font-bold">4:32/km</span>
                </div>
              </div>
            </motion.div>

            {/* 成長指標 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-6 text-white"
            >
              <h4 className="text-lg font-semibold mb-4">成長指標</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>ペース改善</span>
                  <span className="font-bold text-green-300">
                    +<CountUp end={8} suffix="秒" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>距離増加</span>
                  <span className="font-bold text-green-300">
                    +<CountUp end={12} suffix="%" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>継続日数</span>
                  <span className="font-bold">
                    <CountUp end={45} suffix="日" />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* AI予測 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white"
            >
              <h4 className="text-lg font-semibold mb-4">AI予測</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>フルマラソン</span>
                  <span className="font-bold">3:15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>ハーフマラソン</span>
                  <span className="font-bold">1:28:30</span>
                </div>
                <div className="flex justify-between">
                  <span>10km</span>
                  <span className="font-bold">38:45</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* パフォーマンス指標 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">パフォーマンス指標</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold mb-2">
                  <CountUp end={99} suffix="%" />
                </div>
                <div className="text-blue-200">データ精度</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">
                  <CountUp end={2} suffix="秒" />
                </div>
                <div className="text-blue-200">平均レスポンス時間</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">
                  <CountUp end={24} suffix="時間" />
                </div>
                <div className="text-blue-200">サポート対応時間</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

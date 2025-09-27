'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRacePage() {
  const router = useRouter()

  useEffect(() => {
    // 新しい段階的フローにリダイレクト
    router.replace('/races/create')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">新しいレース作成フローに移動中...</h2>
        <p className="text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  )
}
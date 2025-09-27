'use client'

import { useRouter } from 'next/navigation'
import { RaceCreationFlow } from '../components/RaceCreationFlow'

export default function CreateRacePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/races')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            ← レース一覧に戻る
          </button>
        </div>
        <RaceCreationFlow />
      </div>
    </div>
  )
}

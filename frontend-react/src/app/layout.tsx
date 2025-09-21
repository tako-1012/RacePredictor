import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/UI/Toast'
import { Header } from '@/components/Layout/Header'
import { Footer } from '@/components/Layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RacePredictor - データドリブンなランニングタイム予測アプリ',
  description: '高精度な予測を実現するため、まずは豊富なデータ収集に特化したベータ版',
  keywords: ['ランニング', 'マラソン', 'タイム予測', '練習記録', 'データ分析'],
  authors: [{ name: 'RacePredictor Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'RacePredictor - データドリブンなランニングタイム予測アプリ',
    description: '高精度な予測を実現するため、まずは豊富なデータ収集に特化したベータ版',
    type: 'website',
    locale: 'ja_JP',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

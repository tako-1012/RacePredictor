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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'RunMaster - データで進化するランニング体験 | ベータテスター募集中',
  description: '詳細な記録で、あなたの走りを科学する。高精度なAI予測を実現するため、まずは豊富なデータ収集に特化したベータ版。無料でベータテスターに参加しませんか？',
  keywords: ['ランニング', 'マラソン', 'タイム予測', '練習記録', 'データ分析', 'ベータテスター', 'AI予測', 'ランニングアプリ'],
  authors: [{ name: 'RunMaster Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'RunMaster - データで進化するランニング体験',
    description: '詳細な記録で、あなたの走りを科学する。ベータテスター募集中！',
    type: 'website',
    locale: 'ja_JP',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RunMaster - データで進化するランニング体験',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RunMaster - データで進化するランニング体験',
    description: '詳細な記録で、あなたの走りを科学する。ベータテスター募集中！',
    images: ['/og-image.jpg'],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "RunMaster",
              "description": "データで進化するランニング体験。詳細な記録で、あなたの走りを科学する。",
              "url": "https://runmaster.app",
              "applicationCategory": "SportsApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY",
                "description": "ベータ版は無料でご利用いただけます"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "500"
              },
              "author": {
                "@type": "Organization",
                "name": "RunMaster Team"
              }
            })
          }}
        />
      </head>
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

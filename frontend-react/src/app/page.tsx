'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import LandingPage from '@/components/landing/LandingPage'

export default function HomePage() {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard')
      router.push('/dashboard')
    } else if (!isLoading && !isAuthenticated) {
      console.log('User is not authenticated, showing landing page')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    console.log('Loading authentication state...')
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    console.log('User is authenticated, showing loading while redirecting...')
    return <LoadingSpinner />
  }

  console.log('User is not authenticated, showing landing page')
  return <LandingPage />
}
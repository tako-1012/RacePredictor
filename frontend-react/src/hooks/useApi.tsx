'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, handleApiError } from '@/lib/api'

interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  retryCount?: number
  retryDelay?: number
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: any | null
  refetch: () => Promise<void>
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<any | null>(null)
  const retryCountRef = useRef(0)

  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall()
      setData(result)
      onSuccess?.(result)
      retryCountRef.current = 0
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)
      onError?.(apiError)
      
      // リトライロジック
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        setTimeout(() => {
          execute()
        }, retryDelay * retryCountRef.current)
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, onSuccess, onError, retryCount, retryDelay])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return {
    data,
    loading,
    error,
    refetch: execute
  }
}

// 特定のAPI用のフック
export function useWorkouts(filter?: any) {
  return useApi(
    () => apiClient.getWorkouts(filter),
    { immediate: true }
  )
}

export function useWorkoutTypes() {
  return useApi(
    () => apiClient.getWorkoutTypes(),
    { immediate: true }
  )
}

export function useRaces() {
  return useApi(
    () => apiClient.getRaces(),
    { immediate: true }
  )
}

export function useDashboardStats() {
  return useApi(
    () => apiClient.getDashboardStats(),
    { immediate: true }
  )
}

// デバウンス付きの検索フック
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.trim()) {
      setLoading(true)
      timeoutRef.current = setTimeout(async () => {
        try {
          const data = await searchFn(query)
          setResults(data)
        } catch (error) {
          console.error('Search error:', error)
          setResults(null)
        } finally {
          setLoading(false)
        }
      }, delay)
    } else {
      setResults(null)
      setLoading(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, searchFn, delay])

  return {
    query,
    setQuery,
    results,
    loading
  }
}

// 無限スクロール用のフック
export function useInfiniteScroll<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  limit: number = 20
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<any>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchFn(page, limit)
      
      setData(prev => [...prev, ...result.data])
      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [fetchFn, page, limit, loading, hasMore])

  const reset = useCallback(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  useEffect(() => {
    loadMore()
  }, [])

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  }
}

// オプティミスティック更新用のフック
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>,
  rollbackFn?: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const update = useCallback(async (optimisticData: T) => {
    const previousData = data
    
    // オプティミスティック更新
    setData(optimisticData)
    setLoading(true)
    setError(null)

    try {
      const result = await updateFn(optimisticData)
      setData(result)
    } catch (err) {
      setError(handleApiError(err))
      // ロールバック
      if (rollbackFn) {
        try {
          const rollbackData = await rollbackFn(previousData)
          setData(rollbackData)
        } catch (rollbackErr) {
          setData(previousData)
        }
      } else {
        setData(previousData)
      }
    } finally {
      setLoading(false)
    }
  }, [data, updateFn, rollbackFn])

  return {
    data,
    loading,
    error,
    update
  }
}

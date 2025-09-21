'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// デバウンスフック
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// スロットルフック
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// 仮想スクロールフック
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  }
}

// 無限スクロールフック
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold: number = 100
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    try {
      setIsLoading(true)
      setError(null)
      await fetchMore()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, hasMore, isLoading])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore()
      }
    },
    [loadMore, threshold]
  )

  return {
    isLoading,
    error,
    loadMore,
    handleScroll
  }
}

// メモ化フック
export function useMemoizedValue<T>(
  value: T,
  deps: React.DependencyList
): T {
  const [memoizedValue, setMemoizedValue] = useState<T>(value)

  useEffect(() => {
    setMemoizedValue(value)
  }, deps)

  return memoizedValue
}

// パフォーマンス監視フック
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current += 1
    const renderTime = Date.now() - startTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`)
    }
  })

  return {
    renderCount: renderCount.current
  }
}

// 画像遅延読み込みフック
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
      setIsError(false)
    }
    
    img.onerror = () => {
      setIsError(true)
      setIsLoaded(false)
    }
    
    img.src = src
  }, [src])

  return {
    imageSrc,
    isLoaded,
    isError
  }
}

// キャッシュフック
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5分
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < ttl) {
      setData(cached.data)
      return cached.data
    }

    try {
      setIsLoading(true)
      setError(null)
      const result = await fetcher()
      
      cacheRef.current.set(key, { data: result, timestamp: now })
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [key, fetcher, ttl])

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key)
    setData(null)
  }, [key])

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear()
    setData(null)
  }, [])

  return {
    data,
    isLoading,
    error,
    fetchData,
    clearCache,
    clearAllCache
  }
}

// バッチ処理フック
export function useBatchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<R[]>([])
  const [error, setError] = useState<string | null>(null)

  const processBatch = useCallback(async (items: T[]) => {
    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setError(null)

    try {
      const batches = []
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize))
      }

      const allResults: R[] = []
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const batchResults = await processor(batch)
        allResults.push(...batchResults)
        
        setProgress(Math.round(((i + 1) / batches.length) * 100))
        
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      setResults(allResults)
      return allResults
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [processor, batchSize, delay])

  return {
    isProcessing,
    progress,
    results,
    error,
    processBatch
  }
}

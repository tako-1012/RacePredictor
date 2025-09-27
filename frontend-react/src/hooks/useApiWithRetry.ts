'use client'

import { useState, useCallback } from 'react'

interface UseApiWithRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error, attempt: number) => void
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  retryCount: number
}

export function useApiWithRetry<T = any>(options: UseApiWithRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  })

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState({
        data: result,
        loading: false,
        error: null,
        retryCount: 0
      })
      return result
    } catch (error) {
      const err = error as Error
      
      if (retryCount < maxRetries) {
        // リトライ
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: null, 
          retryCount: retryCount + 1 
        }))
        
        if (onError) {
          onError(err, retryCount + 1)
        }
        
        // 遅延後にリトライ
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)))
        return execute(apiCall, retryCount + 1)
      } else {
        // 最大リトライ回数に達した
        setState({
          data: null,
          loading: false,
          error: err,
          retryCount: retryCount + 1
        })
        throw err
      }
    }
  }, [maxRetries, retryDelay, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// 特定のAPI呼び出し用のフック
export function useTemplateApi() {
  const apiState = useApiWithRetry({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error, attempt) => {
      console.warn(`API呼び出し失敗 (試行 ${attempt}回目):`, error.message)
    }
  })

  return apiState
}

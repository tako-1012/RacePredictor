'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

// 高速データ処理用のフック
export function useFastDataProcessing<T>(data: T[], searchTerm: string = '') {
  const [filteredData, setFilteredData] = useState<T[]>(data)
  const [isProcessing, setIsProcessing] = useState(false)

  // メモ化された検索処理
  const processedData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const startTime = performance.now()
    const filtered = data.filter(item => {
      // オブジェクトの全プロパティを検索
      return Object.values(item as any).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm)
        }
        return false
      })
    })
    
    const endTime = performance.now()
    console.log(`検索処理時間: ${endTime - startTime}ms`)
    
    return filtered
  }, [data, searchTerm])

  useEffect(() => {
    setIsProcessing(true)
    const timer = setTimeout(() => {
      setFilteredData(processedData)
      setIsProcessing(false)
    }, 100) // 100msのデバウンス

    return () => clearTimeout(timer)
  }, [processedData])

  return {
    filteredData,
    isProcessing,
    totalCount: data.length,
    filteredCount: filteredData.length
  }
}

// 仮想スクロール用のフック
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  }
}

// インクリメンタル検索用のフック
export function useIncrementalSearch<T>(
  data: T[],
  searchKey: keyof T,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      const filtered = data.filter(item => {
        const value = item[searchKey]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query.toLowerCase())
        }
        return false
      })
      setResults(filtered)
      setIsSearching(false)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, data, searchKey, debounceMs])

  return {
    query,
    setQuery,
    results,
    isSearching
  }
}

// データ集計用のフック
export function useDataAggregation<T>(
  data: T[],
  groupBy: keyof T,
  aggregateFields: Array<{
    field: keyof T
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    label: string
  }>
) {
  const aggregatedData = useMemo(() => {
    const groups = new Map<string, T[]>()

    // グループ化
    data.forEach(item => {
      const key = String(item[groupBy])
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })

    // 集計
    const result = Array.from(groups.entries()).map(([groupKey, items]) => {
      const aggregated: any = { group: groupKey }

      aggregateFields.forEach(({ field, operation, label }) => {
        const values = items.map(item => item[field]).filter(val => val != null)
        
        switch (operation) {
          case 'sum':
            aggregated[label] = values.reduce((sum, val) => sum + Number(val), 0)
            break
          case 'avg':
            aggregated[label] = values.length > 0 
              ? values.reduce((sum, val) => sum + Number(val), 0) / values.length 
              : 0
            break
          case 'count':
            aggregated[label] = values.length
            break
          case 'min':
            aggregated[label] = values.length > 0 ? Math.min(...values.map(Number)) : 0
            break
          case 'max':
            aggregated[label] = values.length > 0 ? Math.max(...values.map(Number)) : 0
            break
        }
      })

      return aggregated
    })

    return result
  }, [data, groupBy, aggregateFields])

  return aggregatedData
}

// CSVダウンロード用のフック
export function useCSVExport<T>(data: T[], filename: string = 'data.csv') {
  const exportToCSV = useCallback(() => {
    if (data.length === 0) return

    const headers = Object.keys(data[0] as any)
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          const value = (item as any)[header]
          // CSV用にエスケープ
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }, [data, filename])

  return exportToCSV
}

// 印刷用CSS用のフック
export function usePrintStyles() {
  useEffect(() => {
    const printStyles = `
      @media print {
        .no-print { display: none !important; }
        .print-break { page-break-before: always; }
        .print-avoid-break { page-break-inside: avoid; }
        body { font-size: 12pt; line-height: 1.4; }
        .print-header { 
          border-bottom: 2px solid #000; 
          margin-bottom: 20px; 
          padding-bottom: 10px; 
        }
        .print-footer { 
          border-top: 1px solid #000; 
          margin-top: 20px; 
          padding-top: 10px; 
          font-size: 10pt; 
        }
        .print-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        .print-table th, .print-table td { 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: left; 
        }
        .print-table th { 
          background-color: #f0f0f0; 
          font-weight: bold; 
        }
      }
    `

    const styleElement = document.createElement('style')
    styleElement.textContent = printStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const printPage = useCallback(() => {
    window.print()
  }, [])

  return { printPage }
}

// 画像エクスポート用のフック
export function useImageExport() {
  const exportToImage = useCallback((elementId: string, filename: string = 'chart.png') => {
    const element = document.getElementById(elementId)
    if (!element) return

    // html2canvasライブラリが必要
    if (typeof window !== 'undefined' && (window as any).html2canvas) {
      (window as any).html2canvas(element).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a')
        link.download = filename
        link.href = canvas.toDataURL()
        link.click()
      })
    } else {
      console.warn('html2canvasライブラリが読み込まれていません')
    }
  }, [])

  return { exportToImage }
}

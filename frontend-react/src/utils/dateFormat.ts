/**
 * 日付フォーマット用のユーティリティ関数
 */

/**
 * ISO日付文字列（YYYY-MM-DD）をスラッシュ区切りの日付（YYYY/M/D）に変換
 * @param isoDateString ISO日付文字列（例: "2024-01-01"）
 * @returns スラッシュ区切りの日付文字列（例: "2024/1/1"）
 */
export const formatDateToSlash = (isoDateString: string): string => {
  if (!isoDateString) return ''
  
  const [year, month, day] = isoDateString.split('-')
  return `${year}/${parseInt(month)}/${parseInt(day)}`
}

/**
 * スラッシュ区切りの日付（YYYY/M/D）をISO日付文字列（YYYY-MM-DD）に変換
 * @param slashDateString スラッシュ区切りの日付文字列（例: "2024/1/1"）
 * @returns ISO日付文字列（例: "2024-01-01"）
 */
export const formatDateFromSlash = (slashDateString: string): string => {
  if (!slashDateString) return ''
  
  const [year, month, day] = slashDateString.split('/')
  
  // 各要素が存在することを確認
  if (!year || !month || !day) {
    console.warn('Invalid date format:', slashDateString)
    return ''
  }
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * 現在の日付をスラッシュ区切りで取得
 * @returns スラッシュ区切りの日付文字列（例: "2024/1/1"）
 */
export const getCurrentDateSlash = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${year}/${month}/${day}`
}

/**
 * 現在の日付をISO形式で取得
 * @returns ISO日付文字列（例: "2024-01-01"）
 */
export const getCurrentDateISO = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * 年齢計算ユーティリティ
 */

/**
 * 生年月日から年齢を計算する
 * @param birthDate 生年月日 (YYYY-MM-DD形式)
 * @returns 年齢（数値）
 */
export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  
  const today = new Date()
  const birth = new Date(birthDate)
  
  // 生年月日が未来の場合は0を返す
  if (birth > today) return 0
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  // まだ誕生日が来ていない場合は1歳引く
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * 年齢から生年月日を推定する（現在の年から逆算）
 * @param age 年齢
 * @returns 生年月日 (YYYY-MM-DD形式)
 */
export function estimateBirthDateFromAge(age: number): string {
  if (age <= 0) return ''
  
  const today = new Date()
  const currentYear = today.getFullYear()
  const birthYear = currentYear - age
  
  // 1月1日をデフォルトの誕生日とする
  return `${birthYear}-01-01`
}

/**
 * 生年月日の妥当性をチェックする
 * @param birthDate 生年月日 (YYYY-MM-DD形式)
 * @returns 妥当性チェック結果
 */
export function validateBirthDate(birthDate: string): {
  isValid: boolean
  error?: string
} {
  if (!birthDate) {
    return { isValid: false, error: '生年月日を入力してください' }
  }
  
  const date = new Date(birthDate)
  const today = new Date()
  
  // 日付の妥当性チェック
  if (isNaN(date.getTime())) {
    return { isValid: false, error: '正しい日付形式で入力してください' }
  }
  
  // 未来の日付チェック
  if (date > today) {
    return { isValid: false, error: '未来の日付は入力できません' }
  }
  
  // 古すぎる日付チェック（100年前）
  const minDate = new Date()
  minDate.setFullYear(today.getFullYear() - 100)
  if (date < minDate) {
    return { isValid: false, error: '100歳を超える年齢は入力できません' }
  }
  
  return { isValid: true }
}

/**
 * 生年月日を日本語形式でフォーマットする
 * @param birthDate 生年月日 (YYYY-MM-DD形式)
 * @returns 日本語形式の日付文字列
 */
export function formatBirthDateJapanese(birthDate: string): string {
  if (!birthDate) return ''
  
  const date = new Date(birthDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}年${month}月${day}日`
}

/**
 * 年齢の表示用テキストを生成する
 * @param age 年齢
 * @returns 年齢の表示用テキスト
 */
export function formatAgeDisplay(age: number): string {
  if (age <= 0) return '未設定'
  return `${age}歳`
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>('')

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 ログインフォーム送信:', { email, password: '***' });
    console.log('🔍 フォームデータ:', { email, password });
    setIsLoading(true)
    setError('')

    try {
      console.log('🚀 ログイン処理開始');
      await login({ email, password })
      console.log('✅ ログイン成功、リダイレクト準備中');
      // ログイン成功後、フォームをリセット
      setEmail('')
      setPassword('')
      // ダッシュボードに直接リダイレクト
      console.log('🔄 ダッシュボードにリダイレクト');
      router.push('/dashboard')
    } catch (err: any) {
      console.error('❌ ログイン失敗:', err);
      console.error('❌ エラー詳細:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // エラーメッセージを分かりやすく変換
      let errorMessage = 'ログインに失敗しました'
      let suggestion = ''
      
      if (err.response?.status === 401) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません'
        suggestion = '入力内容を確認するか、新規アカウントを作成してください'
      } else if (err.response?.status === 422) {
        errorMessage = '入力内容に問題があります'
        suggestion = 'メールアドレスとパスワードを正しく入力してください'
      } else if (err.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました'
        suggestion = 'しばらく時間をおいてから再度お試しください'
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage = 'サーバーに接続できません'
        suggestion = 'インターネット接続を確認してください'
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      }
      
      setError({
        message: errorMessage,
        suggestion: suggestion
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Activity className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-4xl font-bold gradient-text mb-2">
          RunMaster
        </h2>
        <p className="text-center text-neutral-600 text-lg">
          データドリブンなランニングタイム予測アプリ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-elevated">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="label">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                aria-describedby="email-error"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="パスワードを入力"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert" aria-live="polite">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800" id="email-error">
                      {typeof error === 'string' ? error : error.message || 'エラーが発生しました'}
                    </p>
                    {error.suggestion && (
                      <p className="text-sm text-red-600 mt-1">{error.suggestion}</p>
                    )}
                    <div className="mt-3">
                      <div className="bg-red-100 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-medium mb-1">💡 テスト用アカウント</p>
                        <p className="text-xs text-red-600">
                          メール: <span className="font-mono">test@example.com</span><br />
                          パスワード: <span className="font-mono">testpassword</span>
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          ※ パスワードが異なる場合は、新規登録からアカウントを作成してください
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ログイン中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    ログイン
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-neutral-500 font-medium">または</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="btn-secondary w-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                新規アカウント作成
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-xl">
              <svg className="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary-700 font-medium">
                ベータ版のため、テスト用アカウントでお試しください
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

type ImportStep = 'upload' | 'preview' | 'settings' | 'importing' | 'complete'

interface ProgressBarProps {
  currentStep: ImportStep
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const steps = [
    { id: 'upload', name: 'ファイル選択', description: 'CSVファイルを選択' },
    { id: 'preview', name: 'プレビュー', description: 'データを確認' },
    { id: 'settings', name: '設定', description: '詳細を設定' },
    { id: 'importing', name: 'インポート', description: 'データを処理中' },
    { id: 'complete', name: '完了', description: 'インポート完了' }
  ]

  const getStepIndex = (step: ImportStep) => {
    return steps.findIndex(s => s.id === step)
  }

  const currentIndex = getStepIndex(currentStep)

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-center space-x-8">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentIndex
          const isCurrent = stepIdx === currentIndex
          const isUpcoming = stepIdx > currentIndex

          return (
            <li key={step.name} className="relative">
              {stepIdx !== steps.length - 1 && (
                <div
                  className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? 'border-blue-600 bg-blue-600'
                      : isCurrent
                      ? 'border-blue-600 bg-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="ml-4 min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

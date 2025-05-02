import React, { useState, useCallback } from 'react'

interface ResultDisplayProps {
  result: string | null
  isLoading: boolean
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result).then(
        () => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000) // 2秒後にメッセージを消す
        },
        (err) => {
          console.error('コピーに失敗しました: ', err)
          alert('クリップボードへのコピーに失敗しました。')
        }
      )
    }
  }, [result])

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-2">生成結果</h3>
      <div className="p-4 border rounded-md bg-gray-50 min-h-[100px]">
        {isLoading && (
          <div className="flex items-center justify-center h-[80px]">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {result ? (
          <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {result}
          </pre>
        ) : (
          !isLoading && (
            <p className="text-sm text-gray-500 text-center pt-4">
              まだ結果がありません。
            </p>
          )
        )}
        {result && (
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1 rounded text-sm transition-colors duration-150 border border-red-700 hover:bg-red-700 shadow-md ${
                copied ? 'bg-green-500 border-green-600' : ''
              }`}
              aria-label={copied ? 'コピーしました' : '結果をコピー'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultDisplay

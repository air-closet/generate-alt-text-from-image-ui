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
      <div className="relative p-4 border rounded-md bg-gray-50 min-h-[100px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
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
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs transition-colors duration-150 ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-label={copied ? 'コピーしました' : '結果をコピー'}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ResultDisplay

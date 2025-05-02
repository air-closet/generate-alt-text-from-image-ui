import React, { useState, useCallback } from 'react'
import { GenerationResult } from '../../types'

interface ResultDisplayProps {
  results: GenerationResult[]
  isLoading: boolean
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  results,
  isLoading,
}) => {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = useCallback((text: string | null, modelId: string) => {
    if (text) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(modelId)
          setTimeout(() => setCopied(null), 2000) // 2秒後にメッセージを消す
        },
        (err) => {
          console.error('コピーに失敗しました: ', err)
          alert('クリップボードへのコピーに失敗しました。')
        }
      )
    }
  }, [])

  // hasResults は結果リストの内部での表示制御にのみ使用
  // const hasResults =
  //   results.length > 0 && results.some((r) => r.generatedAltText)

  // ローディングインジケーターの表示条件をシンプルに isLoading のみとする
  // const shouldShowLoading = isLoading || (results.length > 0 && !hasResults)

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-2">生成結果</h3>
      <div className="border rounded-md bg-gray-50 overflow-hidden min-h-[100px] flex flex-col justify-center">
        {/* ローディング表示: isLoading が true の時のみ */}
        {isLoading && (
          <div className="flex items-center justify-center h-[100px] bg-white/50">
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

        {/* 「まだ結果がありません」表示: isLoading が false かつ results が空の時のみ */}
        {!isLoading && results.length === 0 && (
          <div className="p-4">
            <p className="text-sm text-gray-500 text-center py-6">
              まだ結果がありません。
            </p>
          </div>
        )}

        {/* 結果リスト表示: isLoading が false かつ results に要素がある時 */}
        {!isLoading && results.length > 0 && (
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => {
              const displayModelName = result.model.replace(
                /^(openai:|gemini:)/,
                ''
              )
              return (
                <div key={`${result.model}-${index}`} className="p-4 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">
                      {displayModelName}
                    </h4>
                    {result.generatedAltText && (
                      <button
                        onClick={() =>
                          handleCopy(result.generatedAltText, result.model)
                        }
                        className={`px-2 py-1 text-xs rounded transition-colors duration-150 ${
                          copied === result.model
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {copied === result.model ? 'コピー済み' : 'コピー'}
                      </button>
                    )}
                  </div>

                  {result.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                      エラー: {result.error}
                    </div>
                  ) : result.generatedAltText ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words p-3 bg-white rounded border border-gray-200">
                      {result.generatedAltText}
                    </pre>
                  ) : (
                    // 結果が null だが表示すべき場合 (isLoading=false, results.length > 0)
                    <p className="text-sm text-gray-500 italic p-3 bg-white rounded border border-gray-200">
                      結果なし
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultDisplay

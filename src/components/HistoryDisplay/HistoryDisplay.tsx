import React from 'react'
import { HistoryEntry } from '../../types' // パスを修正

interface HistoryDisplayProps {
  history: HistoryEntry[]
  onDeleteHistoryItem: (id: string) => void
  onShowHistoryDetails: (entry: HistoryEntry) => void
  // TODO: 将来的に履歴削除や再読み込み用の関数をPropsで受け取るかも
  // onLoadHistoryItem: (entry: HistoryEntry) => void;
}

const HistoryDisplay: React.FC<HistoryDisplayProps> = ({
  history,
  onDeleteHistoryItem,
  onShowHistoryDetails,
}) => {
  if (history.length === 0) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        生成履歴はありません。
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">生成履歴</h2>
      <ul className="space-y-4">
        {history.map((entry) => (
          <li
            key={entry.id}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex space-x-4 items-center hover:bg-gray-50 cursor-pointer"
            onClick={() => onShowHistoryDetails(entry)}
          >
            {/* 画像サムネイル */}
            <img
              src={entry.imageDataUrl}
              alt="History thumbnail"
              className="w-20 h-20 object-cover rounded flex-shrink-0"
            />
            {/* 情報 */}
            <div className="flex-grow min-w-0">
              {' '}
              {/* はみ出し防止 */}
              <div className="text-xs text-gray-500 mb-1">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                モデル:{' '}
                {entry.results
                  .map((r) => r.model.replace(/^(openai:|gemini:)/, ''))
                  .join(', ')}
              </div>
              <p
                className="text-sm text-gray-600 mb-1 truncate"
                title={entry.prompt}
              >
                <span className="font-medium">プロンプト:</span> {entry.prompt}
              </p>
              <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded truncate">
                <span className="font-medium">結果数:</span>{' '}
                {entry.results.length}件
              </p>
            </div>
            {/* アクションボタン */}
            <div className="flex flex-col space-y-1 flex-shrink-0 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteHistoryItem(entry.id)
                }}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 z-10"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default HistoryDisplay

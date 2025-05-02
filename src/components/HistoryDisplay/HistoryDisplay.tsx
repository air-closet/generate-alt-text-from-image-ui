import React from 'react'
import { HistoryEntry, GenerationResult } from '../../types' // パスを修正

interface HistoryDisplayProps {
  history: HistoryEntry[]
  onDeleteHistoryItem: (id: string) => void
  onShowHistoryDetails: (entry: HistoryEntry) => void
  // TODO: 将来的に履歴削除や再読み込み用の関数をPropsで受け取るかも
  // onLoadHistoryItem: (entry: HistoryEntry) => void;
}

// 古い形式の履歴エントリ用の型定義
interface OldFormatHistoryEntry {
  id: string
  timestamp: number
  imageDataUrl: string
  prompt: string
  model: string
  generatedAltText: string
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

  // 古い形式の履歴エントリか新しい形式かを判定する関数
  const isOldFormatEntry = (
    entry: HistoryEntry | OldFormatHistoryEntry
  ): boolean => {
    return (
      !('results' in entry) &&
      typeof (entry as OldFormatHistoryEntry).model === 'string' &&
      typeof (entry as OldFormatHistoryEntry).generatedAltText === 'string'
    )
  }

  // モデル名を表示する関数（古い形式と新しい形式の両方に対応）
  const getModelNames = (
    entry: HistoryEntry | OldFormatHistoryEntry
  ): string => {
    if (isOldFormatEntry(entry)) {
      // 古い形式の場合
      return (entry as OldFormatHistoryEntry).model.replace(
        /^(openai:|gemini:)/,
        ''
      )
    } else if ('results' in entry && Array.isArray(entry.results)) {
      // 新しい形式の場合
      return entry.results
        .map((r: GenerationResult) => r.model.replace(/^(openai:|gemini:)/, ''))
        .join(', ')
    }
    return '不明なモデル' // フォールバック
  }

  // 結果の数を表示する関数（古い形式と新しい形式の両方に対応）
  const getResultCount = (
    entry: HistoryEntry | OldFormatHistoryEntry
  ): string => {
    if (isOldFormatEntry(entry)) {
      // 古い形式の場合
      return '1件'
    } else if ('results' in entry && Array.isArray(entry.results)) {
      // 新しい形式の場合
      return `${entry.results.length}件`
    }
    return '0件' // フォールバック
  }

  return (
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
              モデル: {getModelNames(entry)}
            </div>
            <p
              className="text-sm text-gray-600 mb-1 truncate"
              title={entry.prompt}
            >
              <span className="font-medium">プロンプト:</span> {entry.prompt}
            </p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded truncate">
              <span className="font-medium">結果数:</span>{' '}
              {getResultCount(entry)}
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
  )
}

export default HistoryDisplay

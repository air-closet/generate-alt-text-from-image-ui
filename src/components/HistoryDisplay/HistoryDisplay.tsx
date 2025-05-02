import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  deleteHistoryEntry,
  openHistoryModal,
} from '../../store/slices/historySlice'
import { HistoryEntry, GenerationResult } from '../../types' // 型定義をインポート

// Props は不要になるので削除
// interface HistoryDisplayProps {
//   history: HistoryEntry[]
//   onDeleteHistoryItem: (id: string) => void
//   onShowHistoryDetails: (entry: HistoryEntry) => void
// }

// 古い形式の型定義は不要になるので削除
// interface OldFormatHistoryEntry { ... }

const HistoryDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  // ストアから履歴エントリを取得
  const history = useSelector((state: RootState) => state.history.entries)

  if (history.length === 0) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        生成履歴はありません。
      </div>
    )
  }

  // isOldFormatEntry, getModelNames, getResultCount ヘルパー関数は不要なので削除
  // (新しい形式のみを扱うため)

  // モデル名を取得するヘルパー (新しい形式のみ対応)
  const getModelNames = (results: GenerationResult[]): string => {
    if (!results || results.length === 0) return '不明なモデル'
    return results
      .map((r) => r.model.replace(/^(openai:|gemini:)/, ''))
      .join(', ')
  }

  // 結果数を取得するヘルパー (新しい形式のみ対応)
  const getResultCount = (results: GenerationResult[]): string => {
    if (!results) return '0件'
    return `${results.length}件`
  }

  // 削除ボタンクリックハンドラ
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // 親要素へのクリックイベント伝播を停止
    dispatch(deleteHistoryEntry(id))
  }

  // 履歴アイテムクリックハンドラ (詳細モーダル表示)
  const handleItemClick = (id: string) => {
    dispatch(openHistoryModal(id))
  }

  return (
    <div className="mt-8">
      {/* 履歴リストのタイトルは App.tsx 側で表示 */}
      {/* <h2 className="text-xl font-semibold text-gray-800 mb-4">生成履歴</h2> */}
      <ul className="space-y-4">
        {history.map(
          (
            entry: HistoryEntry // entry に型を付与
          ) => (
            <li
              key={entry.id}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex space-x-4 items-center hover:bg-gray-50 cursor-pointer"
              onClick={() => handleItemClick(entry.id)} // ID を渡す
            >
              <img
                src={entry.imageDataUrl}
                alt="History thumbnail"
                className="w-20 h-20 object-cover rounded flex-shrink-0"
              />
              <div className="flex-grow min-w-0">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1 truncate">
                  {/* entry.results を直接渡す */}
                  モデル: {getModelNames(entry.results)}
                </div>
                <p
                  className="text-sm text-gray-600 mb-1 truncate"
                  title={entry.prompt}
                >
                  <span className="font-medium">プロンプト:</span>{' '}
                  {entry.prompt}
                </p>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded truncate">
                  <span className="font-medium">結果数:</span>{' '}
                  {/* entry.results を直接渡す */}
                  {getResultCount(entry.results)}
                </p>
              </div>
              <div className="flex flex-col space-y-1 flex-shrink-0 ml-auto">
                <button
                  onClick={(e) => handleDeleteClick(e, entry.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 z-10"
                >
                  削除
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}

export default HistoryDisplay

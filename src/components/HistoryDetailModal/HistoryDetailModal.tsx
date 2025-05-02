import React from 'react'
import Modal from 'react-modal'
import { HistoryEntry, GenerationResult } from '../../types'

// 古い形式の履歴エントリ用の型定義
interface OldFormatHistoryEntry {
  id: string
  timestamp: number
  imageDataUrl: string
  prompt: string
  model: string
  generatedAltText: string
}

interface HistoryDetailModalProps {
  isOpen: boolean
  onRequestClose: () => void
  entry: HistoryEntry | null
}

// モーダルのスタイル (例: 中央揃え)
const customStyles: Modal.Styles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '90vh', // 高さを制限してスクロール可能に
    maxWidth: '90vw', // 幅も制限
    overflow: 'auto', // 内容が多い場合にスクロール
    border: '1px solid #ccc',
    background: '#fff',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 背景を暗くする
    zIndex: 1000, // 他の要素より手前に
  },
}

// アプリのルート要素を設定 (アクセシビリティのため)
// 通常は public/index.html の <div id="root"></div> を指定
Modal.setAppElement('#root')

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isOpen,
  onRequestClose,
  entry,
}) => {
  if (!entry) {
    return null // エントリがなければ何も表示しない
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

  // 結果データを取得する関数 (古い形式と新しい形式の両方に対応)
  const getResultsArray = (
    entry: HistoryEntry | OldFormatHistoryEntry
  ): GenerationResult[] => {
    if (isOldFormatEntry(entry)) {
      // 古い形式からGenerationResult配列に変換
      const oldEntry = entry as OldFormatHistoryEntry
      return [
        {
          model: oldEntry.model,
          generatedAltText: oldEntry.generatedAltText,
          error: null,
        },
      ]
    } else {
      // 新しい形式はそのまま返す
      return (entry as HistoryEntry).results || []
    }
  }

  // モデル結果を表示するコンポーネント
  const ModelResult = ({ result }: { result: GenerationResult }) => {
    const displayModelName = result.model.replace(/^(openai:|gemini:)/, '')

    return (
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <div className="text-md font-semibold mb-2 pb-2 border-b">
          {displayModelName}
        </div>

        {result.error ? (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
            エラー: {result.error}
          </div>
        ) : (
          <pre className="bg-white p-3 rounded whitespace-pre-wrap break-words text-sm">
            {result.generatedAltText || '結果なし'}
          </pre>
        )}
      </div>
    )
  }

  // 結果配列
  const resultsArray = getResultsArray(entry)

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="History Detail Modal"
    >
      <div className="relative">
        {/* 閉じるボタン */}
        <button
          onClick={onRequestClose}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-800 text-2xl font-bold p-2"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">履歴詳細</h2>

        {/* コンテンツ */}
        <div className="space-y-4">
          {/* 画像 */}
          <div>
            <img
              src={entry.imageDataUrl}
              alt="Selected history item"
              className="max-w-full h-auto max-h-60 object-contain rounded mx-auto mb-4" // サイズ調整
            />
          </div>

          {/* 情報テーブル */}
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="font-semibold">日時:</span>
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            <div className="border-b pb-1">
              <span className="font-semibold">モデル:</span>
              <span className="truncate ml-1">
                {resultsArray.length}件のモデルを使用
              </span>
            </div>
            <div>
              <span className="font-semibold block mb-1">プロンプト:</span>
              <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap break-words text-xs">
                {entry.prompt}
              </pre>
            </div>
            <div>
              <span className="font-semibold block mb-3 mt-4">生成結果:</span>
              <div className="space-y-3">
                {resultsArray.map((result, index) => (
                  <ModelResult
                    key={`${result.model}-${index}`}
                    result={result}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* フッター (閉じるボタン) */}
        <div className="mt-8 text-right">
          <button
            onClick={onRequestClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default HistoryDetailModal

import React from 'react'
import Modal from 'react-modal'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { closeHistoryModal } from '../../store/slices/historySlice'
import { GenerationResult, HistoryEntry } from '../../types'

// モーダルのスタイル (例: 中央揃え)
const customStyles: Modal.Styles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    height: '90vh', // 高さを固定
    width: '60vw', // 幅を 80vw に変更
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

const HistoryDetailModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // ストアからモーダルの表示状態と選択中のエントリIDを取得
  const {
    isModalOpen,
    selectedEntryId,
    entries: historyEntries,
  } = useSelector((state: RootState) => state.history)

  // 選択中の履歴エントリをIDから検索
  const selectedEntry = historyEntries.find(
    (entry: HistoryEntry) => entry.id === selectedEntryId
  )

  // モーダルを閉じるハンドラ
  const handleRequestClose = () => {
    dispatch(closeHistoryModal())
  }

  // selectedEntry が見つからない、またはモーダルが開いていない場合は何も表示しない
  if (!selectedEntry || !isModalOpen) {
    return null
  }

  // 結果データを取得 (新しい形式のみ)
  const resultsArray = selectedEntry.results || []

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
          <div className="bg-white p-3 rounded whitespace-pre-wrap break-words text-sm max-w-2xl">
            {result.generatedAltText || '結果なし'}
          </div>
        )}
      </div>
    )
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={handleRequestClose}
      style={customStyles}
      contentLabel="History Detail Modal"
    >
      {/* ルート: h-full でモーダルの高さを使い、flex-col で縦積み */}
      <div className="relative flex flex-col h-full">
        {/* 閉じるボタン */}
        <button
          onClick={handleRequestClose}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-800 text-2xl font-bold p-2 z-10" // z-index追加
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* タイトル (flex-shrink-0) */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex-shrink-0">
          履歴詳細
        </h2>

        {/* コンテンツグリッド (flex-grow で残り高さを占め、overflow-hidden) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
          {/* 左カラム (overflow-y-auto) */}
          <div className="md:col-span-1 space-y-4 overflow-y-auto pr-2">
            {' '}
            {/* スクロール用にパディング */}
            {/* 画像 */}
            <img
              src={selectedEntry.imageDataUrl}
              alt="Selected history item"
              className="max-w-full h-auto rounded border"
            />
            {/* 情報 */}
            <div className="text-sm text-gray-700 space-y-3">
              <div className="border-b pb-1">
                <span className="font-semibold">日時:</span>
                <span className="ml-2">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="border-b pb-1">
                <span className="font-semibold block mb-1">使用モデル:</span>
                <ul className="list-disc list-inside text-xs bg-gray-100 p-2 rounded ml-1">
                  {resultsArray.map((r, i) => (
                    <li key={i} className="truncate">
                      {r.model.replace(/^(openai:|gemini:)/, '')}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {' '}
                {/* プロンプトの<div>を追加 */}
                <span className="font-semibold block mb-1">プロンプト:</span>
                <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap break-words text-xs">
                  {selectedEntry.prompt}
                </pre>
              </div>
            </div>
          </div>

          {/* 右カラム (flex-col, overflow-hidden) */}
          <div className="md:col-span-2 flex flex-col overflow-hidden">
            {/* 右カラムタイトル (flex-shrink-0) */}
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex-shrink-0">
              生成結果
            </h3>
            {/* 結果リスト (flex-grow, overflow-y-auto) */}
            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
              {' '}
              {/* flex-grow と overflow-y-auto */}
              {resultsArray.map((result: GenerationResult, index: number) => (
                <ModelResult key={`${result.model}-${index}`} result={result} />
              ))}
            </div>
          </div>
        </div>

        {/* フッター (flex-shrink-0) */}
        <div className="text-right flex-shrink-0">
          <button
            onClick={handleRequestClose}
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

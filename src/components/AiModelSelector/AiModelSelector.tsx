import React, { useState } from 'react'
import { AvailableModel as AvailableGeminiModel } from '../../hooks/useGemini' // ★ useGemini から型をインポート
import { AvailableOpenAIModel } from '../../hooks/useOpenAI' // OpenAIの型をインポート

// ★ AiModel enum は削除

interface AiModelSelectorProps {
  selectedModels: string[] // ★ string[] に変更
  setSelectedModels: (models: string[]) => void // ★ string[] に変更
  availableGeminiModels: AvailableGeminiModel[] // ★ Gemini モデルのリストを受け取る (名前変更)
  availableOpenAIModels: AvailableOpenAIModel[] // ★ OpenAI用リストを受け取る
  isLoadingOpenAI: boolean // ★ OpenAIモデルリスト取得中の状態
  isLoadingGemini: boolean // ★ Geminiモデルリスト取得中の状態
  errorOpenAI: string | null // ★ OpenAIモデルリスト取得エラー
  errorGemini: string | null // ★ Geminiモデルリスト取得エラー
  allowAdvancedModels: boolean // 追加: 高度なモデルの使用許可フラグ
  setAllowAdvancedModels: (allow: boolean) => void // 追加: フラグ更新関数
}

const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  selectedModels,
  setSelectedModels,
  availableGeminiModels, // 名前変更
  availableOpenAIModels,
  isLoadingOpenAI, // 名前変更
  isLoadingGemini, // 名前変更
  errorOpenAI, // 名前変更
  errorGemini, // 名前変更
  allowAdvancedModels,
  setAllowAdvancedModels,
}) => {
  // 折りたたみ状態
  const [isCollapsed, setIsCollapsed] = useState(false)

  // モデル選択の切り替え処理
  const toggleModelSelection = (modelIdentifier: string) => {
    if (selectedModels.includes(modelIdentifier)) {
      setSelectedModels(selectedModels.filter((id) => id !== modelIdentifier))
    } else {
      setSelectedModels([...selectedModels, modelIdentifier])
    }
  }

  // 高度なモデル許可チェックボックスのハンドラ
  const handleAdvancedCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = event.target.checked
    setAllowAdvancedModels(isChecked)

    // チェックを外したら、選択中の高度なGeminiモデルの選択を解除する
    if (!isChecked) {
      setSelectedModels(
        selectedModels.filter((modelId: string) => {
          if (!modelId.startsWith('gemini:')) return true
          const modelName = modelId.replace(/^gemini:/, '')
          const modelInfo = availableGeminiModels.find(
            (m) => m.name === modelName
          )
          return !modelInfo?.isExperimentalOrPreview
        })
      )
    }
  }

  const isLoading = isLoadingOpenAI || isLoadingGemini // 統合ローディング状態
  const hasError = errorOpenAI || errorGemini // エラー状態
  const hasModels =
    availableOpenAIModels.length > 0 || availableGeminiModels.length > 0

  // モデルをタグ形式でレンダリングするヘルパー関数
  const renderModelTags = (
    models: Array<AvailableOpenAIModel | AvailableGeminiModel>,
    prefix: 'openai:' | 'gemini:'
  ) => {
    return (
      <div className="flex flex-wrap gap-2">
        {models.map((model) => {
          const modelId =
            prefix === 'openai:'
              ? (model as AvailableOpenAIModel).id
              : (model as AvailableGeminiModel).name
          const identifier = `${prefix}${modelId}`
          const displayName =
            prefix === 'openai:'
              ? modelId
              : (model as AvailableGeminiModel).displayName
          const isGemini = prefix === 'gemini:'
          const isAdvancedGemini =
            isGemini && (model as AvailableGeminiModel).isExperimentalOrPreview
          const isDisabled = isAdvancedGemini && !allowAdvancedModels
          const isSelected = selectedModels.includes(identifier)

          // 非選択状態のスタイル
          const nonSelectedStyle =
            prefix === 'openai:'
              ? 'bg-white text-gray-800 hover:bg-emerald-50'
              : 'bg-white text-gray-800 hover:bg-purple-50'

          // 選択状態のスタイル (色を真っ黒に！)
          const selectedStyle =
            prefix === 'openai:'
              ? 'bg-white border-2 border-black text-gray-800 ring-2 ring-emerald-500'
              : 'bg-white border-2 border-black text-gray-800 ring-2 ring-purple-500'

          return (
            <button
              key={identifier}
              onClick={() => !isDisabled && toggleModelSelection(identifier)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors relative
                ${isSelected ? selectedStyle : nonSelectedStyle} 
                ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
            >
              {displayName}
              {isAdvancedGemini && <span className="text-xs ml-1">★</span>}
              {isSelected && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-black text-xs font-bold">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* ヘッダー部分 - 常に表示 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={isCollapsed ? '展開' : '折りたたむ'}
          >
            <span className="text-xl">{isCollapsed ? '▶' : '▼'}</span>
          </button>
          <label className="text-md font-semibold text-gray-700">
            比較したいAIモデルを選択
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
            {selectedModels.length}個選択中
          </div>
        </div>
      </div>

      {/* 選択中のモデル表示 - 折りたたみ時に表示 */}
      {isCollapsed && selectedModels.length > 0 && (
        <div className="mb-3 py-2 px-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
          <div className="flex flex-wrap gap-1">
            {selectedModels.map((modelId) => {
              const prefix = modelId.startsWith('openai:')
                ? 'openai:'
                : 'gemini:'
              const rawId = modelId.replace(/^(openai:|gemini:)/, '')

              let displayName = rawId
              if (prefix === 'gemini:') {
                const modelInfo = availableGeminiModels.find(
                  (m) => m.name === rawId
                )
                if (modelInfo) displayName = modelInfo.displayName
              }

              const bgColor =
                prefix === 'openai:' ? 'bg-emerald-100' : 'bg-purple-100'
              const textColor =
                prefix === 'openai:' ? 'text-emerald-800' : 'text-purple-800'

              return (
                <span
                  key={modelId}
                  className={`${bgColor} ${textColor} text-xs px-2 py-1 rounded-full inline-flex items-center`}
                >
                  {displayName}
                  <button
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleModelSelection(modelId)
                    }}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* メインコンテンツ - 折りたたみ状態に応じて表示/非表示 */}
      {!isCollapsed && (
        <>
          {isLoading && (
            <div className="flex items-center py-4 justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
              <p className="ml-2 text-sm text-gray-500">
                モデルリストを読み込み中...
              </p>
            </div>
          )}

          {hasError && (
            <div className="text-sm text-red-600 space-y-1 bg-red-50 p-3 rounded">
              {errorOpenAI && <p>OpenAIモデル取得エラー: {errorOpenAI}</p>}
              {errorGemini && <p>Geminiモデル取得エラー: {errorGemini}</p>}
            </div>
          )}

          {!isLoading && !hasError && !hasModels && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              利用可能なモデルがありません。APIキーを確認してください。
            </div>
          )}

          {!isLoading && !hasError && hasModels && (
            <div className="space-y-4">
              {/* OpenAI モデル */}
              {availableOpenAIModels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">
                      OpenAI
                    </h3>
                  </div>
                  {renderModelTags(availableOpenAIModels, 'openai:')}
                </div>
              )}

              {/* Gemini モデル */}
              {availableGeminiModels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Gemini
                    </h3>
                  </div>
                  {renderModelTags(availableGeminiModels, 'gemini:')}
                </div>
              )}

              {/* 高度なモデル許可チェックボックス */}
              {availableGeminiModels.some((m) => m.isExperimentalOrPreview) && (
                <div className="mt-2 pt-3 border-t border-gray-200 flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowAdvancedModels}
                      onChange={handleAdvancedCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    <span className="ms-3 text-xs text-gray-600 font-medium">
                      高度なモデルを許可（★印のモデル）
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AiModelSelector

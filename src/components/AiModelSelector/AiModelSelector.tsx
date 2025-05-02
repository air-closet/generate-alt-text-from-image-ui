import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { setSelectedModels } from '../../store/slices/modelSlice'
import { AvailableGeminiModel } from '../../api/geminiApi' // 正しいインポート名
import { AvailableOpenAIModel } from '../../api/openaiApi'

// Props は不要になるので削除

const AiModelSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  // ストアからモデル関連の state を取得
  const {
    availableGemini,
    availableOpenAI,
    selected: selectedModels,
    loadingGemini,
    loadingOpenAI,
    errorGemini,
    errorOpenAI,
  } = useSelector((state: RootState) => state.models)

  // 折りたたみ状態 (ローカル UI state)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // モデル選択の切り替え処理 (Action を dispatch)
  const toggleModelSelection = (modelIdentifier: string) => {
    let updatedSelectedModels: string[]
    if (selectedModels.includes(modelIdentifier)) {
      updatedSelectedModels = selectedModels.filter(
        (id: string) => id !== modelIdentifier
      )
    } else {
      updatedSelectedModels = [...selectedModels, modelIdentifier]
    }
    dispatch(setSelectedModels(updatedSelectedModels))
  }

  // isLoading, hasError, hasModels をストアの state から計算
  const isLoading = loadingGemini === 'pending' || loadingOpenAI === 'pending'
  const hasError = !!(errorOpenAI || errorGemini)
  const hasModels = availableOpenAI.length > 0 || availableGemini.length > 0

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
          const isSelected = selectedModels.includes(identifier)

          const nonSelectedStyle =
            prefix === 'openai:'
              ? 'bg-white text-gray-800 hover:bg-emerald-50'
              : 'bg-white text-gray-800 hover:bg-purple-50'

          const selectedStyle =
            prefix === 'openai:'
              ? 'bg-white border-2 border-black text-gray-800 ring-2 ring-emerald-500'
              : 'bg-white border-2 border-black text-gray-800 ring-2 ring-purple-500'

          return (
            <button
              key={identifier}
              onClick={() => toggleModelSelection(identifier)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors relative cursor-pointer
                ${isSelected ? selectedStyle : nonSelectedStyle}
              }`}
            >
              {displayName}
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
      {/* ヘッダー */}
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

      {/* 選択中モデル (折りたたみ時) */}
      {isCollapsed && selectedModels.length > 0 && (
        <div className="mb-3 py-2 px-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
          <div className="flex flex-wrap gap-1">
            {selectedModels.map((modelId: string) => {
              const prefix = modelId.startsWith('openai:')
                ? 'openai:'
                : 'gemini:'
              const rawId = modelId.replace(/^(openai:|gemini:)/, '')

              let displayName = rawId
              let modelInfo:
                | AvailableGeminiModel
                | AvailableOpenAIModel
                | undefined
              if (prefix === 'gemini:') {
                modelInfo = availableGemini.find(
                  (m: AvailableGeminiModel) => m.name === rawId
                )
              } else {
                modelInfo = availableOpenAI.find(
                  (m: AvailableOpenAIModel) => m.id === rawId
                )
              }

              if (modelInfo) {
                if (prefix === 'gemini:') {
                  displayName = (modelInfo as AvailableGeminiModel).displayName
                } else {
                  displayName = (modelInfo as AvailableOpenAIModel).id
                }
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

      {/* メインコンテンツ */}
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
              {availableOpenAI.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">
                      OpenAI
                    </h3>
                  </div>
                  {renderModelTags(availableOpenAI, 'openai:')}
                </div>
              )}

              {/* Gemini モデル */}
              {availableGemini.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Gemini
                    </h3>
                  </div>
                  {renderModelTags(availableGemini, 'gemini:')}
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

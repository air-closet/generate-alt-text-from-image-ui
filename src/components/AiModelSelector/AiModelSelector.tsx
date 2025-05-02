import React from 'react'
import { AvailableModel as AvailableGeminiModel } from '../../hooks/useGemini' // ★ useGemini から型をインポート
import { AvailableOpenAIModel } from '../../hooks/useOpenAI' // OpenAIの型をインポート

// ★ AiModel enum は削除

interface AiModelSelectorProps {
  selectedModel: string // ★ プレフィックス付きモデル名 (例: "openai:gpt-4o", "gemini:gemini-1.5-flash-latest")
  setSelectedModel: (model: string) => void // ★ プレフィックス付きモデル名
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
  selectedModel,
  setSelectedModel,
  availableGeminiModels, // 名前変更
  availableOpenAIModels,
  isLoadingOpenAI, // 名前変更
  isLoadingGemini, // 名前変更
  errorOpenAI, // 名前変更
  errorGemini, // 名前変更
  allowAdvancedModels,
  setAllowAdvancedModels,
}) => {
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value)
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    setAllowAdvancedModels(isChecked)
    // チェックを外したら、もし現在選択中のモデルが高度なGeminiモデルなら、
    // 安全なデフォルトモデル (例: 最初の安全なGeminiモデル or 最初のOpenAIモデル) に戻す
    if (!isChecked && selectedModel.startsWith('gemini:')) {
      const currentModelName = selectedModel.replace(/^gemini:/, '')
      const currentSelectedModelData = availableGeminiModels.find(
        (m) => m.name === currentModelName
      )

      if (
        currentSelectedModelData &&
        currentSelectedModelData.isExperimentalOrPreview
      ) {
        // 安全なGeminiモデルを探す
        const safeGeminiModel = availableGeminiModels.find(
          (m) => !m.isExperimentalOrPreview
        )
        // 安全なOpenAIモデルを探す (最初のもの)
        const safeOpenAIModel = availableOpenAIModels[0]

        // 安全なGeminiがあればそれを、なければ最初のOpenAIを、それもなければ空文字列
        const newModel = safeGeminiModel
          ? `gemini:${safeGeminiModel.name}`
          : safeOpenAIModel
            ? `openai:${safeOpenAIModel.id}`
            : ''
        setSelectedModel(newModel)
      }
    }
  }

  const isLoading = isLoadingOpenAI || isLoadingGemini // 統合ローディング状態
  const hasModels =
    availableOpenAIModels.length > 0 || availableGeminiModels.length > 0

  return (
    <div className="mb-4">
      <label
        htmlFor="ai-model"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        AIモデルを選択
      </label>
      <select
        id="ai-model"
        value={selectedModel}
        onChange={handleModelChange}
        disabled={isLoading || (!hasModels && !errorOpenAI && !errorGemini)} // 条件更新
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {isLoading && <option value="">モデルを読み込み中...</option>}
        {!isLoading && !hasModels && (errorOpenAI || errorGemini) && (
          <option value="">モデル取得エラー</option> // エラー表示を統合
        )}
        {!isLoading && !hasModels && !errorOpenAI && !errorGemini && (
          <option value="" disabled>
            利用可能なモデルがありません (APIキーを確認)
          </option> // モデルなし表示
        )}

        {!isLoading && (
          <>
            {/* OpenAI Models */}
            {availableOpenAIModels.length > 0 && (
              <optgroup label="OpenAI">
                {availableOpenAIModels.map((model) => (
                  <option key={model.id} value={`openai:${model.id}`}>
                    {model.id} {/* OpenAI は id を表示 */}
                  </option>
                ))}
              </optgroup>
            )}

            {/* Gemini Models */}
            {availableGeminiModels.length > 0 && (
              <optgroup label="Gemini">
                {availableGeminiModels.map((model) => {
                  const isAdvanced = model.isExperimentalOrPreview
                  const isDisabled = isAdvanced && !allowAdvancedModels
                  let displaySuffix = ''
                  if (model.isExperimentalOrPreview) {
                    displaySuffix = ' (Preview/実験的)'
                  }

                  return (
                    <option
                      key={model.name}
                      value={`gemini:${model.name}`} // ★ プレフィックス追加
                      disabled={isDisabled}
                    >
                      {model.displayName}
                      {displaySuffix}
                    </option>
                  )
                })}
              </optgroup>
            )}
          </>
        )}
      </select>
      {/* エラーメッセージ表示 */}
      {!isLoading && (errorOpenAI || errorGemini) && (
        <p className="text-xs text-red-600 mt-1">
          {errorOpenAI && `OpenAI Error: ${errorOpenAI}`}
          {errorOpenAI && errorGemini && <br />}
          {errorGemini && `Gemini Error: ${errorGemini}`}
        </p>
      )}

      {/* 高度なモデル許可チェックボックス (Geminiモデルがある場合のみ表示) */}
      {!isLoading &&
        !errorGemini &&
        availableGeminiModels.some((m) => m.isExperimentalOrPreview) && ( // ★ 条件変更: プレビューモデルが存在する場合のみ
          <div className="mt-2 flex items-center">
            <input
              id="allow-advanced-models"
              name="allow-advanced-models"
              type="checkbox"
              checked={allowAdvancedModels}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="allow-advanced-models"
              className="ml-2 block text-sm text-gray-900"
            >
              高度なモデル（プレビュー/実験的）の使用を許可する (Gemini)
            </label>
          </div>
        )}
    </div>
  )
}

export default AiModelSelector

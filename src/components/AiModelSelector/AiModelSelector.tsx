import React from 'react'
import { AvailableModel } from '../../hooks/useGemini' // ★ useGemini から型をインポート

// ★ AiModel enum は削除

interface AiModelSelectorProps {
  selectedModel: string // ★ string 型に変更
  setSelectedModel: (model: string) => void // ★ string 型に変更
  availableModels: AvailableModel[] // ★ Gemini モデルのリストを受け取る
  isLoading: boolean // ★ モデルリスト取得中の状態
  error: string | null // ★ モデルリスト取得エラー
  allowAdvancedModels: boolean // 追加: 高度なモデルの使用許可フラグ
  setAllowAdvancedModels: (allow: boolean) => void // 追加: フラグ更新関数
}

const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
  availableModels,
  isLoading,
  error,
  allowAdvancedModels, // 追加
  setAllowAdvancedModels, // 追加
}) => {
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value)
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    setAllowAdvancedModels(isChecked)
    // チェックを外したら、もし現在選択中のモデルが高度なモデルなら、
    // 安全なデフォルトモデル (例: 最初のGeminiモデル or OpenAI) に戻す
    if (!isChecked) {
      const currentSelectedModelData = availableModels.find(
        (m) => m.name === selectedModel
      )
      const isOpenAiSelected = selectedModel === 'openai' // OpenAIは常に安全とみなす
      if (
        !isOpenAiSelected &&
        currentSelectedModelData &&
        currentSelectedModelData.isExperimentalOrPreview /* || currentSelectedModelData.isHighCost */ // isHighCostチェック削除
      ) {
        // 安全なモデルを探す (例: availableModels の最初か、'openai')
        const safeModel = availableModels.find(
          (m) => !m.isExperimentalOrPreview /* && !m.isHighCost */ // isHighCostチェック削除
        ) ?? { name: 'openai' }
        setSelectedModel(safeModel.name)
      }
    }
  }

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
        disabled={
          isLoading || (availableModels.length === 0 && !error && !isLoading)
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {isLoading && <option value="">モデルを読み込み中...</option>}
        {error && <option value="">モデル取得エラー: {error}</option>}
        {!isLoading && !error && (
          <>
            {/* OpenAI - 常に有効 */}
            <option value="openai">OpenAI (gpt-4o etc.)</option>

            {availableModels.length === 0 && !isLoading && (
              <option value="" disabled>
                Geminiモデルが見つかりません (APIキーを確認)
              </option>
            )}
            {availableModels.map((model) => {
              const isAdvanced =
                model.isExperimentalOrPreview /* || model.isHighCost */ // isHighCostチェック削除
              const isDisabled = isAdvanced && !allowAdvancedModels
              let displaySuffix = ''
              /*
              if (model.isExperimentalOrPreview && model.isHighCost) {
                displaySuffix = ' (Preview/高コスト)'
              } else if (model.isExperimentalOrPreview) {
              */
              if (model.isExperimentalOrPreview) {
                // isHighCostチェック削除
                displaySuffix = ' (Preview/実験的)'
                /*
              } else if (model.isHighCost) {
                displaySuffix = ' (高コスト)'
              }
              */
              }

              return (
                <option
                  key={model.name}
                  value={model.name}
                  disabled={isDisabled}
                >
                  {model.displayName}
                  {/* {` (${model.name.split('-')[1]})`}  モデルバージョン表示はdisplayNameに含まれることが多いので一旦削除 */}
                  {displaySuffix}
                </option>
              )
            })}
          </>
        )}
      </select>
      {/* エラーメッセージは select の下に移動 */}
      {error && !isLoading && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {/* 高度なモデル許可チェックボックス */}
      {!isLoading && !error && availableModels.length > 0 && (
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
            高度なモデル（プレビュー/実験的）の使用を許可する
          </label>
        </div>
      )}
    </div>
  )
}

export default AiModelSelector

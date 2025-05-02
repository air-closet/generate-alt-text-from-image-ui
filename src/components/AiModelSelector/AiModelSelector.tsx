import React from 'react'

// AIモデルの型定義
type SpecificGeminiModel =
  | 'gemini-1.5-flash-latest'
  | 'gemini-1.5-pro-latest'
  | 'gemini-2.5-pro' // 2.5 Pro (実験的)
  | 'gemini-2.5-flash' // 2.5 Flash (実験的) を追加
type AiModel =
  | 'openai' // GPT-4o など
  | SpecificGeminiModel

interface AiModelSelectorProps {
  selectedModel: AiModel
  setSelectedModel: (model: AiModel) => void
}

// モデルごとの追加情報（課金確認が必要かなど）
const modelInfo: Record<
  AiModel,
  { label: string; needsConfirmation?: boolean }
> = {
  openai: { label: 'OpenAI (GPT-4o etc.)' },
  'gemini-1.5-flash-latest': { label: 'Gemini 1.5 Flash (Latest)' },
  'gemini-1.5-pro-latest': {
    label: 'Gemini 1.5 Pro (Latest)',
    needsConfirmation: true, // 確認が必要なモデル
  },
  'gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash (Experimental)', // 実験的 Flash
    needsConfirmation: false, // Flash系は確認不要とする（デフォルトfalse）
  },
  'gemini-2.5-pro': {
    label: 'Gemini 2.5 Pro (Experimental)',
    needsConfirmation: true, // 確認が必要なモデル
  },
}

// 表示順序を定義 (オプション)
const modelOrder: AiModel[] = [
  'openai',
  'gemini-1.5-flash-latest',
  'gemini-2.5-flash', // 実験的 Flash を間に入れる
  'gemini-1.5-pro-latest',
  'gemini-2.5-pro',
]

const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor="aiModel"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        AIモデルを選択
      </label>
      <select
        id="aiModel"
        name="aiModel"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as AiModel)}
        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {modelOrder.map((value) => (
          <option key={value} value={value}>
            {modelInfo[value].label}
          </option>
        ))}
      </select>
    </div>
  )
}

export type { AiModel, SpecificGeminiModel }
export { modelInfo } // モデル情報を外部で使えるようにエクスポート
export default AiModelSelector

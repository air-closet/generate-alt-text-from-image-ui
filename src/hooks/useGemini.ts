import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import { useState, useCallback } from 'react'

// Data URL から MIME タイプと Base64 データを抽出するヘルパー
function fileToGenerativePart(dataUrl: string): {
  inlineData: { data: string; mimeType: string }
} {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) {
    throw new Error('Invalid data URL format')
  }
  const mimeType = match[1]
  const data = match[2]
  return {
    inlineData: {
      data,
      mimeType,
    },
  }
}

// REST API から取得するモデル情報の型 (ライブラリの型とは異なる可能性)
interface ApiModelInfo {
  name: string // 例: "models/gemini-1.5-pro-latest"
  displayName: string // 例: "Gemini 1.5 Pro"
  description: string
  version: string
  supportedGenerationMethods: string[]
  // 他にも必要な情報があれば追加
}

// フックが外部に返すモデル情報の型
export interface AvailableModel {
  name: string // generateContent に渡すモデル名 (通常 'models/' プレフィックスなし？要確認)
  displayName: string
  description: string
  version: string
}

interface UseGeminiProps {
  apiKey: string
}

interface GenerateAltTextOptions {
  prompt: string
  imageDataUrl: string
  model: string
}

const useGemini = ({ apiKey }: UseGeminiProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [listModelsError, setListModelsError] = useState<Error | null>(null)

  // モデルリスト取得関数 (fetch を使用)
  const listAvailableModels = useCallback(async (): Promise<
    AvailableModel[]
  > => {
    setListModelsError(null)
    if (!apiKey) {
      const err = new Error('API Key is required to list models via REST API.')
      setListModelsError(err)
      return []
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) // エラー詳細取得試行
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}. ${errorData?.error?.message ?? ''}`
        )
      }
      const data = await response.json()

      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Invalid response format when fetching models.')
      }

      // ★ ApiModelInfo 型としてアサーション
      const allModels: ApiModelInfo[] = data.models

      // フィルタリングとソート (型アサーションを安全に行う)
      const visionModels = allModels
        .filter(
          (m: ApiModelInfo) =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            (m.name?.includes('flash') ||
              m.name?.includes('pro') ||
              m.name?.includes('vision'))
        )
        .sort((a: ApiModelInfo, b: ApiModelInfo) =>
          (a.displayName ?? '').localeCompare(b.displayName ?? '')
        )

      // ★ generateContent で使うモデル名を確認 ('models/' を取るか？)
      // ここでは一旦 'models/' を削除してみる
      return visionModels.map((m: ApiModelInfo) => ({
        name: m.name.replace(/^models\//, ''), // 'models/' プレフィックスを削除
        displayName: m.displayName,
        description: m.description,
        version: m.version,
      }))
    } catch (err) {
      console.error('Error listing Gemini models via REST:', err)
      const fetchError =
        err instanceof Error ? err : new Error('Unknown error listing models')
      setListModelsError(fetchError)
      return []
    }
  }, [apiKey])

  const generateAltText = useCallback(
    async ({
      prompt,
      imageDataUrl,
      model, // ★ generateContent に渡すモデル名 (上記 listModels で 'models/' を削除したので、そのまま渡せるはず)
    }: GenerateAltTextOptions): Promise<string | null> => {
      setIsLoading(true)
      setError(null)
      if (!apiKey) {
        setError(new Error('Gemini API Key is not set.'))
        setIsLoading(false)
        return null
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        // ★ モデル名をそのまま渡す
        const generativeModel = genAI.getGenerativeModel({ model: model })
        const imagePart = fileToGenerativePart(imageDataUrl)
        const result = await generativeModel.generateContent([
          prompt,
          imagePart,
        ])
        const response = result.response
        const text = response.text()

        console.log('Gemini API Response Text:', text)
        setIsLoading(false)
        return text
      } catch (err) {
        console.error('Gemini API Error:', err)
        setError(
          err instanceof Error ? err : new Error('Unknown Gemini API error')
        )
        setIsLoading(false)
        return null
      }
    },
    [apiKey]
  )

  return {
    generateAltText,
    isLoading,
    error,
    listAvailableModels,
    listModelsError,
  }
}

export default useGemini

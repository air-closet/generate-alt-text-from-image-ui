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
  name: string // generateContent に渡すモデル名 (通常 'models/' プレフィックスなし)
  displayName: string
  description: string
  version: string
  isExperimentalOrPreview?: boolean // 追加: プレビュー/実験的フラグ
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
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // モデルリスト取得関数 (fetch を使用)
  const listAvailableModels = useCallback(async (): Promise<
    AvailableModel[]
  > => {
    setIsLoadingModels(true)
    setListModelsError(null)

    if (!apiKey) {
      const err = new Error('API Key is required to list models via REST API.')
      setListModelsError(err)
      setIsLoadingModels(false)
      return []
    }

    // モデルごとの追加情報 (例)
    // これはAPIレスポンスの 'name' (models/...) に基づいてキーを設定
    const modelMetadata: Record<
      string,
      { isExperimentalOrPreview?: boolean /* isHighCost?: boolean */ }
    > = {
      'models/gemini-2.5-pro-preview-03-25': {
        isExperimentalOrPreview: true /* isHighCost: true */,
      },
      'models/gemini-2.5-pro-exp-03-25': {
        isExperimentalOrPreview: true /* isHighCost: true */,
      },
      'models/gemini-2.5-flash-preview-04-17': {
        isExperimentalOrPreview: true /* isHighCost: true */,
      },
      'models/gemini-2.0-flash': {
        isExperimentalOrPreview: false /* isHighCost: false */,
      },
      'models/gemini-2.0-flash-exp': {
        isExperimentalOrPreview: true /* isHighCost: false */,
      },
      'models/gemini-1.5-pro-latest': {
        isExperimentalOrPreview: false /* isHighCost: true */,
      },
      'models/gemini-1.5-pro': {
        isExperimentalOrPreview: false /* isHighCost: true */,
      },
      'models/gemini-1.5-flash-latest': {
        isExperimentalOrPreview: false /* isHighCost: false */,
      },
      'models/gemini-1.5-flash': {
        isExperimentalOrPreview: false /* isHighCost: false */,
      },
      // APIから取得した他のモデル名も必要に応じて追加
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

      const allModels: ApiModelInfo[] = data.models

      // フィルタリングとソート (generateContent対応、名前順)
      const visionModels = allModels.filter((m: ApiModelInfo) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )

      // ★ 表示名で重複を除外する処理を追加
      const uniqueModelsByName: ApiModelInfo[] = []
      const seenDisplayNames = new Set<string>()

      for (const model of visionModels) {
        // visionModels は filter 後の配列
        if (model.displayName && !seenDisplayNames.has(model.displayName)) {
          uniqueModelsByName.push(model)
          seenDisplayNames.add(model.displayName)
        } else if (!model.displayName) {
          // displayName がないモデルは念のため追加しておく (通常はないはず)
          uniqueModelsByName.push(model)
        }
      }

      // ★ 重複除外後のリストをソートする
      const sortedUniqueModels = uniqueModelsByName.sort(
        (a: ApiModelInfo, b: ApiModelInfo) =>
          (a.displayName ?? '').localeCompare(b.displayName ?? '')
      )

      // generateContent で使うモデル名は 'models/' プレフィックスを削除し、メタデータを付与
      const availableModels = sortedUniqueModels.map((m: ApiModelInfo) => {
        // ★ sortedUniqueModels を使う
        const metadata = modelMetadata[m.name] ?? {} // APIレスポンスの name でメタデータを検索
        // プレビュー/実験フラグ判定 (メタデータ優先、なければ名前に含むか)
        const isExpOrPreview =
          metadata.isExperimentalOrPreview ??
          m.name.includes('preview') ??
          m.name.includes('exp')
        // 高コストフラグ判定は削除
        /*
        const isCostly =
          metadata.isHighCost ??
          ((m.name.includes('pro') && !m.name.includes('flash')) ||
            m.name.includes('2.5'))
        */

        return {
          name: m.name.replace(/^models\//, ''), // 'models/' プレフィックスを削除
          displayName: m.displayName,
          description: m.description,
          version: m.version,
          isExperimentalOrPreview: isExpOrPreview,
          // isHighCost: isCostly, // 削除
        }
      })

      setIsLoadingModels(false)
      return availableModels
    } catch (err) {
      console.error('Error listing Gemini models via REST:', err)
      const fetchError =
        err instanceof Error ? err : new Error('Unknown error listing models')
      setListModelsError(fetchError)
      setIsLoadingModels(false)
      return []
    }
  }, [apiKey])

  const generateAltText = useCallback(
    async ({
      prompt,
      imageDataUrl,
      model,
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

        // セーフティ設定をここに移動
        const safetySettings = [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ]

        // getGenerativeModel に safetySettings を渡す
        const generativeModel = genAI.getGenerativeModel({
          model: model,
          safetySettings,
        })
        const imagePart = fileToGenerativePart(imageDataUrl)

        // generateContent の呼び出しをシンプルにする
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
    listAvailableModels,
    isLoading: isLoading,
    error: error,
    isLoadingModels: isLoadingModels,
    listModelsError: listModelsError,
  }
}

export default useGemini

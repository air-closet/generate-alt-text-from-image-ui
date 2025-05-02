import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

// REST API から取得するモデル情報の型
interface ApiModelInfo {
  name: string
  displayName: string
  description: string
  version: string
  supportedGenerationMethods: string[]
}

// 外部に公開するモデル情報の型
export interface AvailableGeminiModel {
  name: string
  displayName: string
  description: string
  version: string
  isExperimentalOrPreview?: boolean
}

// --- API Functions ---

// モデルごとのメタデータ
const modelMetadata: Record<string, { isExperimentalOrPreview?: boolean }> = {
  'models/gemini-2.5-pro-preview-03-25': { isExperimentalOrPreview: true },
  'models/gemini-2.5-pro-exp-03-25': { isExperimentalOrPreview: true },
  'models/gemini-2.5-flash-preview-04-17': { isExperimentalOrPreview: true },
  'models/gemini-2.0-flash': { isExperimentalOrPreview: false },
  'models/gemini-2.0-flash-exp': { isExperimentalOrPreview: true },
  'models/gemini-1.5-pro-latest': { isExperimentalOrPreview: false },
  'models/gemini-1.5-pro': { isExperimentalOrPreview: false },
  'models/gemini-1.5-flash-latest': { isExperimentalOrPreview: false },
  'models/gemini-1.5-flash': { isExperimentalOrPreview: false },
}

// Geminiモデルリスト取得 (fetch を使用)
export const listAvailableGeminiModels = async (
  apiKey: string
): Promise<AvailableGeminiModel[]> => {
  if (!apiKey) {
    throw new Error('API Key is required to list models via REST API.')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}. ${errorData?.error?.message ?? ''}`
      )
    }
    const data = await response.json()

    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('Invalid response format when fetching models.')
    }

    const allModels: ApiModelInfo[] = data.models

    // フィルタリング (generateContent対応)
    const visionModels = allModels.filter((m) =>
      m.supportedGenerationMethods?.includes('generateContent')
    )

    // 表示名で重複を除外
    const uniqueModelsByName: ApiModelInfo[] = []
    const seenDisplayNames = new Set<string>()
    for (const model of visionModels) {
      if (model.displayName && !seenDisplayNames.has(model.displayName)) {
        uniqueModelsByName.push(model)
        seenDisplayNames.add(model.displayName)
      } else if (!model.displayName) {
        uniqueModelsByName.push(model)
      }
    }

    // ソートして整形
    const sortedUniqueModels = uniqueModelsByName.sort((a, b) =>
      (a.displayName ?? '').localeCompare(b.displayName ?? '')
    )

    const availableModels = sortedUniqueModels.map((m) => {
      const metadata = modelMetadata[m.name] ?? {}
      const isExpOrPreview =
        metadata.isExperimentalOrPreview ??
        m.name.includes('preview') ??
        m.name.includes('exp')

      return {
        name: m.name.replace(/^models\//, ''),
        displayName: m.displayName,
        description: m.description,
        version: m.version,
        isExperimentalOrPreview: isExpOrPreview,
      }
    })

    return availableModels
  } catch (err) {
    console.error('Error listing Gemini models via REST:', err)
    throw err // エラーを再スローして Thunk でキャッチ
  }
}

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
  return { inlineData: { data, mimeType } }
}

interface GenerateAltTextOptions {
  apiKey: string
  prompt: string
  imageDataUrl: string
  model: string
}

// Gemini で Alt テキスト生成
export const generateGeminiAltText = async ({
  apiKey,
  prompt,
  imageDataUrl,
  model,
}: GenerateAltTextOptions): Promise<string> => {
  if (!apiKey) {
    throw new Error('Gemini API Key is not set.')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
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
    const generativeModel = genAI.getGenerativeModel({ model, safetySettings })
    const imagePart = fileToGenerativePart(imageDataUrl)

    const result = await generativeModel.generateContent([prompt, imagePart])
    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error('Geminiからの応答が空でした。')
    }
    console.log('Gemini API Response Text:', text)
    return text
  } catch (err) {
    console.error('Gemini API Error:', err)
    throw err // エラーを再スロー
  }
}

import OpenAI from 'openai'

// 外部に公開するモデル情報の型
export interface AvailableOpenAIModel {
  id: string
}

// ハードコードする Vision 対応モデル ID の部分文字列リスト
const KNOWN_VISION_MODEL_SUBSTRINGS = ['gpt-4o', 'gpt-4-turbo', 'gpt-4.1']

// --- API Functions ---

// OpenAIモデルリスト取得
export const listAvailableOpenAIModels = async (
  apiKey: string
): Promise<AvailableOpenAIModel[]> => {
  if (!apiKey) {
    throw new Error('OpenAI API Key is required to list models.')
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await openai.models.list()
    console.log('OpenAI Models List Response:', response)

    const initialVisionModels = response.data.filter((model) =>
      KNOWN_VISION_MODEL_SUBSTRINGS.some((substring) =>
        model.id.includes(substring)
      )
    )

    // 日付付きバージョンを除外
    const modelIds = new Set(initialVisionModels.map((m) => m.id))
    const finalModelIds = new Set(modelIds)
    const dateRegex = /-(\d{4}-\d{2}-\d{2})$/
    initialVisionModels.forEach((model) => {
      const match = model.id.match(dateRegex)
      if (match) {
        const baseName = model.id.substring(0, match.index)
        if (modelIds.has(baseName)) {
          finalModelIds.delete(model.id)
        }
      }
    })

    // 最終的なモデルリストを作成し、ソート
    const finalVisionModels = initialVisionModels
      .filter((model) => finalModelIds.has(model.id))
      .sort((a, b) => a.id.localeCompare(b.id))

    console.log(
      'Filtered OpenAI Vision Models (No Dated Duplicates):',
      finalVisionModels
    )
    return finalVisionModels.map((model) => ({ id: model.id }))
  } catch (err) {
    console.error('Error listing OpenAI models:', err)
    throw err // エラーを再スロー
  }
}

interface GenerateAltTextOptions {
  apiKey: string
  prompt: string
  imageDataUrl: string
  model: string
}

// OpenAI で Alt テキスト生成
export const generateOpenAIAltText = async ({
  apiKey,
  prompt,
  imageDataUrl,
  model,
}: GenerateAltTextOptions): Promise<string> => {
  if (!apiKey) {
    throw new Error('OpenAI API Key is not set.')
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    console.log('OpenAI API Response:', response)
    const altText = response.choices[0]?.message?.content

    if (!altText) {
      console.error('OpenAI response content is empty:', response)
      throw new Error('OpenAIからの応答が空でした。')
    }

    return altText
  } catch (err) {
    console.error('OpenAI API Error:', err)
    throw err // エラーを再スロー
  }
}

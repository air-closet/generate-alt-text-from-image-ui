import { useState, useCallback } from 'react'
import OpenAI from 'openai' // ★ インポートを有効化

// ★ フックが返すモデル情報の型を追加
export interface AvailableOpenAIModel {
  id: string // OpenAIのモデルID (例: "gpt-4o")
  // 必要に応じて他の情報 (displayNameなど、APIにあれば)
}

interface UseOpenAIProps {
  apiKey: string
}

interface GenerateAltTextOptions {
  prompt: string
  imageDataUrl: string // Base64 Data URL
  // model: string; // 必要に応じてモデル指定を追加
}

// ★ ハードコードする Vision 対応モデル ID の部分文字列リスト
const KNOWN_VISION_MODEL_SUBSTRINGS = [
  'gpt-4o', // gpt-4o, gpt-4o-mini など
  'gpt-4-turbo', // gpt-4-turbo, gpt-4-turbo-2024-04-09 など
  'gpt-4.1', // ★ gpt-4.1, gpt-4.1-nano などを追加
  // 'o4-mini', // ★ o4-mini を追加
  // 'gpt-4-vision', // gpt-4-vision-preview は turbo に含まれることが多い
  // 'o1', // 必要に応じて追加 (JSONでは image_content あり)
  // 'o3', // 必要に応じて追加 (JSONでは image_content あり)
  // 'gpt-4.5', // 必要に応じて追加 (JSONでは image_content あり)
]

const useOpenAI = ({ apiKey }: UseOpenAIProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  // ★ モデルリスト関連のstateを追加
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [listModelsError, setListModelsError] = useState<Error | null>(null)

  // ★ モデルリスト取得関数を修正 (ハードコード版)
  const listAvailableModels = useCallback(async (): Promise<
    AvailableOpenAIModel[]
  > => {
    setIsLoadingModels(true)
    setListModelsError(null)

    // 1. OpenAI API Key のチェック
    if (!apiKey) {
      setListModelsError(
        new Error('OpenAI API Key is required to list models.')
      )
      setIsLoadingModels(false)
      return []
    }

    // 2. OpenAI からモデルリストを取得
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    try {
      const response = await openai.models.list()
      console.log('OpenAI Models List Response:', response)

      // 3. ハードコードしたリストでフィルタリング
      const initialVisionModels = response.data.filter((model) =>
        KNOWN_VISION_MODEL_SUBSTRINGS.some((substring) =>
          model.id.includes(substring)
        )
      )

      // 4. 日付付きバージョンを除外する処理
      const modelIds = new Set(initialVisionModels.map((m) => m.id))
      const finalModelIds = new Set(modelIds)
      const dateRegex = /-(\d{4}-\d{2}-\d{2})$/

      initialVisionModels.forEach((model) => {
        const match = model.id.match(dateRegex)
        if (match) {
          // 日付部分を除いたベース名を取得 (例: gpt-4-turbo-2024-04-09 -> gpt-4-turbo)
          const baseName = model.id.substring(0, match.index)
          // ベース名もリストに存在するか確認
          if (modelIds.has(baseName)) {
            // ベース名が存在すれば、日付付きバージョンを最終リストから削除
            finalModelIds.delete(model.id)
          }
        }
      })

      // 最終的なモデルリストを作成し、ソート
      const finalVisionModels = initialVisionModels
        .filter((model) => finalModelIds.has(model.id))
        .sort((a, b) => a.id.localeCompare(b.id)) // IDでソート

      console.log(
        'Filtered OpenAI Vision Models (No Dated Duplicates):',
        finalVisionModels
      )
      setIsLoadingModels(false)
      return finalVisionModels.map((model) => ({ id: model.id }))
    } catch (err) {
      console.error('Error listing OpenAI models:', err)
      const fetchError =
        err instanceof Error
          ? err
          : new Error('Unknown error listing OpenAI models')
      setListModelsError(fetchError)
      setIsLoadingModels(false)
      return []
    }
  }, [apiKey])

  const generateAltText = useCallback(
    async ({
      prompt,
      imageDataUrl,
      model, // ★ model 引数を追加
    }: GenerateAltTextOptions & { model: string }): Promise<string | null> => {
      // ★ 型にも model を追加
      setIsLoading(true)
      setError(null)

      if (!apiKey) {
        setError(new Error('OpenAI API Key is not set.'))
        setIsLoading(false)
        return null
      }

      console.log('OpenAI Hook - Prompt:', prompt)
      console.log(
        'OpenAI Hook - Image Data URL (length):',
        imageDataUrl?.length
      )

      // --- OpenAI API 呼び出し実装 ---
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
      try {
        const response = await openai.chat.completions.create({
          model: model, // ★ 引数で受け取ったモデルを使用
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    // data URL をそのまま渡す
                    url: imageDataUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 300, // 必要に応じて調整
        })

        console.log('OpenAI API Response:', response)

        const altText = response.choices[0]?.message?.content

        if (!altText) {
          console.error('OpenAI response content is empty:', response)
          throw new Error('OpenAIからの応答が空でした。')
        }

        setIsLoading(false)
        return altText
      } catch (err) {
        console.error('OpenAI API Error:', err)
        setError(
          err instanceof Error ? err : new Error('Unknown OpenAI API error')
        )
        setIsLoading(false)
        return null
      }
      // --- ここまで実装 ---

      /* // ダミーの応答は削除
      await new Promise((resolve) => setTimeout(resolve, 500))
      const dummyText = `(OpenAI 仮実装) ${prompt.substring(0, 20)}...`
      setIsLoading(false)
      // setError(new Error('OpenAI API is not implemented yet.')); // 必要ならエラー表示
      return dummyText
      */
    },
    [apiKey]
  )

  // ★ フックの戻り値にモデル関連のものを追加
  return {
    generateAltText,
    isLoading,
    error,
    listAvailableModels,
    isLoadingModels,
    listModelsError,
  }
}

export default useOpenAI

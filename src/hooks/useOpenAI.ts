import OpenAI from 'openai'
import { useState, useCallback } from 'react'

// APIレスポンスからaltテキストを抽出するヘルパー関数 (仮)
// 実際のレスポンス構造に合わせて調整が必要
const extractAltText = (
  response: OpenAI.Chat.Completions.ChatCompletion
): string | null => {
  // シンプルに最初の choices の message content を返す想定
  return response.choices[0]?.message?.content ?? null
}

interface UseOpenAIProps {
  apiKey: string
}

interface GenerateAltTextOptions {
  prompt: string
  imageDataUrl: string
  model?: string // デフォルトは gpt-4-vision-preview
  maxTokens?: number
}

const useOpenAI = ({ apiKey }: UseOpenAIProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateAltText = useCallback(
    async ({
      prompt,
      imageDataUrl,
      model = 'gpt-4-vision-preview',
      maxTokens = 100,
    }: GenerateAltTextOptions): Promise<string | null> => {
      setIsLoading(true)
      setError(null)

      if (!apiKey) {
        setError(new Error('OpenAI API Key is not set.'))
        setIsLoading(false)
        return null
      }

      // Data URL から base64 部分を削除 (OpenAI API は URL 形式をそのまま受け付けるため)
      // const base64Image = imageDataUrl.split(','')[1];

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // ブラウザからの呼び出しを許可 (本来は非推奨)
      })

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
                    // base64よりURL形式の方が推奨されている
                    url: imageDataUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: maxTokens,
        })

        console.log('OpenAI API Response:', response)
        const altText = extractAltText(response)
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
    },
    [apiKey]
  )

  return { generateAltText, isLoading, error }
}

export default useOpenAI

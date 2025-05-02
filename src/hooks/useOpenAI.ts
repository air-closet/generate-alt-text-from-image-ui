import { useState, useCallback } from 'react'

// import OpenAI from 'openai'; // 必要になったらインポート

interface UseOpenAIProps {
  apiKey: string
}

interface GenerateAltTextOptions {
  prompt: string
  imageDataUrl: string // Base64 Data URL
  // model: string; // 必要に応じてモデル指定を追加
}

const useOpenAI = ({ apiKey }: UseOpenAIProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateAltText = useCallback(
    async ({
      prompt,
      imageDataUrl,
    }: GenerateAltTextOptions): Promise<string | null> => {
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

      // --- OpenAI API 呼び出し実装 (TODO) ---
      // const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      // try {
      //   const response = await openai.chat.completions.create({
      //     model: "gpt-4o", // または他のvision対応モデル
      //     messages: [
      //       {
      //         role: "user",
      //         content: [
      //           { type: "text", text: prompt },
      //           {
      //             type: "image_url",
      //             image_url: {
      //               url: imageDataUrl,
      //             },
      //           },
      //         ],
      //       },
      //     ],
      //     max_tokens: 300,
      //   });
      //   const altText = response.choices[0]?.message?.content;
      //   setIsLoading(false);
      //   return altText || null;
      // } catch (err) {
      //   console.error('OpenAI API Error:', err);
      //   setError(err instanceof Error ? err : new Error('Unknown OpenAI API error'));
      //   setIsLoading(false);
      //   return null;
      // }
      // --- ここまで TODO ---

      // ダミーの応答 (仮)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const dummyText = `(OpenAI 仮実装) ${prompt.substring(0, 20)}...`
      setIsLoading(false)
      // setError(new Error('OpenAI API is not implemented yet.')); // 必要ならエラー表示
      return dummyText
    },
    [apiKey]
  )

  return { generateAltText, isLoading, error }
}

export default useOpenAI

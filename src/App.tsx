import React, { useState, useEffect } from 'react'
import ImageUploader from './components/ImageUploader/ImageUploader'
import ApiKeyInput from './components/ApiKeyInput/ApiKeyInput'
import AiModelSelector from './components/AiModelSelector/AiModelSelector'
import PromptInput from './components/PromptInput/PromptInput'
import GenerateButton from './components/GenerateButton/GenerateButton'
import ResultDisplay from './components/ResultDisplay/ResultDisplay'
import useOpenAI, { AvailableOpenAIModel } from './hooks/useOpenAI'
import useGemini, {
  AvailableModel as AvailableGeminiModel,
} from './hooks/useGemini'
import './App.css'

// モデル選択肢の値のプレフィックス
const OPENAI_PREFIX = 'openai:'
const GEMINI_PREFIX = 'gemini:'

function App() {
  // 画像関連 state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)

  // API/モデル設定 state
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [saveOpenaiKey, setSaveOpenaiKey] = useState(false)
  const [saveGeminiKey, setSaveGeminiKey] = useState(false)
  const [prompt, setPrompt] = useState(
    'この画像のaltテキストを生成してください。\nその際は<generated-alt-text>タグで囲んで出力してください。\n\n# 出力例\n<generated-alt-text>\n美しい女性のビューティーポートレート\n</generated-alt-text>'
  )

  // ★ モデル関連 state (変更あり)
  const [availableGeminiModels, setAvailableGeminiModels] = useState<
    AvailableGeminiModel[]
  >([])
  const [availableOpenAIModels, setAvailableOpenAIModels] = useState<
    AvailableOpenAIModel[]
  >([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [allowAdvancedModels, setAllowAdvancedModels] = useState(false)

  // 結果/状態 state
  const [generatedAltText, setGeneratedAltText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // ★ カスタムフックの準備 (変更あり)
  const {
    generateAltText: generateWithOpenAI,
    isLoading: isLoadingOpenAI,
    error: errorOpenAI,
    listAvailableModels: listAvailableOpenAIModels,
    isLoadingModels: isLoadingOpenAIModels, // ★ フックから直接使う
    listModelsError: listOpenAIModelsError, // ★ フックから直接使う
  } = useOpenAI({ apiKey: openaiApiKey })
  const {
    generateAltText: generateWithGemini,
    isLoading: isLoadingGemini,
    error: errorGemini,
    listAvailableModels: listAvailableGeminiModels,
    isLoadingModels: isLoadingGeminiModels, // ★ フックから直接使う
    listModelsError: listGeminiModelsError, // ★ フックから直接使う
  } = useGemini({ apiKey: geminiApiKey })

  // ★ モデルリスト取得状態の統合 -> 各フックから直接 isLoading*Models を使うので不要
  /*
  useEffect(() => {
    setIsLoadingModels(isLoadingGeminiModels || isLoadingOpenAIModels)
  }, [isLoadingGeminiModels, isLoadingOpenAIModels])
  */

  // ★ モデル取得エラーの統合 -> 各フックから直接 list*ModelsError を使うので不要
  /*
  useEffect(() => {
    let combinedError: string | null = null
    if (listGeminiModelsError) {
      combinedError = `Geminiモデル取得エラー: ${listGeminiModelsError.message}`
    }
    if (listOpenAIModelsError) {
      if (combinedError) combinedError += '; '
      combinedError += `OpenAIモデル取得エラー: ${listOpenAIModelsError.message}`
    }
    setModelFetchError(combinedError)
  }, [listGeminiModelsError, listOpenAIModelsError])
  */

  // ★ Gemini モデルリスト取得 useEffect (修正)
  useEffect(() => {
    let isMounted = true // アンマウント時の不要なstate更新を防ぐ
    const fetchGeminiModels = async () => {
      if (geminiApiKey) {
        const models = await listAvailableGeminiModels()
        if (isMounted) {
          setAvailableGeminiModels(models)
          // Geminiが取得でき、かつ現在何も選択されていない場合、デフォルトを設定
          if (models.length > 0) {
            setSelectedModel((prevSelectedModel) => {
              if (!prevSelectedModel) {
                const safeModel =
                  models.find((m) => !m.isExperimentalOrPreview) ?? models[0]
                return GEMINI_PREFIX + safeModel.name
              } else {
                return prevSelectedModel // 既に選択があれば維持
              }
            })
          }
        }
      } else {
        if (isMounted) {
          setAvailableGeminiModels([])
          setSelectedModel((prevSelectedModel) => {
            if (prevSelectedModel.startsWith(GEMINI_PREFIX)) {
              return '' // 単純にリセットする
            }
            return prevSelectedModel
          })
        }
      }
    }
    fetchGeminiModels()
    return () => {
      isMounted = false
    }
  }, [geminiApiKey, listAvailableGeminiModels]) // ★ availableOpenAIModels を削除

  // ★ OpenAI モデルリスト取得 useEffect (修正)
  useEffect(() => {
    let isMounted = true
    const fetchOpenAIModels = async () => {
      if (openaiApiKey) {
        const models = await listAvailableOpenAIModels()
        if (isMounted) {
          setAvailableOpenAIModels(models)
          // OpenAIが取得でき、かつ現在何も選択されていない場合、デフォルトを設定
          if (models.length > 0) {
            setSelectedModel((prevSelectedModel) => {
              if (!prevSelectedModel) {
                const defaultModel =
                  models.find((m) => m.id === 'gpt-4o') ?? models[0]
                return OPENAI_PREFIX + defaultModel.id
              } else {
                return prevSelectedModel // 既に選択があれば維持
              }
            })
          }
        }
      } else {
        if (isMounted) {
          setAvailableOpenAIModels([])
          // もし選択中のモデルがOpenAIだったらリセット (Geminiがあればそれに切り替え)
          setSelectedModel((prevSelectedModel) => {
            if (prevSelectedModel.startsWith(OPENAI_PREFIX)) {
              // ★ Geminiリストに依存しないように修正
              // const safeGemini =
              //   availableGeminiModels.find((m) => !m.isExperimentalOrPreview) ??
              //   availableGeminiModels[0]
              // return safeGemini ? GEMINI_PREFIX + safeGemini.name : ''
              return '' // 単純にリセットする
            }
            return prevSelectedModel
          })
        }
      }
    }
    fetchOpenAIModels()
    return () => {
      isMounted = false
    }
  }, [openaiApiKey, listAvailableOpenAIModels]) // ★ availableGeminiModels を削除

  // ★ 生成APIのローディング/エラー状態監視 (修正)
  useEffect(() => {
    if (selectedModel.startsWith(OPENAI_PREFIX)) {
      setIsLoading(isLoadingOpenAI) // API生成時のローディング
      setApiError(errorOpenAI ? `OpenAI Error: ${errorOpenAI.message}` : null)
    } else if (selectedModel.startsWith(GEMINI_PREFIX)) {
      setIsLoading(isLoadingGemini) // API生成時のローディング
      setApiError(errorGemini ? `Gemini Error: ${errorGemini.message}` : null)
    } else {
      setIsLoading(false)
      // APIキー未入力などでモデルが選択できない場合のエラーは apiError には設定しない
      // setApiError(null) // 生成ボタン押下時にリセットするのでここでは不要
    }
  }, [
    selectedModel,
    isLoadingOpenAI,
    errorOpenAI,
    isLoadingGemini,
    errorGemini,
  ])

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file)
    setImageDataUrl(dataUrl)
    setGeneratedAltText(null)
    setApiError(null)
    console.log('Uploaded file:', file.name)
  }

  // ★ handleGenerate 関数 (修正)
  const handleGenerate = async () => {
    if (!uploadedFile || !imageDataUrl) {
      setApiError('画像をアップロードしてください。')
      return
    }
    if (!selectedModel) {
      setApiError('モデルを選択してください。')
      return
    }

    setApiError(null)
    setGeneratedAltText(null)

    try {
      let altText: string | null = null

      if (selectedModel.startsWith(OPENAI_PREFIX)) {
        if (!openaiApiKey) {
          setApiError('OpenAI API キーを入力してください。')
          return
        }
        const modelId = selectedModel.substring(OPENAI_PREFIX.length)
        altText = await generateWithOpenAI({
          prompt,
          imageDataUrl,
          model: modelId,
        })
      } else if (selectedModel.startsWith(GEMINI_PREFIX)) {
        if (!geminiApiKey) {
          setApiError('Gemini API キーを入力してください。')
          return
        }
        const modelName = selectedModel.substring(GEMINI_PREFIX.length)

        // ★ ここで選択中のGeminiモデル情報を再取得 (APIキー変更などでリストが変わる可能性があるため)
        const currentGeminiModels = await listAvailableGeminiModels() // 再取得
        const selectedGeminiInfo = currentGeminiModels.find(
          (m) => m.name === modelName
        )

        // プレビュー/実験的モデルのチェック
        if (
          selectedGeminiInfo && // モデル情報が見つかった場合のみチェック
          selectedGeminiInfo.isExperimentalOrPreview &&
          !allowAdvancedModels
        ) {
          setApiError(
            '許可されていない高度なモデルが選択されています。チェックボックスをオンにしてください。'
          )
          return
        }
        // ★ 再取得したリストに選択中のモデルが存在しない場合のエラーハンドリングを追加
        if (!selectedGeminiInfo && currentGeminiModels.length > 0) {
          setApiError(
            '選択中のGeminiモデルが見つかりませんでした。モデルを再選択してください。'
          )
          return
        }

        altText = await generateWithGemini({
          prompt,
          imageDataUrl,
          model: modelName,
        })
      } else {
        setApiError('有効なモデルが選択されていません。')
        return
      }

      if (altText) {
        setGeneratedAltText(altText)
        // TODO: 履歴保存処理
      } else {
        // エラーは useEffect で監視しているので、ここでは特に何もしない
        // if (!apiError) {
        //   setApiError('AIからの応答がありませんでした。')
        // }
      }
    } catch (err) {
      console.error('Error in handleGenerate:', err)
      // useEffect でのエラー設定を待つため、ここでは設定しない方が良い場合がある
      // if (!apiError) {
      //  setApiError('生成処理中に予期せぬエラーが発生しました。')
      // }
    }
  }

  // ★ AiModelSelectorに渡すエラー文字列を作成するヘルパー
  const getModelErrorString = (error: Error | null): string | null =>
    error ? error.message : null

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          画像Altテキスト生成UI
        </h1>

        {/* モデル取得エラー表示は AiModelSelector 内で行うので削除 */}
        {/* {modelFetchError && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p>{modelFetchError}</p>
          </div>
        )} */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ApiKeyInput
            apiKey={openaiApiKey}
            setApiKey={setOpenaiApiKey}
            saveApiKey={saveOpenaiKey}
            setSaveApiKey={setSaveOpenaiKey}
            serviceName="OpenAI"
          />
          <ApiKeyInput
            apiKey={geminiApiKey}
            setApiKey={setGeminiApiKey}
            saveApiKey={saveGeminiKey}
            setSaveApiKey={setSaveGeminiKey}
            serviceName="Gemini"
          />
        </div>

        <ImageUploader onImageUpload={handleImageUpload} />

        <div className="mt-6">
          {' '}
          {/* マージントップを追加 */}
          <AiModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableGeminiModels={availableGeminiModels}
            availableOpenAIModels={availableOpenAIModels}
            isLoadingOpenAI={isLoadingOpenAIModels}
            isLoadingGemini={isLoadingGeminiModels}
            errorOpenAI={getModelErrorString(listOpenAIModelsError)}
            errorGemini={getModelErrorString(listGeminiModelsError)}
            allowAdvancedModels={allowAdvancedModels}
            setAllowAdvancedModels={setAllowAdvancedModels}
          />
          <PromptInput prompt={prompt} setPrompt={setPrompt} />
          <GenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!selectedModel || !imageDataUrl || isLoading}
          />
          <ResultDisplay result={generatedAltText} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default App

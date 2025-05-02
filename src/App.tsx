import React, { useState, useEffect } from 'react'
import ImageUploader from './components/ImageUploader/ImageUploader'
import ApiKeyInput from './components/ApiKeyInput/ApiKeyInput'
import AiModelSelector /* AiModel 型は削除 */ from './components/AiModelSelector/AiModelSelector'
import PromptInput from './components/PromptInput/PromptInput'
import GenerateButton from './components/GenerateButton/GenerateButton'
import ResultDisplay from './components/ResultDisplay/ResultDisplay'
import useOpenAI from './hooks/useOpenAI' // ★ OpenAI フックをインポート
import useGemini, { AvailableModel } from './hooks/useGemini' // ★ Gemini フックをインポート
import './App.css'

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

  // ★ モデル関連 state (元に戻す)
  const [availableGeminiModels, setAvailableGeminiModels] = useState<
    AvailableModel[]
  >([])
  const [selectedModel, setSelectedModel] = useState<string>('') // ★ string 型のみに
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelFetchError, setModelFetchError] = useState<string | null>(null)
  const [allowAdvancedModels, setAllowAdvancedModels] = useState(false)

  // 結果/状態 state
  const [generatedAltText, setGeneratedAltText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // ★ カスタムフックの準備 (元に戻す)
  const {
    generateAltText: generateWithOpenAI,
    isLoading: isLoadingOpenAI,
    error: errorOpenAI,
  } = useOpenAI({ apiKey: openaiApiKey })
  const {
    generateAltText: generateWithGemini,
    isLoading: isLoadingGemini,
    error: errorGemini,
    listAvailableModels,
    listModelsError,
  } = useGemini({ apiKey: geminiApiKey })

  // ★ Gemini API キーが変更されたらモデルリストを再取得 (元に戻す)
  useEffect(() => {
    const fetchModels = async () => {
      if (geminiApiKey) {
        setIsLoadingModels(true)
        setModelFetchError(null)
        setAvailableGeminiModels([]) // リストをクリア
        setSelectedModel('') // 選択をリセット

        const models = await listAvailableModels()
        setAvailableGeminiModels(models)
        if (models.length > 0) {
          // デフォルト選択肢を設定 (例: Flash 最新版があればそれを)
          const defaultModel =
            models.find((m) => m.name === 'gemini-1.5-flash-latest') ??
            models[0]
          setSelectedModel(defaultModel.name)
        }
        setIsLoadingModels(false)
      } else {
        // APIキーがなければリストを空にする
        setAvailableGeminiModels([])
        setSelectedModel('')
      }
    }
    fetchModels()
  }, [geminiApiKey, listAvailableModels])

  // ★ listModels のエラーを監視 (元に戻す)
  useEffect(() => {
    if (listModelsError) {
      setModelFetchError(
        `モデルリストの取得に失敗しました: ${listModelsError.message}`
      )
    }
  }, [listModelsError])

  // ★ 生成APIのローディング/エラー状態を監視 (元に戻す)
  useEffect(() => {
    const isGeminiSelected = availableGeminiModels.some(
      (m: AvailableModel) => m.name === selectedModel
    )
    if (selectedModel === 'openai') {
      setIsLoading(isLoadingOpenAI)
      setApiError(errorOpenAI ? errorOpenAI.message : null)
    } else if (isGeminiSelected) {
      setIsLoading(isLoadingGemini)
      setApiError(errorGemini ? errorGemini.message : null)
    } else {
      setIsLoading(false)
      // setApiError(null) // 必要に応じてエラーをクリア
    }
  }, [
    selectedModel,
    isLoadingOpenAI,
    errorOpenAI,
    isLoadingGemini,
    errorGemini,
    availableGeminiModels,
  ])

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file)
    setImageDataUrl(dataUrl)
    setGeneratedAltText(null)
    setApiError(null)
    console.log('Uploaded file:', file.name)
  }

  // ★ APIキー取得ロジック (元に戻す)
  const getCurrentApiKey = () => {
    return selectedModel === 'openai' ? openaiApiKey : geminiApiKey
  }

  // ★ handleGenerate 関数 (元に戻す)
  const handleGenerate = async () => {
    if (!uploadedFile || !imageDataUrl) {
      setApiError('画像をアップロードしてください。')
      return
    }
    const apiKey = getCurrentApiKey()
    if (!apiKey) {
      const serviceName = selectedModel === 'openai' ? 'OpenAI' : 'Gemini'
      setApiError(`${serviceName} の API キーを入力してください。`)
      return
    }

    const selectedModelInfo = availableGeminiModels.find(
      (m) => m.name === selectedModel
    )
    const isGemini = selectedModelInfo !== undefined

    // ★ 実行確認ロジックを修正: プレビュー/実験的モデルで、許可チェックがない場合に警告(本来はボタンが無効化されるはずだが念のため)
    if (
      isGemini &&
      selectedModelInfo?.isExperimentalOrPreview &&
      !allowAdvancedModels
    ) {
      setApiError(
        '許可されていない高度なモデルが選択されています。チェックボックスをオンにしてください。'
      )
      return // ボタンが無効ならここには来ないはずだけど、保険
    }

    setApiError(null)
    setGeneratedAltText(null)

    try {
      let altText: string | null = null
      if (selectedModel === 'openai') {
        // ★ generateWithOpenAI を呼び出す
        altText = await generateWithOpenAI({ prompt, imageDataUrl })
      } else if (isGemini) {
        // ★ generateWithGemini を呼び出す
        altText = await generateWithGemini({
          prompt,
          imageDataUrl,
          model: selectedModel,
        })
      } else {
        setApiError('有効なモデルが選択されていません。')
        return
      }

      if (altText) {
        setGeneratedAltText(altText)
        // TODO: 履歴保存処理
      } else {
        // 各フック内でエラーがセットされるはずだが、念のため
        if (!apiError) {
          setApiError('AIからの応答がありませんでした。')
        }
      }
    } catch (err) {
      console.error('Error in handleGenerate:', err)
      if (!apiError) {
        setApiError('生成処理中に予期せぬエラーが発生しました。')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          画像Altテキスト生成UI
        </h1>

        {modelFetchError && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p>{modelFetchError}</p>
          </div>
        )}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              1. 画像をアップロード
            </h2>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              2. 設定 & 生成
            </h2>
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

            <AiModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              availableModels={availableGeminiModels} // 利用可能な Gemini モデルリスト
              isLoading={isLoadingModels} // モデルリスト取得中か
              error={modelFetchError} // モデルリスト取得エラー
              allowAdvancedModels={allowAdvancedModels}
              setAllowAdvancedModels={setAllowAdvancedModels}
            />

            <PromptInput prompt={prompt} setPrompt={setPrompt} />

            <GenerateButton
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={
                !uploadedFile ||
                isLoading ||
                !selectedModel ||
                (selectedModel !== 'openai' &&
                  availableGeminiModels.length === 0 &&
                  !isLoadingModels)
              }
            />

            <ResultDisplay result={generatedAltText} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

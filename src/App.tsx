import React, { useState, useEffect } from 'react'
import ImageUploader from './components/ImageUploader/ImageUploader'
import ApiKeyInput from './components/ApiKeyInput/ApiKeyInput'
import AiModelSelector, {
  AiModel,
} from './components/AiModelSelector/AiModelSelector'
import PromptInput from './components/PromptInput/PromptInput'
import GenerateButton from './components/GenerateButton/GenerateButton'
import ResultDisplay from './components/ResultDisplay/ResultDisplay'
// import useOpenAI from './hooks/useOpenAI' // OpenAI用フック (一旦コメントアウト)
import useGemini, { AvailableModel } from './hooks/useGemini' // AvailableModel 型をインポート
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

  // ★ モデル関連 state
  const [availableGeminiModels, setAvailableGeminiModels] = useState<
    AvailableModel[]
  >([])
  const [selectedModel, setSelectedModel] = useState<AiModel | string>('') // 初期値は空に
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelFetchError, setModelFetchError] = useState<string | null>(null)

  // 結果/状態 state
  const [generatedAltText, setGeneratedAltText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // カスタムフックの準備
  // const { generateAltText: generateWithOpenAI, isLoading: isLoadingOpenAI, error: errorOpenAI } = useOpenAI({ apiKey: openaiApiKey }) // 一旦コメントアウト
  const {
    generateAltText: generateWithGemini,
    isLoading: isLoadingGemini,
    error: errorGemini,
    listAvailableModels, // モデルリスト取得関数を取得
    listModelsError,
  } = useGemini({ apiKey: geminiApiKey })

  // Gemini API キーが変更されたらモデルリストを再取得
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

  // listModels のエラーを監視
  useEffect(() => {
    if (listModelsError) {
      setModelFetchError(
        `モデルリストの取得に失敗しました: ${listModelsError.message}`
      )
    }
  }, [listModelsError])

  // 生成APIのローディング/エラー状態を監視
  useEffect(() => {
    // selectedModel が availableGeminiModels に含まれる場合のみ Gemini の状態を見る
    const isGeminiSelected = availableGeminiModels.some(
      (m) => m.name === selectedModel
    )
    if (selectedModel === 'openai') {
      setIsLoading(false)
      setApiError(null)
    } else if (isGeminiSelected) {
      setIsLoading(isLoadingGemini)
      setApiError(errorGemini ? errorGemini.message : null)
    } else {
      // モデルが選択されていない、またはリストにない場合
      setIsLoading(false)
      // setApiError(null) // 既存のエラーは残しても良いかも？
    }
  }, [selectedModel, isLoadingGemini, errorGemini, availableGeminiModels])

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file)
    setImageDataUrl(dataUrl)
    setGeneratedAltText(null)
    setApiError(null)
    console.log('Uploaded file:', file.name)
  }

  // ★ APIキー取得ロジックを単純化 (選択されたモデルが OpenAI かどうかで判断)
  const getCurrentApiKey = () => {
    return selectedModel === 'openai' ? openaiApiKey : geminiApiKey
  }

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
    // 選択されたモデルがリストに存在するか確認
    const selectedModelInfo = availableGeminiModels.find(
      (m) => m.name === selectedModel
    )

    // ★ 実行確認ロジックを更新 (モデル名に 'pro' が含まれるかで判断)
    const needsConfirmation = selectedModel.includes('pro') // 'pro' を含むモデル名なら確認
    if (needsConfirmation) {
      const displayName = selectedModelInfo?.displayName ?? selectedModel // 表示名があれば使う
      const confirmationMessage = `モデル「${displayName}」は従量課金の可能性があります。実行しますか？`
      if (!window.confirm(confirmationMessage)) {
        return
      }
    }

    setApiError(null)
    setGeneratedAltText(null)

    try {
      let altText: string | null = null
      if (selectedModel === 'openai') {
        // altText = await generateWithOpenAI({ prompt, imageDataUrl })
        await new Promise((resolve) => setTimeout(resolve, 500))
        altText = `OpenAI API はまだ実装されていません (File: ${uploadedFile?.name ?? 'N/A'})`
        console.warn('OpenAI API call is not implemented yet.')
      } else if (selectedModelInfo) {
        // Gemini系で選択されたモデルが存在する場合
        altText = await generateWithGemini({
          prompt,
          imageDataUrl,
          model: selectedModel, // ★ プレフィックスなしのモデル名を渡す
        })
      } else {
        setApiError('有効なモデルが選択されていません。')
        return
      }

      if (altText) {
        setGeneratedAltText(altText)
        // TODO: 履歴保存処理
      } else {
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

        {/* モデル取得エラー表示 */}
        {modelFetchError && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p>{modelFetchError}</p>
          </div>
        )}
        {/* APIエラー表示 */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左側: 画像アップローダー */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              1. 画像をアップロード
            </h2>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>

          {/* 右側: 設定と結果 */}
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

            {/* ★ AiModelSelector に動的リストと状態を渡す */}
            <AiModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              availableModels={availableGeminiModels} // 利用可能なモデルリストを渡す
              isLoading={isLoadingModels} // モデルリスト取得中か
              error={modelFetchError} // モデルリスト取得エラー
            />

            <PromptInput prompt={prompt} setPrompt={setPrompt} />

            <GenerateButton
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={
                !uploadedFile ||
                isLoading ||
                !selectedModel ||
                availableGeminiModels.length === 0
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

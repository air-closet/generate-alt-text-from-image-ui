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
import { HistoryEntry, GenerationResult } from './types'
import HistoryDisplay from './components/HistoryDisplay/HistoryDisplay'
import HistoryDetailModal from './components/HistoryDetailModal/HistoryDetailModal'

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
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [allowAdvancedModels, setAllowAdvancedModels] = useState(false)

  // 結果/状態 state
  const [generatedAltText, setGeneratedAltText] = useState<string | null>(null)
  const [generationResults, setGenerationResults] = useState<
    GenerationResult[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // ★ 履歴 state を追加
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // ★ モーダル管理 state を追加
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<HistoryEntry | null>(null)

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

  // ★ localStorage から履歴を読み込む useEffect
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('altGenHistory')
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryEntry[]
        // 簡単なバリデーション (配列かどうか、id があるかなど)
        if (
          Array.isArray(parsedHistory) &&
          parsedHistory.every((item) => item.id)
        ) {
          setHistory(parsedHistory)
          console.log(
            'Loaded history from localStorage:',
            parsedHistory.length,
            'items'
          )
        } else {
          console.warn('Invalid history data found in localStorage. Ignoring.')
          localStorage.removeItem('altGenHistory') // 不正なデータは削除
        }
      } else {
        console.log('No history found in localStorage.')
      }
    } catch (error) {
      console.error('Failed to load or parse history from localStorage:', error)
      localStorage.removeItem('altGenHistory') // エラー時も削除
    }
  }, []) // 初回マウント時のみ実行

  // ★ 履歴が更新されたら localStorage に保存する useEffect
  useEffect(() => {
    // 初回読み込み時は保存しない (無限ループ防止)
    if (history.length > 0) {
      try {
        localStorage.setItem('altGenHistory', JSON.stringify(history))
        console.log('Saved history to localStorage:', history.length, 'items')
      } catch (error) {
        console.error('Failed to save history to localStorage:', error)
        // 容量超過などのエラー考慮
      }
    }
    // history が空になった時の削除処理は初回ロード時に不正データを削除しているので、
    // ここでは単純に history が空なら何もしない or 空配列を保存する、で良いかも。
    // もし明確に「最後の要素を消したらストレージもクリア」したいなら別途ロジック追加。
  }, [history])

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
            setSelectedModels((prevSelectedModels) => {
              if (prevSelectedModels.length === 0) {
                const safeModel =
                  models.find((m) => !m.isExperimentalOrPreview) ?? models[0]
                return [GEMINI_PREFIX + safeModel.name]
              } else {
                return prevSelectedModels // 既に選択があれば維持
              }
            })
          }
        }
      } else {
        if (isMounted) {
          setAvailableGeminiModels([])
          setSelectedModels((prevSelectedModels) => {
            if (prevSelectedModels.length > 0) {
              return [] // 単純にリセットする
            }
            return prevSelectedModels
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
            setSelectedModels((prevSelectedModels) => {
              if (prevSelectedModels.length === 0) {
                const defaultModel =
                  models.find((m) => m.id === 'gpt-4o') ?? models[0]
                return [OPENAI_PREFIX + defaultModel.id]
              } else {
                return prevSelectedModels // 既に選択があれば維持
              }
            })
          }
        }
      } else {
        if (isMounted) {
          setAvailableOpenAIModels([])
          // もし選択中のモデルがOpenAIだったらリセット (Geminiがあればそれに切り替え)
          setSelectedModels((prevSelectedModels) => {
            if (prevSelectedModels.length > 0) {
              return [] // 単純にリセットする
            }
            return prevSelectedModels
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
    if (selectedModels.length > 0) {
      setIsLoading(isLoadingOpenAI) // API生成時のローディング
      setApiError(errorOpenAI ? `OpenAI Error: ${errorOpenAI.message}` : null)
    } else if (selectedModels.length === 0) {
      setIsLoading(false)
      // APIキー未入力などでモデルが選択できない場合のエラーは apiError には設定しない
      // setApiError(null) // 生成ボタン押下時にリセットするのでここでは不要
    }
  }, [selectedModels, isLoadingOpenAI, errorOpenAI])

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedFile(file)
    setImageDataUrl(dataUrl)
    setGeneratedAltText(null)
    setGenerationResults([])
    setApiError(null)
    console.log('Uploaded file:', file.name)
  }

  // ★ handleGenerate 関数 (複数モデル実行 & 案B履歴保存に対応)
  const handleGenerate = async () => {
    if (!uploadedFile || !imageDataUrl) {
      setApiError('画像をアップロードしてください。')
      return
    }
    if (selectedModels.length === 0) {
      setApiError('モデルを1つ以上選択してください。')
      return
    }

    setApiError(null)
    setGenerationResults([])
    setIsLoading(true)

    const generationPromises = selectedModels.map(async (modelIdentifier) => {
      let result: GenerationResult = {
        model: modelIdentifier,
        generatedAltText: null,
        error: null,
      }

      try {
        if (modelIdentifier.startsWith(OPENAI_PREFIX)) {
          if (!openaiApiKey) throw new Error('OpenAI API Key is not set.')
          const modelId = modelIdentifier.substring(OPENAI_PREFIX.length)
          result.generatedAltText = await generateWithOpenAI({
            prompt,
            imageDataUrl,
            model: modelId,
          })
          if (!result.generatedAltText)
            throw new Error('OpenAIからの応答が空でした。')
        } else if (modelIdentifier.startsWith(GEMINI_PREFIX)) {
          if (!geminiApiKey) throw new Error('Gemini API Key is not set.')
          const modelName = modelIdentifier.substring(GEMINI_PREFIX.length)

          // ★ 高度なモデルのチェック (リスト再取得は cost 的に避け、state を信頼する)
          const selectedGeminiInfo = availableGeminiModels.find(
            (m) => m.name === modelName
          )
          if (
            selectedGeminiInfo?.isExperimentalOrPreview &&
            !allowAdvancedModels
          ) {
            throw new Error('許可されていない高度なGeminiモデルです。')
          }
          // 注意: APIキー変更後に古いモデルが選択されている可能性は残る

          result.generatedAltText = await generateWithGemini({
            prompt,
            imageDataUrl,
            model: modelName,
          })
          if (!result.generatedAltText)
            throw new Error('Geminiからの応答が空でした。')
        } else {
          throw new Error(`不明なモデルプレフィックス: ${modelIdentifier}`)
        }
      } catch (err) {
        console.error(`Error generating with ${modelIdentifier}:`, err)
        result.error = err instanceof Error ? err.message : 'Unknown error'
      }
      return result
    })

    // ★ 全てのモデルの処理完了を待つ (失敗しても続ける)
    const results = await Promise.allSettled(generationPromises)

    // ★ 結果 state を更新 (後で ResultDisplay 用に別途作成)
    const finalResults: GenerationResult[] = results.map((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        return outcome.value
      } else {
        // Promise が reject された場合 (通常は内部の catch で処理されるはずだが念のため)
        return {
          model: selectedModels[index],
          generatedAltText: null,
          error:
            outcome.reason instanceof Error
              ? outcome.reason.message
              : 'Unknown settlement error',
        }
      }
    })
    console.log('Generation Results:', finalResults)
    setGenerationResults(finalResults)

    // ★ 案B の履歴エントリを作成
    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      imageDataUrl: imageDataUrl,
      prompt: prompt,
      results: finalResults, // ★ 実行した全モデルの結果を格納
    }

    // 履歴を更新 (最新が先頭に来るように)
    setHistory((prevHistory) => [newHistoryEntry, ...prevHistory])

    setIsLoading(false)
  }

  // ★ 履歴削除ハンドラを追加
  const handleDeleteHistoryItem = (idToDelete: string) => {
    setHistory((prevHistory) =>
      prevHistory.filter((entry) => entry.id !== idToDelete)
    )
    console.log('Deleted history item:', idToDelete)
    // localStorageへの反映は history state の useEffect が自動で行う
  }

  // ★ モーダルを開くハンドラ
  const handleShowHistoryDetails = (entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry)
    setIsModalOpen(true)
  }

  // ★ モーダルを閉じるハンドラ
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHistoryEntry(null) // 閉じる時に選択をリセット
  }

  // ★ AiModelSelectorに渡すエラー文字列を作成するヘルパー
  const getModelErrorString = (error: Error | null): string | null =>
    error ? error.message : null

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-screen-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          画像Altテキスト生成UI
        </h1>

        {/* API生成エラー表示 (カラムの外に配置) */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{apiError}</p>
          </div>
        )}

        {/* ★ 2カラムレイアウト開始 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ★ 左カラム: 生成UI */}
          <div>
            {/* APIキー入力 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {' '}
              {/* APIキーは横並び */}
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

            {/* 画像アップローダー */}
            <ImageUploader onImageUpload={handleImageUpload} />

            {/* 設定と結果表示 */}
            <div className="mt-6">
              <AiModelSelector
                selectedModels={selectedModels}
                setSelectedModels={setSelectedModels}
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
                disabled={
                  selectedModels.length === 0 || !imageDataUrl || isLoading
                }
              />
              <ResultDisplay
                results={generationResults}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* ★ 右カラム: 履歴表示 */}
          <div>
            <HistoryDisplay
              history={history}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onShowHistoryDetails={handleShowHistoryDetails}
            />
          </div>
        </div>
      </div>

      {/* ★ モーダルコンポーネントをレンダリング */}
      <HistoryDetailModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        entry={selectedHistoryEntry}
      />
    </div>
  )
}

export default App

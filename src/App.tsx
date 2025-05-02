import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ImageUploader from './components/ImageUploader/ImageUploader'
import ApiKeyInput from './components/ApiKeyInput/ApiKeyInput'
import AiModelSelector from './components/AiModelSelector/AiModelSelector'
import PromptInput from './components/PromptInput/PromptInput'
import GenerateButton from './components/GenerateButton/GenerateButton'
import ResultDisplay from './components/ResultDisplay/ResultDisplay'
import './App.css'
import HistoryDisplay from './components/HistoryDisplay/HistoryDisplay'
import HistoryDetailModal from './components/HistoryDetailModal/HistoryDetailModal'
import { RootState, AppDispatch } from './store'
import { fetchGeminiModels, fetchOpenAIModels } from './store/slices/modelSlice'
import {
  generateAltTexts,
  clearGenerationState,
} from './store/slices/generationSlice'
import { resetHistory } from './store/slices/historySlice'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const prompt = useSelector((state: RootState) => state.prompt.value)
  const { openaiKey, geminiKey } = useSelector(
    (state: RootState) => state.apiKey
  )
  const { selected: selectedModels } = useSelector(
    (state: RootState) => state.models
  )
  const { isLoading: isGenerating, error: generationError } = useSelector(
    (state: RootState) => state.generation
  )
  const historyCount = useSelector(
    (state: RootState) => state.history.entries.length
  )

  // 画像データは一時的な入力なのでローカルStateで管理
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (openaiKey) {
      dispatch(fetchOpenAIModels(openaiKey))
    }
  }, [openaiKey, dispatch])

  useEffect(() => {
    if (geminiKey) {
      dispatch(fetchGeminiModels(geminiKey))
    }
  }, [geminiKey, dispatch])

  const handleImageUpload = (_file: File, dataUrl: string) => {
    setImageDataUrl(dataUrl)
    dispatch(clearGenerationState())
    console.log('Uploaded image data URL set')
  }

  const handleGenerate = () => {
    if (!imageDataUrl) {
      console.error('Image data URL is missing')
      return
    }
    dispatch(generateAltTexts({ imageDataUrl, prompt }))
  }

  const handleResetHistory = () => {
    if (
      window.confirm(
        '履歴をすべて削除してもよろしいですか？この操作は元に戻せません。'
      )
    ) {
      dispatch(resetHistory())
    }
  }

  const isGenerateDisabled =
    selectedModels.length === 0 || !imageDataUrl || isGenerating

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-screen-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          画像Altテキスト生成UI
        </h1>

        {generationError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>生成エラー: {generationError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ApiKeyInput serviceName="OpenAI" />
              <ApiKeyInput serviceName="Gemini" />
            </div>
            <AiModelSelector />
            <ImageUploader onImageUpload={handleImageUpload} />
            <PromptInput />
            <GenerateButton
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={isGenerateDisabled}
            />
            <ResultDisplay />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">履歴</h2>
              {historyCount > 0 && (
                <button
                  onClick={handleResetHistory}
                  className="px-3 py-1 mb-4 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  履歴をリセット
                </button>
              )}
            </div>
            <HistoryDisplay />
          </div>
        </div>
      </div>
      <HistoryDetailModal />
    </div>
  )
}

export default App

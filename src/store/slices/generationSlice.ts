import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { generateGeminiAltText } from '../../api/geminiApi'
import { generateOpenAIAltText } from '../../api/openaiApi'
import { RootState } from '../index' // RootState をインポートして getState を使えるようにする
import { GenerationResult } from '../../types'

// --- Async Thunks ---

interface GeneratePayload {
  imageDataUrl: string
  prompt: string
}

export const generateAltTexts = createAsyncThunk<
  GenerationResult[], // 成功時の戻り値
  GeneratePayload, // 引数の型
  { state: RootState; rejectValue: string } // ThunkAPIの型 (getState を含む)
>(
  'generation/generateAltTexts',
  async ({ imageDataUrl, prompt }, { getState, rejectWithValue }) => {
    const state = getState()
    const { openaiKey, geminiKey } = state.apiKey
    const { selected: selectedModels } = state.models

    if (selectedModels.length === 0) {
      return rejectWithValue('モデルが選択されていません。')
    }

    const generationPromises = selectedModels.map(
      async (modelIdentifier: string) => {
        const result: GenerationResult = {
          model: modelIdentifier,
          generatedAltText: null,
          error: null,
        }

        try {
          if (modelIdentifier.startsWith('openai:')) {
            const modelId = modelIdentifier.substring('openai:'.length)
            result.generatedAltText = await generateOpenAIAltText({
              apiKey: openaiKey,
              prompt,
              imageDataUrl,
              model: modelId,
            })
          } else if (modelIdentifier.startsWith('gemini:')) {
            const modelName = modelIdentifier.substring('gemini:'.length)
            result.generatedAltText = await generateGeminiAltText({
              apiKey: geminiKey,
              prompt,
              imageDataUrl,
              model: modelName,
            })
          } else {
            throw new Error(`不明なモデルプレフィックス: ${modelIdentifier}`)
          }
        } catch (err) {
          console.error(`Error generating with ${modelIdentifier}:`, err)
          result.error = err instanceof Error ? err.message : 'Unknown error'
        }
        return result
      }
    )

    // Promise.allSettled を使ってすべての結果を待つ
    const settledResults = await Promise.allSettled(generationPromises)

    // 結果を GenerationResult[] 形式に整形
    const finalResults: GenerationResult[] = settledResults.map(
      (outcome, index) => {
        if (outcome.status === 'fulfilled') {
          return outcome.value
        } else {
          // 失敗した場合でもエラー情報を含むオブジェクトを返す
          return {
            model: selectedModels[index],
            generatedAltText: null,
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : 'Settled promise rejected with unknown reason',
          }
        }
      }
    )

    return finalResults
  }
)

// --- Slice Definition ---

interface GenerationState {
  results: GenerationResult[]
  isLoading: boolean
  error: string | null
}

const initialState: GenerationState = {
  results: [],
  isLoading: false,
  error: null,
}

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    clearGenerationState: (state) => {
      state.results = []
      state.isLoading = false
      state.error = null
    },
    // 他の同期アクションがあればここに追加
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAltTexts.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.results = [] // 開始時に結果をクリア
      })
      .addCase(generateAltTexts.fulfilled, (state, action) => {
        state.isLoading = false
        state.results = action.payload
      })
      .addCase(generateAltTexts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to generate alt texts'
        // エラー時でも部分的な結果が含まれている可能性があるので results はクリアしない
        // もし action.payload に部分結果が含まれない設計ならクリアする
        // state.results = []
      })
  },
})

export const { clearGenerationState } = generationSlice.actions

export default generationSlice.reducer

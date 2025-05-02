import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { generateGeminiAltText } from '../../api/geminiApi'
import { generateOpenAIAltText } from '../../api/openaiApi'
import { RootState } from '../index'
import { GenerationResult } from '../../types'

// --- Async Thunks ---

interface GeneratePayload {
  imageDataUrl: string
  prompt: string
}

export const generateAltTexts = createAsyncThunk<
  GenerationResult[],
  GeneratePayload,
  { state: RootState; rejectValue: string }
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

    const settledResults = await Promise.allSettled(generationPromises)

    const finalResults: GenerationResult[] = settledResults.map(
      (outcome, index) => {
        if (outcome.status === 'fulfilled') {
          return outcome.value
        } else {
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAltTexts.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.results = []
      })
      .addCase(generateAltTexts.fulfilled, (state, action) => {
        state.isLoading = false
        state.results = action.payload
      })
      .addCase(generateAltTexts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'Failed to generate alt texts'
      })
  },
})

export const { clearGenerationState } = generationSlice.actions

export default generationSlice.reducer

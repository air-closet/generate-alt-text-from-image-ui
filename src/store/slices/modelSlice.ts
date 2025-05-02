import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
// API関数を新しいパスからインポート
import {
  AvailableGeminiModel,
  listAvailableGeminiModels as fetchGeminiModelsApi,
} from '../../api/geminiApi'
import {
  AvailableOpenAIModel,
  listAvailableOpenAIModels as fetchOpenAIModelsApi,
} from '../../api/openaiApi'

// --- Async Thunks ---

// Geminiモデルリスト取得Thunk
export const fetchGeminiModels = createAsyncThunk<
  AvailableGeminiModel[],
  string,
  { rejectValue: string }
>('models/fetchGemini', async (apiKey, { rejectWithValue }) => {
  // APIキーチェックはAPI関数内に移動したので削除
  try {
    const models = await fetchGeminiModelsApi(apiKey)
    return models
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : 'Unknown error fetching Gemini models'
    )
  }
})

// OpenAIモデルリスト取得Thunk
export const fetchOpenAIModels = createAsyncThunk<
  AvailableOpenAIModel[],
  string,
  { rejectValue: string }
>('models/fetchOpenAI', async (apiKey, { rejectWithValue }) => {
  // APIキーチェックはAPI関数内に移動したので削除
  try {
    const models = await fetchOpenAIModelsApi(apiKey)
    return models
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : 'Unknown error fetching OpenAI models'
    )
  }
})

// --- Slice Definition ---

interface ModelState {
  availableGemini: AvailableGeminiModel[]
  availableOpenAI: AvailableOpenAIModel[]
  selected: string[]
  loadingGemini: 'idle' | 'pending' | 'succeeded' | 'failed'
  loadingOpenAI: 'idle' | 'pending' | 'succeeded' | 'failed'
  errorGemini: string | null
  errorOpenAI: string | null
}

const initialState: ModelState = {
  availableGemini: [],
  availableOpenAI: [],
  selected: [],
  loadingGemini: 'idle',
  loadingOpenAI: 'idle',
  errorGemini: null,
  errorOpenAI: null,
}

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setSelectedModels: (state, action: PayloadAction<string[]>) => {
      state.selected = action.payload
    },
    // 他の同期アクションが必要な場合はここに追加
  },
  extraReducers: (builder) => {
    builder
      // fetchGeminiModels Thunk の状態変化
      .addCase(fetchGeminiModels.pending, (state) => {
        state.loadingGemini = 'pending'
        state.errorGemini = null
      })
      .addCase(fetchGeminiModels.fulfilled, (state, action) => {
        state.loadingGemini = 'succeeded'
        state.availableGemini = action.payload
        if (state.selected.length === 0 && action.payload.length > 0) {
          const defaultGemini =
            action.payload.find((m) => !m.isExperimentalOrPreview) ??
            action.payload[0]
          if (defaultGemini) {
            state.selected = [`gemini:${defaultGemini.name}`]
          }
        }
      })
      .addCase(fetchGeminiModels.rejected, (state, action) => {
        state.loadingGemini = 'failed'
        state.errorGemini = action.payload ?? 'Failed to fetch Gemini models'
        state.availableGemini = []
      })
      // fetchOpenAIModels Thunk の状態変化
      .addCase(fetchOpenAIModels.pending, (state) => {
        state.loadingOpenAI = 'pending'
        state.errorOpenAI = null
      })
      .addCase(fetchOpenAIModels.fulfilled, (state, action) => {
        state.loadingOpenAI = 'succeeded'
        state.availableOpenAI = action.payload
        if (state.selected.length === 0 && action.payload.length > 0) {
          const defaultOpenAI =
            action.payload.find((m) => m.id === 'gpt-4o') ?? action.payload[0]
          if (defaultOpenAI) {
            state.selected = [`openai:${defaultOpenAI.id}`]
          }
        }
      })
      .addCase(fetchOpenAIModels.rejected, (state, action) => {
        state.loadingOpenAI = 'failed'
        state.errorOpenAI = action.payload ?? 'Failed to fetch OpenAI models'
        state.availableOpenAI = []
      })
  },
})

export const { setSelectedModels } = modelSlice.actions

export default modelSlice.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ApiKeyState {
  openaiKey: string
  geminiKey: string
  saveOpenai: boolean
  saveGemini: boolean
}

const loadInitialState = (): ApiKeyState => {
  let openaiKey = ''
  let geminiKey = ''
  let saveOpenai = false
  let saveGemini = false

  try {
    const savedOpenaiPref =
      localStorage.getItem('save_openai_api_key') === 'true'
    const savedGeminiPref =
      localStorage.getItem('save_gemini_api_key') === 'true'

    if (savedOpenaiPref) {
      openaiKey = localStorage.getItem('openai_api_key') || ''
      saveOpenai = !!openaiKey // キーがあれば保存設定もON
    }
    if (savedGeminiPref) {
      geminiKey = localStorage.getItem('gemini_api_key') || ''
      saveGemini = !!geminiKey // キーがあれば保存設定もON
    }
  } catch (e) {
    console.error('Failed to load API keys from localStorage', e)
  }

  return { openaiKey, geminiKey, saveOpenai, saveGemini }
}

const initialState: ApiKeyState = loadInitialState()

const apiKeySlice = createSlice({
  name: 'apiKey',
  initialState,
  reducers: {
    setOpenaiKey: (state, action: PayloadAction<string>) => {
      state.openaiKey = action.payload
      if (state.saveOpenai) {
        try {
          localStorage.setItem('openai_api_key', action.payload)
        } catch (e) {
          console.error('Failed to save OpenAI key to localStorage', e)
        }
      }
    },
    setGeminiKey: (state, action: PayloadAction<string>) => {
      state.geminiKey = action.payload
      if (state.saveGemini) {
        try {
          localStorage.setItem('gemini_api_key', action.payload)
        } catch (e) {
          console.error('Failed to save Gemini key to localStorage', e)
        }
      }
    },
    setSaveOpenai: (state, action: PayloadAction<boolean>) => {
      state.saveOpenai = action.payload
      try {
        localStorage.setItem('save_openai_api_key', String(action.payload))
        if (action.payload) {
          localStorage.setItem('openai_api_key', state.openaiKey)
        } else {
          localStorage.removeItem('openai_api_key')
        }
      } catch (e) {
        console.error('Failed to update OpenAI save preference', e)
      }
    },
    setSaveGemini: (state, action: PayloadAction<boolean>) => {
      state.saveGemini = action.payload
      try {
        localStorage.setItem('save_gemini_api_key', String(action.payload))
        if (action.payload) {
          localStorage.setItem('gemini_api_key', state.geminiKey)
        } else {
          localStorage.removeItem('gemini_api_key')
        }
      } catch (e) {
        console.error('Failed to update Gemini save preference', e)
      }
    },
  },
})

export const { setOpenaiKey, setGeminiKey, setSaveOpenai, setSaveGemini } =
  apiKeySlice.actions

export default apiKeySlice.reducer

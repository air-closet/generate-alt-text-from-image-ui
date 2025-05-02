import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { HistoryEntry } from '../../types'
import { generateAltTexts } from './generationSlice' // generateAltTexts の完了時に履歴を追加するため

interface HistoryState {
  entries: HistoryEntry[]
  isModalOpen: boolean
  selectedEntryId: string | null // 詳細表示する履歴のID
}

// LocalStorage から履歴を読み込むヘルパー
const loadHistoryFromLocalStorage = (): HistoryEntry[] => {
  try {
    const savedHistory = localStorage.getItem('altGenHistory')
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory) as HistoryEntry[]
      if (
        Array.isArray(parsedHistory) &&
        parsedHistory.every((item) => item.id)
      ) {
        console.log(
          'Loaded history from localStorage:',
          parsedHistory.length,
          'items'
        )
        return parsedHistory
      } else {
        console.warn('Invalid history data found in localStorage. Clearing.')
        localStorage.removeItem('altGenHistory')
      }
    }
  } catch (error) {
    console.error('Failed to load/parse history from localStorage:', error)
    localStorage.removeItem('altGenHistory')
  }
  return []
}

// LocalStorage に履歴を保存するヘルパー
const saveHistoryToLocalStorage = (history: HistoryEntry[]) => {
  try {
    localStorage.setItem('altGenHistory', JSON.stringify(history))
    console.log('Saved history to localStorage:', history.length, 'items')
  } catch (error) {
    console.error('Failed to save history to localStorage:', error)
  }
}

const initialState: HistoryState = {
  entries: loadHistoryFromLocalStorage(),
  isModalOpen: false,
  selectedEntryId: null,
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    // 同期的な履歴追加（通常は thunk の完了時に追加するが、テスト等で使う可能性）
    // addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
    //   state.entries.unshift(action.payload) // 配列の先頭に追加
    //   saveHistoryToLocalStorage(state.entries)
    // },
    deleteHistoryEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload
      )
      saveHistoryToLocalStorage(state.entries)
      // 削除したアイテムが詳細表示されていたらモーダルを閉じる
      if (state.selectedEntryId === action.payload) {
        state.isModalOpen = false
        state.selectedEntryId = null
      }
    },
    resetHistory: (state) => {
      state.entries = []
      state.isModalOpen = false
      state.selectedEntryId = null
      try {
        localStorage.removeItem('altGenHistory')
        console.log('History cleared from localStorage')
      } catch (e) {
        console.error('Failed to remove history from localStorage', e)
      }
    },
    openHistoryModal: (state, action: PayloadAction<string>) => {
      if (state.entries.find((entry) => entry.id === action.payload)) {
        state.selectedEntryId = action.payload
        state.isModalOpen = true
      }
    },
    closeHistoryModal: (state) => {
      state.isModalOpen = false
      state.selectedEntryId = null
    },
  },
  extraReducers: (builder) => {
    // generateAltTexts が成功したら履歴に追加
    builder.addCase(generateAltTexts.fulfilled, (state, action) => {
      // action.meta.arg には thunk の引数 (GeneratePayload) が入る
      const payload = action.meta.arg
      // action.payload には thunk の戻り値 (GenerationResult[]) が入る
      const results = action.payload

      // 画像データがない場合は履歴に追加しない（通常は発生しないはず）
      if (!payload.imageDataUrl) return

      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        imageDataUrl: payload.imageDataUrl,
        prompt: payload.prompt,
        results: results, // thunk の結果を使用
      }
      state.entries.unshift(newEntry)
      saveHistoryToLocalStorage(state.entries)
    })
    // 必要に応じて generateAltTexts.rejected 時の処理も追加できる
  },
})

export const {
  deleteHistoryEntry,
  resetHistory,
  openHistoryModal,
  closeHistoryModal,
} = historySlice.actions

export default historySlice.reducer

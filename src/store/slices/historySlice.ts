import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { HistoryEntry } from '../../types'
import { generateAltTexts } from './generationSlice'

interface HistoryState {
  entries: HistoryEntry[]
  isModalOpen: boolean
  selectedEntryId: string | null
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
    deleteHistoryEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload
      )
      saveHistoryToLocalStorage(state.entries)
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
    builder.addCase(generateAltTexts.fulfilled, (state, action) => {
      const payload = action.meta.arg
      const results = action.payload

      if (!payload.imageDataUrl) return

      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        imageDataUrl: payload.imageDataUrl,
        prompt: payload.prompt,
        results: results,
      }
      state.entries.unshift(newEntry)
      saveHistoryToLocalStorage(state.entries)
    })
  },
})

export const {
  deleteHistoryEntry,
  resetHistory,
  openHistoryModal,
  closeHistoryModal,
} = historySlice.actions

export default historySlice.reducer

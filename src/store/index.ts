import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

const store = configureStore({
  reducer: rootReducer,
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(), // 必要に応じて後で追加
  // devTools: process.env.NODE_ENV !== 'production', // 開発モードでのみDevToolsを有効化
})

// ストアの型をエクスポート (TypeScript用)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store

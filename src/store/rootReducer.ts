import { combineReducers } from '@reduxjs/toolkit'
import promptReducer from './slices/promptSlice'
import apiKeyReducer from './slices/apiKeySlice'
import modelReducer from './slices/modelSlice'
import generationReducer from './slices/generationSlice'
import historyReducer from './slices/historySlice'

// ここに後で作成するスライスのreducerをインポートする
// import apiKeyReducer from './slices/apiKeySlice'
// import modelReducer from './slices/modelSlice'
// ... など

const rootReducer = combineReducers({
  prompt: promptReducer,
  apiKey: apiKeyReducer,
  models: modelReducer,
  generation: generationReducer,
  history: historyReducer,
  // 後でスライスのreducerをここに追加する
  // apiKey: apiKeyReducer,
  // model: modelReducer,
  // ...
})

export default rootReducer

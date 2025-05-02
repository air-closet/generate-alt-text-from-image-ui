import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  setOpenaiKey,
  setGeminiKey,
  setSaveOpenai,
  setSaveGemini,
} from '../../store/slices/apiKeySlice'

interface ApiKeyInputProps {
  serviceName: string
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ serviceName }) => {
  const dispatch = useDispatch<AppDispatch>()
  const isGemini = serviceName === 'Gemini'

  const apiKey = useSelector((state: RootState) =>
    isGemini ? state.apiKey.geminiKey : state.apiKey.openaiKey
  )
  const saveApiKey = useSelector((state: RootState) =>
    isGemini ? state.apiKey.saveGemini : state.apiKey.saveOpenai
  )

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value
    if (isGemini) {
      dispatch(setGeminiKey(newKey))
    } else {
      dispatch(setOpenaiKey(newKey))
    }
  }

  const handleSaveApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shouldSave = e.target.checked
    if (isGemini) {
      dispatch(setSaveGemini(shouldSave))
    } else {
      dispatch(setSaveOpenai(shouldSave))
    }
  }

  const inputId = `${serviceName.toLowerCase()}ApiKey`
  const checkboxId = `${serviceName.toLowerCase()}SaveApiKey`

  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {serviceName} APIキー
      </label>
      <input
        type="password"
        id={inputId}
        value={apiKey}
        onChange={handleApiKeyChange}
        placeholder={`${serviceName} の API キーを入力`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <div className="mt-2 flex items-center">
        <input
          id={checkboxId}
          type="checkbox"
          checked={saveApiKey}
          onChange={handleSaveApiKeyChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor={checkboxId}
          className="ml-2 block text-sm text-gray-900"
        >
          APIキーをブラウザに保存する (注意: 安全ではありません)
        </label>
      </div>
    </div>
  )
}

export default ApiKeyInput

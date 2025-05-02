import React, { useEffect } from 'react'

interface ApiKeyInputProps {
  apiKey: string
  setApiKey: (key: string) => void
  saveApiKey: boolean
  setSaveApiKey: (save: boolean) => void
  serviceName: string // 'OpenAI' or 'Gemini'
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  apiKey,
  setApiKey,
  saveApiKey,
  setSaveApiKey,
  serviceName,
}) => {
  const localStorageKey = `${serviceName.toLowerCase()}_api_key`

  // コンポーネントマウント時にlocalStorageから読み込み
  useEffect(() => {
    const savedState = localStorage.getItem('save_api_key_preference')
    const shouldLoad = savedState === 'true'
    if (shouldLoad) {
      const storedKey = localStorage.getItem(localStorageKey)
      if (storedKey) {
        setApiKey(storedKey)
        setSaveApiKey(true) // 保存されていたらチェックボックスもONにする
      }
    } else {
      setSaveApiKey(false) // 保存設定がなければチェックボックスをOFF
    }
  }, [localStorageKey, setApiKey, setSaveApiKey]) // 初回のみ実行

  // APIキー入力ハンドラ
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value
    setApiKey(newKey)
    if (saveApiKey) {
      localStorage.setItem(localStorageKey, newKey)
    }
  }

  // 保存チェックボックス変更ハンドラ
  const handleSaveApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const shouldSave = e.target.checked
    setSaveApiKey(shouldSave)
    localStorage.setItem('save_api_key_preference', shouldSave.toString())
    if (shouldSave) {
      localStorage.setItem(localStorageKey, apiKey)
    } else {
      localStorage.removeItem(localStorageKey)
    }
  }

  return (
    <div className="mb-4">
      <label
        htmlFor={`${serviceName.toLowerCase()}ApiKey`}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {serviceName} APIキー
      </label>
      <input
        type="password" // キーなのでパスワードタイプで見えにくく
        id={`${serviceName.toLowerCase()}ApiKey`}
        value={apiKey}
        onChange={handleApiKeyChange}
        placeholder={`${serviceName} の API キーを入力`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <div className="mt-2 flex items-center">
        <input
          id={`${serviceName.toLowerCase()}SaveApiKey`}
          type="checkbox"
          checked={saveApiKey}
          onChange={handleSaveApiKeyChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor={`${serviceName.toLowerCase()}SaveApiKey`}
          className="ml-2 block text-sm text-gray-900"
        >
          APIキーをブラウザに保存する (注意: 安全ではありません)
        </label>
      </div>
    </div>
  )
}

export default ApiKeyInput

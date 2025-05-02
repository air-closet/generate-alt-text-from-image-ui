import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store' // ストアの型をインポート
import { setPrompt } from '../../store/slices/promptSlice' // アクションをインポート

// Props は不要になるので削除
// interface PromptInputProps {
//   prompt: string
//   setPrompt: (prompt: string) => void
// }

const PromptInput: React.FC = () => {
  // ★ ストアから prompt を取得
  const prompt = useSelector((state: RootState) => state.prompt.value)
  // ★ dispatch 関数を取得
  const dispatch = useDispatch<AppDispatch>()

  // ★ textarea の onChange で setPrompt アクションを dispatch
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setPrompt(e.target.value))
  }

  return (
    <div className="mb-6 py-4">
      <label
        htmlFor="prompt"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        カスタムプロンプト (指示)
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={8}
        value={prompt} // ★ ストアから取得した値を使用
        onChange={handlePromptChange} // ★ dispatch するハンドラを使用
        placeholder="例: この画像のaltテキストを生成してください。簡潔に、主要な要素を説明するように。"
        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <p className="mt-2 text-xs text-gray-500">
        AIにどのようなaltテキストを生成してほしいか、具体的な指示を入力します。
      </p>
    </div>
  )
}

export default PromptInput

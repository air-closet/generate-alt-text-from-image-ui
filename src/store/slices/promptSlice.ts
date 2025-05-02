import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PromptState {
  value: string
}

const initialState: PromptState = {
  value:
    'この画像のaltテキストを生成してください。\nその際は<generated-alt-text>タグで囲んで出力してください。\n\n# 出力例\n<generated-alt-text>\n美しい女性のビューティーポートレート\n</generated-alt-text>',
}

const promptSlice = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setPrompt: (state, action: PayloadAction<string>) => {
      state.value = action.payload
    },
  },
})

export const { setPrompt } = promptSlice.actions

export default promptSlice.reducer

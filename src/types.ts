// ★ 実行結果の型 (モデルごと)
export interface GenerationResult {
  model: string // プレフィックス付きモデル名
  generatedAltText: string | null
  error?: string | null // エラーメッセージ
}

export interface HistoryEntry {
  id: string // 一意なID (タイムスタンプとかで生成)
  timestamp: number
  imageDataUrl: string
  prompt: string
  results: GenerationResult[] // ★ 複数モデルの結果を保持する配列に変更
  // model: string // 削除
  // generatedAltText: string // 削除
}

// 他にも共通で使いたい型があればここに追加していく

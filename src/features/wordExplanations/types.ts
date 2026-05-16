export type ExplainWordRequest = {
  word: string
  context: string
  startOffset: number
  endOffset: number
  provider: 'fake' | 'gemini'
  prompt?: string
}

export type ExplainWordResponse = {
  word: string
  context: string
  provider?: string
  promptHash?: string
  startOffset?: number
  endOffset?: number
  explanation: string
  cached: boolean
  createdAt?: string
}

export type WordExplanationHistoryItem = {
  id: number
  word: string
  context: string
  startOffset: number
  endOffset: number
  provider: string
  promptHash: string
  explanation: string
  createdAt: string
}

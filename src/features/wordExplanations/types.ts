export type ExplainWordRequest = {
  word: string
  context: string
  startOffset: number
  endOffset: number
  provider: 'fake' | 'gemini'
  explanationType: 'INLINE_EXPLANATION' | 'CUSTOM_PROMPT'
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
  explanationType: 'INLINE_EXPLANATION' | 'CUSTOM_PROMPT'
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
  explanationType: 'INLINE_EXPLANATION' | 'CUSTOM_PROMPT'
  explanation: string
  createdAt: string
}

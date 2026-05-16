export type ExplainWordRequest = {
  word: string
  context: string
  startOffset: number
  endOffset: number
  provider: 'fake-testing' | 'gemini'
  prompt?: string
}

export type ExplainWordResponse = {
  word: string
  context: string
  explanation: string
  cached: boolean
}

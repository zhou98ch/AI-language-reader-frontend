import { httpClient } from '../../shared/api/httpClient'
import type { ExplainWordRequest, ExplainWordResponse, WordExplanationHistoryItem } from './types'

export function explainWord(documentId: number, request: ExplainWordRequest) {
  return httpClient
    .post(`texts/${documentId}/explanations`, {
      json: request,
    })
    .json<ExplainWordResponse>()
}

export function listWordExplanations(documentId: number) {
  return httpClient.get(`texts/${documentId}/explanations`).json<WordExplanationHistoryItem[]>()
}

export function updateWordExplanation(
  documentId: number,
  explanationId: number,
  explanation: string,
) {
  return httpClient
    .post(`texts/${documentId}/explanations/${explanationId}`, {
      json: { explanation },
    })
    .json<WordExplanationHistoryItem>()
}

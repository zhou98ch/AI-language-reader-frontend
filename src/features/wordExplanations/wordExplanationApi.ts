import { httpClient } from '../../shared/api/httpClient'
import type { ExplainWordRequest, ExplainWordResponse } from './types'

export function explainWord(documentId: number, request: ExplainWordRequest) {
  return httpClient
    .post(`texts/${documentId}/explanations`, {
      json: request,
    })
    .json<ExplainWordResponse>()
}

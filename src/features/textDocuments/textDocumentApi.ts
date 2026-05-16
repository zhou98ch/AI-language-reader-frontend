import { httpClient } from '../../shared/api/httpClient'
import type { CreateTextDocumentRequest, CreateTextDocumentResponse } from './types'

export function createTextDocument(request: CreateTextDocumentRequest) {
  return httpClient
    .post('texts', {
      json: request,
    })
    .json<CreateTextDocumentResponse>()
}

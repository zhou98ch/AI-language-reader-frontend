import { httpClient } from '../../shared/api/httpClient'
import type {
  CreateTextDocumentRequest,
  CreateTextDocumentResponse,
  TextDocumentSummary,
} from './types'

export function createTextDocument(request: CreateTextDocumentRequest) {
  return httpClient
    .post('texts', {
      json: request,
    })
    .json<CreateTextDocumentResponse>()
}

export function listTextDocuments() {
  return httpClient.get('texts').json<TextDocumentSummary[]>()
}

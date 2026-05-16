import { httpClient } from '../../shared/api/httpClient'
import type {
  CreateTextDocumentRequest,
  CreateTextDocumentResponse,
  TextDocument,
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

export function getTextDocument(id: number) {
  return httpClient.get(`texts/${id}`).json<TextDocument>()
}

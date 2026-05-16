export type SourceType = 'TXT'

export type TextDocumentSummary = {
  id: number
  title: string
  sourceType: SourceType
  createdAt: string
}

export type TextDocument = TextDocumentSummary & {
  content: string
  language: string
}

export type CreateTextDocumentRequest = {
  title: string
  content: string
  sourceType: SourceType
}

export type CreateTextDocumentResponse = TextDocumentSummary

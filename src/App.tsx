import { useEffect, useMemo, useState } from 'react'
import {
  createTextDocument,
  getTextDocument,
  listTextDocuments,
} from './features/textDocuments/textDocumentApi'
import { explainWord } from './features/wordExplanations/wordExplanationApi'
import type { ExplainWordResponse } from './features/wordExplanations/types'
import { getSentenceContext, tokenizeText, type TextToken } from './shared/helpers/tokenizeText'
import type { TextDocument, TextDocumentSummary } from './features/textDocuments/types'
import './App.css'

function App() {
  const [title, setTitle] = useState('German Article 1')
  const [content, setContent] = useState(
    'Das ist ein deutscher Text. Wie sollen wir dieses Problem angehen?',
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedDocumentId, setSavedDocumentId] = useState<number | null>(null)
  const [documents, setDocuments] = useState<TextDocumentSummary[]>([])
  const [activeDocument, setActiveDocument] = useState<TextDocument | null>(null)
  const [selectedToken, setSelectedToken] = useState<TextToken | null>(null)
  const [provider, setProvider] = useState<'fake-testing' | 'gemini'>('gemini')
  const [prompt, setPrompt] = useState('')
  const [explanation, setExplanation] = useState<ExplainWordResponse | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const activeDocumentTokens = useMemo(
    () => tokenizeText(activeDocument?.content ?? ''),
    [activeDocument?.content],
  )

  async function loadDocuments() {
    try {
      setDocuments(await listTextDocuments())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved texts')
    }
  }

  async function saveText() {
    setIsSaving(true)
    setError('')
    setSavedDocumentId(null)

    try {
      const document = await createTextDocument({
        title,
        content,
        sourceType: 'TXT',
      })

      setSavedDocumentId(document.id)
      await loadDocuments()
      await openDocument(document.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save text')
    } finally {
      setIsSaving(false)
    }
  }

  async function openDocument(id: number) {
    setError('')

    try {
      setActiveDocument(await getTextDocument(id))
      setSelectedToken(null)
      setExplanation(null)
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open text')
    }
  }

  async function requestExplanation(token: TextToken, promptValue: string) {
    if (!activeDocument) {
      return
    }

    setError('')
    setIsExplaining(true)

    try {
      setExplanation(
        await explainWord(activeDocument.id, {
          word: token.text,
          context: getSentenceContext(activeDocument.content, token.startOffset, token.endOffset),
          startOffset: token.startOffset,
          endOffset: token.endOffset,
          provider,
          prompt: promptValue.trim() || undefined,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain word')
    } finally {
      setIsExplaining(false)
    }
  }

  function selectToken(token: TextToken) {
    setSelectedToken(token)
    setExplanation(null)
    setPrompt('')
    void requestExplanation(token, '')
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  if (activeDocument) {
    return (
      <main className="page">
        <header className="page-header reader-page-header">
          <button type="button" className="secondary-button" onClick={() => setActiveDocument(null)}>
            Back
          </button>
          <div>
            <h1>{activeDocument.title}</h1>
            <p>
              Document #{activeDocument.id} - {activeDocument.sourceType} - {activeDocument.language}
            </p>
          </div>
        </header>

        <section className="reader-layout">
          <div className="panel reader-panel">
            <div className="reader-text">
              {activeDocumentTokens.map((token) =>
                token.isWord ? (
                  <button
                    type="button"
                    className={`token ${selectedToken?.startOffset === token.startOffset ? 'selected' : ''}`}
                    key={`${token.startOffset}-${token.endOffset}`}
                    onClick={() => selectToken(token)}
                  >
                    {token.text}
                  </button>
                ) : (
                  <span key={`${token.startOffset}-${token.endOffset}`}>{token.text}</span>
                ),
              )}
            </div>
          </div>

          <aside className="panel explanation-panel">
            <h2>Explanation</h2>

            {selectedToken ? (
              <>
                <div className="selected-word">
                  <strong>{selectedToken.text}</strong>
                  <span>{isExplaining ? 'Explaining...' : explanation?.cached ? 'cached' : 'new'}</span>
                </div>

                <label>
                  Provider
                  <select value={provider} onChange={(event) => setProvider(event.target.value as 'fake-testing' | 'gemini')}>
                    <option value="gemini">Gemini</option>
                    <option value="fake">Fake</option>
                  </select>
                </label>

                <label>
                  Prompt
                  <textarea
                    className="prompt-input"
                    placeholder="Optional: ask for Chinese explanation, examples, grammar notes..."
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                  />
                </label>

                <button type="button" disabled={isExplaining} onClick={() => requestExplanation(selectedToken, prompt)}>
                  {isExplaining ? 'Explaining...' : 'Explain again'}
                </button>

                {explanation && <p className="explanation-text">{explanation.explanation}</p>}
              </>
            ) : (
              <p className="empty-state">Select a word to generate an explanation.</p>
            )}

            {error && <p className="error-message">{error}</p>}
          </aside>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>German Context Reader</h1>
        <p>Save German texts and read them with context-aware word explanations.</p>
      </header>

      <section className="layout">
        <div className="panel">
          <h2>New Text</h2>

          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="German Article 1"
            />
          </label>

          <label>
            Text
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste German text here..."
            />
          </label>

          <button type="button" onClick={saveText} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save text'}
          </button>

          {savedDocumentId && (
            <p className="success-message">Saved as document #{savedDocumentId}</p>
          )}

          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="panel">
          <h2>Saved Texts</h2>
          {documents.length === 0 ? (
            <p className="empty-state">No saved texts yet.</p>
          ) : (
            <div className="document-list">
              {documents.map((document) => (
                <button
                  type="button"
                  className="document-row"
                  key={document.id}
                  onClick={() => void openDocument(document.id)}
                >
                  <span>{document.title}</span>
                  <small>
                    #{document.id} - {document.sourceType}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App

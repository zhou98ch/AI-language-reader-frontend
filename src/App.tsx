import { useEffect, useMemo, useState } from 'react'
import {
  createTextDocument,
  getTextDocument,
  listTextDocuments,
} from './features/textDocuments/textDocumentApi'
import {
  explainWord,
  listWordExplanations,
  updateWordExplanation,
} from './features/wordExplanations/wordExplanationApi'
import type {
  ExplainWordResponse,
  WordExplanationHistoryItem,
} from './features/wordExplanations/types'
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
  const [provider, setProvider] = useState<'fake' | 'gemini'>('gemini')
  const [prompt, setPrompt] = useState('')
  const [explanation, setExplanation] = useState<ExplainWordResponse | null>(null)
  const [explanationHistory, setExplanationHistory] = useState<WordExplanationHistoryItem[]>([])
  const [isExplaining, setIsExplaining] = useState(false)
  const [editingExplanationId, setEditingExplanationId] = useState<number | null>(null)
  const [editingExplanationText, setEditingExplanationText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
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
      setExplanationHistory(await listWordExplanations(id))
      setSelectedToken(null)
      setExplanation(null)
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open text')
    }
  }

  async function requestExplanation(
    token: TextToken,
    promptValue: string,
    explanationType: 'INLINE_EXPLANATION' | 'CUSTOM_PROMPT',
  ) {
    if (!activeDocument) {
      return
    }

    setError('')
    setIsExplaining(true)

    try {
      const result = await explainWord(activeDocument.id, {
          word: token.text,
          context: getSentenceContext(activeDocument.content, token.startOffset, token.endOffset),
          startOffset: token.startOffset,
          endOffset: token.endOffset,
          provider,
          explanationType,
          prompt: promptValue.trim() || undefined,
        })

      setExplanation(result)
      setExplanationHistory(await listWordExplanations(activeDocument.id))
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
    setEditingExplanationId(null)
    setEditingExplanationText('')
    void requestExplanation(token, '', 'INLINE_EXPLANATION')
  }

  function startEditingExplanation(item: WordExplanationHistoryItem) {
    setEditingExplanationId(item.id)
    setEditingExplanationText(item.explanation)
  }

  async function saveExplanationEdit(item: WordExplanationHistoryItem) {
    if (!activeDocument) {
      return
    }

    setError('')
    setIsSavingEdit(true)

    try {
      if (item.explanationType === 'INLINE_EXPLANATION' && editingExplanationText.length > 40) {
        throw new Error('Inline explanation must be 40 characters or fewer')
      }

      const updated = await updateWordExplanation(
        activeDocument.id,
        item.id,
        editingExplanationText,
      )

      setExplanationHistory((currentHistory) =>
        currentHistory.map((historyItem) =>
          historyItem.id === updated.id ? updated : historyItem,
        ),
      )
      setEditingExplanationId(null)
      setEditingExplanationText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update explanation')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const selectedTokenHistory =
    selectedToken === null
      ? []
      : explanationHistory.filter(
          (item) =>
            item.startOffset === selectedToken.startOffset &&
            item.endOffset === selectedToken.endOffset &&
            item.explanationType === 'CUSTOM_PROMPT',
        )

  const inlineExplanationsByToken = useMemo(() => {
    const result = new Map<string, WordExplanationHistoryItem>()

    for (const item of explanationHistory) {
      if (item.explanationType !== 'INLINE_EXPLANATION') {
        continue
      }

      const key = `${item.startOffset}-${item.endOffset}`

      if (!result.has(key)) {
        result.set(key, item)
      }
    }

    return result
  }, [explanationHistory])

  const selectedInlineExplanation =
    selectedToken === null
      ? null
      : inlineExplanationsByToken.get(`${selectedToken.startOffset}-${selectedToken.endOffset}`) ?? null

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
              {activeDocumentTokens.map((token) => {
                const inlineExplanation = inlineExplanationsByToken.get(`${token.startOffset}-${token.endOffset}`)

                return token.isWord ? (
                  <button
                    type="button"
                    className={`token ${selectedToken?.startOffset === token.startOffset ? 'selected' : ''}`}
                    key={`${token.startOffset}-${token.endOffset}`}
                    onClick={() => selectToken(token)}
                  >
                    {token.text}
                    {inlineExplanation && (
                      <span className="inline-explanation">({inlineExplanation.explanation})</span>
                    )}
                  </button>
                ) : (
                  <span key={`${token.startOffset}-${token.endOffset}`}>{token.text}</span>
                )
              })}
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

                {selectedInlineExplanation && (
                  <div className="inline-editor">
                    <div className="inline-editor-header">
                      <span>Inline explanation</span>
                      {editingExplanationId !== selectedInlineExplanation.id && (
                        <button
                          type="button"
                          className="small-secondary-button"
                          onClick={() => startEditingExplanation(selectedInlineExplanation)}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editingExplanationId === selectedInlineExplanation.id ? (
                      <>
                        <input
                          value={editingExplanationText}
                          maxLength={40}
                          onChange={(event) => setEditingExplanationText(event.target.value)}
                        />
                        <div className="character-count">{editingExplanationText.length}/40</div>
                        <div className="history-edit-actions">
                          <button
                            type="button"
                            disabled={isSavingEdit}
                            onClick={() => void saveExplanationEdit(selectedInlineExplanation)}
                          >
                            {isSavingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isSavingEdit}
                            onClick={() => {
                              setEditingExplanationId(null)
                              setEditingExplanationText('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>{selectedInlineExplanation.explanation}</p>
                    )}
                  </div>
                )}

                <label>
                  Provider
                  <select value={provider} onChange={(event) => setProvider(event.target.value as 'fake' | 'gemini')}>
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

                <button
                  type="button"
                  disabled={isExplaining}
                  onClick={() => requestExplanation(selectedToken, prompt, 'CUSTOM_PROMPT')}
                >
                  {isExplaining ? 'Explaining...' : 'Explain again'}
                </button>

                <div className="history-list">
                  <h3>History</h3>
                  {selectedTokenHistory.length === 0 ? (
                    <p className="empty-state">No saved explanations for this word yet.</p>
                  ) : (
                    selectedTokenHistory.map((item) => (
                      <article className="history-item" key={item.id}>
                        <div className="history-meta">
                          <span>{item.provider}</span>
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                        {editingExplanationId === item.id ? (
                          <>
                            <textarea
                              className="history-edit-input"
                              maxLength={item.explanationType === 'INLINE_EXPLANATION' ? 40 : undefined}
                              value={editingExplanationText}
                              onChange={(event) => setEditingExplanationText(event.target.value)}
                            />
                            <div className="history-edit-actions">
                              <button
                                type="button"
                                disabled={isSavingEdit}
                                onClick={() => void saveExplanationEdit(item)}
                              >
                                {isSavingEdit ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                disabled={isSavingEdit}
                                onClick={() => {
                                  setEditingExplanationId(null)
                                  setEditingExplanationText('')
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p>{item.explanation}</p>
                            <button
                              type="button"
                              className="small-secondary-button"
                              onClick={() => startEditingExplanation(item)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </article>
                    ))
                  )}
                </div>
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

import { useEffect, useState } from 'react'
import {
  createTextDocument,
  getTextDocument,
  listTextDocuments,
} from './features/textDocuments/textDocumentApi'
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open text')
    }
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

        <section className="panel reader-panel">
          <p className="reader-text">{activeDocument.content}</p>
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

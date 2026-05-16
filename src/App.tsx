import { useState } from 'react'
import { createTextDocument } from './features/textDocuments/textDocumentApi'
import './App.css'

function App() {
  const [title, setTitle] = useState('German Article 1')
  const [content, setContent] = useState(
    'Das ist ein deutscher Text. Wie sollen wir dieses Problem angehen?',
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedDocumentId, setSavedDocumentId] = useState<number | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save text')
    } finally {
      setIsSaving(false)
    }
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
          <p className="empty-state">No saved texts loaded yet.</p>
        </div>
      </section>
    </main>
  )
}

export default App

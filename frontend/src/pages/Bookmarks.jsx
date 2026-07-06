import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import Navbar from '../components/Navbar'

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function RagPill({ rating }) {
  const map = {
    green: { bg: 'var(--greensoft)', color: 'var(--green)', label: 'Got it' },
    amber: { bg: 'var(--ambersoft)', color: 'var(--amber)', label: 'Partially' },
    red:   { bg: 'var(--redsoft)',   color: 'var(--red)',   label: "Didn't get it" },
  }
  const s = map[rating]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontWeight: 700, fontSize: 12,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: s.color, display: 'inline-block'
      }} />
      {s.label}
    </span>
  )
}

export default function Bookmarks() {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:5000/api/bookmarks', {
          credentials: 'include'
        })
        if (!res.ok) { navigate('/login'); return }
        const data = await res.json()
        setBookmarks(data.bookmarks)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  async function deleteBookmark(bookmarkId) {
    try {
      await fetch(`http://localhost:5000/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    } catch {
      console.error('Delete failed')
    }
  }

  async function saveNote(bookmarkId) {
    try {
      await fetch(`http://localhost:5000/api/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: noteText })
      })
      setBookmarks(prev => prev.map(b =>
        b.id === bookmarkId ? { ...b, note: noteText } : b
      ))
      setEditingNote(null)
    } catch {
      console.error('Save note failed')
    }
  }

  function startEditNote(bookmark) {
    setEditingNote(bookmark.id)
    setNoteText(bookmark.note || '')
  }

  if (loading) return <div className="auth-loading">Loading bookmarks...</div>

  return (
    <div className="bookmarks-page">

      <Navbar showBack backTo="/dashboard" backLabel="Dashboard" />
      <div className="bookmarks-content">
        <h1 className="settings-title">Saved Explanations</h1>

        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <p>No saved explanations yet.</p>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text3)' }}>
              Click the 🔖 Save button on any explanation to bookmark it.
            </p>
            <button
              className="btn-primary"
              style={{ width: 'auto', marginTop: 16 }}
              onClick={() => navigate('/learn')}
            >
              Start learning →
            </button>
          </div>
        ) : (
          <div className="bookmarks-grid">
            {bookmarks.map(b => (
              <div key={b.id} className="bookmark-card">

                {/* Header */}
                <div className="bookmark-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bookmark-topic">{b.topic}</div>
                    <div className="bookmark-meta">
                      {b.style && (
                        <span className="db-style-pill">{b.style}</span>
                      )}
                      {b.rag_rating && <RagPill rating={b.rag_rating} />}
                      <span className="history-time">{timeAgo(b.saved_at)}</span>
                    </div>
                  </div>
                  <button
                    className="bookmark-delete-btn"
                    onClick={() => deleteBookmark(b.id)}
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>

                {/* Preview / expanded text */}
                <div
                  className="bookmark-preview"
                  onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                >
                  {expandedId === b.id ? (
                    <div className="explanation-text" style={{ fontSize: 14 }}>
                      <ReactMarkdown>{b.response_text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="bookmark-preview-text">
                      {b.text_preview}...
                      <span className="bookmark-read-more"> Read more</span>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="bookmark-note-section">
                  {editingNote === b.id ? (
                    <div className="bookmark-note-edit">
                      <textarea
                        className="bookmark-note-input"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        rows={2}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          className="btn-primary"
                          style={{
                            width: 'auto', padding: '7px 14px',
                            fontSize: 13, marginBottom: 0
                          }}
                          onClick={() => saveNote(b.id)}
                        >
                          Save note
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ width: 'auto', padding: '7px 14px', fontSize: 13 }}
                          onClick={() => setEditingNote(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bookmark-note"
                      onClick={() => startEditNote(b)}
                    >
                      {b.note
                        ? <span className="bookmark-note-text">{b.note}</span>
                        : <span className="bookmark-note-placeholder">+ Add a note</span>
                      }
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bookmark-actions">
                  <button
                    className="btn-ghost"
                    style={{ width: 'auto', fontSize: 13, padding: '7px 14px' }}
                    onClick={() => navigate(`/history/${b.session_id}`)}
                  >
                    View full session →
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
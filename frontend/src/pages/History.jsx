import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import Navbar from '../components/Navbar'
import API_URL from '../api'

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
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
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

export default function History() {
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedData, setExpandedData] = useState({})

  // filters
  const [search, setSearch] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [ragFilter, setRagFilter] = useState('')

 useEffect(() => {
  loadSessions(1, true)
  // loadSessions is stable — intentionally excluded from deps
}, [search, styleFilter, ragFilter]) // eslint-disable-line

  async function loadSessions(pageNum = 1, reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: pageNum })
      if (search) params.append('search', search)
      if (styleFilter) params.append('style', styleFilter)
      if (ragFilter) params.append('rag', ragFilter)

      const res = await fetch(
        `${API_URL}/api/sessions?${params}`,
        { credentials: 'include' }
      )
      if (!res.ok) { navigate('/login'); return }
      const data = await res.json()

      setSessions(prev => reset ? data.sessions : [...prev, ...data.sessions])
      setHasMore(data.has_more)
      setPage(pageNum)
    } catch { navigate('/login') }
    finally { setLoading(false) }
  }

  async function toggleExpand(sessionId) {
    if (expandedId === sessionId) {
      setExpandedId(null)
      return
    }
    setExpandedId(sessionId)

    if (!expandedData[sessionId]) {
      try {
        const res = await fetch(
          `${API_URL}/api/sessions/${sessionId}`,
          { credentials: 'include' }
        )
        if (res.ok) {
          const data = await res.json()
          setExpandedData(prev => ({ ...prev, [sessionId]: data.session }))
        }
      } catch {
        // silently ignore
      }
    }
  }

  const [user, setUser] = useState(null)
  useEffect(() => {
  fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
    .then(r => r.json())
    .then(d => setUser(d.user))
    .catch(() => {})
}, []) 

  return (
    <div className="history-page">

      {/* Navbar */}
     <Navbar user={user} />

      <div className="history-content">
        <h1 className="settings-title">Learning History</h1>

        {/* Filters */}
        <div className="history-filters">
          <input
            className="history-search"
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="history-select"
            value={styleFilter}
            onChange={e => setStyleFilter(e.target.value)}
          >
            <option value="">All styles</option>
            <option value="analogy">Analogy</option>
            <option value="story">Story</option>
            <option value="steps">Step-by-step</option>
            <option value="eli5">ELI5</option>
            <option value="expert">Expert</option>
          </select>
          <select
            className="history-select"
            value={ragFilter}
            onChange={e => setRagFilter(e.target.value)}
          >
            <option value="">All ratings</option>
            <option value="green">Got it</option>
            <option value="amber">Partially</option>
            <option value="red">Didn't get it</option>
          </select>
        </div>

        {/* Sessions list */}
        {sessions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No sessions found.</p>
            {(search || styleFilter || ragFilter) && (
              <button
                className="btn-primary"
                style={{ width: 'auto', marginTop: 12 }}
                onClick={() => { setSearch(''); setStyleFilter(''); setRagFilter('') }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="history-list">
            {sessions.map(s => (
              <div key={s.id} className="history-item">

                {/* Row — always visible */}
<div
  className="history-row"
  onClick={() => toggleExpand(s.id)}
>
  <div className="history-row-top">
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="history-topic">{s.topic}</span>
      {s.style && <span className="db-style-pill">{s.style}</span>}
    </div>
    <span className="history-time">{timeAgo(s.started_at)}</span>
  </div>

  {s.explanation_preview && (
    <div className="history-preview">
      {s.explanation_preview}...
    </div>
  )}

  <div className="history-row-bottom">
    <div className="history-meta">
      {s.rag_rating && <RagPill rating={s.rag_rating} />}
      {s.quiz_score !== null && s.quiz_score !== undefined && (
        <span className="db-pill-neutral">Quiz {s.quiz_score}%</span>
      )}
      {s.total_attempts > 1 && (
        <span className="db-pill-neutral">{s.total_attempts} attempts</span>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
  <button
    className="db-relearn-btn"
    style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1.5px solid var(--accent)' }}
    onClick={e => { e.stopPropagation(); navigate(`/history/${s.id}`) }}
  >
    View full
  </button>
  <button
  className="db-relearn-btn"
  onClick={e => { e.stopPropagation(); navigate(`/history/${s.id}`) }}
>
  View session
</button>
</div>
  </div>
</div>

                {/* Expanded detail */}
                {expandedId === s.id && (
  <div className="history-expanded">
    {!expandedData[s.id] ? (
      <p style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</p>
    ) : (
      <>
        {expandedData[s.id].explanations.map((exp, idx) => (
          <div key={exp.id} className="history-exp-block">

            {/* Explanation header */}
            <div className="history-exp-header">
              <span className="explanation-badge">{exp.style}</span>
              {exp.rag_rating && <RagPill rating={exp.rag_rating} />}
              {idx > 0 && (
                <span className="db-pill-neutral">Attempt {exp.attempt_number}</span>
              )}
            </div>

            {/* Explanation text with fade */}
           <div className="history-exp-text">
  <ReactMarkdown>{exp.response_text}</ReactMarkdown>
</div>

            {/* Quiz results */}
            {exp.quiz_results && exp.quiz_results.length > 0 && (
              <div className="history-quiz-block">
                <div className="history-quiz-title">Quiz answers</div>
                {exp.quiz_results.map((q, qi) => {
                  const options = JSON.parse(q.options)
                

                  return (
                    <div key={qi} className="history-quiz-item">
                      <div className="history-quiz-q-text">{q.question}</div>
                      <div className="history-quiz-answers">
                        {options.map((opt, oi) => {
                          let cls = 'history-quiz-opt'
                          if (oi === q.correct_index) cls += ' hq-correct'
                          else if (oi === q.user_answer_index && !q.correct) cls += ' hq-wrong'
                          return (
                            <div key={oi} className={cls}>
                              {oi === q.correct_index && <span className="hq-icon">✓</span>}
                              {oi === q.user_answer_index && !q.correct && <span className="hq-icon">✗</span>}
                              {opt}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        ))}

        <button
          className="btn-primary"
          style={{ width: 'auto', marginTop: 16 }}
          onClick={() => navigate('/learn')}
        >
          Learn this topic again →
        </button>
      </>
    )}
  </div>
)}
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            className="btn-ghost"
            style={{ marginTop: 16 }}
            onClick={() => loadSessions(page + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}

        {loading && sessions.length === 0 && (
          <div className="empty-state">Loading your history...</div>
        )}
      </div>
    </div>
  )
}
import API_URL from '../api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'





function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function RagPill({ rating }) {
  const map = {
    green: { bg: 'var(--greensoft)', color: 'var(--green)', label: 'Green' },
    amber: { bg: 'var(--ambersoft)', color: 'var(--amber)', label: 'Amber' },
    red:   { bg: 'var(--redsoft)',   color: 'var(--red)',   label: 'Red' },
  }
  const s = map[rating]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontWeight: 700, fontSize: 12,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

const LEVELS = [
  [0, 'Curious'], [100, 'Learner'], [300, 'Scholar'],
  [700, 'Thinker'], [1500, 'Expert'], [3000, 'Master']
]

function getLevel(xp) {
  let level = LEVELS[0], next = LEVELS[1]
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i][0]) {
      level = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  const inLevel = xp - level[0]
  const toNext = next ? next[0] - level[0] : 1
  const pct = next ? Math.round((inLevel / toNext) * 100) : 100
  return { name: level[1], nextName: next ? next[1] : 'Max', inLevel, toNext, pct }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentIdx, setRecentIdx] = useState(0)
  const [courses, setCourses] = useState([])

  const THEMES = ['focus', 'calm', 'energy', 'night', 'contrast']
  function cycleTheme() {
    const current = THEMES.indexOf(theme)
    setTheme(THEMES[(current + 1) % THEMES.length])
  }

  useEffect(() => {
    async function load() {
      try {
        const [userRes, sessRes, statsRes, bmRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }),
          fetch(`${API_URL}/api/sessions`, { credentials: 'include' }),
          fetch(`${API_URL}/api/sessions/stats`, { credentials: 'include' }),
          fetch(`${API_URL}/api/bookmarks`, { credentials: 'include' }),
          fetch(`${API_URL}/api/courses`, { credentials: 'include' }),
        ])

        if (!userRes.ok) { navigate('/login'); return }

        const userData = await userRes.json()
        setUser(userData.user)

        if (sessRes.ok) {
  const d = await sessRes.json()
  setSessions((d.sessions || []).slice(0, 5))
}
        if (statsRes.ok) {
          const d = await statsRes.json()
          setWeeklyStats(d)
        }
        if (bmRes.ok) {
          const d = await bmRes.json()
          setBookmarks((d.bookmarks || []).slice(0, 3))
        }
        if (coursesRes.ok) {
          const d = await coursesRes.json()
          setCourses(d.courses || [])
}
      } catch { navigate('/login') }
      finally { setLoading(false) }
    }
    load()
  }, [navigate])

  async function handleLogout() {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    navigate('/login')
  }

  if (loading) return <div className="auth-loading">Loading your dashboard...</div>
  if (!user) return null

  const nickname = user.nickname || user.name
  const initial = nickname[0].toUpperCase()
  const xp = user.stats?.xp || 0
  const streak = user.stats?.streak || 0
  const level = getLevel(xp)
  const activeSession = sessions[recentIdx] || null

  return (
    <div className="dashboard">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            AdaptLearn
          </span>
          <div className="db-nav-links">
            <button className="db-nav-link db-nav-link-active" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="db-nav-link" onClick={() => navigate('/learn')}>Learn</button>
            <button className="db-nav-link" onClick={() => navigate('/courses')}>Courses</button>
            <button className="db-nav-link" onClick={() => navigate('/history')}>History</button>
          </div>
        </div>
        <div className="navbar-right">
          {streak > 0 && (
            <span className="streak-badge">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block', marginRight: 5 }} />
              {streak}-day streak
            </span>
          )}
          <span className="xp-badge">{xp.toLocaleString()} XP</span>
          <button className="theme-toggle" onClick={cycleTheme} title="Switch theme">
            <div className="theme-toggle-icon" />
          </button>
          <button
            className="navbar-avatar"
            onClick={() => navigate('/settings')}
            title="Profile & Settings"
          >
            {initial}
          </button>
          <button className="btn-ghost-small" onClick={handleLogout}>Log out</button>
        </div>
      </nav>

      <div className="db-content">

        {/* ── Header row ── */}
        <div className="db-header">
          <div>
            <div className="db-welcome-label">Welcome back</div>
            <h1 className="db-welcome-name">Hello, {nickname}.</h1>
          </div>
          <div className="db-header-actions">
            <button className="btn-primary db-action-primary" onClick={() => navigate('/learn')}>
              + New topic
            </button>
            <button className="btn-ghost db-action-ghost" onClick={() => navigate('/courses/new')}>
              + Build a course
            </button>
          </div>
        </div>

        {/* ── Two column grid ── */}
        <div className="db-grid">

          {/* LEFT */}
          <div className="db-left">

            {/* Recent sessions */}
            <div className="db-card">
              <div className="db-card-header">
                <div>
                  <div className="db-card-title">Recent sessions</div>
                  <div className="db-card-sub">Swipe through your last topics</div>
                </div>
                {sessions.length > 1 && (
                  <div className="db-nav-btns">
                    <button
                      className="db-nav-btn"
                      onClick={() => setRecentIdx(i => Math.max(0, i - 1))}
                      disabled={recentIdx === 0}
                    >‹</button>
                    <button
                      className="db-nav-btn"
                      onClick={() => setRecentIdx(i => Math.min(sessions.length - 1, i + 1))}
                      disabled={recentIdx === sessions.length - 1}
                    >›</button>
                  </div>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="db-empty">
                  <p>No sessions yet.</p>
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', marginTop: 12 }}
                    onClick={() => navigate('/learn')}
                  >
                    Learn your first topic →
                  </button>
                </div>
              ) : (
                <>
                  <div className="db-session-card" key={activeSession?.id}>
                    <div className="db-session-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="db-session-topic">{activeSession?.topic}</span>
                        {activeSession?.style && (
                          <span className="db-style-pill">{activeSession.style}</span>
                        )}
                      </div>
                      <span className="db-session-time">{timeAgo(activeSession?.started_at)}</span>
                    </div>

                    {activeSession?.explanation_preview && (
                      <div className="db-session-preview">
                        {activeSession.explanation_preview}...
                      </div>
                    )}

                    <div className="db-session-meta">
                      {activeSession?.rag_rating && <RagPill rating={activeSession.rag_rating} />}
                      {activeSession?.quiz_score !== null && activeSession?.quiz_score !== undefined && (
                        <span className="db-pill-neutral">Quiz {activeSession.quiz_score}%</span>
                      )}
                      {activeSession?.total_attempts > 1 && (
                        <span className="db-pill-neutral">{activeSession.total_attempts} attempt(s)</span>
                      )}
                      <button
  className="db-relearn-btn"
  onClick={() => navigate(`/history/${activeSession?.id}`)}
>
    Relearn
</button>
                    </div>
                  </div>

                  {sessions.length > 1 && (
                    <div className="db-dots">
                      {sessions.map((_, i) => (
                        <button
                          key={i}
                          className={`db-dot ${i === recentIdx ? 'db-dot-active' : ''}`}
                          onClick={() => setRecentIdx(i)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Courses */}
<div className="db-card">
  <div className="db-card-header">
    <div className="db-card-title">Your courses</div>
    <button className="section-link" onClick={() => navigate('/courses')}>View all</button>
  </div>

  {courses.length === 0 ? (
    <div className="db-empty" style={{ textAlign: 'left' }}>
      <p style={{ color: 'var(--text3)', fontSize: 14 }}>No courses yet.</p>
      <button
        className="btn-primary"
        style={{ width: 'auto', marginTop: 12 }}
        onClick={() => navigate('/courses/new')}
      >
        Build your first course →
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {courses.slice(0, 3).map(c => (
        <div
          key={c.id}
          className="db-bookmark-item"
          onClick={() => navigate(`/courses/${c.id}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {c.title}
            </span>
            <span style={{
              fontWeight: 700, fontSize: 13,
              color: c.progress_pct === 100 ? 'var(--green)' : 'var(--accent)'
            }}>
              {c.progress_pct}%
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${c.progress_pct}%`,
              background: c.progress_pct === 100 ? 'var(--green)' : 'var(--accent)',
              borderRadius: 99,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>
            {c.completed_topics} of {c.total_topics} topics
          </div>
        </div>
      ))}
    </div>
  )}
</div>
          </div>

          {/* RIGHT */}
          <div className="db-right">

            {/* Streak + XP card */}
            <div className="db-xp-card">
              <div className="db-xp-row">
                <div>
                  <div className="db-xp-label">Current streak</div>
                  <div className="db-xp-value">{streak} days</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="db-xp-label">Total XP</div>
                  <div className="db-xp-value">{xp.toLocaleString()}</div>
                </div>
              </div>
              <div className="db-level-row">
                <span>{level.name}</span>
                <span>{level.inLevel} / {level.toNext} to {level.nextName}</span>
              </div>
              <div className="db-level-bar">
                <div className="db-level-fill" style={{ width: `${level.pct}%` }} />
              </div>
            </div>

            {/* Stats grid */}
            {weeklyStats && (
              <div className="db-stats-grid">
                <div className="db-stat">
                  <div className="db-stat-num" style={{ color: 'var(--accent)' }}>
                    {weeklyStats.total_this_week}
                  </div>
                  <div className="db-stat-label">this week</div>
                </div>
                <div className="db-stat">
                  <div className="db-stat-num" style={{ color: 'var(--green)' }}>
                    {weeklyStats.avg_score !== null ? `${weeklyStats.avg_score}%` : '—'}
                  </div>
                  <div className="db-stat-label">best quiz</div>
                </div>
                <div className="db-stat">
                  <div className="db-stat-num" style={{ color: 'var(--text)', fontSize: 17, paddingTop: 5 }}>
                    {weeklyStats.best_style || '—'}
                  </div>
                  <div className="db-stat-label">top style</div>
                </div>
              </div>
            )}

            {/* Bookmarks */}
            <div className="db-card">
              <div className="db-card-header">
                <div className="db-card-title">Bookmarks</div>
                <button className="section-link" onClick={() => navigate('/bookmarks')}>View all</button>
              </div>
              {bookmarks.length === 0 ? (
                <div className="db-empty" style={{ textAlign: 'left' }}>
                  <p style={{ color: 'var(--text3)', fontSize: 14 }}>No bookmarks yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bookmarks.map(b => (
                    <div
                      key={b.id}
                      className="db-bookmark-item"
                      onClick={() => navigate('/bookmarks')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                          {b.topic}
                        </span>
                        {b.style && <span className="db-style-pill">{b.style}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>
                        {b.text_preview?.slice(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
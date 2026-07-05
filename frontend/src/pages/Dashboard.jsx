import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// helper — how long ago was a date
function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// RAG dot colour
function RagDot({ rating }) {
  const colours = {
    green: '#0F6E56',
    amber: '#854F0B',
    red: '#993C1D',
  }
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: colours[rating] || '#DDDDDD',
      marginRight: 6,
    }} />
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        // fetch user
        const userRes = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        })
        if (!userRes.ok) {
          navigate('/login')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        // fetch recent sessions
        const sessionsRes = await fetch('http://localhost:5000/api/sessions', {
          credentials: 'include'
        })
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json()
          setSessions(sessionsData.sessions)
        }

        // fetch weekly stats
        const statsRes = await fetch('http://localhost:5000/api/sessions/stats', {
          credentials: 'include'
        })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setWeeklyStats(statsData)
        }

      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [navigate])

  async function handleLogout() {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    navigate('/login')
  }

  if (loading) return <div className="auth-loading">Loading your dashboard...</div>
  if (!user) return null

  const nickname = user.nickname || user.name
  const xp = user.stats?.xp || 0
  const streak = user.stats?.streak || 0

  return (
    <div className="dashboard">

      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">AdaptLearn</span>
        <div className="navbar-right">
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak} day streak</span>
          )}
          <span className="xp-badge">⚡ {xp} XP</span>
          <span className="navbar-user">{nickname}</span>
          <button className="btn-ghost-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">

        {/* Greeting */}
        <div className="dashboard-greeting">
          <h1>Hey {nickname} 👋</h1>
          <p className="greeting-sub">
            Your default style is <strong>{user.preferences?.preferred_style || 'not set'}</strong>
            {' '}— you can change this in settings anytime.
          </p>
        </div>

        {/* Quick actions */}
        <div className="dashboard-section">
          <h2 className="section-title">What do you want to do?</h2>
          <div className="action-grid">
            <button className="action-card primary" onClick={() => navigate('/learn')}>
              <span className="action-icon">🧠</span>
              <div>
                <span className="action-label">Learn a topic</span>
                <span className="action-sub">Enter anything you want to understand</span>
              </div>
            </button>

            <button className="action-card" onClick={() => navigate('/courses/new')}>
              <span className="action-icon">📚</span>
              <div>
                <span className="action-label">Build a course</span>
                <span className="action-sub">Create a structured learning path</span>
              </div>
            </button>

            <button className="action-card" onClick={() => navigate('/courses/new?import=true')}>
              <span className="action-icon">📄</span>
              <div>
                <span className="action-label">Import a document</span>
                <span className="action-sub">Turn a PDF or PPTX into a course</span>
              </div>
            </button>
          </div>
        </div>

        {/* This week stats */}
        {weeklyStats && (
          <div className="dashboard-section">
            <h2 className="section-title">This week</h2>
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-number">{weeklyStats.total_this_week}</span>
                <span className="stat-label">topics learned</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {weeklyStats.avg_score !== null ? `${weeklyStats.avg_score}%` : '—'}
                </span>
                <span className="stat-label">avg quiz score</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{weeklyStats.best_style || '—'}</span>
                <span className="stat-label">best style</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{xp}</span>
                <span className="stat-label">total XP</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent topics */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent topics</h2>
            {sessions.length > 0 && (
              <button
                className="section-link"
                onClick={() => navigate('/history')}
              >
                View all →
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet — learn your first topic to see it here.</p>
              <button
                className="btn-primary"
                style={{ width: 'auto', marginTop: 12 }}
                onClick={() => navigate('/learn')}
              >
                Learn something →
              </button>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s.id} className="session-row">
                  <div className="session-info">
                    <span className="session-topic">{s.topic}</span>
                    <div className="session-meta">
                      <span className="session-style">{s.style}</span>
                      {s.rag_rating && <RagDot rating={s.rag_rating} />}
                      {s.quiz_score !== null && (
                        <span className="session-score">{s.quiz_score}%</span>
                      )}
                    </div>
                  </div>
                  <span className="session-time">{timeAgo(s.started_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
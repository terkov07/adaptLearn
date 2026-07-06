import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Courses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [userRes, coursesRes] = await Promise.all([
          fetch('http://localhost:5000/api/auth/me', { credentials: 'include' }),
          fetch('http://localhost:5000/api/courses', { credentials: 'include' }),
        ])
        if (!userRes.ok) { navigate('/login'); return }
        const userData = await userRes.json()
        setUser(userData.user)
        if (coursesRes.ok) {
          const d = await coursesRes.json()
          setCourses(d.courses || [])
        }
      } catch { navigate('/login') }
      finally { setLoading(false) }
    }
    load()
  }, [navigate])

  function getProgressColor(pct) {
    if (pct === 100) return 'var(--green)'
    if (pct > 0) return 'var(--accent)'
    return 'var(--border)'
  }

  if (loading) return <div className="auth-loading">Loading courses...</div>

  const nickname = user?.nickname || user?.name || ''
  const initial = nickname[0]?.toUpperCase() || '?'
  const xp = user?.stats?.xp || 0
  const streak = user?.stats?.streak || 0

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            AdaptLearn
          </span>
          <div className="db-nav-links">
            <button className="db-nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="db-nav-link" onClick={() => navigate('/learn')}>Learn</button>
            <button className="db-nav-link db-nav-link-active" onClick={() => navigate('/courses')}>Courses</button>
            <button className="db-nav-link" onClick={() => navigate('/history')}>History</button>
          </div>
        </div>
        <div className="navbar-right">
          {streak > 0 && <span className="streak-badge">🔥 {streak}-day streak</span>}
          <span className="xp-badge">{xp} XP</span>
          <button className="navbar-avatar" onClick={() => navigate('/settings')}>{initial}</button>
        </div>
      </nav>

      <div className="db-content">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 className="db-welcome-name">Courses</h1>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginTop: 4 }}>
              Structured topic playlists — built by you or from a document.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto', marginBottom: 0 }}
            onClick={() => navigate('/courses/new')}
          >
            + Build a course
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <p>No courses yet.</p>
            <button
              className="btn-primary"
              style={{ width: 'auto', marginTop: 16 }}
              onClick={() => navigate('/courses/new')}
            >
              Build your first course →
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(c => (
              <div
                key={c.id}
                className="course-card"
                onClick={() => navigate(`/courses/${c.id}`)}
              >
                <div className="course-card-top">
                  <span className="course-card-title">{c.title}</span>
                  <span className="course-card-pct" style={{
                    color: c.progress_pct === 100 ? 'var(--green)' : 'var(--accent)'
                  }}>
                    {c.progress_pct}%
                  </span>
                </div>
                <div className="course-progress-bar">
                  <div
                    className="course-progress-fill"
                    style={{
                      width: `${c.progress_pct}%`,
                      background: getProgressColor(c.progress_pct)
                    }}
                  />
                </div>
                <div className="course-card-bottom">
                  <span className="course-card-source">
                    📄 {c.source_filename || 'Manual'}
                  </span>
                  <span className="course-card-count">
                    {c.progress_pct === 100
                      ? 'Complete'
                      : `${c.completed_topics} of ${c.total_topics} topics`}
                  </span>
                </div>
              </div>
            ))}

            {/* New course card */}
            <div
              className="course-card course-card-new"
              onClick={() => navigate('/courses/new')}
            >
              <div className="course-card-new-inner">
                <span className="course-card-new-plus">+</span>
                <span className="course-card-new-label">New course</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
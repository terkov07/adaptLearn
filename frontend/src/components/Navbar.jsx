import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ user, showBack, backTo, backLabel }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const THEMES = ['focus', 'calm', 'energy', 'night', 'contrast']

  function cycleTheme() {
    const current = THEMES.indexOf(theme)
    setTheme(THEMES[(current + 1) % THEMES.length])
  }

  const nickname = user?.nickname || user?.name || ''
  const initial = nickname[0]?.toUpperCase() || '?'
  const xp = user?.stats?.xp || 0
  const streak = user?.stats?.streak || 0

  const NAV_LINKS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Learn', path: '/learn' },
    { label: 'Courses', path: '/courses' },
    { label: 'History', path: '/history' },
  ]

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {showBack ? (
            <button
              className="navbar-back"
              onClick={() => navigate(backTo || '/dashboard')}
            >
              ← {backLabel || 'Back'}
            </button>
          ) : (
            <span
              className="navbar-logo"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            >
              AdaptLearn
            </span>
          )}

          <div className="db-nav-links">
            {NAV_LINKS.map(link => (
              <button
                key={link.path}
                className={`db-nav-link ${location.pathname === link.path ? 'db-nav-link-active' : ''}`}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="navbar-right">
          {streak > 0 && (
            <span className="streak-badge">
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--amber)',
                display: 'inline-block', marginRight: 5
              }} />
              {streak}-day streak
            </span>
          )}
          {xp > 0 && (
            <span className="xp-badge">{xp} XP</span>
          )}
          <button className="theme-toggle" onClick={cycleTheme} title="Switch theme">
            <div className="theme-toggle-icon" />
          </button>
          {nickname && (
            <button
              className="navbar-avatar"
              onClick={() => navigate('/settings')}
              title="Settings"
            >
              {initial}
            </button>
          )}
        </div>
      </nav>

      {/* Bottom navigation — mobile only */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="bottom-nav-icon">⊞</span>
          <span className="bottom-nav-label">Home</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === '/learn' ? 'active' : ''}`}
          onClick={() => navigate('/learn')}
        >
          <span className="bottom-nav-icon">🧠</span>
          <span className="bottom-nav-label">Learn</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === '/courses' ? 'active' : ''}`}
          onClick={() => navigate('/courses')}
        >
          <span className="bottom-nav-icon">📚</span>
          <span className="bottom-nav-label">Courses</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === '/history' ? 'active' : ''}`}
          onClick={() => navigate('/history')}
        >
          <span className="bottom-nav-icon">📋</span>
          <span className="bottom-nav-label">History</span>
        </button>
        <button
          className={`bottom-nav-btn ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">Settings</span>
        </button>
      </nav>
    </>
  )
}
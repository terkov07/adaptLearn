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
  )
}
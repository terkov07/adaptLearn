import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ user, showBack, backTo, backLabel }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const THEMES = ['focus', 'calm', 'energy', 'night', 'contrast']

  function cycleTheme() {
    const current = THEMES.indexOf(theme)
    setTheme(THEMES[(current + 1) % THEMES.length])
  }

  const initial = (user?.nickname || user?.name || '?')[0].toUpperCase()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {showBack ? (
          <button
            className="navbar-back"
            onClick={() => navigate(backTo || '/dashboard')}
          >
            ← {backLabel || 'Dashboard'}
          </button>
        ) : (
          <span
            className="navbar-logo"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            AdaptLearn
          </span>
        )}
      </div>

      {!showBack && (
        <span className="navbar-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          AdaptLearn
        </span>
      )}

      <div className="navbar-right">
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
      </div>
    </nav>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // check if logged in when page loads
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          // not logged in — send to login
          navigate('/login')
        }
      } catch (err) {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    navigate('/login')
  }

  if (loading) return <div className="auth-loading">Loading...</div>
  if (!user) return null

  return (
    <div className="dashboard">

      <nav className="navbar">
        <span className="navbar-logo">AdaptLearn</span>
        <div className="navbar-right">
          <span className="navbar-user">Hey {user.nickname || user.name} 👋</span>
          <button className="btn-ghost-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">

        <div className="dashboard-welcome">
          <h1>Welcome{user.nickname ? `, ${user.nickname}` : ''}!</h1>
          <p>Your learning style: <strong>{user.preferences?.preferred_style || 'not set yet'}</strong></p>
        </div>

        <div className="dashboard-actions">
          <button
            className="action-card"
            onClick={() => navigate('/learn')}
          >
            <span className="action-icon">🧠</span>
            <span className="action-label">Learn a topic</span>
            <span className="action-sub">Enter anything you want to understand</span>
          </button>

          <button
            className="action-card"
            onClick={() => navigate('/courses/new')}
          >
            <span className="action-icon">📚</span>
            <span className="action-label">Build a course</span>
            <span className="action-sub">Create a structured learning path</span>
          </button>

          <button
            className="action-card"
            onClick={() => navigate('/history')}
          >
            <span className="action-icon">📋</span>
            <span className="action-label">View history</span>
            <span className="action-sub">See your past sessions</span>
          </button>
        </div>

      </div>
    </div>
  )
}
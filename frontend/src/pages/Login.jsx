import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API_URL from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email) return setError('Please enter your email')
    if (!password) return setError('Please enter your password')

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (res.ok) {
        navigate('/dashboard')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  if (loading) return <div className="auth-loading">Logging you in...</div>

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to continue learning</p>

        <div className="form-group">
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="btn-primary" onClick={handleLogin}>
          Log in →
        </button>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
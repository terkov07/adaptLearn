import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopicInput from '../components/TopicInput'
import StyleSelector from '../components/StyleSelector'
import ExplanationCard from '../components/ExplanationCard'
import SkeletonCard from '../components/SkeletonCard'

export default function Learn() {
  const navigate = useNavigate()

  // user profile
  const [user, setUser] = useState(null)

  // learn state
  const [selectedStyle, setSelectedStyle] = useState('analogy')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [currentTopic, setCurrentTopic] = useState('')
  const [attempt, setAttempt] = useState(1)
  const [usedStyles, setUsedStyles] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [explanationId, setExplanationId] = useState(null)
  const [error, setError] = useState('')

  // load user on mount — get their preferred style
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          // pre-select their profile style
          if (data.user.preferences?.preferred_style) {
            setSelectedStyle(data.user.preferences.preferred_style)
          }
        } else {
          navigate('/login')
        }
      } catch {
        navigate('/login')
      }
    }
    loadUser()
  }, [navigate])

  async function handleExplain(topic) {
    setCurrentTopic(topic)
    setLoading(true)
    setExplanation(null)
    setError('')
    setAttempt(1)
    setUsedStyles([selectedStyle])

    try {
      const res = await fetch('http://localhost:5000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic,
          style: selectedStyle,
          education_level: user?.preferences?.education_level,
        })
      })
      const data = await res.json()

      if (res.ok) {
        setExplanation(data.explanation)
        setSessionId(data.session_id)
        setExplanationId(data.explanation_id)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="learn-page">

      {/* Navbar */}
      <nav className="navbar">
        <button className="navbar-back" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <span className="navbar-logo">AdaptLearn</span>
        <span className="navbar-user">
          {user?.nickname || user?.name || ''}
        </span>
      </nav>

      <div className="learn-content">

        {/* Input section */}
        <div className="learn-input-section">
          <StyleSelector
            selected={selectedStyle}
            onSelect={setSelectedStyle}
          />
          <TopicInput
            onSubmit={handleExplain}
            loading={loading}
          />
        </div>

        {/* Error */}
        {error && <p className="auth-error">{error}</p>}

        {/* Loading skeleton */}
        {loading && (
          <div>
            <p className="loading-text">
              Generating your {selectedStyle} explanation...
            </p>
            <SkeletonCard />
          </div>
        )}

        {/* Explanation */}
        {explanation && !loading && (
          <ExplanationCard
            explanation={explanation}
            style={selectedStyle}
            attempt={attempt}
          />
        )}

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopicInput from '../components/TopicInput'
import StyleSelector from '../components/StyleSelector'
import ExplanationCard from '../components/ExplanationCard'
import SkeletonCard from '../components/SkeletonCard'
import RAGRating from '../components/RAGRating'
import AttemptBanner from '../components/AttemptBanner'

const STYLE_ORDER = ['analogy', 'story', 'steps', 'eli5', 'expert']

export default function Learn() {
  const navigate = useNavigate()

  // user
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

  // post-explanation state
  const [ragDone, setRagDone] = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [allStylesExhausted, setAllStylesExhausted] = useState(false)

  // load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
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

  // reset all state for a new topic
  function resetAll() {
    setExplanation(null)
    setRagDone(false)
    setShowStylePicker(false)
    setShowQuiz(false)
    setAttempt(1)
    setUsedStyles([])
    setAllStylesExhausted(false)
    setError('')
    setSessionId(null)
    setExplanationId(null)
  }

  // core explain function — used for first attempt and re-explains
  async function handleExplain(topic, style, attemptNum, used) {
    setCurrentTopic(topic)
    setLoading(true)
    setExplanation(null)
    setError('')
    setRagDone(false)
    setShowStylePicker(false)
    setShowQuiz(false)
    setAllStylesExhausted(false)

    try {
      const res = await fetch('http://localhost:5000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic,
          style,
          education_level: user?.preferences?.education_level,
        })
      })
      const data = await res.json()

      if (res.ok) {
        setExplanation(data.explanation)
        setSessionId(data.session_id)
        setExplanationId(data.explanation_id)
        setAttempt(attemptNum)
        setUsedStyles(used)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  // called when user submits topic for first time
  function handleFirstExplain(topic) {
    const used = [selectedStyle]
    handleExplain(topic, selectedStyle, 1, used)
  }

  // called when user rates Red or Amber
  async function handleRag(rating) {
    setRagDone(true)

    // save rating to backend
    if (explanationId) {
      await fetch(`http://localhost:5000/api/explanations/${explanationId}/rag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating })
      })
    }

    if (rating === 'green') {
      setShowQuiz(true)
    } else {
      // check styles remaining
      const remaining = STYLE_ORDER.filter(s => !usedStyles.includes(s))
      if (remaining.length === 0) {
        setAllStylesExhausted(true)
      } else {
        setShowStylePicker(true)
      }
    }
  }

  // called when user picks a style from the style picker
  function handleStylePick(style) {
    setShowStylePicker(false)
    const newUsed = [...usedStyles, style]
    const newAttempt = attempt + 1
    setSelectedStyle(style)
    handleExplain(currentTopic, style, newAttempt, newUsed)
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

        {/* Topic input — only show before explanation loads */}
        {!explanation && !loading && (
          <div className="learn-input-section">
            <StyleSelector
              selected={selectedStyle}
              onSelect={setSelectedStyle}
            />
            <TopicInput
              onSubmit={handleFirstExplain}
              loading={loading}
            />
          </div>
        )}

        {/* Try different topic button — show after explanation loads */}
        {(explanation || loading) && (
          <button className="new-topic-btn" onClick={resetAll}>
            ← Try a different topic
          </button>
        )}

        {/* Error message */}
        {error && <p className="auth-error">{error}</p>}

        {/* Attempt banner — shown on re-explains */}
        {attempt > 1 && (
          <AttemptBanner attempt={attempt} style={selectedStyle} />
        )}

        {/* Loading skeleton */}
        {loading && (
          <div>
            <p className="loading-text">
              Generating your {selectedStyle} explanation...
            </p>
            <SkeletonCard />
          </div>
        )}

        {/* Explanation card */}
        {explanation && !loading && (
          <>
            <ExplanationCard
              explanation={explanation}
              style={selectedStyle}
              attempt={attempt}
            />

            {/* RAG rating — shown after explanation, hidden after rated */}
            {!ragDone && (
              <RAGRating onRate={handleRag} disabled={false} />
            )}

            {/* Style picker — shown after Red/Amber */}
            {showStylePicker && (
              <div className="style-picker-wrap">
                <p className="style-picker-label">
                  That one didn't click — pick a style to try next:
                </p>
                <div className="style-picker-options">
                  {STYLE_ORDER.filter(s => !usedStyles.includes(s)).map(style => (
                    <button
                      key={style}
                      className="style-picker-btn"
                      onClick={() => handleStylePick(style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All styles exhausted message */}
            {allStylesExhausted && (
              <div className="exhausted-message">
                <h3>You've tried every explanation style for this topic.</h3>
                <p>
                  This one's tough — take a break and come back to it,
                  or try searching for a video on this topic.
                </p>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', marginTop: 16 }}
                  onClick={resetAll}
                >
                  Try a different topic
                </button>
              </div>
            )}

            {/* Quiz placeholder — shown after Green */}
            {showQuiz && (
              <div className="quiz-placeholder">
                <h3>Quiz coming next! 🎯</h3>
                <p>Quiz component loads here — building it next.</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopicInput from '../components/TopicInput'
import StyleSelector from '../components/StyleSelector'
import ExplanationCard from '../components/ExplanationCard'
import SkeletonCard from '../components/SkeletonCard'
import RAGRating from '../components/RAGRating'
import AttemptBanner from '../components/AttemptBanner'
import QuizCard from '../components/QuizCard'

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

  // quiz state
  const [questions, setQuestions] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [numQuestions, setNumQuestions] = useState(3)

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

  // reset everything for a new topic
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
    setQuestions([])
    setQuizLoading(false)
    setQuizScore(null)
    setQuizComplete(false)
  }

  // core explain function
  async function handleExplain(topic, style, attemptNum, used) {
    setCurrentTopic(topic)
    setLoading(true)
    setExplanation(null)
    setError('')
    setRagDone(false)
    setShowStylePicker(false)
    setShowQuiz(false)
    setAllStylesExhausted(false)
    setQuestions([])
    setQuizComplete(false)
    setQuizScore(null)

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

  // first explanation from topic input
  function handleFirstExplain(topic) {
    const used = [selectedStyle]
    handleExplain(topic, selectedStyle, 1, used)
  }

  // RAG rating handler
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
      setShowQuiz(false) //dont show quiz yet
    
    } else {
      const remaining = STYLE_ORDER.filter(s => !usedStyles.includes(s))
      if (remaining.length === 0) {
        setAllStylesExhausted(true)
      } else {
        setShowStylePicker(true)
      }
    }
  }

  // user picks a style after Red/Amber
  function handleStylePick(style) {
    setShowStylePicker(false)
    const newUsed = [...usedStyles, style]
    const newAttempt = attempt + 1
    setSelectedStyle(style)
    handleExplain(currentTopic, style, newAttempt, newUsed)
  }

  // fetch quiz questions from backend
  async function fetchQuiz() {
    if (!explanation) return
    setQuizLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          explanation_text: explanation,
          num_questions: numQuestions,
          education_level: user?.preferences?.education_level,
        })
      })
      const data = await res.json()

      if (res.ok && data.questions.length > 0) {
        setQuestions(data.questions)
      } else {
        setQuestions([])
      }
    } catch {
      setQuestions([])
    } finally {
      setQuizLoading(false)
    }
  }

  // quiz completed with a score
  function handleQuizComplete(score) {
    setQuizScore(score)
    setQuizComplete(true)
  }

  // quiz skipped
  function handleQuizSkip() {
    setShowQuiz(true)
    setQuizScore(null)
    setQuizComplete(true)
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

        {/* Topic input — only before explanation loads */}
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

        {/* Try different topic button */}
        {(explanation || loading) && (
          <button className="new-topic-btn" onClick={resetAll}>
            ← Try a different topic
          </button>
        )}

        {/* Error */}
        {error && <p className="auth-error">{error}</p>}

        {/* Attempt banner */}
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

        {/* Explanation + everything after */}
        {explanation && !loading && (
          <>
            <ExplanationCard
              explanation={explanation}
              style={selectedStyle}
              attempt={attempt}
            />

            {/* RAG rating */}
            {!ragDone && (
              <RAGRating onRate={handleRag} disabled={false} />
            )}

            {/* Style picker after Red/Amber */}
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

            {/* All styles exhausted */}
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

            {/* Question count picker — shown after Green, before quiz loads */}
{ragDone && !showQuiz && !showStylePicker && !allStylesExhausted && (
  <div className="question-count">
    <p className="style-label">How many questions do you want?</p>
    <div className="question-count-options">
      {[1, 2, 3, 5].map(n => (
        <button
          key={n}
          className={`question-count-btn ${numQuestions === n ? 'question-count-active' : ''}`}
          onClick={() => setNumQuestions(n)}
        >
          {n}
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
  <button
    className="btn-primary"
    style={{ width: 'auto' }}
    onClick={() => { setShowQuiz(true); fetchQuiz() }}
  >
    Start quiz →
  </button>
  <button
  className="btn-ghost"
  style={{ width: 'auto' }}
  onClick={() => {
    setShowQuiz(true)
    setQuizScore(null)
    setQuizComplete(true)
  }}
>
  Skip quiz
</button>
</div>
  </div>
)}

{/* Quiz section */}
{showQuiz && (
  <div className="quiz-wrap">

                {/* Loading questions */}
                {quizLoading && (
                  <div className="quiz-loading">
                    <p>Generating quiz questions...</p>
                    <SkeletonCard />
                  </div>
                )}

                {/* Questions */}
                {!quizLoading && questions.length > 0 && !quizComplete && (
                  <QuizCard
                    questions={questions}
                    onComplete={handleQuizComplete}
                    onSkip={handleQuizSkip}
                  />
                )}

                {/* Quiz failed to load */}
                {!quizLoading && questions.length === 0 && !quizComplete && (
                  <div className="quiz-unavailable">
                    <p>Quiz unavailable for this explanation.</p>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto' }}
                      onClick={handleQuizSkip}
                    >
                      Continue anyway →
                    </button>
                  </div>
                )}

                {/* Score screen */}
                {quizComplete && (
                  <div className="quiz-complete">
                    {quizScore !== null ? (
                      <>
                        <h3>
                          {quizScore >= 80 ? '🎉' : quizScore >= 60 ? '👍' : '💪'}{' '}
                          You scored {quizScore}%
                        </h3>
                        <p>
                          {quizScore >= 80
                            ? 'Excellent — you really understood that.'
                            : quizScore >= 60
                            ? 'Good — you got the main ideas.'
                            : "Don't worry — try a different explanation style."}
                        </p>
                      </>
                    ) : (
                      <h3>Quiz skipped</h3>
                    )}
                    <div className="quiz-complete-actions">
                      <button
                        className="btn-primary"
                        style={{ width: 'auto' }}
                        onClick={resetAll}
                      >
                        Learn another topic →
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ width: 'auto' }}
                        onClick={() => navigate('/dashboard')}
                      >
                        Back to dashboard
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

// ─── Main CourseDetail page ───────────────────────────────────────────────────
export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTopic, setActiveTopic] = useState(null)
  const [autoAdvance, setAutoAdvance] = useState(true)

 

  
useEffect(() => {
  async function load() {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        credentials: 'include'
      })
      if (!res.ok) { navigate('/courses'); return }
      const data = await res.json()
      setCourse(data.course)
      const firstIncomplete = data.course.topics.find(t => t.status !== 'complete')
      if (firstIncomplete) setActiveTopic(firstIncomplete)
    } catch {
      navigate('/courses')
    } finally {
      setLoading(false)
    }
  }
  load()
}, [id, navigate])

  async function markTopicComplete(topicId) {
    try {
      await fetch(`http://localhost:5000/api/courses/${id}/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'complete' })
      })
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setCourse(data.course)

      if (autoAdvance) {
        const next = data.course.topics.find(t => t.status !== 'complete')
        setActiveTopic(next || null)
      } else {
        setActiveTopic(null)
      }
    } catch {
      console.error('Failed to mark topic complete')
    }
  }

  if (loading) return <div className="auth-loading">Loading course...</div>
  if (!course) return null

  const completed = course.topics.filter(t => t.status === 'complete').length
  const total = course.topics.length

  return (
    <div className="dashboard">
      <nav className="navbar">
        <button className="navbar-back" onClick={() => navigate('/courses')}>
          ← Courses
        </button>
        <span className="navbar-logo">AdaptLearn</span>
        <span />
      </nav>

      <div className="cd-layout">

        {/* Sidebar checklist */}
        <div className="cd-sidebar">
          <div className="cd-sidebar-header">
            <div className="cd-course-title">{course.title}</div>
            <div className="cd-progress-row">
              <div className="cd-progress-bar">
                <div className="cd-progress-fill" style={{ width: `${course.progress_pct}%` }} />
              </div>
              <span className="cd-progress-label">{completed}/{total}</span>
            </div>
          </div>

          <div className="cd-advance-toggle">
            <span className="settings-toggle-label" style={{ fontSize: 13 }}>Auto-advance</span>
            <button
              className={`settings-toggle ${autoAdvance ? 'settings-toggle-on' : ''}`}
              onClick={() => setAutoAdvance(!autoAdvance)}
              style={{ width: 38, height: 22 }}
            >
              <span className="settings-toggle-knob" style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div className="cd-topics">
            {course.topics.map(t => (
              <button
                key={t.id}
                className={`cd-topic-btn ${activeTopic?.id === t.id ? 'cd-topic-active' : ''} ${t.status === 'complete' ? 'cd-topic-done' : ''}`}
                onClick={() => setActiveTopic(t)}
              >
                <span className="cd-topic-icon">
                  {t.status === 'complete' ? '✓' : activeTopic?.id === t.id ? '▶' : '○'}
                </span>
                <span className="cd-topic-name">{t.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="cd-main">
          {activeTopic ? (
            <div>
              <div className="cd-active-header">
                <span className="cd-active-label">Now learning</span>
                <h2 className="cd-active-topic">{activeTopic.title}</h2>
              </div>
              <CourseLearner
                key={activeTopic.id}
                topic={activeTopic}
                docText={course.doc_text}
                onComplete={() => markTopicComplete(activeTopic.id)}
              />
            </div>
          ) : (
            <div className="cd-complete-state">
              {completed === total ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <h2>Course complete!</h2>
                  <p>You've finished all {total} topics in {course.title}.</p>
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', marginTop: 20 }}
                    onClick={() => navigate('/courses')}
                  >
                    Back to courses
                  </button>
                </>
              ) : (
                <>
                  <h2>Pick a topic to start</h2>
                  <p>Select a topic from the list to begin learning.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Embedded learn loop ──────────────────────────────────────────────────────
const STYLE_ORDER = ['analogy', 'story', 'steps', 'eli5', 'expert']

function CourseLearner({ topic, docText, onComplete }) {
  const [selectedStyle, setSelectedStyle] = useState('analogy')
  const [loadingExp, setLoadingExp] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [explanationId, setExplanationId] = useState(null)
  const [error, setError] = useState('')
  const [ragDone, setRagDone] = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [showAmberChoice, setShowAmberChoice] = useState(false)
  const [showQuizPicker, setShowQuizPicker] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [allExhausted, setAllExhausted] = useState(false)
  const [attempt, setAttempt] = useState(1)
  const [usedStyles, setUsedStyles] = useState([])
  const [numQuestions, setNumQuestions] = useState(3)
  const [questions, setQuestions] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // key prop on CourseLearner handles reset when topic changes — no useEffect needed

  async function explainTopic(style, attemptNum, used) {
    setLoadingExp(true)
    setExplanation(null)
    setError('')
    setRagDone(false)
    setShowStylePicker(false)
    setShowAmberChoice(false)
    setShowQuizPicker(false)
    setShowQuiz(false)
    setAllExhausted(false)

    try {
      const res = await fetch('http://localhost:5000/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: topic.title,
          style,
          doc_text: docText || null,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setExplanation(data.explanation)
        setExplanationId(data.explanation_id)
        setAttempt(attemptNum)
        setUsedStyles(used)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoadingExp(false)
    }
  }

  function startExplain() {
    const used = [selectedStyle]
    explainTopic(selectedStyle, 1, used)
  }

  async function handleRag(rating) {
    setRagDone(true)
    if (explanationId) {
      await fetch(`http://localhost:5000/api/explanations/${explanationId}/rag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating })
      })
    }
    if (rating === 'green') {
      setShowQuizPicker(true)
    } else if (rating === 'amber') {
      setShowAmberChoice(true)
    } else {
      const remaining = STYLE_ORDER.filter(s => !usedStyles.includes(s))
      if (remaining.length === 0) setAllExhausted(true)
      else setShowStylePicker(true)
    }
  }

  function pickStyle(style) {
    setShowStylePicker(false)
    setShowAmberChoice(false)
    const newUsed = [...usedStyles, style]
    explainTopic(style, attempt + 1, newUsed)
  }

  async function fetchQuiz() {
    if (!explanation) return
    setQuizLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ explanation_text: explanation, num_questions: numQuestions })
      })
      const data = await res.json()
      setQuestions(res.ok ? (data.questions || []) : [])
    } catch {
      setQuestions([])
    } finally {
      setQuizLoading(false)
    }
  }

  async function handleBookmark() {
    if (!explanationId || isBookmarked) return
    try {
      await fetch('http://localhost:5000/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ explanation_id: explanationId })
      })
      setIsBookmarked(true)
    } catch {
      console.error('Bookmark failed')
    }
  }

  function resetToInput() {
    setExplanation(null)
    setRagDone(false)
    setShowStylePicker(false)
    setShowAmberChoice(false)
    setShowQuizPicker(false)
    setShowQuiz(false)
    setAllExhausted(false)
    setAttempt(1)
    setUsedStyles([])
    setQuestions([])
    setQuizScore(null)
    setQuizComplete(false)
    setIsBookmarked(false)
    setError('')
  }

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Style selector + explain button */}
      {!explanation && !loadingExp && (
        <div className="learn-input-section" style={{ marginBottom: 20 }}>
          <div className="style-selector">
            <p className="style-label">Explanation style</p>
            <div className="style-options">
              {STYLE_ORDER.map(s => (
                <button
                  key={s}
                  className={`style-option ${selectedStyle === s ? 'style-option-active' : ''}`}
                  onClick={() => setSelectedStyle(s)}
                >
                  <span className="style-name" style={{ textTransform: 'capitalize' }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 14, marginBottom: 0 }}
            onClick={startExplain}
          >
            Explain this topic →
          </button>
        </div>
      )}

      {(explanation || loadingExp) && (
        <button className="new-topic-btn" onClick={resetToInput}>
          ← Change style
        </button>
      )}

      {error && <p className="auth-error">{error}</p>}

      {attempt > 1 && (
        <div className="attempt-banner">
          Attempt {attempt} — trying <strong style={{ textTransform: 'capitalize' }}>
            {usedStyles[usedStyles.length - 1]}
          </strong>
        </div>
      )}

      {/* Loading */}
      {loadingExp && (
        <div>
          <p className="loading-text">Generating explanation...</p>
          <div className="skeleton-card">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`skeleton-line ${i === 2 ? 'skeleton-line-short' : ''}`} />
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && !loadingExp && (
        <>
          <div className="explanation-card">
            <div className="explanation-header">
              <span className="explanation-badge" style={{ textTransform: 'capitalize' }}>
                {usedStyles[usedStyles.length - 1]}
              </span>
              {attempt > 1 && <span className="attempt-badge">Attempt {attempt}</span>}
              <button
                className={`bookmark-btn ${isBookmarked ? 'bookmark-btn-active' : ''}`}
                onClick={handleBookmark}
              >
                🔖 <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>
            <div className="explanation-text">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          </div>

          {/* RAG */}
          {!ragDone && (
            <div className="rag-wrap">
              <p className="rag-label">How well did you understand that?</p>
              <div className="rag-buttons">
                <button className="rag-btn rag-red" onClick={() => handleRag('red')}>🔴 Didn't get it</button>
                <button className="rag-btn rag-amber" onClick={() => handleRag('amber')}>🟡 Partially</button>
                <button className="rag-btn rag-green" onClick={() => handleRag('green')}>🟢 Got it</button>
              </div>
            </div>
          )}

          {/* Amber choice */}
          {showAmberChoice && (
            <div className="rag-wrap">
              <p className="rag-label">You partially got it — what would you like to do?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" style={{ width: 'auto' }}
                  onClick={() => { setShowAmberChoice(false); setShowQuizPicker(true) }}>
                  Test what I understood →
                </button>
                <button className="btn-ghost" style={{ width: 'auto' }}
                  onClick={() => {
                    setShowAmberChoice(false)
                    const remaining = STYLE_ORDER.filter(s => !usedStyles.includes(s))
                    if (remaining.length === 0) setAllExhausted(true)
                    else setShowStylePicker(true)
                  }}>
                  Try different explanation
                </button>
              </div>
            </div>
          )}

          {/* Style picker */}
          {showStylePicker && (
            <div className="style-picker-wrap">
              <p className="style-picker-label">Pick a style to try next:</p>
              <div className="style-picker-options">
                {STYLE_ORDER.filter(s => !usedStyles.includes(s)).map(s => (
                  <button key={s} className="style-picker-btn" onClick={() => pickStyle(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All exhausted */}
          {allExhausted && (
            <div className="exhausted-message">
              <h3>You've tried every style for this topic.</h3>
              <p>Move on and come back later, or mark it as done anyway.</p>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 16 }} onClick={onComplete}>
                Mark as done and continue →
              </button>
            </div>
          )}

          {/* Quiz picker */}
          {showQuizPicker && !showQuiz && (
            <div className="rag-wrap">
              <p className="rag-label">How many quiz questions?</p>
              <div className="question-count-options" style={{ marginBottom: 14 }}>
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" style={{ width: 'auto' }}
                  onClick={() => { setShowQuiz(true); fetchQuiz() }}>
                  Start quiz →
                </button>
                <button className="btn-ghost" style={{ width: 'auto' }}
                  onClick={() => { setShowQuiz(true); setQuizComplete(true); setQuizScore(null) }}>
                  Skip quiz
                </button>
              </div>
            </div>
          )}

          {/* Quiz */}
          {showQuiz && (
            <div className="quiz-wrap">
              {quizLoading && <p className="loading-text">Generating questions...</p>}

              {!quizLoading && questions.length > 0 && !quizComplete && (
                <QuizCardInline
                  questions={questions}
                  explanationId={explanationId}
                  onComplete={(score) => { setQuizScore(score); setQuizComplete(true) }}
                  onSkip={() => { setQuizScore(null); setQuizComplete(true) }}
                />
              )}

              {quizComplete && (
                <div className="quiz-complete">
                  {quizScore !== null ? (
                    <>
                      <h3>{quizScore >= 80 ? '🎉' : quizScore >= 60 ? '👍' : '💪'} You scored {quizScore}%</h3>
                      <p>{quizScore >= 80 ? 'Great understanding!' : quizScore >= 60 ? 'Good — keep going.' : "Let's move on — you can revisit this."}</p>
                    </>
                  ) : (
                    <h3>Quiz skipped</h3>
                  )}
                  <div className="quiz-complete-actions">
                    <button className="btn-primary" style={{ width: 'auto' }} onClick={onComplete}>
                      Next topic →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Inline quiz card ─────────────────────────────────────────────────────────
function QuizCardInline({ questions, explanationId, onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)

  const q = questions[currentIndex]
  const isCorrect = answered && selected === q.correct_index

  function handleSubmit() {
    if (selected === null) return
    setAnswered(true)
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)

    if (currentIndex >= questions.length - 1) {
      if (explanationId) {
        fetch('http://localhost:5000/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ explanation_id: explanationId, questions, answers: newAnswers })
        })
      }
      setTimeout(() => {
        const correct = newAnswers.filter((a, i) => a === questions[i].correct_index).length
        setDone(true)
        onComplete(Math.round((correct / questions.length) * 100))
      }, 1000)
    }
  }

  function handleNext() {
    setCurrentIndex(currentIndex + 1)
    setSelected(null)
    setAnswered(false)
  }

  if (done) return null

  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <span className="quiz-progress">Question {currentIndex + 1} of {questions.length}</span>
        <button className="quiz-skip" onClick={onSkip}>Skip quiz →</button>
      </div>
      <p className="quiz-question">{q.question}</p>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (answered) {
            if (i === q.correct_index) cls += ' quiz-option-correct'
            else if (i === selected) cls += ' quiz-option-wrong'
          } else if (i === selected) cls += ' quiz-option-selected'
          return (
            <button key={i} className={cls}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {!answered && (
        <button className="btn-primary" onClick={handleSubmit}
          disabled={selected === null} style={{ marginTop: 16 }}>
          Submit answer
        </button>
      )}
      {answered && (
        <>
          <p className={`quiz-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            {isCorrect ? '✓ Correct!' : `✗ Correct answer: ${q.options[q.correct_index]}`}
          </p>
          {currentIndex < questions.length - 1 && (
            <button className="btn-primary" style={{ marginTop: 12, width: 'auto' }} onClick={handleNext}>
              Next question →
            </button>
          )}
        </>
      )}
    </div>
  )
}
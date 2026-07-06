import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QuizCard from '../components/QuizCard'
import ReactMarkdown from 'react-markdown'

function RagPill({ rating }) {
  const map = {
    green: { bg: 'var(--greensoft)', color: 'var(--green)', label: 'Got it' },
    amber: { bg: 'var(--ambersoft)', color: 'var(--amber)', label: 'Partially' },
    red:   { bg: 'var(--redsoft)',   color: 'var(--red)',   label: "Didn't get it" },
  }
  const s = map[rating]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontWeight: 700, fontSize: 13,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // session data
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // regen quiz state
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenQuestions, setRegenQuestions] = useState(null)
  const [regenDone, setRegenDone] = useState(false)
  const [regenScore, setRegenScore] = useState(null)
  const [regenExpId, setRegenExpId] = useState(null)

  const [regenNumQuestions, setRegenNumQuestions] = useState(3)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
          credentials: 'include'
        })
        if (!res.ok) { navigate('/history'); return }
        const data = await res.json()
        setSession(data.session)
      } catch { navigate('/history') }
      finally { setLoading(false) }
    }
    load()
  }, [id, navigate])

  async function regenerateQuiz(explanationText, explanationId) {
  setRegenExpId(explanationId)
  setRegenLoading(true)
  setRegenQuestions(null)
  setRegenDone(false)
  setRegenScore(null)

  try {
    const res = await fetch('http://localhost:5000/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        explanation_text: explanationText,
        num_questions: regenNumQuestions
      })
    })
    const data = await res.json()
    if (res.ok) setRegenQuestions(data.questions)
  } catch {
    // silently ignore
  } finally {
    setRegenLoading(false)
  }
}
  if (loading) return <div className="auth-loading">Loading session...</div>
  if (!session) return null

  return (
    <div className="learn-page">

      <nav className="navbar">
        <button className="navbar-back" onClick={() => navigate('/history')}>
          ← History
        </button>
        <span className="navbar-logo">AdaptLearn</span>
        <span />
      </nav>

      <div className="learn-content">

        {/* Topic header */}
        <div className="session-detail-header">
          <h1 className="session-detail-topic">{session.topic}</h1>
          <div className="session-detail-meta">
            {session.quiz_score !== null && session.quiz_score !== undefined && (
              <span className="db-pill-neutral">Quiz {session.quiz_score}%</span>
            )}
            {session.total_attempts > 1 && (
              <span className="db-pill-neutral">{session.total_attempts} attempts</span>
            )}
          </div>
        </div>

        {/* Each explanation attempt */}
        {session.explanations.map((exp) => (
          <div key={exp.id} className="session-detail-block">

            {/* Explanation card */}
            <div className="explanation-card">
              <div className="explanation-header">
                <span className="explanation-badge">{exp.style}</span>
                {exp.rag_rating && <RagPill rating={exp.rag_rating} />}
                {session.explanations.length > 1 && (
                  <span className="attempt-badge">Attempt {exp.attempt_number}</span>
                )}
              </div>
              <div className="explanation-text">
  <ReactMarkdown>{exp.response_text}</ReactMarkdown>
</div>
            </div>

            {/* Quiz results */}
            {exp.quiz_results && exp.quiz_results.length > 0 && (
              <div className="session-quiz-block">
                <div className="session-quiz-title">
                  Quiz results
                  {session.quiz_score !== null && (
                    <span className="session-quiz-score">{session.quiz_score}%</span>
                  )}
                </div>
                {exp.quiz_results.map((q, qi) => {
                  const options = JSON.parse(q.options)
                  return (
                    <div key={qi} className="session-quiz-item">
                      <div className="session-quiz-q">{q.question}</div>
                      <div className="session-quiz-opts">
                        {options.map((opt, oi) => {
                          let cls = 'session-quiz-opt'
                          if (oi === q.correct_index) cls += ' sqo-correct'
                          else if (oi === q.user_answer_index && !q.correct) cls += ' sqo-wrong'
                          else if (oi === q.user_answer_index) cls += ' sqo-selected'
                          return (
                            <div key={oi} className={cls}>
                              <span className="sqo-marker">
                                {oi === q.correct_index ? '✓' :
                                 oi === q.user_answer_index && !q.correct ? '✗' : ''}
                              </span>
                              {opt}
                              {oi === q.user_answer_index && (
                                <span className="sqo-yours">your answer</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Regenerate quiz */}
<div style={{ marginTop: 16 }}>
  <div className="question-count" style={{ marginBottom: 12 }}>
    <p className="style-label">How many questions?</p>
    <div className="question-count-options">
      {[1, 2, 3, 5].map(n => (
        <button
          key={n}
          className={`question-count-btn ${regenNumQuestions === n ? 'question-count-active' : ''}`}
          onClick={() => setRegenNumQuestions(n)}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
  <button
    className="btn-ghost"
    style={{ width: 'auto' }}
    onClick={() => regenerateQuiz(exp.response_text, exp.id)}
    disabled={regenLoading && regenExpId === exp.id}
  >
    {regenLoading && regenExpId === exp.id
      ? 'Generating...'
      : '🔄 Generate new quiz questions'}
  </button>
</div>

            {/* New quiz */}
            {regenQuestions && regenExpId === exp.id && !regenDone && (
              <div style={{ marginTop: 16 }}>
                <QuizCard
                  questions={regenQuestions}
                  explanationId={exp.id}
                  onComplete={(score) => {
                    setRegenScore(score)
                    setRegenDone(true)
                  }}
                  onSkip={() => setRegenDone(true)}
                />
              </div>
            )}

            {/* Regen score */}
            {regenDone && regenExpId === exp.id && regenScore !== null && (
              <div className="quiz-complete" style={{ marginTop: 16 }}>
                <h3>
                  {regenScore >= 80 ? '🎉' : regenScore >= 60 ? '👍' : '💪'} You scored {regenScore}%
                </h3>
                <p>
                  {regenScore >= 80
                    ? 'Excellent retention!'
                    : regenScore >= 60
                    ? 'Getting there.'
                    : 'Keep reviewing.'}
                </p>
                <button
                  className="btn-ghost"
                  style={{ width: 'auto', marginTop: 12 }}
                  onClick={() => {
                    setRegenQuestions(null)
                    setRegenDone(false)
                    setRegenScore(null)
                  }}
                >
                  Try again
                </button>
              </div>
            )}

          </div>
        ))}

        {/* Actions */}
        <div className="session-detail-actions">
          <button
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => navigate('/learn')}
          >
            Learn this topic again →
          </button>
          <button
            className="btn-ghost"
            style={{ width: 'auto' }}
            onClick={() => navigate('/history')}
          >
            ← Back to history
          </button>
        </div>

      </div>
    </div>
  )
}
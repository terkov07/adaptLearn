import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../api'

const QUESTIONS = [
  {
    id: 'q1',
    heading: 'First, about your background',
    question: 'Which best describes your current situation?',
    options: [
      { label: 'Currently studying GCSEs', sub: 'Year 10 or 11', value: 'hard' },
      { label: 'I have GCSEs — now at sixth form or college', sub: 'A-Levels or equivalent', value: 'time' },
      { label: 'I have A-Levels — now at university or beyond', sub: 'Undergraduate or postgraduate', value: 'quickly' },
      { label: 'Self-taught or professional', sub: "I've built knowledge outside formal education", value: 'already' },
    ]
  },
  {
    id: 'q2',
    heading: 'How your mind works',
    question: 'When someone explains something new to you, which feels most natural?',
    options: [
      { label: "Show me something it's similar to", sub: '"It\'s like a..." — connect it to something familiar', value: 'similar' },
      { label: 'Tell me a story about it', sub: 'Make it come alive with narrative', value: 'story' },
      { label: 'Break it down step by step', sub: 'One clear idea at a time', value: 'stepbystep' },
      { label: 'Just give me the facts directly', sub: 'Clear, precise, no fluff', value: 'facts' },
    ]
  },
  {
    id: 'q3',
    heading: 'When things feel confusing',
    question: "When you're reading something and it's not making sense, what usually happens?",
    options: [
      { label: 'I get frustrated and want to stop', sub: 'Confusion kills my motivation quickly', value: 'frustrated' },
      { label: 'I re-read it slowly and usually get there', sub: 'Patience and persistence', value: 'reread' },
      { label: 'I try to break it into smaller pieces', sub: 'Chunking it down helps me', value: 'smaller' },
      { label: 'I look for the core idea and ignore the detail', sub: 'Big picture first, detail later', value: 'mainidea' },
    ]
  },
  {
    id: 'q4',
    heading: 'How you remember things',
    question: 'When you recall something you learned, how does it come back to you?',
    options: [
      { label: 'As a picture or scene in my head', sub: 'Visual and narrative memory', value: 'picture' },
      { label: 'As a comparison — "it\'s like when..."', sub: 'Analogical memory', value: 'comparison' },
      { label: 'As a sequence — first this, then that', sub: 'Sequential memory', value: 'sequence' },
      { label: 'As a fact or definition', sub: 'Propositional memory', value: 'fact' },
    ]
  },
  {
    id: 'q5',
    heading: 'Why you\'re here',
    question: "What's the main reason you want to understand things better?",
    options: [
      { label: 'I have exams or assessments coming up', sub: 'Revision with a deadline', value: 'exams' },
      { label: "I'm genuinely curious about something", sub: 'Learning for the love of it', value: 'curious' },
      { label: 'I missed something and need to catch up', sub: 'Filling a gap in my knowledge', value: 'catchup' },
      { label: 'I want to go deeper on something I know', sub: 'Building on existing understanding', value: 'deeply' },
    ]
  },
  {
    id: 'q6',
    heading: 'What puts you off',
    question: 'When reading an explanation, what bothers you most?',
    options: [
      { label: "It goes on too long and I lose track", sub: 'Brevity matters to me', value: 'toolong' },
      { label: "It uses words I don't know", sub: 'Jargon gets in the way', value: 'jargon' },
      { label: "It's too vague and doesn't go deep enough", sub: 'I want the real detail', value: 'toovague' },
      { label: "It's too abstract — no real examples", sub: 'I need something concrete to hold onto', value: 'abstract' },
    ]
  },
]

const STYLE_INFO = {
  analogy: {
    name: 'Analogy',
    icon: '🔗',
    tagline: 'You understand the unknown through the known.',
    description: 'You build understanding by connecting new ideas to things you already know well. When someone says "it\'s like a...", your brain lights up. You process information by finding familiar structures to hang new concepts on.',
    strengths: ['Excellent at transferring knowledge between domains', 'Strong intuitive grasp of abstract concepts', 'Naturally builds rich mental models'],
    tip: 'When an analogy explanation finishes, ask yourself: "what does this comparison miss?" — that gap reveals the most important nuance.',
  },
  story: {
    name: 'Story',
    icon: '📖',
    tagline: 'You understand through narrative and meaning.',
    description: 'Your brain naturally encodes information through narrative structure — characters, causality, and consequence. You remember things better when they have a story arc. Abstract information comes alive for you when it has a protagonist.',
    strengths: ['Strong emotional memory for learning', 'Excellent long-term retention of narrative-encoded information', 'Natural ability to explain things to others'],
    tip: 'After a story explanation, try retelling it in your own words to someone else — even imagining doing so. This cements the narrative in memory.',
  },
  steps: {
    name: 'Step-by-step',
    icon: '📋',
    tagline: 'You understand by building understanding systematically.',
    description: 'You process new information best when it\'s broken into clear, ordered steps. You need to understand step one before step two feels meaningful. You are naturally analytical and prefer to build mastery incrementally rather than jumping to conclusions.',
    strengths: ['Excellent at procedural tasks and systematic thinking', 'Strong at following complex multi-stage processes', 'Careful, thorough understanding that rarely has gaps'],
    tip: 'With step-by-step explanations, pause after each step and check you can explain it before moving on. Your sequential processing style means this pays off significantly.',
  },
  eli5: {
    name: 'ELI5',
    icon: '💬',
    tagline: 'You understand best when complexity is stripped away.',
    description: 'You have a low tolerance for unnecessary complexity and jargon — not because you lack ability, but because you know that genuine understanding should be expressible simply. You\'re often more capable than standard explanations give you credit for.',
    strengths: ['Strong intuition for when something is genuinely understood vs memorised', 'Excellent at identifying the core of a concept', 'Great at explaining things to others in accessible terms'],
    tip: 'Once an ELI5 explanation clicks, try asking for the Expert version of the same topic. You may find you understand more technical language than you expected now that you have the core idea.',
  },
  expert: {
    name: 'Expert',
    icon: '🎓',
    tagline: 'You understand through precision and depth.',
    description: 'You are comfortable with technical language and actively prefer explanations that don\'t simplify away important nuance. Oversimplification frustrates you more than complexity does. You likely have significant prior knowledge in at least some domains.',
    strengths: ['Strong analytical and critical thinking', 'Comfortable with ambiguity and nuance', 'Excellent at building on existing knowledge structures'],
    tip: 'Expert explanations sometimes assume knowledge you don\'t have. If one doesn\'t click, try Analogy style — not because you need it simple, but because a well-chosen analogy can bridge a specific knowledge gap efficiently.',
  },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { recommended_style }
  const [error, setError] = useState('')

  async function handleSelect(value) {
    const questionId = QUESTIONS[current].id
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
    } else {
      await submitAnswers(newAnswers)
    }
  }

  async function submitAnswers(finalAnswers) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalAnswers)
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="onboarding-loading-screen">
        <div className="onboarding-loading-inner">
          <div className="onboarding-spinner" />
          <h2>Analysing your learning profile...</h2>
          <p>We're using your answers to find the explanation style that fits how you think.</p>
        </div>
      </div>
    )
  }

  // ── Results screen ──
  if (result) {
    const style = STYLE_INFO[result.recommended_style] || STYLE_INFO['analogy']
    return (
      <div className="onboarding-result-page">
        <div className="onboarding-result-inner">

          <div className="result-tag">Your learning profile</div>

          <div className="result-style-card">
            <div className="result-style-icon">{style.icon}</div>
            <div className="result-style-name">{style.name}</div>
            <div className="result-style-tagline">{style.tagline}</div>
          </div>

          <div className="result-description">
            <p>{style.description}</p>
          </div>

          <div className="result-strengths">
            <div className="result-strengths-title">What this says about how you think</div>
            {style.strengths.map((s, i) => (
              <div key={i} className="result-strength-row">
                <span className="result-strength-dot" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="result-tip">
            <div className="result-tip-label">💡 A tip for you</div>
            <p>{style.tip}</p>
          </div>

          <div className="result-note">
            <p>
              We've set <strong>{style.name}</strong> as your default explanation style.
              You can always choose a different style during a session, or update your preference in Settings.
              The app will also track which styles give you the best quiz scores over time.
            </p>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: 8 }}
          >
            Start learning →
          </button>

        </div>
      </div>
    )
  }

  // ── Quiz screen ──
  const q = QUESTIONS[current]

  return (
    <div className="onboarding">

      <div className="progress-dots">
        {QUESTIONS.map((_, i) => (
          <span key={i} className={i <= current ? 'dot dot-active' : 'dot'} />
        ))}
      </div>

      <p className="onboarding-framing">
        Help us understand how you think — no wrong answers
      </p>

      <h2 className="onboarding-heading">{q.heading}</h2>
      <p className="onboarding-question">{q.question}</p>

      {error && <p className="auth-error">{error}</p>}

      <div className="onboarding-options">
        {q.options.map(opt => (
          <button
            key={opt.value}
            className="onboarding-option"
            onClick={() => handleSelect(opt.value)}
          >
            <span className="onboarding-option-label">{opt.label}</span>
            <span className="onboarding-option-sub">{opt.sub}</span>
          </button>
        ))}
      </div>

      {current > 0 && (
        <button
          className="onboarding-back"
          onClick={() => setCurrent(current - 1)}
        >
          ← Back
        </button>
      )}

    </div>
  )
}
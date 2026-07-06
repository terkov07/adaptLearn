import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const STYLES = [
  { icon: '🔗', name: 'Analogy', desc: 'Connect new ideas to things you already know' },
  { icon: '📖', name: 'Story', desc: 'Learn through narrative and characters' },
  { icon: '📋', name: 'Step-by-step', desc: 'Break it down one clear idea at a time' },
  { icon: '💬', name: 'ELI5', desc: 'Simple language, no jargon, just clarity' },
  { icon: '🎓', name: 'Expert', desc: 'Full technical depth for those who want it' },
]

const HOW_STEPS = [
  {
    n: '1',
    title: 'Tell us how you think',
    body: 'A quick 6-question quiz — grounded in cognitive science — profiles how you naturally process new information.'
  },
  {
    n: '2',
    title: 'Enter any topic',
    body: 'Type anything you want to understand. We generate an explanation in the style that fits you best.'
  },
  {
    n: '3',
    title: 'Rate and adapt',
    body: "Didn't click? Rate Red or Amber and pick a different style. Green? A quiz tests and cements your understanding."
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const THEMES = ['focus', 'calm', 'energy', 'night', 'contrast']

  function cycleTheme() {
    const current = THEMES.indexOf(theme)
    setTheme(THEMES[(current + 1) % THEMES.length])
  }

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <div className="landing-logo-diamond" />
            </div>
            <span>AdaptLearn</span>
          </div>
          <div className="landing-nav-right">
            <button className="theme-toggle" onClick={cycleTheme} title="Switch theme">
              <div className="theme-toggle-icon" />
            </button>
            <button className="landing-login-btn" onClick={() => navigate('/login')}>
              Log in
            </button>
            <button className="landing-signup-btn" onClick={() => navigate('/register')}>
              Sign up
            </button>
          </div>
        </div>
      </header>

      <div className="landing-inner">

        {/* ── Hero ── */}
        <section className="landing-hero">
          <div className="landing-hero-left">
            <div className="landing-tag">
              A cognitive-science learning experiment
            </div>
            <h1 className="landing-h1">
              Anyone can understand anything — explained the right way for{' '}
              <span style={{ color: 'var(--accent)' }}>you</span>.
            </h1>
            <p className="landing-sub">
              AdaptLearn profiles how you think, explains any topic in the style
              that fits you, quizzes your understanding, and re-explains differently
              until it clicks.
            </p>
            <div className="landing-hero-btns">
              <button className="landing-cta-primary" onClick={() => navigate('/register')}>
                Get started — it's free
              </button>
              <button className="landing-cta-ghost" onClick={() => navigate('/login')}>
                I have an account
              </button>
            </div>
          </div>

          {/* Hero demo card */}
          <div className="landing-hero-card">
            <div className="landing-demo-header">
              <span className="landing-demo-topic">Topic · Photosynthesis</span>
              <span className="explanation-badge">Analogy</span>
            </div>
            <p className="landing-demo-text">
              Picture a leaf as a tiny solar-powered kitchen: sunlight is the stove,
              water and air are the ingredients, and sugar is the meal the plant cooks
              for itself…
            </p>
            <div className="landing-demo-rag">
              <div className="landing-rag-btn landing-rag-red">Red</div>
              <div className="landing-rag-btn landing-rag-amber">Amber</div>
              <div className="landing-rag-btn landing-rag-green">Green ✓</div>
            </div>
            <p className="landing-demo-hint">
              Rate how well you understood — we adapt from there
            </p>
          </div>
        </section>

        {/* ── Five styles ── */}
        <section className="landing-section">
          <div className="landing-section-label">Five ways to understand</div>
          <h2 className="landing-h2">One topic, explained five ways</h2>
          <div className="landing-styles-grid">
            {STYLES.map(s => (
              <div key={s.name} className="landing-style-card">
                <div className="landing-style-icon">{s.icon}</div>
                <div className="landing-style-name">{s.name}</div>
                <div className="landing-style-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="landing-section">
          <h2 className="landing-h2" style={{ textAlign: 'center', marginBottom: 34 }}>
            How it works
          </h2>
          <div className="landing-steps-grid">
            {HOW_STEPS.map(s => (
              <div key={s.n} className="landing-step-card">
                <div className="landing-step-num">{s.n}</div>
                <div className="landing-step-title">{s.title}</div>
                <div className="landing-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Science CTA ── */}
        <section className="landing-section">
          <div className="landing-cta-banner">
            <h2 className="landing-cta-banner-title">
              Built on how the brain actually learns
            </h2>
            <p className="landing-cta-banner-sub">
              Grounded in Cognitive Load Theory, Schema Theory and Vygotsky's Zone
              of Proximal Development — and it gets smarter the more you use it.
            </p>
            <button
              className="landing-cta-banner-btn"
              onClick={() => navigate('/register')}
            >
              Create your free account
            </button>
          </div>
          <div className="landing-footer-note">
            AdaptLearn · A personalised learning experiment
          </div>
        </section>

      </div>
    </div>
  )
}
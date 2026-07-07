import API_URL from '../api'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'


export default function Register() {
  const navigate = useNavigate()

  // which step we're on (1, 2, or 3)
  const [step, setStep] = useState(1)

  // all form data in one object
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    education_level: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // update a single field
  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value })
    setError('') // clear error when user types
  }

  // validate and move to next step
  function handleNext() {
    if (step === 1) {
      if (!formData.name) return setError('Please enter your name')
      setStep(2)
    } else if (step === 2) {
  if (!formData.email) return setError('Please enter your email')
  if (!formData.password) return setError('Please enter a password')
  if (formData.password.length < 8) return setError('Password must be at least 8 characters')
  if (formData.password !== formData.confirmPassword) return setError('Passwords do not match')
  setStep(3)
}
  }

  // education level selected — auto submit
  async function handleEducation(level) {
    setFormData({ ...formData, education_level: level })
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, education_level: level })
      })
      const data = await res.json()

      if (res.ok) {
        navigate('/onboarding')
      } else {
        setError(data.error || 'Something went wrong')
        setStep(1) // send back to start if error
      }
    } catch  {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  // password strength — simple version
  function getPasswordStrength(password) {
    if (password.length === 0) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  }

  const strength = getPasswordStrength(formData.password)

  if (loading) return <div className="auth-loading">Creating your account...</div>

  return (
    <div className="auth-page">

      {/* Progress bar */}
      <div className="register-progress">
        <div
          className="register-progress-fill"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="auth-card">

        {/* Step 1 — Personal details */}
        {step === 1 && (
          <>
            <h1>Create your account</h1>
            <p className="auth-subtitle">Step 1 of 3 — Personal details</p>

            <div className="form-group">
              <label>First name</label>
              <input
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nickname <span className="optional">(optional)</span></label>
              <input
                type="text"
                placeholder="What should we call you?"
                value={formData.nickname}
                onChange={e => handleChange('nickname', e.target.value)}
              />
              <p className="field-hint">This appears on your dashboard</p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-primary" onClick={handleNext}>
              Continue →
            </button>

            <p className="auth-link">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}

        {/* Step 2 — Account details */}
{step === 2 && (
  <>
    <h1>Account details</h1>
    <p className="auth-subtitle">Step 2 of 3 — Your login information</p>

    <div className="form-group">
      <label>Email address</label>
      <input
        type="email"
        placeholder="you@email.com"
        value={formData.email}
        onChange={e => handleChange('email', e.target.value)}
      />
    </div>

    <div className="form-group">
      <label>Password</label>
      <input
        type="password"
        placeholder="At least 8 characters"
        value={formData.password}
        onChange={e => handleChange('password', e.target.value)}
      />
      {strength && (
        <div className="password-strength">
          <div className={`strength-bar strength-${strength}`} />
          <span className={`strength-label strength-${strength}`}>
            {strength === 'weak' ? 'Too short' : strength === 'medium' ? 'Medium' : 'Strong'}
          </span>
        </div>
      )}
    </div>

    <div className="form-group">
      <label>Confirm password</label>
      <input
        type="password"
        placeholder="Same password again"
        value={formData.confirmPassword}
        onChange={e => handleChange('confirmPassword', e.target.value)}
      />
    </div>

    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          id="age-gate"
          required
          style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
        />
        <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>
          I confirm I am 13 years of age or older
        </span>
      </label>
    </div>

    {error && <p className="auth-error">{error}</p>}

    <button className="btn-primary" onClick={handleNext}>
      Continue →
    </button>

    <button className="btn-ghost" onClick={() => setStep(1)}>
      ← Back
    </button>
  </>
)}

{/* Step 3 — Ready to go */}
{step === 3 && (
  <>
    <h1>You're all set</h1>
    <p className="auth-subtitle">Step 3 of 3 — Almost there</p>
    <p className="auth-body">
      Your account is ready. Next we'll ask you a few quick questions
      to find your ideal learning style — takes about 60 seconds.
    </p>

    {error && <p className="auth-error">{error}</p>}

    <button
      className="btn-primary"
      onClick={() => handleEducation('unknown')}
      disabled={loading}
    >
      {loading ? 'Creating account...' : 'Continue to setup →'}
    </button>

    <button className="btn-ghost" onClick={() => setStep(2)}>
      ← Back
    </button>
  </>
)}

      </div>
    </div>
  )
}
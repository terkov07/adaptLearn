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

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-primary" onClick={handleNext}>
              Continue →
            </button>

            <button className="btn-ghost" onClick={() => setStep(1)}>
              ← Back
            </button>
          </>
        )}

        {/* Step 3 — Education level */}
        {step === 3 && (
          <>
            <h1>One last thing</h1>
            <p className="auth-subtitle">Step 3 of 3 — Your background</p>
            <p className="auth-body">
              This helps us pitch explanations at the right level from the start.
            </p>

            <div className="education-options">
              {[
                { value: 'gcse', label: 'GCSE', sub: 'Currently studying or recently completed' },
                { value: 'alevel', label: 'A-Level', sub: 'Sixth form or college' },
                { value: 'university', label: 'University', sub: 'Undergraduate or postgraduate' },
                { value: 'self_taught', label: 'Self-taught', sub: "I've built knowledge outside formal education" },
                { value: 'expert', label: 'Expert', sub: 'Professional or specialist in my field' },
                { value: 'other', label: 'Other', sub: "Doesn't quite fit the above" },
              ].map(option => (
                <button
                  key={option.value}
                  className="education-option"
                  onClick={() => handleEducation(option.value)}
                >
                  <span className="education-label">{option.label}</span>
                  <span className="education-sub">{option.sub}</span>
                </button>
              ))}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn-ghost" onClick={() => setStep(2)}>
              ← Back
            </button>
          </>
        )}

      </div>
    </div>
  )
}
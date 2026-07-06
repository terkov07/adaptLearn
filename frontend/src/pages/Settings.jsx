import API_URL from '../api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Navbar from '../components/Navbar'


const STYLES = [
  { value: 'analogy',  label: 'Analogy',      desc: 'Compare to something familiar' },
  { value: 'story',    label: 'Story',         desc: 'Learn through narrative' },
  { value: 'steps',    label: 'Step-by-step',  desc: 'One idea at a time' },
  { value: 'eli5',     label: 'ELI5',          desc: 'Simple, no jargon' },
  { value: 'expert',   label: 'Expert',        desc: 'Full technical depth' },
]

const THEMES = [
  { value: 'focus',    label: 'Focus',    color: '#5b4ec8' },
  { value: 'calm',     label: 'Calm',     color: '#0f6e56' },
  { value: 'energy',   label: 'Energy',   color: '#e67e22' },
  { value: 'night',    label: 'Night',    color: '#8b7ff0' },
  { value: 'contrast', label: 'Contrast', color: '#f5c518' },
]

const TEXT_SIZES = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
]

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Profile tab state
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')

  // Preferences tab state
  const [preferredStyle, setPreferredStyle] = useState('analogy')
  const [autoAdvance, setAutoAdvance] = useState(true)

  // Appearance tab state
  const [textSize, setTextSize] = useState('md')

  // Account tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        })
        if (!res.ok) { navigate('/login'); return }
        const data = await res.json()
        setUser(data.user)
        setName(data.user.name || '')
        setNickname(data.user.nickname || '')
        setPreferredStyle(data.user.preferences?.preferred_style || 'analogy')
        setAutoAdvance(data.user.preferences?.auto_advance ?? true)
        setTextSize(data.user.preferences?.text_size || 'md')
      } catch { navigate('/login') }
      finally { setLoading(false) }
    }
    loadUser()
  }, [navigate])

  function showMessage(msg, isError = false) {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, nickname })
      })
      if (res.ok) showMessage('Profile saved')
      else showMessage('Failed to save', true)
    } catch { showMessage('Could not connect', true) }
    finally { setSaving(false) }
  }

  async function savePreferences() {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferred_style: preferredStyle, auto_advance: autoAdvance })
      })
      if (res.ok) showMessage('Preferences saved')
      else showMessage('Failed to save', true)
    } catch { showMessage('Could not connect', true) }
    finally { setSaving(false) }
  }

  async function saveTheme(newTheme) {
    setTheme(newTheme)
    await fetch(`${API_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ theme: newTheme })
    })
  }

  async function saveTextSize(size) {
    setTextSize(size)
    await fetch(`${API_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text_size: size })
    })
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) return showMessage('Fill in all fields', true)
    if (newPassword.length < 8) return showMessage('New password must be at least 8 characters', true)
    if (newPassword !== confirmPassword) return showMessage('Passwords do not match', true)

    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/user/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      })
      if (res.ok) {
        showMessage('Password changed')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        showMessage(data.error || 'Failed to change password', true)
      }
    } catch { showMessage('Could not connect', true) }
    finally { setSaving(false) }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return showMessage('Type DELETE to confirm', true)

    try {
      const res = await fetch(`${API_URL}/api/user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm: 'DELETE' })
      })
      if (res.ok) navigate('/login')
      else showMessage('Failed to delete account', true)
    } catch { showMessage('Could not connect', true) }
  }

  if (loading) return <div className="auth-loading">Loading settings...</div>

  return (
    <div className="settings-page">

      {/* Navbar */}
      <Navbar user={user} showBack backTo="/dashboard" backLabel="Dashboard" />

      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        {/* Tabs */}
        <div className="settings-tabs">
          {['profile', 'preferences', 'appearance', 'account'].map(tab => (
            <button
              key={tab}
              className={`settings-tab ${activeTab === tab ? 'settings-tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && <div className="settings-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="settings-card">
            <div className="settings-section-title">Personal details</div>

            <div className="settings-avatar">
              {(nickname || name || '?')[0].toUpperCase()}
            </div>

            <div className="form-group">
              <label>First name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nickname <span className="optional">(shown on dashboard)</span></label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span className="field-hint">Email cannot be changed</span>
            </div>

            <div className="settings-stats-row">
              <div className="settings-stat">
                <span className="settings-stat-num">{user?.stats?.xp || 0}</span>
                <span className="settings-stat-label">Total XP</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-num">{user?.stats?.streak || 0}</span>
                <span className="settings-stat-label">Day streak</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-num">{user?.stats?.total_sessions || 0}</span>
                <span className="settings-stat-label">Sessions</span>
              </div>
            </div>

            <button className="btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        {/* ── PREFERENCES TAB ── */}
        {activeTab === 'preferences' && (
          <div className="settings-card">
            <div className="settings-section-title">Learning preferences</div>

            <div className="form-group">
              <label>Default explanation style</label>
              <p className="field-hint" style={{ marginBottom: 10 }}>
                This is pre-selected when you start a new topic
              </p>
              <div className="style-options">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    className={`style-option ${preferredStyle === s.value ? 'style-option-active' : ''}`}
                    onClick={() => setPreferredStyle(s.value)}
                  >
                    <span className="style-name">{s.label}</span>
                    <span className="style-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Auto-advance in courses</div>
                <div className="settings-toggle-desc">
                  Load the next topic automatically when one is complete
                </div>
              </div>
              <button
                className={`settings-toggle ${autoAdvance ? 'settings-toggle-on' : ''}`}
                onClick={() => setAutoAdvance(!autoAdvance)}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>

            <div className="settings-divider" />

            <div className="settings-retake">
              <div>
                <div className="settings-toggle-label">Retake learning style quiz</div>
                <div className="settings-toggle-desc">
                  Redo the onboarding quiz to refine your style recommendation
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ width: 'auto' }}
                onClick={() => navigate('/onboarding')}
              >
                Retake quiz →
              </button>
            </div>

            <div className="settings-divider" />

            <button className="btn-primary" onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === 'appearance' && (
          <div className="settings-card">
            <div className="settings-section-title">Appearance</div>

            <div className="form-group">
              <label>Theme</label>
              <p className="field-hint" style={{ marginBottom: 12 }}>
                Changes apply instantly across the whole app
              </p>
              <div className="theme-swatches">
                {THEMES.map(t => (
                  <button
                    key={t.value}
                    className={`theme-swatch ${theme === t.value ? 'theme-swatch-active' : ''}`}
                    onClick={() => saveTheme(t.value)}
                    title={t.label}
                  >
                    <span
                      className="theme-swatch-color"
                      style={{ background: t.color }}
                    />
                    <span className="theme-swatch-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            <div className="form-group">
              <label>Text size</label>
              <div className="text-size-options">
                {TEXT_SIZES.map(s => (
                  <button
                    key={s.value}
                    className={`text-size-btn ${textSize === s.value ? 'text-size-active' : ''}`}
                    onClick={() => saveTextSize(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div className="settings-card">
            <div className="settings-section-title">Change password</div>

            <div className="form-group">
              <label>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
              />
            </div>

            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Same as above"
              />
            </div>

            <button className="btn-primary" onClick={changePassword} disabled={saving}>
              {saving ? 'Saving...' : 'Change password'}
            </button>

            <div className="settings-divider" style={{ marginTop: 32 }} />

            <div className="settings-section-title" style={{ color: 'var(--red)' }}>
              Danger zone
            </div>

            {!showDeleteConfirm ? (
              <button
                className="btn-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete my account
              </button>
            ) : (
              <div className="delete-confirm-box">
                <p>This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.</p>
                <div className="form-group">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE"
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-delete" onClick={deleteAccount}>
                    Permanently delete
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ width: 'auto' }}
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm('') }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
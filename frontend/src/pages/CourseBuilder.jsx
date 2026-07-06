import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LEVELS = ['GCSE', 'A-Level', 'University', 'Beginner', 'Expert']

export default function CourseBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // step 1
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('')

  // step 2
  const [sourceType, setSourceType] = useState('')

  // step 3
  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState('')
  const [docText, setDocText] = useState('')
  const [sourceFilename, setSourceFilename] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractSuccess, setExtractSuccess] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setExtracting(true)
    setExtractError('')
    setExtractSuccess(false)
    setSourceFilename(file.name)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setTopics(data.topics || [])
        setDocText(data.doc_text || '')
        setExtractSuccess(true)
      } else {
        setExtractError(data.error || 'Extraction failed')
      }
    } catch {
      setExtractError('Could not connect to server')
    } finally {
      setExtracting(false)
    }
  }

  function addTopic() {
    if (!newTopic.trim()) return
    setTopics(prev => [...prev, newTopic.trim()])
    setNewTopic('')
  }

  function removeTopic(index) {
    setTopics(prev => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTopic()
  }

  async function saveCourse() {
    if (topics.length === 0) {
      setError('Add at least one topic')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          topics,
          source_type: sourceType,
          source_filename: sourceFilename || null,
          doc_text: docText || null,
        })
      })
      const data = await res.json()
      if (res.ok) {
        navigate(`/courses/${data.course_id}`)
      } else {
        setError(data.error || 'Failed to save course')
      }
    } catch {
      setError('Could not connect to server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cb-page">
      <div className="cb-content">

        {/* Back link */}
        <button className="cb-back" onClick={() => step === 1 ? navigate('/courses') : setStep(step - 1)}>
          ‹ {step === 1 ? 'Courses' : 'Back'}
        </button>

        <h1 className="cb-title">Build a course</h1>

        {/* ── STEP 1 — Name + Level ── */}
        {step === 1 && (
          <div className="cb-card">
            <div className="form-group">
              <label>Course name</label>
              <input
                type="text"
                placeholder="e.g. AQA Psychology — Memory"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="topic-input"
                style={{ marginTop: 6 }}
              />
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Level</label>
              <div className="cb-level-options">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    className={`cb-level-btn ${level === l ? 'cb-level-active' : ''}`}
                    onClick={() => setLevel(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Import or Manual ── */}
        {step === 2 && (
          <>
            <p className="cb-step-sub">
              How do you want to add topics to <strong>{title}</strong>?
            </p>
            <div className="cb-source-grid">
              <button
                className={`cb-source-card ${sourceType === 'import' ? 'cb-source-active' : ''}`}
                onClick={() => setSourceType('import')}
              >
                <div className="cb-source-icon">↑</div>
                <div className="cb-source-name">Import a document</div>
                <div className="cb-source-desc">
                  Upload a PDF, slides or text — we extract the topics for you.
                </div>
              </button>
              <button
                className={`cb-source-card ${sourceType === 'manual' ? 'cb-source-active' : ''}`}
                onClick={() => setSourceType('manual')}
              >
                <div className="cb-source-icon">✏</div>
                <div className="cb-source-name">Build manually</div>
                <div className="cb-source-desc">
                  Add topics one at a time, in any order you like.
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3 — Topic list ── */}
        {step === 3 && (
          <div className="cb-card">
            <div className="cb-card-header">
              <span className="cb-card-title">{title}</span>
              <span className="explanation-badge">
                {sourceType === 'import' ? 'Imported from document' : 'Built manually'}
              </span>
            </div>

            {/* Import file picker */}
            {sourceType === 'import' && topics.length === 0 && !extracting && (
              <div className="cb-upload-zone">
                <input
                  type="file"
                  accept=".pdf,.pptx,.txt,.md"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cb-upload-label">
                  <div className="cb-upload-icon">↑</div>
                  <div className="cb-upload-text">
                    Click to upload PDF, PPTX or TXT
                  </div>
                  <div className="cb-upload-hint">
                    Claude will extract the topics automatically
                  </div>
                </label>
              </div>
            )}

            {extracting && (
              <div className="cb-extracting">
                <p>Reading your document and extracting topics...</p>
              </div>
            )}

            {extractError && (
              <p className="auth-error">{extractError}</p>
            )}

            {extractSuccess && (
              <div className="cb-extract-success">
                ✓ Extracted {topics.length} topics from your document — review and edit below.
              </div>
            )}

            {/* Topic count */}
            {topics.length > 0 && (
              <p className="cb-topic-count">
                {topics.length} topic{topics.length !== 1 ? 's' : ''} · each runs through the learn loop
              </p>
            )}

            {/* Topic list */}
            <div className="cb-topics-list">
              {topics.map((t, i) => (
                <div key={i} className="cb-topic-row">
                  <span className="cb-topic-num">{i + 1}</span>
                  <span className="cb-topic-title">{t}</span>
                  <button
                    className="cb-topic-remove"
                    onClick={() => removeTopic(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add topic input */}
            <div className="cb-add-row">
              <input
                type="text"
                className="topic-input"
                placeholder="Add a topic..."
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="btn-primary"
                style={{ width: 'auto', marginBottom: 0, whiteSpace: 'nowrap' }}
                onClick={addTopic}
              >
                + Add
              </button>
            </div>

            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {/* ── Footer buttons ── */}
        <div className="cb-footer">
          {step > 1 && (
            <button className="btn-ghost" style={{ width: 'auto' }} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}

          {step < 3 && (
            <button
              className="btn-primary"
              style={{ flex: 1, marginBottom: 0 }}
              disabled={
                (step === 1 && !title.trim()) ||
                (step === 2 && !sourceType)
              }
              onClick={() => {
                if (step === 2 && sourceType === 'manual') {
                  setStep(3)
                } else if (step === 2 && sourceType === 'import') {
                  setStep(3)
                } else {
                  setStep(step + 1)
                }
              }}
            >
              Continue →
            </button>
          )}

          {step === 3 && (
            <button
              className="btn-primary"
              style={{ flex: 1, marginBottom: 0 }}
              onClick={saveCourse}
              disabled={saving || topics.length === 0}
            >
              {saving ? 'Saving...' : 'Save course'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
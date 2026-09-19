import { useState, useEffect } from 'react'

export default function TopicInput({ onSubmit, loading, initialValue }) {
  const [topic, setTopic] = useState(initialValue || '')

  useEffect(() => {
    if (initialValue) setTopic(initialValue)
  }, [initialValue])

  function handleSubmit() {
    if (!topic.trim()) return
    onSubmit(topic.trim())
  }
  // ...rest of the file stays exactly the same

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="topic-input-wrap">
      <input
        className="topic-input"
        type="text"
        placeholder="What do you want to understand?"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button
        className="btn-primary topic-submit"
        onClick={handleSubmit}
        disabled={!topic.trim() || loading}
      >
        {loading ? 'Generating...' : 'Explain →'}
      </button>
    </div>
  )
}
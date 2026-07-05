import { useState } from 'react'

export default function TopicInput({ onSubmit, loading }) {
  const [topic, setTopic] = useState('')

  function handleSubmit() {
    if (!topic.trim()) return
    onSubmit(topic.trim())
  }

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
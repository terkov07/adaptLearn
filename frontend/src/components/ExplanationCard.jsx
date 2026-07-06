import ReactMarkdown from 'react-markdown'

export default function ExplanationCard({ explanation, style, attempt }) {
  return (
    <div className="explanation-card">
      <div className="explanation-header">
        <span className="explanation-badge">{style}</span>
        {attempt > 1 && (
          <span className="attempt-badge">Attempt {attempt}</span>
        )}
      </div>
      <div className="explanation-text">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
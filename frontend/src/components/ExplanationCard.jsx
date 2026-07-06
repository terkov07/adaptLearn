import ReactMarkdown from 'react-markdown'

export default function ExplanationCard({ explanation, style, attempt, onBookmark, isBookmarked }) {
  return (
    <div className="explanation-card">
      <div className="explanation-header">
        <span className="explanation-badge">{style}</span>
        {attempt > 1 && (
          <span className="attempt-badge">Attempt {attempt}</span>
        )}
        {onBookmark && (
          <button
            className={`bookmark-btn ${isBookmarked ? 'bookmark-btn-active' : ''}`}
            onClick={onBookmark}
            title={isBookmarked ? 'Bookmarked' : 'Save this explanation'}
          >
            {isBookmarked ? '🔖' : '🔖'}
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>
      <div className="explanation-text">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  )
}
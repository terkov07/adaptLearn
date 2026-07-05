export default function RAGRating({ onRate, disabled }) {
  return (
    <div className="rag-wrap">
      <p className="rag-label">How well did you understand that?</p>
      <div className="rag-buttons">
        <button
          className="rag-btn rag-red"
          onClick={() => onRate('red')}
          disabled={disabled}
        >
          🔴 Didn't get it
        </button>
        <button
          className="rag-btn rag-amber"
          onClick={() => onRate('amber')}
          disabled={disabled}
        >
          🟡 Partially
        </button>
        <button
          className="rag-btn rag-green"
          onClick={() => onRate('green')}
          disabled={disabled}
        >
          🟢 Got it
        </button>
      </div>
    </div>
  )
}
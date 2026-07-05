export default function AttemptBanner({ attempt, style, totalStyles = 5 }) {
  if (attempt <= 1) return null

  return (
    <div className="attempt-banner">
      <span>Attempt {attempt} of {totalStyles} — trying <strong>{style}</strong> this time</span>
    </div>
  )
}
const STYLES = [
  { value: 'analogy', label: 'Analogy', desc: 'Compare to something familiar' },
  { value: 'story', label: 'Story', desc: 'Learn through narrative' },
  { value: 'steps', label: 'Step-by-step', desc: 'One idea at a time' },
  { value: 'eli5', label: 'ELI5', desc: 'Simple, no jargon' },
  { value: 'expert', label: 'Expert', desc: 'Full technical depth' },
]

export default function StyleSelector({ selected, onSelect }) {
  return (
    <div className="style-selector">
      <p className="style-label">Explanation style</p>
      <div className="style-options">
        {STYLES.map(style => (
          <button
            key={style.value}
            className={`style-option ${selected === style.value ? 'style-option-active' : ''}`}
            onClick={() => onSelect(style.value)}
          >
            <span className="style-name">{style.label}</span>
            <span className="style-desc">{style.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
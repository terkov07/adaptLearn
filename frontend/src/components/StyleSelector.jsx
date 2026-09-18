const STYLES = [
  { value: 'analogy', label: 'Real-World Example', desc: 'A concrete example from everyday life' },
  { value: 'story', label: 'Picture / Story', desc: 'Learn through vivid imagery and narrative' },
  { value: 'steps', label: 'Step-by-step', desc: 'One idea at a time' },
  { value: 'eli5', label: "Explain Like I'm 5", desc: 'Simple, no jargon' },
  { value: 'expert', label: 'Expert — My Level', desc: 'Full depth, matched to your level' },
  { value: 'expert_full', label: 'Expert — Full Detail', desc: 'Maximum depth, beyond your syllabus' },
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
import API_URL from '../api'
import { useState } from 'react'

export default function QuizCard({ questions, onComplete, onSkip, explanationId }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)

  const currentQuestion = questions[currentIndex]

  function handleSelect(index) {
    if (answered) return
    setSelected(index)
  }

 function handleSubmit() {
  if (selected === null) return
  setAnswered(true)

  const newAnswers = [...answers, selected]
  setAnswers(newAnswers)

  // check if last question
  if (currentIndex >= questions.length - 1) {
  const newAnswers = [...answers, selected]
  setAnswers(newAnswers)
  setAnswered(true)

  const correct = newAnswers.filter(
    (ans, i) => ans === questions[i].correct_index
  ).length
  const pct = Math.round((correct / questions.length) * 100)

  // save to database
  if (explanationId) {
    fetch(`${API_URL}/api/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        explanation_id: explanationId,
        questions: questions,
        answers: newAnswers
      })
    })
  }

  setTimeout(() => {
    setDone(true)
    onComplete(pct, newAnswers)
  }, 1200)
}
  // if not last — wait for Next button
}

function handleNext() {
  setCurrentIndex(currentIndex + 1)
  setSelected(null)
  setAnswered(false)
}

  if (done) return null

  const isCorrect = answered && selected === currentQuestion.correct_index

  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <span className="quiz-progress">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <button className="quiz-skip" onClick={onSkip}>
          Skip quiz →
        </button>
      </div>

      <p className="quiz-question">{currentQuestion.question}</p>

      <div className="quiz-options">
        {currentQuestion.options.map((option, index) => {
          let className = 'quiz-option'
          if (answered) {
            if (index === currentQuestion.correct_index) {
              className += ' quiz-option-correct'
            } else if (index === selected) {
              className += ' quiz-option-wrong'
            }
          } else if (index === selected) {
            className += ' quiz-option-selected'
          }
          return (
            <button
              key={index}
              className={className}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              {option}
            </button>
          )
        })}
      </div>

      {!answered && (
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={selected === null}
          style={{ marginTop: 16 }}
        >
          Submit answer
        </button>
      )}

      {answered && (
  <>
    <p className={`quiz-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
      {isCorrect
        ? '✓ Correct!'
        : `✗ The correct answer was: ${currentQuestion.options[currentQuestion.correct_index]}`}
    </p>
    {currentIndex < questions.length - 1 && (
      <button
        className="btn-primary"
        style={{ marginTop: 12, width: 'auto' }}
        onClick={handleNext}
      >
        Next question →
      </button>
    )}
  </>
)}
    </div>
  )
}
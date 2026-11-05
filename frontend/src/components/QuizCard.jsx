import API_URL from '../api'
import { useState } from 'react'

export default function QuizCard({ questions, onComplete, onSkip, explanationId }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex >= questions.length - 1
  const explanations = currentQuestion.explanations || []

  function handleSelect(index) {
    if (answered) return
    setSelected(index)
  }

  function handleSubmit() {
    if (selected === null) return
    setAnswered(true)
    setAnswers([...answers, selected])
  }

  function handleNext() {
    setCurrentIndex(currentIndex + 1)
    setSelected(null)
    setAnswered(false)
  }

  function handleFinish() {
    const correct = answers.filter(
      (ans, i) => ans === questions[i].correct_index
    ).length
    const pct = Math.round((correct / questions.length) * 100)

    if (explanationId) {
      fetch(`${API_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          explanation_id: explanationId,
          questions: questions,
          answers: answers,
        }),
      })
    }
    onComplete(pct, answers)
  }

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
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </p>

          <div className="quiz-why">
            {!isCorrect && explanations[selected] && (
              <p>
                <strong>Why your answer wasn't right:</strong> {explanations[selected]}
              </p>
            )}
            <p>
              <strong>
                {isCorrect ? 'Why this is right:' : `The correct answer is "${currentQuestion.options[currentQuestion.correct_index]}":`}
              </strong>{' '}
              {explanations[currentQuestion.correct_index] || ''}
            </p>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 12, width: 'auto' }}
            onClick={isLast ? handleFinish : handleNext}
          >
            {isLast ? 'See results →' : 'Next question →'}
          </button>
        </>
      )}
    </div>
  )
}
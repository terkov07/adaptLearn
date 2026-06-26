const QUESTIONS = [
  {
    id: 'q1',
    heading: 'First, a bit about you',
    question: 'Think about school or studying in general. How would you describe yourself?',
    options: [
      { label: 'I find most things pretty hard to understand at first', value: 'hard' },
      { label: 'I usually get things eventually but need time', value: 'time' },
      { label: 'I pick things up fairly quickly', value: 'quickly' },
      { label: 'I often already know a bit before I start', value: 'already' },
    ]
  },
  {
    id: 'q2',
    heading: 'How your mind works',
    question: 'When someone explains something new to you, which feels most natural?',
    options: [
      { label: "Show me something it's similar to — \"it's like a...\"", value: 'similar' },
      { label: 'Tell me a story about it — make it come alive', value: 'story' },
      { label: 'Break it down step by step — one thing at a time', value: 'stepbystep' },
      { label: 'Just tell me the facts clearly and directly', value: 'facts' },
    ]
  },
  {
    id: 'q3',
    heading: 'When things feel confusing',
    question: "When you're reading something and it's not making sense, what usually happens?",
    options: [
      { label: 'I get frustrated and want to give up', value: 'frustrated' },
      { label: 'I re-read it slowly and usually get there', value: 'reread' },
      { label: 'I try to break it into smaller pieces', value: 'smaller' },
      { label: 'I look for the main idea and ignore the details', value: 'mainidea' },
    ]
  },
  {
    id: 'q4',
    heading: 'How you remember things',
    question: 'When you remember something you learned, how does it usually come back to you?',
    options: [
      { label: 'As a picture or scene in my head', value: 'picture' },
      { label: "As a comparison — \"it's like when...\"", value: 'comparison' },
      { label: 'As a sequence — first this, then that', value: 'sequence' },
      { label: 'As a fact or definition', value: 'fact' },
    ]
  },
  {
    id: 'q5',
    heading: 'Why you are here',
    question: 'What is the main reason you want to understand things better?',
    options: [
      { label: 'I have exams or assessments coming up', value: 'exams' },
      { label: 'I am just genuinely curious about things', value: 'curious' },
      { label: 'I missed something and need to catch up', value: 'catchup' },
      { label: 'I want to really deeply understand something', value: 'deeply' },
    ]
  },
  {
    id: 'q6',
    heading: 'What puts you off',
    question: 'When reading an explanation, what bothers you most?',
    options: [
      { label: 'It goes on too long and I lose track', value: 'toolong' },
      { label: "It uses words I don't know", value: 'jargon' },
      { label: "It's too vague and doesn't go deep enough", value: 'toovague' },
      { label: "It's too abstract with no real examples", value: 'abstract' },
    ]
  },
]
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const currentQuestion = QUESTIONS[currentIndex]

  async function handleSelect(value) {
    // save this answer
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (currentIndex < QUESTIONS.length - 1) {
      // not the last question — move to next
      setCurrentIndex(currentIndex + 1)
    } else {
      // last question — submit to Flask
      await submitAnswers(newAnswers)
    }
  }

  async function submitAnswers(finalAnswers) {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // sends session cookie
        body: JSON.stringify(finalAnswers)
      })
      const data = await res.json()
      if (res.ok) {
        navigate('/dashboard')
      } else {
        console.error(data.error)
      }
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="onboarding-loading">Setting up your experience...</div>
  }

  return (
    <div className="onboarding">

      {/* Progress dots */}
      <div className="progress-dots">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={i === currentIndex ? 'dot dot-active' : 'dot'}
          />
        ))}
      </div>

      {/* Framing text */}
      <p className="onboarding-framing">
        Help us personalise your experience — no wrong answers
      </p>

      {/* Question heading */}
      <h2 className="onboarding-heading">{currentQuestion.heading}</h2>

      {/* Question text */}
      <p className="onboarding-question">{currentQuestion.question}</p>

      {/* Options */}
      <div className="onboarding-options">
        {currentQuestion.options.map(option => (
          <button
            key={option.value}
            className="onboarding-option"
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

    </div>
  )
}
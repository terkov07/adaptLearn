import anthropic
import os
from dotenv import load_dotenv
import re
import json

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

STYLE_PROMPTS = {
    'analogy':  'Explain using one vivid real-world analogy. Start with "Imagine..."',
    'story':    'Explain as a short story where the main character encounters the concept.',
    'steps':    'Explain as a numbered sequence. One idea per step. Maximum 10 steps.',
    'eli5':     'Explain for a curious 10-year-old. No jargon. Short sentences.',
    'expert':   'Explain with precise technical language at undergraduate level.',
}

#main explanation call
def get_explanation(topic, style, education_level):
    if not education_level:
        education_level = 'unknown level'

    style_instruction = STYLE_PROMPTS.get(style)
    if not style_instruction:
        return 'Invalid style provided.'

    if education_level:
        context = f'The learner background: {education_level}.'
    else:
        context = 'Assume the learner has no specific background — explain accessibly.'
    prompt = f'{context} {style_instruction} Topic: {topic}. Keep under 200 words.'

    message = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=1000,
        messages=[
            {'role': 'user', 'content': prompt}
        ]
    )

    return message.content[0].text

def parse_quiz(raw):
    clean = re.sub(r'```json|```', '', raw).strip()
    start = clean.find('[')
    end = clean.rfind(']') + 1
    if start == -1:
        return []
    try:
        return json.loads(clean[start:end])
    except:
        return []

#quiz generation after explanation given
def generate_quiz(explanation_text, num_questions=3, education_level=None):
    if education_level:
        context = f'The learner background: {education_level}.'
    else:
        context = 'Assume no specific background — keep questions accessible.'

    prompt = f'''{context}
Based on this explanation, generate {num_questions} multiple choice questions.
Return ONLY a JSON array. No markdown, no extra text.
Format: [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0}}]

Explanation: {explanation_text}'''

    response = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=1000,
        messages=[
            {'role': 'user', 'content': prompt}
        ]
    )

    raw = response.content[0].text
    return parse_quiz(raw)


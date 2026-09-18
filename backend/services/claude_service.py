import anthropic
import os
from dotenv import load_dotenv
import re
import json

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

STYLE_PROMPTS = {
    'analogy':     'Explain using one vivid, concrete real-world example the learner will recognise from everyday life.',
    'story':       'Explain as a short, vivid story with strong visual imagery — describe the scene as if the learner is picturing it happening.',
    'steps':       'Explain as a numbered sequence. One idea per step. Maximum 10 steps.',
    'eli5':        'Explain for a curious 10-year-old. No jargon. Short sentences.',
    'expert':      "Explain with precise technical language appropriate to the learner's own stated education level — go deeper than a simple summary, using correct terminology for that stage, but don't exceed what's expected at it.",
    'expert_full': 'Explain with maximum technical depth and precision, using full specialist terminology and nuance, regardless of the learner\'s stated level — as if for a subject expert.',
}

#main explanation call
#main explanation call
def get_explanation(topic, style, education_level, doc_text=None, exam_board=None, spec_code=None):
    if not education_level:
        education_level = 'unknown level'

    style_instruction = STYLE_PROMPTS.get(style)
    if not style_instruction:
        return 'Invalid style provided.'

    context = f'The learner background: {education_level}.'
    if exam_board:
        context += f' Exam board: {exam_board}.'
    if spec_code:
        context += f' Specification code: {spec_code}.'

    grounding = ''
    if doc_text:
        grounding = (
            f'\n\nUse the following specification/syllabus/reading material as your source of truth '
            f'for what to cover and how to phrase it — do not rely on general knowledge of the subject '
            f'where it conflicts with this text:\n"""\n{doc_text}\n"""\n'
        )

    prompt = f'{context} {style_instruction} Topic: {topic}.{grounding} Keep under 200 words.'
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


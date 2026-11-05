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
    'steps':       'Explain as a numbered sequence of steps. Each step must build directly on the one before it: open each step by referring back to what the previous step established (e.g. "Because of step 1..." or "Now that we know..."), and close it by setting up the next. Define any new term the first time it appears. Never introduce an idea that an earlier step has not prepared. Maximum 8 steps, then finish with one sentence tying them all together.',
    'eli5':        'Explain for a curious 10-year-old. No jargon. Short sentences.',
    'expert':      "Explain with precise technical language appropriate to the learner's own stated education level — go deeper than a simple summary, using correct terminology for that stage, but don't exceed what's expected at it.",
    'expert_full': 'Explain with maximum technical depth and precision, using full specialist terminology and nuance, regardless of the learner\'s stated level — as if for a subject expert.',
}


def level_guidance(education_level):
    lvl = (education_level or '').lower()
    if 'gcse' in lvl:
        return 'The learner is a GCSE student: plain, clear language, short sentences, and explain technical terms when first used.'
    if 'a-level' in lvl or 'a level' in lvl or 'alevel' in lvl:
        return 'The learner is an A-Level student: use correct subject terminology, assume GCSE knowledge, and give the reasoning behind ideas, not just facts.'
    if 'uni' in lvl or 'degree' in lvl or 'undergrad' in lvl or 'postgrad' in lvl:
        return 'The learner is a university student: write in an academic register with precise disciplinary terminology, add nuance where the field has genuine debate, and do not oversimplify.'
    return ''

#main explanation call
def get_explanation(topic, style, education_level, doc_text=None, exam_board=None, spec_code=None):
    if not education_level:
        education_level = 'unknown level'

    style_instruction = STYLE_PROMPTS.get(style)
    if not style_instruction:
        return 'Invalid style provided.'

    context = f'The learner background: {education_level}.'
    # eli5 and expert_full deliberately ignore the learner's level
    if style not in ('eli5', 'expert_full'):
        context += ' ' + level_guidance(education_level)

    grounding = ''
    if doc_text:
        grounding = (
            f'\n\nUse the following specification/syllabus/reading material as your source of truth '
            f'for what to cover and how to phrase it — do not rely on general knowledge of the subject '
            f'where it conflicts with this text:\n"""\n{doc_text}\n"""\n'
        )

    word_limit = 250 if style == 'steps' else 200
    prompt = f'{context} {style_instruction} Topic: {topic}.{grounding} Keep under {word_limit} words.'
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
Format: [{{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanations": ["...", "...", "...", "..."]}}]
"explanations" must contain exactly 4 short strings (one sentence each), in the same order as "options". For the correct option, say why it is right. For each wrong option, say why it is wrong and what misconception it reflects.

Explanation: {explanation_text}'''

    response = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=2500,
        messages=[
            {'role': 'user', 'content': prompt}
        ]
    )

    raw = response.content[0].text
    return parse_quiz(raw)


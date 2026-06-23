import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

STYLE_PROMPTS = {
    'analogy':  'Explain using one vivid real-world analogy. Start with "Imagine..."',
    'story':    'Explain as a short story where the main character encounters the concept.',
    'steps':    'Explain as a numbered sequence. One idea per step. Maximum 10 steps.',
    'eli5':     'Explain for a curious 10-year-old. No jargon. Short sentences.',
    'expert':   'Explain with precise technical language at undergraduate level.',
}

def get_explanation(topic, style, education_level='alevel'):
    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS['analogy'])
    context = f'The learner is at {education_level} level.'
    prompt = f'{context} {style_instruction} Topic: {topic}. Keep under 300 words.'

    message = client.messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=1000,
        messages=[
            {'role': 'user', 'content': prompt}
        ]
    )

    return message.content[0].text
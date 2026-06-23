from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

@app.route('/api/hello')
def hello():
    return jsonify({'message': 'AdaptLearn is alive'})

@app.route('/api/explain', methods=['POST'])
def explain():
    data = request.json

    if not data or not data.get('topic'):
        return jsonify({'error': 'Topic is required'}), 400

    topic = data['topic']
    style = data.get('style', 'analogy')
    education_level = data.get('education_level', 'alevel')

    try:
        from services.claude_service import get_explanation
        explanation = get_explanation(topic, style, education_level)
        return jsonify({
            'explanation': explanation,
            'style': style,
            'topic': topic
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
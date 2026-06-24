from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from models import db, User
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///adaptlearn.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/api/hello')
def hello():
    return jsonify({'message': 'AdaptLearn is alive'})

@app.route('/api/explain', methods=['POST'])
def explain():
    data = request.json
    if not data or not data.get('topic'):
        return jsonify({'error': 'Topic is required'}), 400
    if not data.get('style'):
        return jsonify({'error': 'Style is required'}), 400
    topic = data['topic']
    style = data['style']
    education_level = data.get('education_level')
    try:
        from services.claude_service import get_explanation
        explanation = get_explanation(topic, style, education_level)
        return jsonify({'explanation': explanation, 'style': style, 'topic': topic})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz', methods=['POST'])
def quiz():
    data = request.json
    if not data or not data.get('explanation_text'):
        return jsonify({'error': 'Explanation text is required'}), 400
    explanation_text = data['explanation_text']
    num_questions = data.get('num_questions', 3)
    education_level = data.get('education_level')
    try:
        from services.claude_service import generate_quiz
        questions = generate_quiz(explanation_text, num_questions, education_level)
        return jsonify({'questions': questions, 'num_questions': num_questions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Tables created!")
    app.run(debug=True)
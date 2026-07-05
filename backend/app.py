from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from models import db, User
import os
from routes.auth import auth_bp
from routes.sessions import sessions_bp


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:5173'])


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
    user_id = session.get('user_id')

    try:
        from services.claude_service import get_explanation
        explanation_text = get_explanation(topic, style, education_level)

        # save to database if logged in
        session_id = None
        explanation_id = None

        if user_id:
            from models import LearningSession, Explanation
            from datetime import datetime

            # create session
            learning_session = LearningSession(
                user_id=user_id,
                topic=topic,
                initial_style=style,
                started_at=datetime.utcnow()
            )
            db.session.add(learning_session)
            db.session.flush()

            # create explanation
            explanation_record = Explanation(
                session_id=learning_session.id,
                style=style,
                prompt_sent=f"{education_level} | {style} | {topic}",
                response_text=explanation_text,
                attempt_number=1,
                model_used='claude-haiku-4-5-20251001'
            )
            db.session.add(explanation_record)
            db.session.commit()

            session_id = learning_session.id
            explanation_id = explanation_record.id

        return jsonify({
            'explanation': explanation_text,
            'style': style,
            'topic': topic,
            'session_id': session_id,
            'explanation_id': explanation_id,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/explanations/<int:explanation_id>/rag', methods=['PATCH'])
def rate_explanation(explanation_id):
    data = request.json
    rating = data.get('rating')

    if rating not in ['red', 'amber', 'green']:
        return jsonify({'error': 'Invalid rating'}), 400

    from models import Explanation
    explanation = Explanation.query.get(explanation_id)
    if not explanation:
        return jsonify({'error': 'Explanation not found'}), 404

    explanation.rag_rating = rating
    db.session.commit()

    return jsonify({
        'success': True,
        'next_action': 'quiz' if rating == 'green' else 'retry'
    })

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
    
app.register_blueprint(auth_bp)
app.register_blueprint(sessions_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Tables created!")
    app.run(debug=True)
from flask import Blueprint, request, jsonify, session
from models import db, User, UserPreferences, UserStats
import bcrypt

#style quiz algorithm
def recommend_style(education, q1, q2, q3, q4, q5, q6):
    scores = {
        'analogy': 0,
        'story':   0,
        'steps':   0,
        'eli5':    0,
        'expert':  0
    }

    # Q1 — prior knowledge
    q1_map = {
        'hard':    {'eli5': 3},
        'time':    {'analogy': 2, 'eli5': 1},
        'quickly': {'steps': 2, 'analogy': 1},
        'already': {'expert': 3},
    }

    # Q2 — concrete vs abstract
    q2_map = {
        'similar':   {'analogy': 3},
        'story':     {'story': 3},
        'stepbystep':{'steps': 3},
        'facts':     {'expert': 3},
    }

    # Q3 — anxiety / cognitive load
    q3_map = {
        'frustrated': {'eli5': 3},
        'reread':     {'analogy': 2, 'story': 1},
        'smaller':    {'steps': 3},
        'mainidea':   {'expert': 2, 'analogy': 1},
    }

    # Q4 — narrative vs analytical
    q4_map = {
        'picture':   {'story': 3},
        'comparison':{'analogy': 3},
        'sequence':  {'steps': 3},
        'fact':      {'expert': 3},
    }

    # Q5 — motivation
    q5_map = {
        'exams':     {'steps': 2, 'analogy': 1},
        'curious':   {'story': 2, 'analogy': 1},
        'catchup':   {'eli5': 2, 'story': 1},
        'deeply':    {'expert': 3},
    }

    # Q6 — complexity tolerance
    q6_map = {
        'toolong':   {'eli5': 3},
        'jargon':    {'eli5': 2, 'story': 1},
        'toovague':  {'expert': 3},
        'abstract':  {'analogy': 2, 'steps': 1},
    }

    # Apply all scores
    for answer, mapping in [
        (q1, q1_map), (q2, q2_map), (q3, q3_map),
        (q4, q4_map), (q5, q5_map), (q6, q6_map)
    ]:
        for style, pts in mapping.get(answer, {}).items():
            scores[style] += pts

    # Education level tiebreaker
    edu_boost = {
        'gcse':        'eli5',
        'alevel':      'analogy',
        'university':  'steps',
        'expert':      'expert',
        'self_taught': 'analogy',
        'other':       'analogy',
    }
    boost = edu_boost.get(education)
    if boost:
        scores[boost] += 0.5

    return max(scores, key=scores.get)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json

    # Validation
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    if not data.get('password'):
        return jsonify({'error': 'Password is required'}), 400
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    # Check email not already used
    existing = User.query.filter_by(email=data['email']).first()
    if existing:
        return jsonify({'error': 'An account with this email already exists'}), 409

    # Hash password
    password_hash = bcrypt.hashpw(
        data['password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Create user
    user = User(
        name=data['name'],
        nickname=data.get('nickname', data['name']),
        email=data['email'],
        password_hash=password_hash,
    )
    db.session.add(user)
    db.session.flush()  # gets user.id before committing

    # Create preferences row
    prefs = UserPreferences(
        user_id=user.id,
        education_level=data.get('education_level'),
        theme='focus',
        text_size='md',
        auto_advance=True
    )
    db.session.add(prefs)

    # Create stats row
    stats = UserStats(
        user_id=user.id,
        xp=0,
        streak=0,
        total_sessions=0,
        total_topics=0
    )
    db.session.add(stats)

    db.session.commit()

    # Store user in session
    session['user_id'] = user.id

    return jsonify({
        'message': 'Account created successfully',
        'user_id': user.id,
        'nickname': user.nickname
    }), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    # Find user
    user = User.query.filter_by(email=data['email']).first()

    # Check password — same error whether email or password wrong (security)
    if not user or not bcrypt.checkpw(
        data['password'].encode('utf-8'),
        user.password_hash.encode('utf-8')
    ):
        return jsonify({'error': 'Incorrect email or password'}), 401

    # Store in session
    session['user_id'] = user.id

    return jsonify({
        'message': 'Logged in successfully',
        'user': {
            'id': user.id,
            'name': user.name,
            'nickname': user.nickname,
            'email': user.email,
            'preferences': {
                'education_level': user.preferences.education_level,
                'preferred_style': user.preferences.preferred_style,
                'theme': user.preferences.theme,
                'text_size': user.preferences.text_size,
                'auto_advance': user.preferences.auto_advance,
            },
            'stats': {
                'xp': user.stats.xp,
                'streak': user.stats.streak,
                'total_sessions': user.stats.total_sessions,
                'total_topics': user.stats.total_topics,
            }
        }
    })


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/api/auth/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': {
            'id': user.id,
            'name': user.name,
            'nickname': user.nickname,
            'email': user.email,
            'preferences': {
                'education_level': user.preferences.education_level,
                'preferred_style': user.preferences.preferred_style,
                'theme': user.preferences.theme,
                'text_size': user.preferences.text_size,
                'auto_advance': user.preferences.auto_advance,
            },
            'stats': {
                'xp': user.stats.xp,
                'streak': user.stats.streak,
                'total_sessions': user.stats.total_sessions,
                'total_topics': user.stats.total_topics,
            }
        }
    })

@auth_bp.route('/api/auth/onboarding', methods=['POST'])
def onboarding():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = User.query.get(user_id)

    data = request.json
    q1 = data.get('q1')
    q2 = data.get('q2')
    q3 = data.get('q3')
    q4 = data.get('q4')
    q5 = data.get('q5')
    q6 = data.get('q6')

    if not all([q1, q2, q3, q4, q5, q6]):
        return jsonify({'error': 'All 6 answers are required'}), 400

    recommended = recommend_style(
        education=user.preferences.education_level,
        q1=q1, q2=q2, q3=q3,
        q4=q4, q5=q5, q6=q6
    )

    # Store raw answers
    user.preferences.approach = q1
    user.preferences.cognitive_style = q2
    user.preferences.anxiety_response = q3
    user.preferences.memory_style = q4
    user.preferences.motivation = q5
    user.preferences.complexity_pref = q6

    # Store result
    user.preferences.preferred_style = recommended

    db.session.commit()

    return jsonify({
        'recommended_style': recommended,
        'scores_explanation': f'Based on your answers, {recommended} explanations will work best for you'
    })
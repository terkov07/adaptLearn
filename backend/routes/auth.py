from flask import Blueprint, request, jsonify, session
from models import db, User, UserPreferences, UserStats
import bcrypt

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
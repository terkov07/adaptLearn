from flask import Blueprint, request, jsonify, session
from models import db, User, UserPreferences

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/user/profile', methods=['PATCH'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.json

    # Update user table
    if 'name' in data:
        user.name = data['name']
    if 'nickname' in data:
        user.nickname = data['nickname']

    # Update preferences table
    if user.preferences:
        if 'preferred_style' in data:
            user.preferences.preferred_style = data['preferred_style']
        if 'theme' in data:
            user.preferences.theme = data['theme']
        if 'text_size' in data:
            user.preferences.text_size = data['text_size']
        if 'auto_advance' in data:
            user.preferences.auto_advance = data['auto_advance']

    db.session.commit()

    return jsonify({'success': True, 'message': 'Profile updated'})


@user_bp.route('/api/user/password', methods=['PATCH'])
def change_password():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    user = User.query.get(user_id)
    data = request.json

    import bcrypt
    if not bcrypt.checkpw(
        data['current_password'].encode('utf-8'),
        user.password_hash.encode('utf-8')
    ):
        return jsonify({'error': 'Current password is incorrect'}), 403

    new_hash = bcrypt.hashpw(
        data['new_password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    user.password_hash = new_hash
    db.session.commit()

    return jsonify({'success': True})


@user_bp.route('/api/user', methods=['DELETE'])
def delete_account():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    data = request.json
    if data.get('confirm') != 'DELETE':
        return jsonify({'error': 'Must confirm with DELETE'}), 400

    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()
    session.clear()

    return jsonify({'success': True})
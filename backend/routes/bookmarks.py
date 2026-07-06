from flask import Blueprint, request, jsonify, session
from models import db, Bookmark, Explanation, LearningSession

bookmarks_bp = Blueprint('bookmarks', __name__)

@bookmarks_bp.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    bookmarks = Bookmark.query.filter_by(user_id=user_id)\
        .order_by(Bookmark.saved_at.desc()).all()

    results = []
    for b in bookmarks:
        exp = Explanation.query.get(b.explanation_id)
        if not exp:
            continue
        s = LearningSession.query.get(exp.session_id)
        results.append({
            'id': b.id,
            'explanation_id': b.explanation_id,
            'note': b.note,
            'saved_at': b.saved_at.isoformat(),
            'topic': s.topic if s else 'Unknown',
            'style': exp.style,
            'rag_rating': exp.rag_rating,
            'text_preview': exp.response_text[:200],
            'response_text': exp.response_text,
            'session_id': s.id if s else None,
        })

    return jsonify({'bookmarks': results})


@bookmarks_bp.route('/api/bookmarks', methods=['POST'])
def add_bookmark():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    data = request.json
    explanation_id = data.get('explanation_id')
    if not explanation_id:
        return jsonify({'error': 'explanation_id required'}), 400

    # check not already bookmarked
    existing = Bookmark.query.filter_by(
        user_id=user_id,
        explanation_id=explanation_id
    ).first()

    if existing:
        return jsonify({'error': 'Already bookmarked', 'bookmark_id': existing.id}), 409

    from datetime import datetime
    bookmark = Bookmark(
        user_id=user_id,
        explanation_id=explanation_id,
        note=data.get('note'),
        saved_at=datetime.utcnow()
    )
    db.session.add(bookmark)
    db.session.commit()

    return jsonify({'bookmark_id': bookmark.id, 'success': True}), 201


@bookmarks_bp.route('/api/bookmarks/<int:bookmark_id>', methods=['PATCH'])
def update_bookmark(bookmark_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    bookmark = Bookmark.query.filter_by(
        id=bookmark_id, user_id=user_id
    ).first()
    if not bookmark:
        return jsonify({'error': 'Not found'}), 404

    data = request.json
    if 'note' in data:
        bookmark.note = data['note']
    db.session.commit()

    return jsonify({'success': True})


@bookmarks_bp.route('/api/bookmarks/<int:bookmark_id>', methods=['DELETE'])
def delete_bookmark(bookmark_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    bookmark = Bookmark.query.filter_by(
        id=bookmark_id, user_id=user_id
    ).first()
    if not bookmark:
        return jsonify({'error': 'Not found'}), 404

    db.session.delete(bookmark)
    db.session.commit()

    return jsonify({'success': True})
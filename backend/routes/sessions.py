from flask import Blueprint, jsonify, session
from models import db, LearningSession, Explanation, User

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('/api/sessions', methods=['GET'])
def get_sessions():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    # get last 5 completed sessions
    recent = LearningSession.query.filter_by(
        user_id=user_id
    ).order_by(
        LearningSession.started_at.desc()
    ).limit(5).all()

    sessions_data = []
    for s in recent:
        # get the final explanation for this session
        final_explanation = Explanation.query.filter_by(
            session_id=s.id
        ).order_by(
            Explanation.attempt_number.desc()
        ).first()

        sessions_data.append({
            'id': s.id,
            'topic': s.topic,
            'style': s.final_style or s.initial_style,
            'rag_rating': final_explanation.rag_rating if final_explanation else None,
            'quiz_score': s.final_quiz_score,
            'xp_earned': s.xp_earned,
            'started_at': s.started_at.isoformat() if s.started_at else None,
            'completed_at': s.completed_at.isoformat() if s.completed_at else None,
        })

    return jsonify({'sessions': sessions_data})


@sessions_bp.route('/api/sessions/stats', methods=['GET'])
def get_weekly_stats():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)

    # sessions this week
    weekly_sessions = LearningSession.query.filter(
        LearningSession.user_id == user_id,
        LearningSession.started_at >= week_ago,
        LearningSession.completed_at != None
    ).all()

    total_this_week = len(weekly_sessions)

    # average quiz score this week
    scores = [s.final_quiz_score for s in weekly_sessions if s.final_quiz_score is not None]
    avg_score = round(sum(scores) / len(scores)) if scores else None

    # best performing style
    style_scores = {}
    for s in weekly_sessions:
        if s.final_style and s.final_quiz_score:
            if s.final_style not in style_scores:
                style_scores[s.final_style] = []
            style_scores[s.final_style].append(s.final_quiz_score)

    best_style = None
    if style_scores:
        best_style = max(style_scores, key=lambda k: sum(style_scores[k]) / len(style_scores[k]))

    return jsonify({
        'total_this_week': total_this_week,
        'avg_score': avg_score,
        'best_style': best_style,
    })
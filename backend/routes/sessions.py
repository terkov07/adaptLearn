from flask import Blueprint, request, jsonify, session
from models import db, LearningSession, Explanation, QuizResult
from sqlalchemy import desc
from models import Explanation

import re

def strip_markdown(text):
    if not text:
        return ''
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'\n+', ' ', text)
    return text.strip()
sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('/api/sessions', methods=['GET'])
def get_sessions():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    # filters from query params
    style_filter = request.args.get('style')
    rag_filter = request.args.get('rag')
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = 5

    query = LearningSession.query.filter_by(user_id=user_id)

    if style_filter:
        query = query.filter(
            db.or_(
                LearningSession.final_style == style_filter,
                LearningSession.initial_style == style_filter
            )
        )
    if search:
        query = query.filter(LearningSession.topic.ilike(f'%{search}%'))

    query = query.order_by(desc(LearningSession.started_at))
    total = query.count()
    sessions_list = query.offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for s in sessions_list:
        # get final explanation and its RAG rating
        final_exp = Explanation.query.filter_by(
            session_id=s.id
        ).order_by(desc(Explanation.attempt_number)).first()

        rag = final_exp.rag_rating if final_exp else None

        # filter by RAG if requested
        if rag_filter and rag != rag_filter:
            continue

        results.append({
            'id': s.id,
            'topic': s.topic,
            'style': s.final_style or s.initial_style,
            'rag_rating': rag,
            'quiz_score': s.final_quiz_score,
            'total_attempts': s.total_attempts,
            'xp_earned': s.xp_earned,
            'started_at': s.started_at.isoformat() if s.started_at else None,
            'completed_at': s.completed_at.isoformat() if s.completed_at else None,
            'explanation_preview': strip_markdown(final_exp.response_text)[:150] if final_exp else None,
        })

    return jsonify({
        'sessions': results,
        'total': total,
        'page': page,
        'per_page': per_page,
        'has_more': (page * per_page) < total
    })


@sessions_bp.route('/api/sessions/<int:session_id>', methods=['GET'])
def get_session_detail(session_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    s = LearningSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not s:
        return jsonify({'error': 'Session not found'}), 404

    explanations = Explanation.query.filter_by(session_id=s.id).order_by(Explanation.attempt_number).all()

    exps_data = []
    for exp in explanations:
        quiz_results = QuizResult.query.filter_by(explanation_id=exp.id).all()
        exps_data.append({
            'id': exp.id,
            'style': exp.style,
            'response_text': exp.response_text,
            'rag_rating': exp.rag_rating,
            'attempt_number': exp.attempt_number,
            'quiz_results': [{
                'question': q.question,
                'options': q.options,
                'correct_index': q.correct_index,
                'user_answer_index': q.user_answer_index,
                'correct': q.correct,
            } for q in quiz_results]
        })

    return jsonify({
        'session': {
            'id': s.id,
            'topic': s.topic,
            'quiz_score': s.final_quiz_score,
            'total_attempts': s.total_attempts,
            'started_at': s.started_at.isoformat() if s.started_at else None,
            'explanations': exps_data,
        }
    })


@sessions_bp.route('/api/sessions/stats', methods=['GET'])
def get_weekly_stats():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)

    weekly = LearningSession.query.filter(
        LearningSession.user_id == user_id,
        LearningSession.started_at >= week_ago,
    ).all()

    total = len(weekly)

    # avg quiz score from sessions that have one
    scores = [s.final_quiz_score for s in weekly if s.final_quiz_score is not None]
    avg_score = round(sum(scores) / len(scores)) if scores else None

    # best style — by green RAG ratings across all explanations this week
    style_greens = {}
    for s in weekly:
        exps = Explanation.query.filter_by(session_id=s.id).all()
        for exp in exps:
            if exp.rag_rating == 'green' and exp.style:
                style_greens[exp.style] = style_greens.get(exp.style, 0) + 1

    best_style = max(style_greens, key=style_greens.get) if style_greens else None

    return jsonify({
        'total_this_week': total,
        'avg_score': avg_score,
        'best_style': best_style,
    })
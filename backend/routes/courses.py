from flask import Blueprint, request, jsonify, session
from models import db, Course, CourseTopic
from datetime import datetime

courses_bp = Blueprint('courses', __name__)


@courses_bp.route('/api/courses', methods=['GET'])
def get_courses():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    courses = Course.query.filter_by(user_id=user_id)\
        .order_by(Course.created_at.desc()).all()

    results = []
    for c in courses:
        topics = CourseTopic.query.filter_by(course_id=c.id)\
            .order_by(CourseTopic.order_index).all()
        total = len(topics)
        completed = sum(1 for t in topics if t.status == 'complete')
        pct = round((completed / total) * 100) if total > 0 else 0

        results.append({
            'id': c.id,
            'title': c.title,
            'source_type': c.source_type,
            'source_filename': c.source_filename,
            'status': c.status,
            'total_topics': total,
            'completed_topics': completed,
            'progress_pct': pct,
            'created_at': c.created_at.isoformat(),
        })

    return jsonify({'courses': results})


@courses_bp.route('/api/courses', methods=['POST'])
def create_course():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    data = request.json
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    if not data.get('topics'):
        return jsonify({'error': 'At least one topic is required'}), 400

    course = Course(
        user_id=user_id,
        title=data['title'],
        source_type=data.get('source_type', 'manual'),
        source_filename=data.get('source_filename'),
        doc_text=data.get('doc_text'),
        status='not_started',
        created_at=datetime.utcnow()
    )
    db.session.add(course)
    db.session.flush()

    for i, topic_title in enumerate(data['topics']):
        topic = CourseTopic(
            course_id=course.id,
            title=topic_title,
            order_index=i,
            status='not_started'
        )
        db.session.add(topic)

    db.session.commit()

    return jsonify({'course_id': course.id, 'success': True}), 201


@courses_bp.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    topics = CourseTopic.query.filter_by(course_id=course.id)\
        .order_by(CourseTopic.order_index).all()

    total = len(topics)
    completed = sum(1 for t in topics if t.status == 'complete')
    pct = round((completed / total) * 100) if total > 0 else 0

    return jsonify({
        'course': {
            'id': course.id,
            'title': course.title,
            'source_type': course.source_type,
            'source_filename': course.source_filename,
            'doc_text': course.doc_text,
            'status': course.status,
            'progress_pct': pct,
            'completed_topics': completed,
            'total_topics': total,
            'topics': [{
                'id': t.id,
                'title': t.title,
                'order_index': t.order_index,
                'status': t.status,
                'completed_at': t.completed_at.isoformat() if t.completed_at else None,
            } for t in topics]
        }
    })


@courses_bp.route('/api/courses/<int:course_id>/topics/<int:topic_id>', methods=['PATCH'])
def update_topic(course_id, topic_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    topic = CourseTopic.query.filter_by(id=topic_id, course_id=course_id).first()
    if not topic:
        return jsonify({'error': 'Topic not found'}), 404

    data = request.json
    if 'status' in data:
        topic.status = data['status']
        if data['status'] == 'complete':
            topic.completed_at = datetime.utcnow()

    db.session.commit()

    # update course status
    topics = CourseTopic.query.filter_by(course_id=course_id).all()
    total = len(topics)
    completed = sum(1 for t in topics if t.status == 'complete')

    if completed == total:
        course.status = 'complete'
    elif completed > 0:
        course.status = 'in_progress'
    db.session.commit()

    return jsonify({'success': True, 'progress_pct': round((completed/total)*100) if total else 0})


@courses_bp.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    db.session.delete(course)
    db.session.commit()

    return jsonify({'success': True})
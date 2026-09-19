from flask import Blueprint, request, jsonify, session
from models import db, Course, CourseTopic
from datetime import datetime
from models import db, Course, CourseTopic, Deadline

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
        level=data.get('level'),
        exam_board=data.get('exam_board'),
        spec_code=data.get('spec_code'),
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
            'level': course.level,
            'exam_board': course.exam_board,
            'spec_code': course.spec_code,
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

@courses_bp.route('/api/courses/<int:course_id>/deadlines', methods=['GET'])
def get_deadlines(course_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    deadlines = Deadline.query.filter_by(course_id=course_id)\
        .order_by(Deadline.due_date).all()

    return jsonify({'deadlines': [{
        'id': d.id,
        'type': d.type,
        'title': d.title,
        'due_date': d.due_date.isoformat(),
        'estimated_minutes': d.estimated_minutes,
        'completed': d.completed,
        'course_topic_id': d.course_topic_id,
    } for d in deadlines]})


@courses_bp.route('/api/courses/<int:course_id>/deadlines', methods=['POST'])
def add_deadline(course_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    data = request.json
    for field in ('type', 'title', 'due_date'):
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    deadline = Deadline(
        course_id=course_id,
        type=data['type'],
        title=data['title'],
        due_date=datetime.fromisoformat(data['due_date']),
        estimated_minutes=data.get('estimated_minutes'),
        course_topic_id=data.get('course_topic_id'),
    )
    db.session.add(deadline)
    db.session.commit()

    return jsonify({'success': True, 'id': deadline.id}), 201

@courses_bp.route('/api/courses/<int:course_id>/deadlines/<int:deadline_id>', methods=['PATCH'])
def update_deadline(course_id, deadline_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    deadline = Deadline.query.filter_by(id=deadline_id, course_id=course_id).first()
    if not deadline:
        return jsonify({'error': 'Deadline not found'}), 404

    data = request.json
    if 'completed' in data:
        deadline.completed = data['completed']
    db.session.commit()

    return jsonify({'success': True})


@courses_bp.route('/api/courses/<int:course_id>/deadlines/<int:deadline_id>', methods=['DELETE'])
def delete_deadline(course_id, deadline_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    deadline = Deadline.query.filter_by(id=deadline_id, course_id=course_id).first()
    if not deadline:
        return jsonify({'error': 'Deadline not found'}), 404

    db.session.delete(deadline)
    db.session.commit()

    return jsonify({'success': True})
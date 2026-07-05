from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    nickname = db.Column(db.String)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    preferences = db.relationship('UserPreferences', backref='user', uselist=False, cascade='all, delete-orphan')
    stats = db.relationship('UserStats', backref='user', uselist=False, cascade='all, delete-orphan')
    sessions = db.relationship('LearningSession', backref='user', cascade='all, delete-orphan')
    courses = db.relationship('Course', backref='user', cascade='all, delete-orphan')
    bookmarks = db.relationship('Bookmark', backref='user', cascade='all, delete-orphan')


class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    education_level = db.Column(db.String)
    subject_background = db.Column(db.String)
    preferred_style = db.Column(db.String)
    approach = db.Column(db.String)
    cognitive_style = db.Column(db.String)    # Q2 — concrete vs abstract
    anxiety_response = db.Column(db.String)   # Q3 — anxiety / cognitive load
    memory_style = db.Column(db.String)       # Q4 — narrative vs analytical
    motivation = db.Column(db.String)
    complexity_pref = db.Column(db.String)
    learning_context = db.Column(db.String)
    theme = db.Column(db.String, default='focus')
    text_size = db.Column(db.String, default='md')
    auto_advance = db.Column(db.Boolean, default=True)


class UserStats(db.Model):
    __tablename__ = 'user_stats'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_active = db.Column(db.DateTime)
    total_sessions = db.Column(db.Integer, default=0)
    total_topics = db.Column(db.Integer, default=0)


class LearningSession(db.Model):
    __tablename__ = 'learning_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_topic_id = db.Column(db.Integer, db.ForeignKey('course_topics.id'), nullable=True)
    topic = db.Column(db.String, nullable=False)
    initial_style = db.Column(db.String)
    final_style = db.Column(db.String)
    total_attempts = db.Column(db.Integer, default=1)
    final_quiz_score = db.Column(db.Integer)
    xp_earned = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Integer)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    explanations = db.relationship('Explanation', backref='session', cascade='all, delete-orphan')


class Explanation(db.Model):
    __tablename__ = 'explanations'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('learning_sessions.id'), nullable=False)
    style = db.Column(db.String, nullable=False)
    prompt_sent = db.Column(db.String, nullable=False)
    response_text = db.Column(db.String, nullable=False)
    rag_rating = db.Column(db.String)
    attempt_number = db.Column(db.Integer, nullable=False)
    model_used = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    quiz_results = db.relationship('QuizResult', backref='explanation', cascade='all, delete-orphan')
    bookmark = db.relationship('Bookmark', backref='explanation', uselist=False, cascade='all, delete-orphan')


class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    id = db.Column(db.Integer, primary_key=True)
    explanation_id = db.Column(db.Integer, db.ForeignKey('explanations.id'), nullable=False)
    question = db.Column(db.String, nullable=False)
    options = db.Column(db.String, nullable=False)
    correct_index = db.Column(db.Integer, nullable=False)
    user_answer_index = db.Column(db.Integer)
    correct = db.Column(db.Boolean)
    question_type = db.Column(db.String)


class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String, nullable=False)
    source_type = db.Column(db.String, nullable=False)
    source_filename = db.Column(db.String)
    doc_text = db.Column(db.String)
    status = db.Column(db.String, default='not_started')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    topics = db.relationship('CourseTopic', backref='course', cascade='all, delete-orphan')


class CourseTopic(db.Model):
    __tablename__ = 'course_topics'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String, nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String, default='not_started')
    completed_at = db.Column(db.DateTime)

    session = db.relationship('LearningSession', backref='course_topic', uselist=False)


class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    explanation_id = db.Column(db.Integer, db.ForeignKey('explanations.id'), nullable=False)
    note = db.Column(db.String)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'explanation_id', name='unique_bookmark'),
    )
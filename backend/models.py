from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    nickname = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    education_level = db.Column(db.String)
    preferred_style = db.Column(db.String)
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    theme = db.Column(db.String, default='focus')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
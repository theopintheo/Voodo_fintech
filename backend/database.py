# finance-coach-ai/backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Priority:
# 1. DATABASE_URL (for Neon/PostgreSQL production)
# 2. SQLite in /tmp (for Vercel temp storage)
# 3. Local SQLite (for development)

SQLALCHEMY_DATABASE_URL = os.environ.get('DATABASE_URL')

if SQLALCHEMY_DATABASE_URL:
    # Small fix: Neon uses postgres:// but SQLAlchemy requires postgresql://
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # Default to SQLite for local or if no Cloud DB is provided
    if os.environ.get('VERCEL'):
        db_path = "/tmp/finance_coach.db"
    else:
        db_path = "./finance_coach.db"
    
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

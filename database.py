"""
SQLAlchemy database setup — SQLite, single file at project root.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./scrooge.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables if they don't exist, and add any missing columns automatically."""
    from sqlalchemy import text
    from models import User, Simulation  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Lightweight auto-migration: add new columns to existing tables without losing data.
    # Each ALTER TABLE is wrapped in try/except — SQLite raises an error if the column
    # already exists, which we safely ignore.
    migrations = [
        "ALTER TABLE simulations ADD COLUMN volatility FLOAT",
        "ALTER TABLE simulations ADD COLUMN decisions TEXT",
        "ALTER TABLE simulations ADD COLUMN asset_names TEXT",
        "ALTER TABLE users ADD COLUMN reset_token TEXT",
        "ALTER TABLE users ADD COLUMN reset_token_expires DATETIME",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # Column already exists — skip

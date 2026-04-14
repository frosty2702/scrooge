"""
Auth helpers — bcrypt password hashing and JWT token handling.
"""
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt

# Change this to a long random string in production
SECRET_KEY = "scrooge-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


# ── Passwords ──────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT tokens ─────────────────────────────────────────────────────────────────

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[int]:
    """Returns user_id if token is valid, None otherwise."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None

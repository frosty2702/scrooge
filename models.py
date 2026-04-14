"""
SQLAlchemy ORM models — users and simulations tables.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)          # bcrypt hash
    risk_profile = Column(String, nullable=False)      # conservative / moderate / aggressive
    investment_goal = Column(String, nullable=False)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    simulations = relationship("Simulation", back_populates="user")


class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String, nullable=False)
    final_amount = Column(Float)
    total_return_pct = Column(Float)
    sharpe = Column(Float)
    max_drawdown = Column(Float)
    volatility = Column(Float)
    weights = Column(Text)       # JSON — final portfolio weights
    decisions = Column(Text)     # JSON — full decisions array (date, weights, capital, feature_importance)
    asset_names = Column(Text)   # JSON — list of asset names
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="simulations")

# finance-coach-ai/backend/models.py
from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    personality = Column(String, nullable=True)
    language = Column(String, default="English")
    income = Column(Float, default=0.0)
    expenses = Column(JSON, default=dict)
    health_score = Column(Float, default=0.0)
    grade = Column(String, default="E")
    onboarded = Column(Boolean, default=False)
    
    chats = relationship("ChatLog", back_populates="session", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="session", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="session", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="session", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="session", cascade="all, delete-orphan")

class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    role = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("UserSession", back_populates="chats")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    name = Column(String)
    type = Column(String)
    balance = Column(Float, default=0.0)
    icon = Column(String)
    color = Column(String)
    status = Column(String, default="Active")

    session = relationship("UserSession", back_populates="accounts")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    name = Column(String)
    category = Column(String)
    amount = Column(Float)
    date = Column(String)
    status = Column(String, default="Completed")
    icon = Column(String)

    session = relationship("UserSession", back_populates="transactions")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    name = Column(String)
    target_amount = Column(Float)
    target_date = Column(String) # For simplicity, storing as string e.g. "3 months"
    saved_amount = Column(Float, default=0.0)
    weekly_plan = Column(JSON, default=list) # e.g. [{"week": 1, "amount": 5000}, ...]
    
    session = relationship("UserSession", back_populates="goals")

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("user_sessions.session_id"))
    category = Column(String)
    limit = Column(Float)
    spent = Column(Float, default=0.0)
    color = Column(String)
    icon = Column(String)

    session = relationship("UserSession", back_populates="budgets")

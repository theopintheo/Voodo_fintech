# finance-coach-ai/backend/routes/chat_routes.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import get_db
import models
from llm_engine import LLMCoach

router = APIRouter()

@router.post("/{session_id}/message")
def send_chat_message(
    session_id: str, 
    data: dict = Body(...), 
    db: Session = Depends(get_db)
):
    """
    Send user message and receive AI response with conversational context.
    """
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_msg = data.get("message")
    
    # Simple history retrieval for context
    history = db.query(models.ChatLog).filter(models.ChatLog.session_id == session_id).order_by(models.ChatLog.timestamp.desc()).limit(10).all()
    history_list = [{"role": msg.role, "content": msg.content} for msg in reversed(history)]
    
    # Save User Message
    db.add(models.ChatLog(session_id=session_id, role="user", content=user_msg))
    db.commit()
    
    # Generate AI Response
    ai_advice = LLMCoach.get_coach_advice(
        income=sess.income,
        expenses=sess.expenses,
        score=sess.health_score,
        grade=sess.grade,
        language=sess.language,
        personality=sess.personality,
        chat_history=history_list,
        user_message=user_msg
    )
    
    # Save Assistant Response
    db.add(models.ChatLog(session_id=session_id, role="assistant", content=ai_advice))
    db.commit()
    
    # Prepare the whole updated chat to return (just for convenience)
    full_history = db.query(models.ChatLog).filter(models.ChatLog.session_id == session_id).order_by(models.ChatLog.timestamp.asc()).all()
    
    return {
        "response": ai_advice, 
        "chat_history": [{"role": m.role, "content": m.content, "timestamp": str(m.timestamp)} for m in full_history]
    }

@router.get("/{session_id}/history")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    history = db.query(models.ChatLog).filter(models.ChatLog.session_id == session_id).order_by(models.ChatLog.timestamp.asc()).all()
    return [{"role": m.role, "content": m.content, "timestamp": str(m.timestamp)} for m in history]

@router.get("/{session_id}/insight")
def get_dashboard_insight(session_id: str, db: Session = Depends(get_db)):
    """
    Generates a quick, one-sentence AI advice for the dashboard overview.
    """
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    prompt = f"As an AI Finance Coach, give a single, extremely concise 1-sentence tip for a '{sess.personality}' who earns {sess.income} and has a health score of {sess.health_score}/100. Target the highest expense category if possible."
    
    insight = LLMCoach.get_coach_advice(
        income=sess.income,
        expenses=sess.expenses,
        score=sess.health_score,
        grade=sess.grade,
        language=sess.language,
        personality=sess.personality,
        chat_history=[],
        user_message=prompt
    )
    
    # Clean up the response if it's too long
    if "\n" in insight:
        insight = insight.split("\n")[0]
        
    return {"insight": insight}

# finance-coach-ai/backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import models
from database import engine, get_db
from sqlalchemy.orm import Session
import uuid
import routes.finance_routes as finance_routes
import routes.chat_routes as chat_routes

# Init DB
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app):
    print(">>> BACKEND STARTED <<<")
    yield

app = FastAPI(title="AI Personal Finance Coach API", version="1.0.0", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Root Path
@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Personal Finance Coach API"}

# Create a new session (Onboarding)
@app.post("/session/create")
def create_session(db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    new_sess = models.UserSession(session_id=session_id)
    db.add(new_sess)
    db.commit()
    return {"session_id": session_id}

# Health Check & Session Info
@app.get("/session/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": sess.session_id, "onboarded": sess.onboarded}

# Include Sub-Routes
app.include_router(finance_routes.router, prefix="/api/finance", tags=["finance"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.events import router as events_router
from src.api.timeline import router as timeline_router
from src.api.approvals import router as approvals_router
from src.api.summary import router as summary_router


app = FastAPI(
    title="Sentinel Incident Intelligence",
    description="AI-powered incident intelligence and Truth Engine for Sentinel.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://sentinel-six-murex.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(events_router)
app.include_router(timeline_router)
app.include_router(approvals_router)
app.include_router(summary_router)


@app.get("/")
def root():
    return {
        "name": "Sentinel Incident Intelligence",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "incident-intelligence",
    }

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.events import router as events_router
from .api.timeline import router as timeline_router
from .api.approvals import router as approvals_router
from .api.summary import router as summary_router


load_dotenv()


app = FastAPI(
    title="Sentinel Incident Intelligence",
    description="Incident intelligence and Truth Engine for Sentinel",
    version="0.1.0",
)


# Allow the React/Vite frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(events_router)
app.include_router(timeline_router)
app.include_router(approvals_router)
app.include_router(summary_router)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "incident-intelligence",
    }
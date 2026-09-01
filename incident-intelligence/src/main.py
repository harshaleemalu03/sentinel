from dotenv import load_dotenv
from fastapi import FastAPI

from .api.events import router as events_router

load_dotenv()

app = FastAPI(
    title="Sentinel Incident Intelligence",
    description="Incident intelligence and Truth Engine for Sentinel",
    version="0.1.0",
)

app.include_router(events_router)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "incident-intelligence",
    }

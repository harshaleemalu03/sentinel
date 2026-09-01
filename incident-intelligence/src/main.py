from dotenv import load_dotenv
from fastapi import FastAPI

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

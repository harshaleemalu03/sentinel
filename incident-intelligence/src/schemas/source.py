from pydantic import BaseModel


class SourceReference(BaseModel):
    event_id: str
    speaker_id: str
    speaker_name: str
    speaker_role: str

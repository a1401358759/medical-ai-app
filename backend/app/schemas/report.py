from pydantic import BaseModel
from datetime import datetime

class ReportUpload(BaseModel):
    filename: str

class ReportResponse(BaseModel):
    id: int
    filename: str
    content: str
    analysis: str
    created_at: datetime

    class Config:
        from_attributes = True

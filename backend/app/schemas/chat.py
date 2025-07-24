from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionCreate(BaseModel):
    title: str

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessageSchema(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class AgentChatRequestSchema(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None
    session_id: Optional[str] = "sess_default"
    history: List[ChatMessageSchema] = Field(default_factory=list)

class QuickActionSchema(BaseModel):
    id: str
    label: str
    query: str

class AgentChatResponseSchema(BaseModel):
    reply: str
    intent: Dict[str, Any]
    products: List[Dict[str, Any]]
    quick_actions: List[QuickActionSchema]

class IntentParseRequestSchema(BaseModel):
    query: str

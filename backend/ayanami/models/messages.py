"""Pydantic models for Ayanami API communication."""
from pydantic import BaseModel, Field
from typing import Optional

class ChatMessage(BaseModel):
    role: str = Field(..., description="user, assistant, or system")
    content: str

class ToolCall(BaseModel):
    name: str
    arguments: dict = Field(default_factory=dict)
    call_id: Optional[str] = None

class ToolResult(BaseModel):
    call_id: str
    output: Optional[str] = None
    error: Optional[str] = None

class ConversationRequest(BaseModel):
    messages: list[ChatMessage]
    model: Optional[str] = None
    sandbox_mode: str = "workspace-only"
    permission_mode: str = "never"
    reasoning_effort: str = "medium"
    max_tokens: int = 4096
    stream: bool = True
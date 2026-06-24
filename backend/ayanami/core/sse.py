"""SSE event types and formatting for Ayanami."""
import json
from enum import Enum
from typing import Any

class SSEEvent(str, Enum):
    RESPONSE_CREATED = "response.created"
    RESPONSE_IN_PROGRESS = "response.in_progress"
    RESPONSE_COMPLETED = "response.completed"
    TEXT_DELTA = "output_text.delta"
    TEXT_DONE = "output_text.done"
    THINKING_DELTA = "thinking.delta"
    THINKING_DONE = "thinking.done"
    FUNCTION_CALL_DELTA = "function_call.delta"
    FUNCTION_CALL_DONE = "function_call.done"
    ERROR = "error"
    PLAN_CREATED = "plan.created"
    PLAN_STEP = "plan.step_updated"
    PLAN_COMPLETED = "plan.completed"
    ARTIFACT_CREATED = "artifact.created"
    ARTIFACT_UPDATED = "artifact.updated"
    MESSAGE_ADDED = "message.added"
    MESSAGE_COMPLETED = "message.completed"

def sse_event(event: SSEEvent, data: Any) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event.value}\r\ndata: {payload}\r\n\r\n"

def sse_error(message: str, code: str = "unknown") -> str:
    return sse_event(SSEEvent.ERROR, {"message": message, "code": code})

def sse_done() -> str:
    return "data: [DONE]\r\n\r\n"
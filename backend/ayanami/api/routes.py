"""FastAPI routes for Ayanami backend."""
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from ..models.messages import ConversationRequest
from ..core.config import load_config
from ..core.sse import SSEEvent, sse_event, sse_error
from ..providers.factory import create_provider

router = APIRouter()

SYSTEM_PROMPT = """You are Ayanami, a coding agent and desktop AI assistant.
You are precise, safe, and helpful. You can execute shell commands and apply code patches.
You communicate with users in a friendly, direct manner.
When writing code, follow best practices and keep changes minimal and focused."""

def _load_system_prompt() -> str:
    prompt_path = Path(__file__).resolve().parent.parent.parent / "SYSTEM_PROMPT.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return SYSTEM_PROMPT

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ayanami-backend"}

@router.post("/v1/chat/completions")
async def chat_completions(request: ConversationRequest):
    config = load_config()

    # Inject system prompt
    system_msg = _load_system_prompt()
    messages = [{"role": "system", "content": system_msg}] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]
    request.messages = messages  # hack: replace with system-injected list

    provider = create_provider(config)

    return StreamingResponse(
        provider.chat_completion(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
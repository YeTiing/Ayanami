"""FastAPI routes for Ayanami backend - core chat & health."""
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..models.messages import ConversationRequest
from ..core.config import load_config
from ..providers.factory import create_provider
from ..database import db_manager

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

    system_msg = _load_system_prompt()
    messages = [{"role": "system", "content": system_msg}] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]
    # Create a copy with injected messages to avoid mutating the original request
    injected = request.model_copy(update={"messages": messages})

    provider = create_provider(config)

    return StreamingResponse(
        provider.chat_completion(injected),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@router.on_event("startup")
async def init_databases():
    db_manager.init_all()

@router.on_event("shutdown")
async def close_databases():
    db_manager.close_all()
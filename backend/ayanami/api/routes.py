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

# ---- Agents ----

from ..agents import agent_manager, AgentRole

@router.get("/v1/agents")
async def list_agents():
    return {"agents": agent_manager.list_all()}

@router.post("/v1/agents/spawn")
async def spawn_agent(role: str = "worker", parent_thread_id: str = ""):
    try:
        agent = agent_manager.spawn(role, parent_thread_id)
        return {"agent": agent.to_dict()}
    except RuntimeError as e:
        raise HTTPException(429, str(e))

@router.post("/v1/agents/{agent_id}/close")
async def close_agent(agent_id: str):
    agent = agent_manager.close(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}

@router.post("/v1/agents/{agent_id}/resume")
async def resume_agent(agent_id: str):
    agent = agent_manager.resume(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}

@router.post("/v1/agents/{agent_id}/send")
async def send_agent_input(agent_id: str, message: str = ""):
    agent = agent_manager.send_input(agent_id, message)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}

# ---- Approval ----

from ..approval import approval_manager, ApprovalType, ApprovalMode

@router.get("/v1/approvals/pending")
async def pending_approvals():
    return {"pending": approval_manager.pending_requests}

@router.post("/v1/approvals/{request_id}/approve")
async def approve_request(request_id: str):
    req = approval_manager.approve(request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    return {"request": req.to_dict()}

@router.post("/v1/approvals/{request_id}/deny")
async def deny_request(request_id: str, reason: str = ""):
    req = approval_manager.deny(request_id, reason)
    if not req:
        raise HTTPException(404, "Request not found")
    return {"request": req.to_dict()}

@router.get("/v1/approvals/mode")
async def get_approval_mode():
    return {"mode": approval_manager.mode.value}

@router.post("/v1/approvals/mode")
async def set_approval_mode(mode: str = "default"):
    try:
        approval_manager.set_mode(ApprovalMode(mode))
    except ValueError:
        raise HTTPException(400, f"Invalid mode: {mode}")
    return {"mode": approval_manager.mode.value}

# ---- Automations ----

from ..automation import automation_manager

@router.get("/v1/automations")
async def list_automations():
    return {"automations": automation_manager.list_all()}

@router.post("/v1/automations")
async def create_automation(name: str, schedule_type: str, schedule_value: str, action: str):
    auto = automation_manager.add(name, schedule_type, schedule_value, action)
    return {"automation": auto.to_dict()}

@router.delete("/v1/automations/{auto_id}")
async def delete_automation(auto_id: str):
    if not automation_manager.remove(auto_id):
        raise HTTPException(404, "Automation not found")
    return {"ok": True}

@router.post("/v1/automations/{auto_id}/toggle")
async def toggle_automation(auto_id: str):
    auto = automation_manager.toggle(auto_id)
    if not auto:
        raise HTTPException(404, "Automation not found")
    return {"automation": auto.to_dict()}

# ---- Database ----

from ..database import db_manager

@router.on_event("startup")
async def init_databases():
    db_manager.init_all()

@router.on_event("shutdown")
async def close_databases():
    db_manager.close_all()

# ---- Goals / Budget ----

from ..goals import goal_manager

@router.post("/v1/goals")
async def create_goal(objective: str = "", token_budget: int = 0):
    try:
        goal = goal_manager.create(objective, token_budget)
        return {"goal": goal.to_dict()}
    except RuntimeError as e:
        raise HTTPException(409, str(e))

@router.get("/v1/goals/current")
async def current_goal():
    goal = goal_manager.current
    return {"goal": goal.to_dict() if goal else None}

@router.post("/v1/goals/complete")
async def complete_goal():
    goal = goal_manager.complete()
    if not goal:
        raise HTTPException(404, "No active goal")
    return {"goal": goal.to_dict()}

@router.post("/v1/goals/block")
async def block_goal():
    goal = goal_manager.block()
    if not goal:
        raise HTTPException(404, "No active goal")
    return {"goal": goal.to_dict()}

@router.get("/v1/goals/history")
async def goal_history():
    return {"goals": goal_manager.list_history()}


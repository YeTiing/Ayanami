"""Routes for sub-agent management."""
from fastapi import APIRouter, HTTPException
from ..agents import agent_manager, AgentRole

router = APIRouter(prefix="/v1/agents", tags=["agents"])

@router.get("")
async def list_agents():
    return {"agents": agent_manager.list_all()}

@router.post("/spawn")
async def spawn_agent(role: str = "worker", parent_thread_id: str = ""):
    try:
        agent = agent_manager.spawn(role, parent_thread_id)
        return {"agent": agent.to_dict()}
    except RuntimeError as e:
        raise HTTPException(429, str(e))

@router.post("/{agent_id}/close")
async def close_agent(agent_id: str):
    agent = agent_manager.close(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}

@router.post("/{agent_id}/resume")
async def resume_agent(agent_id: str):
    agent = agent_manager.resume(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}

@router.post("/{agent_id}/send")
async def send_agent_input(agent_id: str, message: str = ""):
    agent = agent_manager.send_input(agent_id, message)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"agent": agent.to_dict()}
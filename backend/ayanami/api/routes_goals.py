"""Routes for goal/budget management."""
from fastapi import APIRouter, HTTPException
from ..goals import goal_manager

router = APIRouter(prefix="/v1/goals", tags=["goals"])

@router.post("")
async def create_goal(objective: str = "", token_budget: int = 0):
    try:
        goal = goal_manager.create(objective, token_budget)
        return {"goal": goal.to_dict()}
    except RuntimeError as e:
        raise HTTPException(409, str(e))

@router.get("/current")
async def current_goal():
    goal = goal_manager.current
    return {"goal": goal.to_dict() if goal else None}

@router.post("/complete")
async def complete_goal():
    goal = goal_manager.complete()
    if not goal:
        raise HTTPException(404, "No active goal")
    return {"goal": goal.to_dict()}

@router.post("/block")
async def block_goal():
    goal = goal_manager.block()
    if not goal:
        raise HTTPException(404, "No active goal")
    return {"goal": goal.to_dict()}

@router.get("/history")
async def goal_history():
    return {"goals": goal_manager.list_history()}
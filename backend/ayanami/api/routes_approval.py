"""Routes for approval management."""
from fastapi import APIRouter, HTTPException
from ..approval import approval_manager, ApprovalType, ApprovalMode

router = APIRouter(prefix="/v1/approvals", tags=["approvals"])

@router.get("/pending")
async def pending_approvals():
    return {"pending": approval_manager.pending_requests}

@router.post("/{request_id}/approve")
async def approve_request(request_id: str):
    req = approval_manager.approve(request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    return {"request": req.to_dict()}

@router.post("/{request_id}/deny")
async def deny_request(request_id: str, reason: str = ""):
    req = approval_manager.deny(request_id, reason)
    if not req:
        raise HTTPException(404, "Request not found")
    return {"request": req.to_dict()}

@router.get("/mode")
async def get_approval_mode():
    return {"mode": approval_manager.mode.value}

@router.post("/mode")
async def set_approval_mode(mode: str = "default"):
    try:
        approval_manager.set_mode(ApprovalMode(mode))
    except ValueError:
        raise HTTPException(400, f"Invalid mode: {mode}")
    return {"mode": approval_manager.mode.value}
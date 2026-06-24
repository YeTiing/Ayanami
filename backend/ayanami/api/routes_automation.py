"""Routes for automation management."""
from fastapi import APIRouter, HTTPException
from ..automation import automation_manager

router = APIRouter(prefix="/v1/automations", tags=["automations"])

@router.get("")
async def list_automations():
    return {"automations": automation_manager.list_all()}

@router.post("")
async def create_automation(name: str, schedule_type: str, schedule_value: str, action: str):
    auto = automation_manager.add(name, schedule_type, schedule_value, action)
    return {"automation": auto.to_dict()}

@router.delete("/{auto_id}")
async def delete_automation(auto_id: str):
    if not automation_manager.remove(auto_id):
        raise HTTPException(404, "Automation not found")
    return {"ok": True}

@router.post("/{auto_id}/toggle")
async def toggle_automation(auto_id: str):
    auto = automation_manager.toggle(auto_id)
    if not auto:
        raise HTTPException(404, "Automation not found")
    return {"automation": auto.to_dict()}
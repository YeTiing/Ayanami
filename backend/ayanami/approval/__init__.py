"""Approval system for Ayanami - 9 types, 4 modes."""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Callable
import time, uuid

class ApprovalType(str, Enum):
    SHELL_EXEC = "shell_exec"
    FILE_WRITE = "file_write"
    FILE_DELETE = "file_delete"
    NETWORK_REQUEST = "network_request"
    PATCH_APPLY = "patch_apply"
    COMPUTER_USE = "computer_use"
    BROWSER_USE = "browser_use"
    PACKAGE_INSTALL = "package_install"
    SPAWN_AGENT = "spawn_agent"

class ApprovalMode(str, Enum):
    DEFAULT = "default"
    AUTO_REVIEW = "autoReview"
    FULL_ACCESS = "fullAccess"
    GUARDIAN = "guardian"

APPROVAL_CONFIG = {
    ApprovalMode.DEFAULT: {
        ApprovalType.SHELL_EXEC: "ask",
        ApprovalType.FILE_WRITE: "ask",
        ApprovalType.FILE_DELETE: "ask",
        ApprovalType.NETWORK_REQUEST: "ask",
        ApprovalType.PATCH_APPLY: "auto",
        ApprovalType.COMPUTER_USE: "ask",
        ApprovalType.BROWSER_USE: "ask",
        ApprovalType.PACKAGE_INSTALL: "ask",
        ApprovalType.SPAWN_AGENT: "ask",
    },
    ApprovalMode.AUTO_REVIEW: {
        ApprovalType.SHELL_EXEC: "auto",
        ApprovalType.FILE_WRITE: "auto",
        ApprovalType.FILE_DELETE: "ask",
        ApprovalType.NETWORK_REQUEST: "auto",
        ApprovalType.PATCH_APPLY: "auto",
        ApprovalType.COMPUTER_USE: "ask",
        ApprovalType.BROWSER_USE: "auto",
        ApprovalType.PACKAGE_INSTALL: "ask",
        ApprovalType.SPAWN_AGENT: "auto",
    },
    ApprovalMode.FULL_ACCESS: {t: "auto" for t in ApprovalType},
    ApprovalMode.GUARDIAN: {t: "ask" for t in ApprovalType},
}

@dataclass
class ApprovalRequest:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    type: ApprovalType = ApprovalType.SHELL_EXEC
    description: str = ""
    details: dict = field(default_factory=dict)
    status: str = "pending"
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "type": self.type.value,
            "description": self.description, "details": self.details,
            "status": self.status, "created_at": self.created_at
        }

class ApprovalManager:
    def __init__(self, mode: ApprovalMode = ApprovalMode.DEFAULT):
        self.mode = mode
        self._pending: dict[str, ApprovalRequest] = {}
        self._on_approval: Optional[Callable] = None

    def set_mode(self, mode: ApprovalMode):
        self.mode = mode

    def set_callback(self, callback: Callable):
        self._on_approval = callback

    def needs_approval(self, approval_type: ApprovalType) -> bool:
        policy = APPROVAL_CONFIG.get(self.mode, {}).get(approval_type, "ask")
        return policy == "ask"

    async def request(self, approval_type: ApprovalType, description: str, details: dict = None) -> ApprovalRequest:
        req = ApprovalRequest(type=approval_type, description=description, details=details or {})
        if not self.needs_approval(approval_type):
            req.status = "auto_approved"
            return req
        self._pending[req.id] = req
        if self._on_approval:
            self._on_approval(req.to_dict())
        return req

    def approve(self, request_id: str) -> Optional[ApprovalRequest]:
        req = self._pending.pop(request_id, None)
        if req:
            req.status = "approved"
        return req

    def deny(self, request_id: str, reason: str = "") -> Optional[ApprovalRequest]:
        req = self._pending.pop(request_id, None)
        if req:
            req.status = "denied"
            req.details["deny_reason"] = reason
        return req

    @property
    def pending_requests(self) -> list[dict]:
        return [r.to_dict() for r in self._pending.values()]

approval_manager = ApprovalManager()
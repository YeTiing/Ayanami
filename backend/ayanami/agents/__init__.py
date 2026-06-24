"""Sub-agent management for Ayanami."""
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import json, time, uuid

class AgentRole(str, Enum):
    ARCHITECT = "architect"
    EXPLORER = "explorer"
    WORKER = "worker"
    REVIEWER = "reviewer"
    SECURITY = "security-reviewer"
    DATABASE = "database-reviewer"
    JAVA_REVIEWER = "java-reviewer"
    BUILD_RESOLVER = "build-error-resolver"
    SILENT_HUNTER = "silent-failure-hunter"
    DEFAULT = "default"

AGENT_CONFIGS = {
    AgentRole.ARCHITECT: {"model": "gpt-5.5", "description": "Software architecture specialist"},
    AgentRole.EXPLORER: {"model": "gpt-5.4-mini", "description": "Fast codebase explorer"},
    AgentRole.WORKER: {"model": "gpt-5.4", "description": "Implementation worker"},
    AgentRole.REVIEWER: {"model": "gpt-5.4", "description": "Code reviewer"},
    AgentRole.SECURITY: {"model": "gpt-5.5", "description": "Security vulnerability scanner"},
    AgentRole.DATABASE: {"model": "gpt-5.4", "description": "Database specialist"},
    AgentRole.JAVA_REVIEWER: {"model": "gpt-5.5", "description": "Java/Spring Boot reviewer"},
    AgentRole.BUILD_RESOLVER: {"model": "gpt-5.4-mini", "description": "Build error fixer"},
    AgentRole.SILENT_HUNTER: {"model": "gpt-5.4", "description": "Silent failure detector"},
    AgentRole.DEFAULT: {"model": "gpt-5.4", "description": "Default agent"},
}

@dataclass
class SubAgent:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    role: AgentRole = AgentRole.DEFAULT
    parent_thread_id: str = ""
    status: str = "idle"
    model: str = "gpt-5.4"
    created_at: float = field(default_factory=time.time)

    @classmethod
    def spawn(cls, role: AgentRole, parent_thread_id: str) -> "SubAgent":
        cfg = AGENT_CONFIGS.get(role, AGENT_CONFIGS[AgentRole.DEFAULT])
        return cls(role=role, parent_thread_id=parent_thread_id, model=cfg["model"])

    def to_dict(self) -> dict:
        return {
            "id": self.id, "role": self.role.value,
            "parent_thread_id": self.parent_thread_id,
            "status": self.status, "model": self.model,
            "created_at": self.created_at
        }

class AgentManager:
    def __init__(self):
        self._agents: dict[str, SubAgent] = {}
        self._max_concurrent = 3

    def spawn(self, role: str, parent_thread_id: str) -> SubAgent:
        try:
            agent_role = AgentRole(role)
        except ValueError:
            agent_role = AgentRole.DEFAULT
        if len(self.active) >= self._max_concurrent:
            raise RuntimeError(f"Max {self._max_concurrent} concurrent agents reached")
        agent = SubAgent.spawn(agent_role, parent_thread_id)
        self._agents[agent.id] = agent
        return agent

    def close(self, agent_id: str):
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = "closed"
        return agent

    def resume(self, agent_id: str) -> Optional[SubAgent]:
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = "idle"
        return agent

    def send_input(self, agent_id: str, message: str) -> Optional[SubAgent]:
        agent = self._agents.get(agent_id)
        if agent:
            agent.status = "running"
        return agent

    @property
    def active(self) -> list[SubAgent]:
        return [a for a in self._agents.values() if a.status not in ("closed", "completed", "error")]

    def list_all(self) -> list[dict]:
        return [a.to_dict() for a in self._agents.values()]

agent_manager = AgentManager()
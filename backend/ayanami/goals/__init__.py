"""Goal and token budget tracker for Ayanami."""
from dataclasses import dataclass, field
from typing import Optional
import time, uuid

@dataclass
class Goal:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    objective: str = ""
    status: str = "active"
    token_budget: int = 0
    token_used: int = 0
    created_at: float = field(default_factory=time.time)
    completed_at: float = 0.0
    steps: list = field(default_factory=list)

    def add_step(self, step: str):
        self.steps.append({"id": uuid.uuid4().hex[:6], "step": step, "status": "pending", "updated_at": time.time()})

    def consume_tokens(self, amount: int):
        self.token_used += amount

    @property
    def remaining(self) -> int:
        return -1 if self.token_budget == 0 else max(0, self.token_budget - self.token_used)

    @property
    def progress_pct(self) -> float:
        return min(100.0, (self.token_used / self.token_budget) * 100) if self.token_budget > 0 else 0.0

    def complete(self):
        self.status = "complete"; self.completed_at = time.time()

    def block(self):
        self.status = "blocked"

    def to_dict(self) -> dict:
        return {"id": self.id, "objective": self.objective, "status": self.status, "token_budget": self.token_budget, "token_used": self.token_used, "remaining": self.remaining, "progress_pct": self.progress_pct, "created_at": self.created_at, "completed_at": self.completed_at, "steps": self.steps}

class GoalManager:
    def __init__(self):
        self._current: Optional[Goal] = None
        self._history: list[Goal] = []

    def create(self, objective: str, token_budget: int = 0) -> Goal:
        if self._current and self._current.status == "active":
            raise RuntimeError("Active goal already exists")
        self._current = Goal(objective=objective, token_budget=token_budget)
        return self._current

    def consume(self, tokens: int):
        if self._current:
            self._current.consume_tokens(tokens)

    def complete(self) -> Optional[Goal]:
        if self._current:
            self._current.complete()
            self._history.append(self._current)
            g = self._current
            self._current = None
            return g

    def block(self) -> Optional[Goal]:
        if self._current:
            self._current.block()
            return self._current

    @property
    def current(self) -> Optional[Goal]:
        return self._current

    def list_history(self) -> list[dict]:
        return [g.to_dict() for g in self._history]

goal_manager = GoalManager()
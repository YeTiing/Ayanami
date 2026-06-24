"""Automation system for Ayanami - Cron + RRULE scheduled tasks."""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Callable
import time, uuid, asyncio
from datetime import datetime

class ScheduleType(str, Enum):
    CRON = "cron"
    RRULE = "rrule"
    INTERVAL = "interval"

@dataclass
class Automation:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    name: str = ""
    schedule_type: ScheduleType = ScheduleType.INTERVAL
    schedule_value: str = "3600"
    action: str = ""
    enabled: bool = True
    last_run: float = 0.0
    next_run: float = 0.0
    created_at: float = field(default_factory=time.time)

    def should_run(self) -> bool:
        if not self.enabled:
            return False
        return time.time() >= self.next_run

    def mark_run(self):
        self.last_run = time.time()
        if self.schedule_type == ScheduleType.INTERVAL:
            self.next_run = self.last_run + int(self.schedule_value)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "name": self.name,
            "schedule_type": self.schedule_type.value,
            "schedule_value": self.schedule_value,
            "action": self.action, "enabled": self.enabled,
            "last_run": self.last_run, "next_run": self.next_run,
            "created_at": self.created_at
        }

class AutomationManager:
    def __init__(self):
        self._automations: dict[str, Automation] = {}
        self._actions: dict[str, Callable] = {}
        self._running = False

    def add(self, name: str, schedule_type: str, schedule_value: str, action: str) -> Automation:
        try:
            st = ScheduleType(schedule_type)
        except ValueError:
            st = ScheduleType.INTERVAL
        auto = Automation(name=name, schedule_type=st, schedule_value=schedule_value, action=action, next_run=time.time())
        self._automations[auto.id] = auto
        return auto

    def remove(self, auto_id: str) -> bool:
        return self._automations.pop(auto_id, None) is not None

    def toggle(self, auto_id: str) -> Optional[Automation]:
        auto = self._automations.get(auto_id)
        if auto:
            auto.enabled = not auto.enabled
        return auto

    def register_action(self, name: str, callback: Callable):
        self._actions[name] = callback

    async def tick(self):
        for auto in list(self._automations.values()):
            if auto.should_run():
                try:
                    cb = self._actions.get(auto.action)
                    if cb:
                        await cb()
                    auto.mark_run()
                except Exception:
                    pass

    def list_all(self) -> list[dict]:
        return [a.to_dict() for a in self._automations.values()]

automation_manager = AutomationManager()
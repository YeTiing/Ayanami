"""SQLite database layer for Ayanami - 5 databases."""
import sqlite3
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
import json
import time

class DatabaseManager:
    def __init__(self, base_dir: str = "."):
        self.base = Path(base_dir).resolve()
        self.base.mkdir(parents=True, exist_ok=True)
        self._dbs: dict[str, sqlite3.Connection] = {}

    def _get(self, name: str) -> sqlite3.Connection:
        if name not in self._dbs:
            db = sqlite3.connect(str(self.base / f"{name}.db"))
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA foreign_keys=ON")
            self._dbs[name] = db
        return self._dbs[name]

    def init_all(self):
        self._init_state()
        self._init_memories()
        self._init_goals()
        self._init_logs()
        self._init_automations()
        return self

    def _init_state(self):
        db = self._get("state")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS threads (
                id TEXT PRIMARY KEY, title TEXT, created_at REAL, updated_at REAL,
                pinned INTEGER DEFAULT 0, archived INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY, thread_id TEXT, role TEXT, kind TEXT,
                content TEXT, metadata TEXT, timestamp REAL,
                FOREIGN KEY(thread_id) REFERENCES threads(id)
            );
            CREATE TABLE IF NOT EXISTS sub_agents (
                id TEXT PRIMARY KEY, parent_thread_id TEXT, agent_type TEXT,
                status TEXT DEFAULT 'idle', created_at REAL,
                FOREIGN KEY(parent_thread_id) REFERENCES threads(id)
            );
            CREATE TABLE IF NOT EXISTS dynamic_tools (
                id TEXT PRIMARY KEY, name TEXT, definition TEXT, enabled INTEGER DEFAULT 1
            );
        """)

    def _init_memories(self):
        db = self._get("memories")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY, thread_id TEXT, content TEXT,
                embedding BLOB, importance REAL DEFAULT 0.5, created_at REAL
            );
            CREATE TABLE IF NOT EXISTS memory_index (
                id INTEGER PRIMARY KEY, memory_id TEXT, key TEXT, value TEXT
            );
        """)

    def _init_goals(self):
        db = self._get("goals")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY, objective TEXT, status TEXT DEFAULT 'active',
                token_budget INTEGER, token_used INTEGER DEFAULT 0,
                created_at REAL, completed_at REAL
            );
            CREATE TABLE IF NOT EXISTS goal_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id TEXT, step TEXT,
                status TEXT DEFAULT 'pending', updated_at REAL,
                FOREIGN KEY(goal_id) REFERENCES goals(id)
            );
        """)

    def _init_logs(self):
        db = self._get("logs")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS run_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT,
                event_type TEXT, data TEXT, timestamp REAL
            );
            CREATE TABLE IF NOT EXISTS tool_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT,
                tool_name TEXT, arguments TEXT, result TEXT,
                duration_ms INTEGER, status TEXT, timestamp REAL
            );
        """)

    def _init_automations(self):
        db = self._get("automations")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS automations (
                id TEXT PRIMARY KEY, name TEXT, schedule_type TEXT,
                schedule_value TEXT, action TEXT, enabled INTEGER DEFAULT 1,
                last_run REAL, next_run REAL, created_at REAL
            );
            CREATE TABLE IF NOT EXISTS automation_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, automation_id TEXT,
                status TEXT, output TEXT, started_at REAL, finished_at REAL,
                FOREIGN KEY(automation_id) REFERENCES automations(id)
            );
        """)

    def close_all(self):
        for db in self._dbs.values():
            db.close()
        self._dbs.clear()

db_manager = DatabaseManager()
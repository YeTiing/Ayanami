"""Tool definitions for Ayanami."""
from typing import Any

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "shell_command",
            "description": "Execute a shell command and return its output.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute."
                    },
                    "justification": {
                        "type": "string",
                        "description": "User-facing reason for running this command."
                    },
                    "timeout_ms": {
                        "type": "integer",
                        "description": "Max runtime in milliseconds. Default 10000."
                    },
                    "workdir": {
                        "type": "string",
                        "description": "Working directory for the command."
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "apply_patch",
            "description": "Apply a unified diff patch to modify files.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patch": {
                        "type": "string",
                        "description": "Unified diff patch content to apply."
                    }
                },
                "required": ["patch"]
            }
        }
    }
]
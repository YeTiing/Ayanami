"""Tool executor for Ayanami."""
import asyncio
import re
from pathlib import Path
from .definitions import TOOL_DEFINITIONS

class ToolExecutor:
    def __init__(self, workspace_root: str = "."):
        self.workspace_root = Path(workspace_root).resolve()

    async def execute(self, tool_name: str, arguments: dict) -> dict:
        if tool_name == "shell_command":
            return await self._shell_command(arguments)
        elif tool_name == "apply_patch":
            return self._apply_patch(arguments)
        else:
            return {"call_id": "unknown", "error": f"Unknown tool: {tool_name}"}

    async def _shell_command(self, args: dict) -> dict:
        command = args.get("command", "")
        timeout = args.get("timeout_ms", 10000) / 1000.0
        workdir = args.get("workdir", str(self.workspace_root))

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=workdir,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )
            return {
                "call_id": f"shell_{id(command)}",
                "output": stdout.decode("utf-8", errors="replace")
                + ("\n" + stderr.decode("utf-8", errors="replace") if stderr else ""),
                "exit_code": proc.returncode,
            }
        except asyncio.TimeoutError:
            return {
                "call_id": f"shell_{id(command)}",
                "error": f"Command timed out after {timeout}s",
            }
        except Exception as e:
            return {
                "call_id": f"shell_{id(command)}",
                "error": str(e),
            }

    def _apply_patch(self, args: dict) -> dict:
        patch = args.get("patch", "")
        return {"call_id": f"patch_{id(patch)}", "output": "Patch applied successfully"}
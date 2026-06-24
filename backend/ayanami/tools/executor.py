"""Tool executor for Ayanami."""
import asyncio
import re
import shlex
from pathlib import Path
from typing import List, Optional
from .definitions import TOOL_DEFINITIONS

DANGEROUS_COMMANDS = [
    r"rm\s+-rf\s+/",
    r"format\b",
    r"del\s+/[fF]\s+/[sS]",
    r"shutdown\b",
    r"reboot\b",
    r":\(\)\s*\{",
    r"mkfs\.",
    r"dd\s+if=",
    r">\s*/dev/sd[a-z]",
]

_NEED_SHELL_MARKERS = ["|", ">", "<", "&&", "||", ";"]


def _needs_shell(command: str) -> bool:
    return any(m in command for m in _NEED_SHELL_MARKERS)


class ToolExecutor:
    def __init__(
        self,
        workspace_root: str = ".",
        allowed_paths: Optional[List[str]] = None,
        allow_mkdir: bool = False,
    ):
        self.workspace_root = Path(workspace_root).resolve()
        if allowed_paths is None:
            self.allowed_paths = [self.workspace_root]
        else:
            self.allowed_paths = [Path(p).resolve() for p in allowed_paths]
        self.allow_mkdir = allow_mkdir

    async def execute(self, tool_name: str, arguments: dict) -> dict:
        if tool_name == "shell_command":
            return await self._shell_command(arguments)
        elif tool_name == "apply_patch":
            return self._apply_patch(arguments)
        else:
            return {"call_id": "unknown", "error": f"Unknown tool: {tool_name}"}

    def _check_dangerous(self, command: str) -> Optional[str]:
        for pattern in DANGEROUS_COMMANDS:
            if re.search(pattern, command, re.IGNORECASE):
                return (
                    f"Security blocked: command matches dangerous pattern "
                    f"'{pattern}'. Command rejected."
                )
        return None

    def _validate_workdir(self, workdir: str) -> Optional[str]:
        try:
            resolved = Path(workdir).resolve()
        except Exception:
            return f"Invalid workdir path: {workdir}"
        for allowed in self.allowed_paths:
            try:
                resolved.relative_to(allowed)
                return None
            except ValueError:
                continue
        return (
            f"Security blocked: workdir '{workdir}' resolves to "
            f"'{resolved}', which is outside allowed paths: "
            f"{[str(p) for p in self.allowed_paths]}"
        )

    async def _shell_command(self, args: dict) -> dict:
        command = args.get("command", "")
        timeout = args.get("timeout_ms", 10000) / 1000.0
        workdir = args.get("workdir", str(self.workspace_root))

        danger_msg = self._check_dangerous(command)
        if danger_msg:
            return {"call_id": f"shell_{id(command)}", "error": danger_msg}

        workdir_err = self._validate_workdir(workdir)
        if workdir_err:
            return {"call_id": f"shell_{id(command)}", "error": workdir_err}

        if _needs_shell(command):
            kind = "subprocess_shell"
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=workdir,
            )
        else:
            kind = "subprocess_exec"
            try:
                argv = shlex.split(command)
            except ValueError:
                argv = command.split()
            proc = await asyncio.create_subprocess_exec(
                *argv,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=workdir,
            )

        try:
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
            if proc.returncode is None:
                try:
                    proc.kill()
                except Exception:
                    pass
            return {
                "call_id": f"shell_{id(command)}",
                "error": f"Command timed out after {timeout}s",
            }
        except Exception as e:
            return {
                "call_id": f"shell_{id(command)}",
                "error": str(e),
            }

    # ===== apply_patch =====

    def _parse_patch(self, patch: str) -> list:
        file_pattern = re.compile(
            r"\*\*\* Update File:\s*(.+?)\s*\n", re.IGNORECASE
        )
        hunk_header = re.compile(
            r"@@\s+-(\d+),?(\d*)\s+\+(\d+),?(\d*)\s+@@"
        )

        files = []
        pos = 0
        while True:
            file_match = file_pattern.search(patch, pos)
            if not file_match:
                break
            filepath = file_match.group(1).strip()
            section_start = file_match.end()
            next_file = file_pattern.search(patch, section_start)
            section_end = next_file.start() if next_file else len(patch)
            section = patch[section_start:section_end]

            hunks = []
            hunk_pos = 0
            while True:
                hdr = hunk_header.search(section, hunk_pos)
                if not hdr:
                    break
                old_start = int(hdr.group(1))
                old_len = int(hdr.group(2)) if hdr.group(2) else 1
                new_start = int(hdr.group(3))
                new_len = int(hdr.group(4)) if hdr.group(4) else 1

                hunk_body_start = hdr.end()
                next_hdr = hunk_header.search(section, hunk_body_start)
                hunk_body_end = next_hdr.start() if next_hdr else len(section)
                body = section[hunk_body_start:hunk_body_end]

                lines = []
                for line in body.split("\n"):
                    raw = line.rstrip("\r")
                    if raw.startswith(" "):
                        lines.append(("context", raw[1:]))
                    elif raw.startswith("-"):
                        lines.append(("remove", raw[1:]))
                    elif raw.startswith("+"):
                        lines.append(("add", raw[1:]))

                hunks.append({
                    "old_start": old_start,
                    "old_len": old_len,
                    "new_start": new_start,
                    "new_len": new_len,
                    "lines": lines,
                })
                hunk_pos = next_hdr.end() if next_hdr else len(section)

            files.append((filepath, hunks))
            pos = section_end

        return files

    def _apply_patch(self, args: dict) -> dict:
        patch = args.get("patch", "")
        if not patch.strip():
            return {"call_id": f"patch_{id(patch)}", "error": "Empty patch"}

        try:
            parsed = self._parse_patch(patch)
        except Exception as e:
            return {"call_id": f"patch_{id(patch)}", "error": f"Patch parse error: {e}"}

        if not parsed:
            return {"call_id": f"patch_{id(patch)}", "error": "No files found in patch"}

        total_added = 0
        total_removed = 0
        report = []

        for filepath, hunks in parsed:
            target = Path(filepath)
            if not target.is_absolute():
                target = self.workspace_root / target
            target = target.resolve()

            try:
                target.relative_to(self.workspace_root)
            except ValueError:
                report.append(
                    f"SKIP {filepath}: outside workspace ({self.workspace_root})"
                )
                continue

            is_new = not target.exists()

            if is_new:
                file_lines = []
            else:
                file_lines = target.read_text(encoding="utf-8").splitlines(keepends=True)

            file_added = 0
            file_removed = 0

            for hunk in reversed(hunks):
                old_start = hunk["old_start"]
                old_len = hunk["old_len"]
                hunk_lines = hunk["lines"]

                # === CONTEXT MATCH VALIDATION ===
                if not is_new and old_len > 0:
                    context_err = self._verify_context(
                        filepath, file_lines, old_start, hunk_lines
                    )
                    if context_err:
                        return {
                            "call_id": f"patch_{id(patch)}",
                            "error": context_err,
                        }

                new_block = []
                removed_in_hunk = 0
                for kind, text in hunk_lines:
                    if kind == "remove":
                        removed_in_hunk += 1
                    elif kind in ("add", "context"):
                        new_block.append(text)

                if old_len == 0 and is_new:
                    pass
                elif old_start - 1 <= len(file_lines):
                    del_start = old_start - 1
                    del file_lines[del_start : del_start + removed_in_hunk]
                    for i, added_line in enumerate(new_block):
                        file_lines.insert(del_start + i, added_line)

                file_removed += removed_in_hunk
                file_added += len([l for k, l in hunk_lines if k == "add"])

            if is_new and file_lines == []:
                new_lines = []
                for hunk in hunks:
                    for kind, text in hunk["lines"]:
                        if kind in ("add", "context"):
                            new_lines.append(text)
                file_lines = new_lines
                file_added = len(new_lines)

            if is_new:
                parent = target.parent
                if not parent.exists():
                    if self.allow_mkdir:
                        parent.mkdir(parents=True, exist_ok=True)
                    else:
                        report.append(
                            f"SKIP {filepath}: parent dir '{parent}' missing "
                            f"(mkdir requires approval / allow_mkdir=True)"
                        )
                        continue

            target.write_text(
                "".join(line + "\n" for line in file_lines),
                encoding="utf-8",
            )

            total_added += file_added
            total_removed += file_removed
            tag = "NEW" if is_new else "OK"
            report.append(f"{tag} {filepath}: +{file_added} -{file_removed}")

        return {
            "call_id": f"patch_{id(patch)}",
            "output": "\n".join(report)
            + f"\nTotal: +{total_added} -{total_removed} lines across {len(parsed)} file(s)",
        }

    def _verify_context(
        self,
        filepath: str,
        file_lines: list,
        old_start: int,
        hunk_lines: list,
    ) -> Optional[str]:
        idx = old_start - 1
        for kind, text in hunk_lines:
            if kind != "context":
                continue
            if idx >= len(file_lines):
                return (
                    f"Context mismatch in {filepath}: expected "
                    f"'{text}' at line {old_start}, but file is shorter "
                    f"({len(file_lines)} lines)"
                )
            actual = file_lines[idx].rstrip("\n\r")
            if actual != text:
                return (
                    f"Context mismatch in {filepath} line {old_start}: "
                    f"expected '{text}' but got '{actual}'. "
                    f"Patch may be stale — re-read the file first."
                )
            idx += 1
        return None

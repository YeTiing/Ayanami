"""
Async Named Pipe client for Computer Use JSON-RPC server.
"""
import asyncio
import json
import struct
from concurrent.futures import ThreadPoolExecutor

import pywintypes
import win32file
import win32pipe

PIPE_NAME = r"\\.\pipe\ayanami_computer_use"
BUFSIZE = 65536


class ComputerUseClient:
    def __init__(self):
        self._handle = None
        self._executor = ThreadPoolExecutor(max_workers=2)
        self._lock = asyncio.Lock()

    async def connect(self):
        loop = asyncio.get_running_loop()
        self._handle = await loop.run_in_executor(
            self._executor,
            lambda: win32file.CreateFile(
                PIPE_NAME, win32file.GENERIC_READ | win32file.GENERIC_WRITE,
                0, None, win32file.OPEN_EXISTING, 0, None,
            ),
        )
        # Set to message mode
        win32pipe.SetNamedPipeHandleState(
            self._handle, win32pipe.PIPE_READMODE_MESSAGE, None, None,
        )

    async def _call(self, method: str, params: dict = None) -> dict:
        loop = asyncio.get_running_loop()
        req = {"jsonrpc": "2.0", "method": method, "params": params or {}, "id": 1}
        payload = (json.dumps(req) + "\n").encode()
        async with self._lock:
            await loop.run_in_executor(self._executor, win32file.WriteFile, self._handle, payload)
            _, raw = await loop.run_in_executor(self._executor, win32file.ReadFile, self._handle, BUFSIZE)
        resp = json.loads(raw.decode("utf-8").strip())
        if "error" in resp:
            raise RuntimeError(resp["error"].get("message", "Unknown error"))
        return resp.get("result")

    async def screenshot(self) -> str:
        """Return base64 PNG screenshot."""
        return await self._call("screenshot")

    async def mouse_move(self, x: int, y: int):
        await self._call("mouse_move", {"x": x, "y": y})

    async def mouse_click(self, x: int, y: int, button: str = "left"):
        await self._call("mouse_click", {"x": x, "y": y, "button": button})

    async def mouse_scroll(self, dy: int):
        await self._call("mouse_scroll", {"dy": dy})

    async def key_press(self, key: str):
        await self._call("key_press", {"key": key})

    async def key_type(self, text: str, interval: float = 0.02):
        await self._call("key_type", {"text": text, "interval": interval})

    async def screen_size(self) -> dict:
        return await self._call("screen_size")

    async def get_cursor_pos(self) -> dict:
        return await self._call("get_cursor_pos")

    async def close(self):
        if self._handle:
            win32file.CloseHandle(self._handle)
            self._handle = None
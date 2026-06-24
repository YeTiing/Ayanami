"""
Computer Use — Named Pipe JSON-RPC 2.0 server.
Screenshot / mouse / keyboard via pyautogui.
"""
import asyncio
import base64
import io
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import pyautogui
import pywintypes
import win32file
import win32pipe

PIPE_NAME = r"\\.\pipe\ayanami_computer_use"
BUFSIZE = 65536
_executor = ThreadPoolExecutor(max_workers=4)

pyautogui.FAILSAFE = False


def _screenshot() -> str:
    img = pyautogui.screenshot()
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _screen_size() -> dict:
    w, h = pyautogui.size()
    return {"width": w, "height": h}


def _cursor_pos() -> dict:
    x, y = pyautogui.position()
    return {"x": x, "y": y}


METHODS = {
    "screenshot":     lambda p: _screenshot(),
    "mouse_move":     lambda p: pyautogui.moveTo(p["x"], p["y"]),
    "mouse_click":    lambda p: pyautogui.click(p["x"], p["y"], button=p.get("button", "left")),
    "mouse_scroll":   lambda p: pyautogui.scroll(p.get("clicks", p.get("dy", 0))),
    "key_press":      lambda p: pyautogui.press(p["key"]),
    "key_type":       lambda p: pyautogui.typewrite(p["text"], interval=p.get("interval", 0.02)),
    "screen_size":    lambda p: _screen_size(),
    "get_cursor_pos": lambda p: _cursor_pos(),
}


def handle_request(data: bytes) -> bytes:
    try:
        req = json.loads(data.decode("utf-8"))
    except json.JSONDecodeError:
        err = {"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": None}
        return (json.dumps(err) + "\n").encode()

    rid = req.get("id")
    method = req.get("method", "")
    params = req.get("params", {})

    if method not in METHODS:
        resp = {"jsonrpc": "2.0", "error": {"code": -32601, "message": f"Method not found: {method}"}, "id": rid}
        return (json.dumps(resp) + "\n").encode()

    try:
        result = METHODS[method](params)
        resp = {"jsonrpc": "2.0", "result": result, "id": rid}
    except Exception as exc:
        resp = {"jsonrpc": "2.0", "error": {"code": -32000, "message": str(exc)}, "id": rid}

    return (json.dumps(resp) + "\n").encode()


async def pipe_worker(pipe_handle):
    loop = asyncio.get_running_loop()
    leftover = b""
    while True:
        try:
            _, raw = await loop.run_in_executor(_executor, win32file.ReadFile, pipe_handle, BUFSIZE)
        except pywintypes.error:
            break
        if not raw:
            break
        leftover += raw
        while b"\n" in leftover:
            line, leftover = leftover.split(b"\n", 1)
            if line.strip():
                resp = await loop.run_in_executor(_executor, handle_request, line)
                try:
                    await loop.run_in_executor(_executor, win32file.WriteFile, pipe_handle, resp)
                except pywintypes.error:
                    return


async def serve():
    loop = asyncio.get_running_loop()
    print(f"[computer_use] Listening on {PIPE_NAME}")
    while True:
        handle = win32pipe.CreateNamedPipe(
            PIPE_NAME,
            win32pipe.PIPE_ACCESS_DUPLEX,
            win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_READMODE_MESSAGE | win32pipe.PIPE_WAIT,
            1, BUFSIZE, BUFSIZE, 0, None,
        )
        await loop.run_in_executor(_executor, win32pipe.ConnectNamedPipe, handle)
        asyncio.create_task(pipe_worker(handle))


if __name__ == "__main__":
    asyncio.run(serve())
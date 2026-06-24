"""
Async HTTP client for Browser Use server.
"""
import json
import httpx


class BrowserUseClient:
    def __init__(self, base_url: str = "http://127.0.0.1:9223"):
        self._base = base_url.rstrip("/")
        self._rid = 0
        self._client = httpx.AsyncClient(timeout=30.0)

    async def _call(self, method: str, params: dict = None) -> dict:
        self._rid += 1
        req = {"jsonrpc": "2.0", "method": method, "params": params or {}, "id": self._rid}
        resp = await self._client.post(f"{self._base}/jsonrpc", json=req)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise RuntimeError(data["error"].get("message", "Unknown error"))
        return data.get("result")

    async def launch(self, headless: bool = True) -> dict:
        return await self._call("launch", {"headless": headless})

    async def navigate(self, url: str, wait_until: str = "load") -> dict:
        return await self._call("navigate", {"url": url, "wait_until": wait_until})

    async def screenshot(self, selector: str = None, full_page: bool = False) -> str:
        return await self._call("screenshot", {"selector": selector, "full_page": full_page})

    async def click(self, selector: str, **kwargs) -> dict:
        return await self._call("click", {"selector": selector, **kwargs})

    async def type(self, selector: str, text: str) -> dict:
        return await self._call("type", {"selector": selector, "text": text})

    async def evaluate(self, js: str) -> dict:
        return await self._call("evaluate", {"js": js})

    async def get_html(self) -> str:
        return await self._call("get_html")

    async def close(self) -> dict:
        result = await self._call("close")
        await self._client.aclose()
        return result

    async def health(self) -> dict:
        resp = await self._client.get(f"{self._base}/health")
        resp.raise_for_status()
        return resp.json()
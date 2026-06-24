"""
Browser Use — Playwright CDP browser control HTTP server.
"""
import asyncio
import base64
import json
from aiohttp import web

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None


class BrowserServer:
    def __init__(self, host: str = "127.0.0.1", port: int = 9223):
        self.host = host
        self.port = port
        self._playwright = None
        self._browser = None
        self._page = None
        self._app = web.Application()
        self._setup_routes()

    def _setup_routes(self):
        self._app.router.add_post("/jsonrpc", self._handle_jsonrpc)
        self._app.router.add_get("/health", self._handle_health)

    async def _handle_health(self, request):
        return web.json_response({"status": "ok", "browser": self._browser is not None})

    async def _handle_jsonrpc(self, request):
        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({
                "jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": None
            })

        rid = body.get("id")
        method = body.get("method", "")
        params = body.get("params", {})

        handler = getattr(self, f"_rpc_{method}", None)
        if handler is None:
            return web.json_response({
                "jsonrpc": "2.0", "error": {"code": -32601, "message": f"Method not found: {method}"}, "id": rid
            })

        try:
            result = await handler(params)
            return web.json_response({"jsonrpc": "2.0", "result": result, "id": rid})
        except Exception as exc:
            return web.json_response({
                "jsonrpc": "2.0", "error": {"code": -32000, "message": str(exc)}, "id": rid
            })

    # ── RPC handlers ────────────────────────────────────────────

    async def _rpc_launch(self, params):
        if async_playwright is None:
            raise RuntimeError("playwright not installed. Run: pip install playwright && playwright install chromium")
        if self._playwright is None:
            self._playwright = await async_playwright().start()
        if self._browser is None:
            headless = params.get("headless", True)
            self._browser = await self._playwright.chromium.launch(headless=headless)
        if self._page is None:
            self._page = await self._browser.new_page()
        return {"status": "launched"}

    async def _rpc_navigate(self, params):
        self._ensure_page()
        url = params["url"]
        await self._page.goto(url, wait_until=params.get("wait_until", "load"))
        return {"url": self._page.url, "title": await self._page.title()}

    async def _rpc_screenshot(self, params):
        self._ensure_page()
        selector = params.get("selector")
        if selector:
            el = await self._page.query_selector(selector)
            if el is None:
                raise RuntimeError(f"Element not found: {selector}")
            raw = await el.screenshot(type="png")
        else:
            raw = await self._page.screenshot(type="png", full_page=params.get("full_page", False))
        return base64.b64encode(raw).decode()

    async def _rpc_click(self, params):
        self._ensure_page()
        selector = params["selector"]
        await self._page.click(selector, **{k: v for k, v in params.items() if k != "selector"})
        return {"clicked": selector}

    async def _rpc_type(self, params):
        self._ensure_page()
        selector = params["selector"]
        text = params["text"]
        await self._page.fill(selector, text)
        return {"typed": selector}

    async def _rpc_evaluate(self, params):
        self._ensure_page()
        js = params["js"]
        result = await self._page.evaluate(js)
        return {"result": result}

    async def _rpc_get_html(self, params):
        self._ensure_page()
        html = await self._page.content()
        return html

    async def _rpc_close(self, params):
        if self._page:
            await self._page.close()
            self._page = None
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        return {"status": "closed"}

    def _ensure_page(self):
        if self._page is None:
            raise RuntimeError("Browser not launched. Call 'launch' first.")

    async def start(self):
        runner = web.AppRunner(self._app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()
        print(f"[browser_use] Listening on http://{self.host}:{self.port}")

    async def stop(self):
        await self._rpc_close({})


if __name__ == "__main__":
    server = BrowserServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        pass
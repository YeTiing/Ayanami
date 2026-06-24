"""
FastAPI router for Browser Use endpoints.
Proxies to the Browser Use HTTP server.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from browser_use.client import BrowserUseClient
import asyncio

router = APIRouter(prefix="/browser", tags=["browser"])

_client: BrowserUseClient = None


def get_client() -> BrowserUseClient:
    global _client
    if _client is None:
        _client = BrowserUseClient()
    return _client


# ── Request models ──────────────────────────────────────────────

class LaunchRequest(BaseModel):
    headless: bool = True


class NavigateRequest(BaseModel):
    url: str
    wait_until: str = "load"


class ScreenshotRequest(BaseModel):
    selector: str | None = None
    full_page: bool = False


class ClickRequest(BaseModel):
    selector: str


class TypeRequest(BaseModel):
    selector: str
    text: str


class EvaluateRequest(BaseModel):
    js: str


# ── Routes ──────────────────────────────────────────────────────

@router.post("/launch")
async def launch(body: LaunchRequest):
    client = get_client()
    try:
        result = await client.launch(headless=body.headless)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/navigate")
async def navigate(body: NavigateRequest):
    client = get_client()
    try:
        result = await client.navigate(url=body.url, wait_until=body.wait_until)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/screenshot")
async def screenshot(body: ScreenshotRequest):
    client = get_client()
    try:
        result = await client.screenshot(selector=body.selector, full_page=body.full_page)
        return {"image_base64": result}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/click")
async def click(body: ClickRequest):
    client = get_client()
    try:
        result = await client.click(selector=body.selector)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/type")
async def type_text(body: TypeRequest):
    client = get_client()
    try:
        result = await client.type(selector=body.selector, text=body.text)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate")
async def evaluate(body: EvaluateRequest):
    client = get_client()
    try:
        result = await client.evaluate(js=body.js)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/close")
async def close():
    client = get_client()
    try:
        result = await client.close()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    client = get_client()
    try:
        return await client.health()
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
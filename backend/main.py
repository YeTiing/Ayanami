"""Ayanami Backend - FastAPI entry point."""
import sys
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ayanami.api.routes import router as core_router
from ayanami.api.routes_agents import router as agents_router
from ayanami.api.routes_approval import router as approval_router
from ayanami.api.routes_automation import router as automation_router
from ayanami.api.routes_goals import router as goals_router
from ayanami.api.browser_routes import router as browser_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Ayanami Backend",
        description="SSE proxy backend for Ayanami Desktop AI Assistant",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "app://ayanami"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(core_router)
    app.include_router(agents_router)
    app.include_router(approval_router)
    app.include_router(automation_router)
    app.include_router(goals_router)
    app.include_router(browser_router)
    return app

app = create_app()

def main():
    parser = argparse.ArgumentParser(description="Ayanami Backend")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=57321, help="Port to bind")
    parser.add_argument("--config", default=None, help="Config file path")
    args = parser.parse_args()

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
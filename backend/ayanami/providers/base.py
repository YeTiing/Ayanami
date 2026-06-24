"""Base provider for Ayanami."""
from abc import ABC, abstractmethod
from typing import AsyncGenerator
import httpx
from ..models.messages import ConversationRequest

class BaseProvider(ABC):
    def __init__(self, name: str, base_url: str, api_key: str = None):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client: httpx.AsyncClient = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    @abstractmethod
    def _build_body(self, request: ConversationRequest) -> dict:
        """Build the API request body."""
        ...

    async def chat_completion(self, request: ConversationRequest) -> AsyncGenerator[str, None]:
        """Stream chat completion and yield SSE events."""
        raise NotImplementedError

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
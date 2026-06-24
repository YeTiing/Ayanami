"""OpenAI-compatible provider (Responses API)."""
import json
from typing import AsyncGenerator
from ..models.messages import ConversationRequest
from ..tools.definitions import TOOL_DEFINITIONS
from ..core.sse import SSEEvent, sse_event, sse_done
from .base import BaseProvider

class OpenAICompatProvider(BaseProvider):
    def _build_body(self, request: ConversationRequest) -> dict:
        body = {
            "model": request.model or "deepseek-v4-pro",
            "input": [
                {"role": m.role, "content": m.content}
                for m in request.messages
            ],
            "tools": TOOL_DEFINITIONS,
            "max_output_tokens": request.max_tokens,
            "stream": True,
        }
        return body

    async def chat_completion(self, request: ConversationRequest) -> AsyncGenerator[str, None]:
        body = self._build_body(request)
        try:
            async with self.client.stream(
                "POST",
                f"{self.base_url}/responses",
                headers=self._headers(),
                json=body,
            ) as response:
                if response.status_code != 200:
                    text = await response.aread()
                    yield sse_event(SSEEvent.ERROR, {
                        "message": f"API error {response.status_code}: {text.decode()[:500]}"
                    })
                    yield sse_done()
                    return

                yield sse_event(SSEEvent.RESPONSE_CREATED, {"model": body["model"]})
                yield sse_event(SSEEvent.RESPONSE_IN_PROGRESS, {})

                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        event_data = json.loads(data_str)
                        event_type = event_data.get("type", "")

                        if event_type == "response.output_text.delta":
                            yield sse_event(SSEEvent.TEXT_DELTA, {
                                "delta": event_data.get("delta", "")
                            })
                        elif event_type == "response.output_text.done":
                            yield sse_event(SSEEvent.TEXT_DONE, {
                                "text": event_data.get("text", "")
                            })
                        elif event_type == "response.reasoning_text.delta":
                            yield sse_event(SSEEvent.THINKING_DELTA, {
                                "delta": event_data.get("delta", "")
                            })
                        elif event_type == "response.reasoning_text.done":
                            yield sse_event(SSEEvent.THINKING_DONE, {
                                "text": event_data.get("text", "")
                            })
                        elif "tool_call" in event_type or "function_call" in event_type:
                            yield sse_event(SSEEvent.FUNCTION_CALL_DELTA, {
                                "delta": data_str
                            })
                        else:
                            # Forward raw delta
                            yield sse_event(SSEEvent.TEXT_DELTA, {
                                "delta": data_str
                            })
                    except json.JSONDecodeError:
                        pass

                yield sse_event(SSEEvent.RESPONSE_COMPLETED, {})
                yield sse_done()

        except Exception as e:
            yield sse_event(SSEEvent.ERROR, {"message": str(e)})
            yield sse_done()
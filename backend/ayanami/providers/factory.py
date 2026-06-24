"""Provider factory for Ayanami."""
from ..core.config import Config, ModelProvider
from .base import BaseProvider
from .openai_compat import OpenAICompatProvider

def create_provider(config: Config) -> BaseProvider:
    provider_cfg = config.providers.get(config.model_provider)
    if not provider_cfg:
        provider_cfg = ModelProvider(name="openai", wire_api="responses", base_url="https://api.openai.com/v1")

    return OpenAICompatProvider(
        name=provider_cfg.name,
        base_url=provider_cfg.base_url,
        api_key=provider_cfg.api_key,
    )
import tomli
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class ModelProvider:
    name: str
    wire_api: str = "responses"
    base_url: str = "https://api.openai.com/v1"
    api_key: Optional[str] = None

@dataclass
class Config:
    model: str = "deepseek/deepseek-v4-pro"
    model_provider: str = "custom"
    providers: dict[str, ModelProvider] = field(default_factory=dict)
    sandbox_mode: str = "workspace-only"
    permission_mode: str = "never"
    reasoning_effort: str = "medium"

    def get_provider(self, name: Optional[str] = None) -> Optional[ModelProvider]:
        key = name or self.model_provider
        return self.providers.get(key)

def load_config(path: Optional[str] = None) -> Config:
    if path is None:
        search = Path(__file__).resolve().parent.parent.parent.parent / "config.toml"
        if search.exists(): path = str(search)
        else: return Config()
    if not Path(path).exists(): return Config()
    with open(path, "rb") as f:
        data = tomli.load(f)
    providers = {}
    if "model_providers" in data:
        for key, val in data["model_providers"].items():
            providers[key] = ModelProvider(
                name=val.get("name", key),
                wire_api=val.get("wire_api", "responses"),
                base_url=val.get("base_url", "https://api.openai.com/v1"),
                api_key=val.get("api_key"),
            )
    return Config(
        model=data.get("model", "deepseek/deepseek-v4-pro"),
        model_provider=data.get("model_provider", "custom"),
        providers=providers,
        sandbox_mode=data.get("sandbox", {}).get("mode", "workspace-only"),
        permission_mode=data.get("permissions", {}).get("mode", "never"),
        reasoning_effort=data.get("reasoning", {}).get("effort", "medium"),
    )
from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    provider_version: str = os.getenv("PROVIDER_VERSION", "provider-python-lunar-v1")
    cors_allow_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,https://saju-dating-proto.vercel.app").split(",")
            if origin.strip()
        ]
    )
    engine_version: str = os.getenv("ENGINE_VERSION", "chart-engine-v0.4")
    chart_mode: str = os.getenv("CHART_ENGINE_MODE", "fake")  # fake | lunar-prep
    # chart baseline (잠정 고정): v2-month-branch-boost
    chart_rule_version: str = os.getenv("CHART_RULE_VERSION", "v2-month-branch-boost")
    hidden_stem_blend: float = float(os.getenv("CHART_HIDDEN_STEM_BLEND", "0.5"))
    earth_dampening_enabled: bool = os.getenv("CHART_EARTH_DAMPENING_ENABLED", "false").lower() == "true"
    earth_dampening_strength: float = float(os.getenv("CHART_EARTH_DAMPENING_STRENGTH", "0.5"))


settings = Settings()

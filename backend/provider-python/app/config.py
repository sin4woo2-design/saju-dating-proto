from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    provider_version: str = os.getenv("PROVIDER_VERSION", "fake-python-provider-v0")
    engine_version: str = os.getenv("ENGINE_VERSION", "chart-engine-v0.3")
    chart_mode: str = os.getenv("CHART_ENGINE_MODE", "fake")  # fake | lunar-prep
    chart_rule_version: str = os.getenv("CHART_RULE_VERSION", "v2-month-branch-boost")
    hidden_stem_blend: float = float(os.getenv("CHART_HIDDEN_STEM_BLEND", "0.5"))


settings = Settings()

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    provider_version: str = os.getenv("PROVIDER_VERSION", "fake-python-provider-v0")
    chart_mode: str = os.getenv("CHART_ENGINE_MODE", "fake")  # fake | lunar-prep


settings = Settings()

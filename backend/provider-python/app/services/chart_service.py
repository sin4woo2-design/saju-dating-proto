from __future__ import annotations

from app.config import settings
from app.schemas import PersonInput
from app.services.fake_engine import calculate_chart
from app.services.lunar_chart import calculate_chart_with_lunar


def get_chart(person: PersonInput):
    """
    chart 엔진 선택 포인트.
    - 현재 기본은 fake
    - CHART_ENGINE_MODE=lunar-prep 일 때 lunar 모듈 진입 시도
    - 아직 lunar 미구현이므로 graceful fallback
    """
    if settings.chart_mode == "lunar-prep":
        try:
            five, pillars, signals, warnings = calculate_chart_with_lunar(person)
            return five, pillars, signals, 48, warnings
        except Exception:
            five, pillars, signals, latency_ms, warnings = calculate_chart(person)
            if "PROVIDER_UNAVAILABLE" not in warnings:
                warnings.append("PROVIDER_UNAVAILABLE")
            return five, pillars, signals, latency_ms, warnings

    return calculate_chart(person)

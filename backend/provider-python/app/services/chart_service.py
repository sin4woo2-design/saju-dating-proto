from __future__ import annotations

from app.config import settings
from app.schemas import PersonInput
from app.services.fake_engine import calculate_chart
from app.services.lunar_chart import calculate_chart_with_lunar


def get_chart(person: PersonInput):
    """
    chart 엔진 선택 포인트.
    - 기본(fake): v1-current
    - lunar-prep: ruleVersion에 맞춰 lunar chart 계산 시도
    - 실패 시 fake fallback + source=mock-fallback
    """
    if settings.chart_mode == "lunar-prep":
        try:
            five, pillars, signals, warnings = calculate_chart_with_lunar(
                person,
                rule_version=settings.chart_rule_version,
                hidden_blend=settings.hidden_stem_blend,
                earth_dampening_enabled=settings.earth_dampening_enabled,
                earth_dampening_strength=settings.earth_dampening_strength,
            )
            return {
                "five": five,
                "pillars": pillars,
                "signals": signals,
                "latency_ms": 48,
                "warnings": warnings,
                "rule_version": settings.chart_rule_version,
                "calculation_source": "provider-lunar-python",
            }
        except Exception:
            five, pillars, signals, latency_ms, warnings = calculate_chart(person)
            if "PROVIDER_UNAVAILABLE" not in warnings:
                warnings.append("PROVIDER_UNAVAILABLE")
            return {
                "five": five,
                "pillars": pillars,
                "signals": signals,
                "latency_ms": latency_ms,
                "warnings": warnings,
                "rule_version": "v1-current",
                "calculation_source": "mock-fallback",
            }

    five, pillars, signals, latency_ms, warnings = calculate_chart(person)
    return {
        "five": five,
        "pillars": pillars,
        "signals": signals,
        "latency_ms": latency_ms,
        "warnings": warnings,
        "rule_version": "v1-current",
        "calculation_source": "mock",
    }

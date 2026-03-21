from __future__ import annotations

import time

from app.config import settings
from app.schemas import PersonInput
from app.services.fake_engine import calculate_chart
from app.services.chart_basis import derive_chart_basis
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
            started = time.perf_counter()
            five, pillars, signals, warnings, basis, breakdown = calculate_chart_with_lunar(
                person,
                rule_version=settings.chart_rule_version,
                hidden_blend=settings.hidden_stem_blend,
                earth_dampening_enabled=settings.earth_dampening_enabled,
                earth_dampening_strength=settings.earth_dampening_strength,
            )
            latency_ms = max(1, int((time.perf_counter() - started) * 1000))
            return {
                "five": five,
                "pillars": pillars,
                "signals": signals,
                "latency_ms": latency_ms,
                "warnings": warnings,
                "rule_version": settings.chart_rule_version,
                "calculation_source": "provider-lunar-python",
                "basis": basis,
                "breakdown": breakdown,
            }
        except Exception:
            started = time.perf_counter()
            five, pillars, signals, latency_ms, warnings = calculate_chart(person)
            latency_ms = max(latency_ms, int((time.perf_counter() - started) * 1000))
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
                "basis": derive_chart_basis(five, pillars),
                "breakdown": None,
            }

    started = time.perf_counter()
    five, pillars, signals, latency_ms, warnings = calculate_chart(person)
    latency_ms = max(latency_ms, int((time.perf_counter() - started) * 1000))
    return {
        "five": five,
        "pillars": pillars,
        "signals": signals,
        "latency_ms": latency_ms,
        "warnings": warnings,
        "rule_version": "v1-current",
        "calculation_source": "mock",
        "basis": derive_chart_basis(five, pillars),
        "breakdown": None,
    }

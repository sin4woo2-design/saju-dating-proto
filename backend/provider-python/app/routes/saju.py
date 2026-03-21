from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import (
    CompatibilitySignalsRequest,
    CompatibilitySignalsResponse,
    ErrorBody,
    ErrorResponse,
    Meta,
    SajuBody,
    SajuChartRequest,
    SajuChartResponse,
    CompatibilityBody,
)
from app.config import settings
from app.services.fake_engine import PROVIDER_VERSION, validate_policy
from app.services.chart_service import get_chart
from app.services.compatibility_service import get_compatibility
from app.services.request_id import deterministic_request_id

router = APIRouter(prefix="/saju", tags=["saju"])


def _raise_error(status_code: int, code: str, message: str, request_id: str, retryable: bool = False):
    payload = ErrorResponse(
        error=ErrorBody(code=code, message=message, requestId=request_id, retryable=retryable)
    ).model_dump()
    raise HTTPException(status_code=status_code, detail=payload)


@router.post("/chart", response_model=SajuChartResponse)
def saju_chart(req: SajuChartRequest):
    payload = req.model_dump()
    request_id = deterministic_request_id("chart", payload)

    ok, error_code, error_message = validate_policy(req.person)
    if not ok:
        _raise_error(status_code=400, code=error_code, message=error_message, request_id=request_id)

    result = get_chart(req.person)

    return SajuChartResponse(
        meta=Meta(
            providerVersion=PROVIDER_VERSION,
            engineVersion=settings.engine_version,
            requestId=request_id,
            latencyMs=result["latency_ms"],
        ),
        saju=SajuBody(
            fiveElements=result["five"],
            pillars=result["pillars"] if req.options.includeRawPillars else None,
            signals=result["signals"] if req.options.includeSignals else None,
            ruleVersion=result["rule_version"],
            calculationSource=result["calculation_source"],
            basis=result.get("basis"),
            breakdown=result.get("breakdown"),
        ),
        warnings=result["warnings"],
    )


@router.post("/compatibility-signals", response_model=CompatibilitySignalsResponse)
def compatibility_signals(req: CompatibilitySignalsRequest):
    payload = req.model_dump()
    request_id = deterministic_request_id("compatibility", payload)

    for p in (req.me, req.partner):
        ok, error_code, error_message = validate_policy(p)
        if not ok:
            _raise_error(status_code=400, code=error_code, message=error_message, request_id=request_id)

    score, signals, raw_signals, reliability, latency_ms, warnings, v2 = get_compatibility(req.me, req.partner)

    return CompatibilitySignalsResponse(
        meta=Meta(
            providerVersion=PROVIDER_VERSION,
            engineVersion=settings.engine_version,
            requestId=request_id,
            latencyMs=latency_ms,
        ),
        compatibility=CompatibilityBody(
            totalScore=v2["totalScore"],
            subScores=v2["subScores"],
            basis=v2["basis"],
            confidence=v2["confidence"],
            provenance=v2["provenance"],
            score=score,
            signals=signals if req.options.includeSignals else None,
            rawSignals=raw_signals if req.options.includeRawSignals else None,
            reliability=reliability,
        ),
        warnings=warnings,
    )

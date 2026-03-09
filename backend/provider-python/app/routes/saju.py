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

    five, pillars, signals, latency_ms, warnings = get_chart(req.person)

    return SajuChartResponse(
        meta=Meta(
            providerVersion=PROVIDER_VERSION,
            requestId=request_id,
            latencyMs=latency_ms,
        ),
        saju=SajuBody(
            fiveElements=five,
            pillars=pillars if req.options.includeRawPillars else None,
            signals=signals if req.options.includeSignals else None,
        ),
        warnings=warnings,
    )


@router.post("/compatibility-signals", response_model=CompatibilitySignalsResponse)
def compatibility_signals(req: CompatibilitySignalsRequest):
    payload = req.model_dump()
    request_id = deterministic_request_id("compatibility", payload)

    for p in (req.me, req.partner):
        ok, error_code, error_message = validate_policy(p)
        if not ok:
            _raise_error(status_code=400, code=error_code, message=error_message, request_id=request_id)

    score, signals, latency_ms, warnings = get_compatibility(req.me, req.partner)

    return CompatibilitySignalsResponse(
        meta=Meta(
            providerVersion=PROVIDER_VERSION,
            requestId=request_id,
            latencyMs=latency_ms,
        ),
        compatibility=CompatibilityBody(
            score=score,
            signals=signals if req.options.includeSignals else None,
        ),
        warnings=warnings,
    )

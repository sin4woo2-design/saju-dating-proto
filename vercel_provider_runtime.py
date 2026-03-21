from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parent
PROVIDER_APP_ROOT = ROOT / "backend" / "provider-python"

if str(PROVIDER_APP_ROOT) not in sys.path:
    sys.path.insert(0, str(PROVIDER_APP_ROOT))

from app.config import settings  # noqa: E402
from app.schemas import (  # noqa: E402
    CompatibilityBody,
    CompatibilitySignalsRequest,
    CompatibilitySignalsResponse,
    ErrorBody,
    ErrorResponse,
    Meta,
    SajuBody,
    SajuChartRequest,
    SajuChartResponse,
)
from app.services.chart_service import get_chart  # noqa: E402
from app.services.compatibility_service import get_compatibility  # noqa: E402
from app.services.fake_engine import PROVIDER_VERSION, validate_policy  # noqa: E402
from app.services.request_id import deterministic_request_id  # noqa: E402


def _set_common_headers(handler: BaseHTTPRequestHandler, status_code: int) -> None:
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, X-Request-Id")
    handler.end_headers()


def send_json(handler: BaseHTTPRequestHandler, status_code: int, payload: dict[str, Any]) -> None:
    _set_common_headers(handler, status_code)
    handler.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))


def send_error(
    handler: BaseHTTPRequestHandler,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    retryable: bool = False,
) -> None:
    payload = ErrorResponse(
        error=ErrorBody(
            code=code,
            message=message,
            requestId=request_id,
            retryable=retryable,
        )
    ).model_dump(mode="json")
    send_json(handler, status_code, payload)


def handle_options_request(handler: BaseHTTPRequestHandler) -> None:
    _set_common_headers(handler, 204)


def handle_method_not_allowed(handler: BaseHTTPRequestHandler, allowed: str) -> None:
    handler.send_response(405)
    handler.send_header("Allow", allowed)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, X-Request-Id")
    handler.end_headers()


def read_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any] | None:
    length = int(handler.headers.get("content-length", "0") or 0)
    if length <= 0:
        return None

    raw = handler.rfile.read(length)
    if not raw:
        return None

    decoded = raw.decode("utf-8")
    return json.loads(decoded)


def health_payload() -> dict[str, Any]:
    return {"ok": True, "service": "provider-python", "mode": settings.chart_mode}


def handle_health_request(handler: BaseHTTPRequestHandler) -> None:
    send_json(handler, 200, health_payload())


def handle_saju_chart_request(handler: BaseHTTPRequestHandler) -> None:
    try:
        payload = read_json_body(handler)
    except json.JSONDecodeError:
        send_error(handler, 400, "INVALID_INPUT", "invalid request payload", "req_invalid_json")
        return

    request_id = deterministic_request_id("chart", payload or {})

    try:
        request = SajuChartRequest.model_validate(payload or {})
    except ValidationError:
        send_error(handler, 400, "INVALID_INPUT", "invalid request payload", request_id)
        return

    ok, error_code, error_message = validate_policy(request.person)
    if not ok:
        send_error(handler, 400, error_code or "INVALID_INPUT", error_message or "invalid request payload", request_id)
        return

    try:
        result = get_chart(request.person)
    except Exception:
        send_error(handler, 500, "INTERNAL_ERROR", "chart calculation failed", request_id, retryable=True)
        return

    response = SajuChartResponse(
        meta=Meta(
            providerVersion=PROVIDER_VERSION,
            engineVersion=settings.engine_version,
            requestId=request_id,
            latencyMs=result["latency_ms"],
        ),
        saju=SajuBody(
            fiveElements=result["five"],
            pillars=result["pillars"] if request.options.includeRawPillars else None,
            signals=result["signals"] if request.options.includeSignals else None,
            ruleVersion=result["rule_version"],
            calculationSource=result["calculation_source"],
        ),
        warnings=result["warnings"],
    ).model_dump(mode="json")

    send_json(handler, 200, response)


def handle_compatibility_request(handler: BaseHTTPRequestHandler) -> None:
    try:
        payload = read_json_body(handler)
    except json.JSONDecodeError:
        send_error(handler, 400, "INVALID_INPUT", "invalid request payload", "req_invalid_json")
        return

    request_id = deterministic_request_id("compatibility", payload or {})

    try:
        request = CompatibilitySignalsRequest.model_validate(payload or {})
    except ValidationError:
        send_error(handler, 400, "INVALID_INPUT", "invalid request payload", request_id)
        return

    for person in (request.me, request.partner):
        ok, error_code, error_message = validate_policy(person)
        if not ok:
            send_error(handler, 400, error_code or "INVALID_INPUT", error_message or "invalid request payload", request_id)
            return

    try:
        score, signals, raw_signals, reliability, latency_ms, warnings, v2 = get_compatibility(request.me, request.partner)
    except Exception:
        send_error(handler, 500, "INTERNAL_ERROR", "compatibility calculation failed", request_id, retryable=True)
        return

    response = CompatibilitySignalsResponse(
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
            signals=signals if request.options.includeSignals else None,
            rawSignals=raw_signals if request.options.includeRawSignals else None,
            reliability=reliability,
        ),
        warnings=warnings,
    ).model_dump(mode="json")

    send_json(handler, 200, response)

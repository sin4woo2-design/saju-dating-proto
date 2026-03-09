from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

WarningCode = Literal[
    "PROVIDER_TIMEOUT",
    "PROVIDER_UNAVAILABLE",
    "PROVIDER_BAD_RESPONSE",
    "PROVIDER_PARTIAL_DATA",
]

ErrorCode = Literal[
    "INVALID_INPUT",
    "UNSUPPORTED_TIMEZONE",
    "UNSUPPORTED_CALENDAR_TYPE",
    "UPSTREAM_TIMEOUT",
    "INTERNAL_ERROR",
]


class PersonInput(BaseModel):
    name: Optional[str] = None
    birthDate: str
    birthTime: str
    birthTimeKnown: bool = True
    gender: Literal["male", "female", "other"]
    calendarType: Literal["solar", "lunar"] = "solar"
    timezone: str = "Asia/Seoul"


class SajuOptions(BaseModel):
    includeSignals: bool = True
    includeRawPillars: bool = True


class CompatibilityOptions(BaseModel):
    includeSignals: bool = True


class SajuChartRequest(BaseModel):
    person: PersonInput
    options: SajuOptions = Field(default_factory=SajuOptions)


class CompatibilitySignalsRequest(BaseModel):
    me: PersonInput
    partner: PersonInput
    options: CompatibilityOptions = Field(default_factory=CompatibilityOptions)


class Meta(BaseModel):
    providerVersion: str
    requestId: str
    latencyMs: Optional[int] = None


class Pillars(BaseModel):
    year: Optional[str] = None
    month: Optional[str] = None
    day: Optional[str] = None
    hour: Optional[str] = None


class SajuBody(BaseModel):
    fiveElements: Optional[dict[str, int]] = None
    pillars: Optional[Pillars] = None
    signals: Optional[list[str]] = None


class CompatibilityBody(BaseModel):
    score: Optional[int] = None
    signals: Optional[list[str]] = None


class SajuChartResponse(BaseModel):
    meta: Meta
    saju: SajuBody
    warnings: list[WarningCode] = Field(default_factory=list)


class CompatibilitySignalsResponse(BaseModel):
    meta: Meta
    compatibility: CompatibilityBody
    warnings: list[WarningCode] = Field(default_factory=list)


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    requestId: str
    retryable: bool


class ErrorResponse(BaseModel):
    error: ErrorBody

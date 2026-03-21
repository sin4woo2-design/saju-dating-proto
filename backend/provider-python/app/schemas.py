from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

WarningCode = Literal[
    "PROVIDER_TIMEOUT",
    "PROVIDER_UNAVAILABLE",
    "PROVIDER_BAD_RESPONSE",
    "PROVIDER_PARTIAL_DATA",
    "COMPAT_RULE_DEGRADED",
    "COMPAT_BASIS_INCOMPLETE",
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
    includeRawSignals: bool = True


class SajuChartRequest(BaseModel):
    person: PersonInput
    options: SajuOptions = Field(default_factory=SajuOptions)


class CompatibilitySignalsRequest(BaseModel):
    me: PersonInput
    partner: PersonInput
    options: CompatibilityOptions = Field(default_factory=CompatibilityOptions)


class Meta(BaseModel):
    providerVersion: str
    engineVersion: Optional[str] = None
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
    ruleVersion: Optional[str] = None
    calculationSource: Optional[str] = None
    basis: Optional[dict[str, Any]] = None
    breakdown: Optional[dict[str, Any]] = None


class CompatibilityRawSignal(BaseModel):
    code: str
    category: Literal[
        "relation-branch",
        "relation-stem",
        "element-dynamics",
        "daymaster-dynamics",
        "reliability",
    ]
    polarity: Literal["positive", "negative", "neutral"]
    weight: Optional[int] = None
    note: Optional[str] = None


class CompatibilityReliability(BaseModel):
    timeKnownMe: Optional[bool] = None
    timeKnownPartner: Optional[bool] = None
    confidence: Optional[Literal["high", "medium", "low"]] = None


class CompatibilitySubScores(BaseModel):
    branch: int
    stem: int
    elements: int
    dayMaster: int
    reliability: int


class CompatibilityBasisParticipant(BaseModel):
    pillars: Optional[Pillars] = None
    dayMaster: Optional[str] = None
    dayMasterLabel: Optional[str] = None
    strengthLevel: Optional[Literal["strong", "balanced", "weak"]] = None
    usefulElements: Optional[list[Literal["wood", "fire", "earth", "metal", "water"]]] = None
    cautionElements: Optional[list[Literal["wood", "fire", "earth", "metal", "water"]]] = None
    fiveElements: Optional[dict[str, int]] = None
    birthTimeKnown: Optional[bool] = None


class CompatibilityBranchRelation(BaseModel):
    scope: Literal["year", "month", "day", "hour", "cross"]
    type: Literal["hap", "chung", "hyeong", "pa", "hae", "neutral"]
    weight: int
    code: str


class CompatibilityStemRelation(BaseModel):
    scope: Literal["year", "month", "day", "hour", "cross"]
    type: Literal["hap", "chung", "clash", "neutral"]
    weight: int
    code: str


class CompatibilityElementDynamics(BaseModel):
    type: Literal["generates", "controls", "overweight", "lacking", "balanced"]
    weight: int
    code: str


class CompatibilityDayMasterDynamics(BaseModel):
    type: Literal["support", "clash", "neutral"]
    weight: int
    code: str


class CompatibilityReliabilityPenalty(BaseModel):
    code: str
    weight: int
    reason: str


class CompatibilityBasisRelations(BaseModel):
    branchRelations: list[CompatibilityBranchRelation] = Field(default_factory=list)
    stemRelations: list[CompatibilityStemRelation] = Field(default_factory=list)
    elementDynamics: list[CompatibilityElementDynamics] = Field(default_factory=list)
    dayMasterDynamics: list[CompatibilityDayMasterDynamics] = Field(default_factory=list)


class CompatibilityBasisReliability(BaseModel):
    penalties: list[CompatibilityReliabilityPenalty] = Field(default_factory=list)
    confidence: Literal["high", "medium", "low"]


class CompatibilityBasis(BaseModel):
    schemaVersion: Literal["compat-basis-v1"]
    participants: dict[Literal["me", "partner"], CompatibilityBasisParticipant]
    relations: CompatibilityBasisRelations
    reliability: CompatibilityBasisReliability


class CompatibilityConfidence(BaseModel):
    level: Literal["high", "medium", "low"]
    reasons: list[str] = Field(default_factory=list)


class CompatibilityProvenance(BaseModel):
    ruleVersion: str
    calculationSource: str
    basisSchemaVersion: Literal["compat-basis-v1"]
    chartRuleVersion: Optional[str] = None


class CompatibilityBody(BaseModel):
    # v2
    totalScore: Optional[int] = None
    subScores: Optional[CompatibilitySubScores] = None
    basis: Optional[CompatibilityBasis] = None
    confidence: Optional[CompatibilityConfidence] = None
    provenance: Optional[CompatibilityProvenance] = None

    # v1 (legacy)
    score: Optional[int] = None
    signals: Optional[list[str]] = None
    rawSignals: Optional[list[CompatibilityRawSignal]] = None
    reliability: Optional[CompatibilityReliability] = None


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

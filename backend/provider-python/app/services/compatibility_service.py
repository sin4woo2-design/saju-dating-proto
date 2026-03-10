from __future__ import annotations

from app.schemas import PersonInput
from app.services.fake_engine import calculate_compatibility_signals

RAW_SIGNAL_TABLE = {
    "HAP_YEAR_BRANCH": {
        "code": "BRANCH_HAP_YEAR",
        "category": "relation-branch",
        "polarity": "positive",
        "weight": 7,
        "note": "연지 합 관계",
    },
    "CHUNG_YEAR_BRANCH": {
        "code": "BRANCH_CHUNG_YEAR",
        "category": "relation-branch",
        "polarity": "negative",
        "weight": -6,
        "note": "연지 충 관계",
    },
    "HAP_DAY_STEM": {
        "code": "STEM_HAP_DAY",
        "category": "relation-stem",
        "polarity": "positive",
        "weight": 4,
        "note": "일간 합 관계",
    },
    "CHUNG_DAY_STEM": {
        "code": "STEM_CHUNG_DAY",
        "category": "relation-stem",
        "polarity": "negative",
        "weight": -4,
        "note": "일간 충 관계",
    },
    "COMPLEMENT_FIVE_ELEMENTS": {
        "code": "ELEMENT_GENERATES_MUTUAL",
        "category": "element-dynamics",
        "polarity": "positive",
        "weight": 3,
        "note": "오행 상생 보완",
    },
    "BALANCED_RHYTHM": {
        "code": "DAYMASTER_SUPPORT_MUTUAL",
        "category": "daymaster-dynamics",
        "polarity": "positive",
        "weight": 2,
        "note": "관계 리듬 균형",
    },
}


def to_raw_signals(signals: list[str], me: PersonInput, partner: PersonInput):
    raw = []

    for s in signals:
        mapped = RAW_SIGNAL_TABLE.get(s)
        if not mapped:
            raw.append(
                {
                    "code": f"UNKNOWN_{s}",
                    "category": "reliability",
                    "polarity": "neutral",
                    "weight": 0,
                    "note": "미등록 신호",
                }
            )
            continue
        raw.append(mapped)

    if not me.birthTimeKnown:
        raw.append(
            {
                "code": "RELIABILITY_TIME_UNKNOWN_ME",
                "category": "reliability",
                "polarity": "neutral",
                "weight": -3,
                "note": "내 출생시간 미상",
            }
        )
    if not partner.birthTimeKnown:
        raw.append(
            {
                "code": "RELIABILITY_TIME_UNKNOWN_PARTNER",
                "category": "reliability",
                "polarity": "neutral",
                "weight": -3,
                "note": "상대 출생시간 미상",
            }
        )

    return raw


def derive_score_from_raw_signals(raw_signals: list[dict]) -> int:
    base = 70
    total = base + sum(int(s.get("weight", 0)) for s in raw_signals)
    return max(40, min(96, total))


def derive_reliability(raw_signals: list[dict]):
    penalty = sum(abs(int(s.get("weight", 0))) for s in raw_signals if s.get("category") == "reliability")
    if penalty >= 6:
        confidence = "low"
    elif penalty >= 3:
        confidence = "medium"
    else:
        confidence = "high"
    return confidence


def get_compatibility(me: PersonInput, partner: PersonInput):
    signals, latency_ms, warnings = calculate_compatibility_signals(me, partner)
    raw_signals = to_raw_signals(signals, me, partner)
    score = derive_score_from_raw_signals(raw_signals)

    reliability = {
        "timeKnownMe": me.birthTimeKnown,
        "timeKnownPartner": partner.birthTimeKnown,
        "confidence": derive_reliability(raw_signals),
    }

    if reliability["confidence"] != "high" and "PROVIDER_PARTIAL_DATA" not in warnings:
        warnings.append("PROVIDER_PARTIAL_DATA")

    return score, signals, raw_signals, reliability, latency_ms, warnings

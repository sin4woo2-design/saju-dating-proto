from __future__ import annotations

from app.schemas import PersonInput
from app.services.chart_service import get_chart

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
    "ELEMENT_CONTROLS_IMBALANCED": {
        "code": "ELEMENT_CONTROLS_IMBALANCED",
        "category": "element-dynamics",
        "polarity": "negative",
        "weight": -3,
        "note": "오행 상극 불균형",
    },
    "BALANCED_RHYTHM": {
        "code": "DAYMASTER_SUPPORT_MUTUAL",
        "category": "daymaster-dynamics",
        "polarity": "positive",
        "weight": 2,
        "note": "관계 리듬 균형",
    },
    "DAYMASTER_CLASH": {
        "code": "DAYMASTER_CLASH",
        "category": "daymaster-dynamics",
        "polarity": "negative",
        "weight": -4,
        "note": "일간 충돌",
    },
}

BRANCH_HAP_PAIRS = {
    frozenset(("子", "丑")),
    frozenset(("寅", "亥")),
    frozenset(("卯", "戌")),
    frozenset(("辰", "酉")),
    frozenset(("巳", "申")),
    frozenset(("午", "未")),
}

BRANCH_CHUNG_PAIRS = {
    frozenset(("子", "午")),
    frozenset(("丑", "未")),
    frozenset(("寅", "申")),
    frozenset(("卯", "酉")),
    frozenset(("辰", "戌")),
    frozenset(("巳", "亥")),
}

STEM_HAP_PAIRS = {
    frozenset(("甲", "己")),
    frozenset(("乙", "庚")),
    frozenset(("丙", "辛")),
    frozenset(("丁", "壬")),
    frozenset(("戊", "癸")),
}

STEM_CHUNG_PAIRS = {
    frozenset(("甲", "庚")),
    frozenset(("乙", "辛")),
    frozenset(("丙", "壬")),
    frozenset(("丁", "癸")),
}

ELEMENT_GENERATES = {
    ("wood", "fire"),
    ("fire", "earth"),
    ("earth", "metal"),
    ("metal", "water"),
    ("water", "wood"),
}


def _extract_stem_branch(pillar: str | None) -> tuple[str | None, str | None]:
    if not pillar or len(pillar) < 2:
        return None, None
    return pillar[0], pillar[1]


def _top_two_elements(five: dict[str, int]) -> tuple[str, str]:
    ranked = sorted(five.items(), key=lambda x: x[1], reverse=True)
    first = ranked[0][0]
    second = ranked[1][0] if len(ranked) > 1 else ranked[0][0]
    return first, second


def _derive_core_signals(me_chart: dict, partner_chart: dict) -> list[str]:
    signals: list[str] = []

    me_year_stem, me_year_branch = _extract_stem_branch(me_chart.get("pillars", {}).get("year"))
    partner_year_stem, partner_year_branch = _extract_stem_branch(partner_chart.get("pillars", {}).get("year"))
    me_day_stem, _ = _extract_stem_branch(me_chart.get("pillars", {}).get("day"))
    partner_day_stem, _ = _extract_stem_branch(partner_chart.get("pillars", {}).get("day"))

    if me_year_branch and partner_year_branch:
        year_pair = frozenset((me_year_branch, partner_year_branch))
        signals.append("HAP_YEAR_BRANCH" if year_pair in BRANCH_HAP_PAIRS else "CHUNG_YEAR_BRANCH" if year_pair in BRANCH_CHUNG_PAIRS else "BALANCED_RHYTHM")
    else:
        signals.append("BALANCED_RHYTHM")

    if me_day_stem and partner_day_stem:
        day_pair = frozenset((me_day_stem, partner_day_stem))
        signals.append("HAP_DAY_STEM" if day_pair in STEM_HAP_PAIRS else "CHUNG_DAY_STEM" if day_pair in STEM_CHUNG_PAIRS else "BALANCED_RHYTHM")
    else:
        signals.append("BALANCED_RHYTHM")

    me_top, _ = _top_two_elements(me_chart.get("five", {}))
    partner_top, _ = _top_two_elements(partner_chart.get("five", {}))
    if (me_top, partner_top) in ELEMENT_GENERATES or (partner_top, me_top) in ELEMENT_GENERATES:
        signals.append("COMPLEMENT_FIVE_ELEMENTS")
    elif me_top == partner_top:
        signals.append("ELEMENT_CONTROLS_IMBALANCED")
    else:
        signals.append("BALANCED_RHYTHM")

    if me_day_stem and partner_day_stem and frozenset((me_day_stem, partner_day_stem)) in STEM_CHUNG_PAIRS:
        signals.append("DAYMASTER_CLASH")
    else:
        signals.append("BALANCED_RHYTHM")

    return signals


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

    missing_time = False

    if not me.birthTimeKnown:
        missing_time = True
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
        missing_time = True
        raw.append(
            {
                "code": "RELIABILITY_TIME_UNKNOWN_PARTNER",
                "category": "reliability",
                "polarity": "neutral",
                "weight": -3,
                "note": "상대 출생시간 미상",
            }
        )

    if missing_time:
        raw.append(
            {
                "code": "RELIABILITY_PARTIAL_PILLARS",
                "category": "reliability",
                "polarity": "neutral",
                "weight": -4,
                "note": "일부 기둥 정보 제한",
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
    me_chart = get_chart(me)
    partner_chart = get_chart(partner)

    signals = _derive_core_signals(me_chart, partner_chart)
    raw_signals = to_raw_signals(signals, me, partner)
    score = derive_score_from_raw_signals(raw_signals)

    reliability = {
        "timeKnownMe": me.birthTimeKnown,
        "timeKnownPartner": partner.birthTimeKnown,
        "confidence": derive_reliability(raw_signals),
    }

    warnings = list(set((me_chart.get("warnings") or []) + (partner_chart.get("warnings") or [])))
    if reliability["confidence"] != "high" and "PROVIDER_PARTIAL_DATA" not in warnings:
        warnings.append("PROVIDER_PARTIAL_DATA")

    latency_ms = int(me_chart.get("latency_ms", 40)) + int(partner_chart.get("latency_ms", 40))
    return score, signals, raw_signals, reliability, latency_ms, warnings

from __future__ import annotations

from app.schemas import PersonInput
from app.services.chart_service import get_chart

RAW_SIGNAL_TABLE = {
    "HAP_YEAR_BRANCH": {"code": "BRANCH_HAP_YEAR", "category": "relation-branch", "polarity": "positive", "weight": 7, "note": "연지 합 관계"},
    "CHUNG_YEAR_BRANCH": {"code": "BRANCH_CHUNG_YEAR", "category": "relation-branch", "polarity": "negative", "weight": -6, "note": "연지 충 관계"},
    "HYEONG_YEAR_BRANCH": {"code": "BRANCH_HYEONG_YEAR", "category": "relation-branch", "polarity": "negative", "weight": -4, "note": "연지 형 관계"},
    "PA_YEAR_BRANCH": {"code": "BRANCH_PA_YEAR", "category": "relation-branch", "polarity": "negative", "weight": -3, "note": "연지 파 관계"},
    "HAE_YEAR_BRANCH": {"code": "BRANCH_HAE_YEAR", "category": "relation-branch", "polarity": "negative", "weight": -2, "note": "연지 해 관계"},
    "BALANCED_BRANCH": {"code": "BRANCH_BALANCED", "category": "relation-branch", "polarity": "neutral", "weight": 0, "note": "연지 중립"},
    "HAP_DAY_STEM": {"code": "STEM_HAP_DAY", "category": "relation-stem", "polarity": "positive", "weight": 4, "note": "일간 합 관계"},
    "CHUNG_DAY_STEM": {"code": "STEM_CHUNG_DAY", "category": "relation-stem", "polarity": "negative", "weight": -4, "note": "일간 충 관계"},
    "COMPLEMENT_FIVE_ELEMENTS": {"code": "ELEMENT_GENERATES_MUTUAL", "category": "element-dynamics", "polarity": "positive", "weight": 3, "note": "오행 상생 보완"},
    "ELEMENT_CONTROLS_IMBALANCED": {"code": "ELEMENT_CONTROLS_IMBALANCED", "category": "element-dynamics", "polarity": "negative", "weight": -3, "note": "오행 상극 불균형"},
    "DAYMASTER_SUPPORT": {"code": "DAYMASTER_SUPPORT_MUTUAL", "category": "daymaster-dynamics", "polarity": "positive", "weight": 3, "note": "일간 보완"},
    "DAYMASTER_CLASH": {"code": "DAYMASTER_CLASH", "category": "daymaster-dynamics", "polarity": "negative", "weight": -4, "note": "일간 충돌"},
    "BALANCED_RHYTHM": {"code": "DAYMASTER_SUPPORT_MUTUAL", "category": "daymaster-dynamics", "polarity": "positive", "weight": 2, "note": "관계 리듬 균형"},
}

BRANCH_HAP_PAIRS = {frozenset(("子", "丑")), frozenset(("寅", "亥")), frozenset(("卯", "戌")), frozenset(("辰", "酉")), frozenset(("巳", "申")), frozenset(("午", "未"))}
BRANCH_CHUNG_PAIRS = {frozenset(("子", "午")), frozenset(("丑", "未")), frozenset(("寅", "申")), frozenset(("卯", "酉")), frozenset(("辰", "戌")), frozenset(("巳", "亥"))}
BRANCH_PA_PAIRS = {frozenset(("子", "酉")), frozenset(("卯", "午")), frozenset(("辰", "丑")), frozenset(("未", "戌")), frozenset(("寅", "亥")), frozenset(("申", "巳"))}
BRANCH_HAE_PAIRS = {frozenset(("子", "未")), frozenset(("丑", "午")), frozenset(("寅", "巳")), frozenset(("卯", "辰")), frozenset(("申", "亥")), frozenset(("酉", "戌"))}
BRANCH_HYEONG_TRIPLES = [set(("丑", "未", "戌")), set(("寅", "巳", "申"))]
BRANCH_HYEONG_PAIRS = {frozenset(("子", "卯"))}

STEM_HAP_PAIRS = {frozenset(("甲", "己")), frozenset(("乙", "庚")), frozenset(("丙", "辛")), frozenset(("丁", "壬")), frozenset(("戊", "癸"))}
STEM_CHUNG_PAIRS = {frozenset(("甲", "庚")), frozenset(("乙", "辛")), frozenset(("丙", "壬")), frozenset(("丁", "癸"))}
STEM_TO_ELEMENT = {"甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth", "己": "earth", "庚": "metal", "辛": "metal", "壬": "water", "癸": "water"}
ELEMENT_GENERATES = {("wood", "fire"), ("fire", "earth"), ("earth", "metal"), ("metal", "water"), ("water", "wood")}


def _extract_stem_branch(pillar: str | None) -> tuple[str | None, str | None]:
    if not pillar or len(pillar) < 2:
        return None, None
    return pillar[0], pillar[1]


def _top_two_elements(five: dict[str, int]) -> tuple[str, str]:
    ranked = sorted(five.items(), key=lambda x: x[1], reverse=True)
    if not ranked:
        return "earth", "earth"
    first = ranked[0][0]
    second = ranked[1][0] if len(ranked) > 1 else ranked[0][0]
    return first, second


def _branch_relation_signal(branch_a: str | None, branch_b: str | None) -> str:
    if not branch_a or not branch_b:
        return "BALANCED_BRANCH"

    pair = frozenset((branch_a, branch_b))
    if pair in BRANCH_CHUNG_PAIRS:
        return "CHUNG_YEAR_BRANCH"
    if pair in BRANCH_HYEONG_PAIRS:
        return "HYEONG_YEAR_BRANCH"
    if pair in BRANCH_PA_PAIRS:
        return "PA_YEAR_BRANCH"
    if pair in BRANCH_HAE_PAIRS:
        return "HAE_YEAR_BRANCH"
    if pair in BRANCH_HAP_PAIRS:
        return "HAP_YEAR_BRANCH"

    # 형(刑) 삼형 관계의 2개 조합도 약한 형으로 처리
    for tri in BRANCH_HYEONG_TRIPLES:
        if branch_a in tri and branch_b in tri:
            return "HYEONG_YEAR_BRANCH"

    return "BALANCED_BRANCH"


def _daymaster_signal(day_stem_a: str | None, day_stem_b: str | None) -> str:
    if not day_stem_a or not day_stem_b:
        return "BALANCED_RHYTHM"

    pair = frozenset((day_stem_a, day_stem_b))
    if pair in STEM_CHUNG_PAIRS:
        return "DAYMASTER_CLASH"
    if pair in STEM_HAP_PAIRS:
        return "DAYMASTER_SUPPORT"

    elem_a = STEM_TO_ELEMENT.get(day_stem_a)
    elem_b = STEM_TO_ELEMENT.get(day_stem_b)
    if elem_a and elem_b and ((elem_a, elem_b) in ELEMENT_GENERATES or (elem_b, elem_a) in ELEMENT_GENERATES):
        return "DAYMASTER_SUPPORT"

    return "BALANCED_RHYTHM"


def _derive_core_signals(me_chart: dict, partner_chart: dict) -> list[str]:
    signals: list[str] = []

    _, me_year_branch = _extract_stem_branch(me_chart.get("pillars", {}).get("year"))
    _, partner_year_branch = _extract_stem_branch(partner_chart.get("pillars", {}).get("year"))
    me_day_stem, _ = _extract_stem_branch(me_chart.get("pillars", {}).get("day"))
    partner_day_stem, _ = _extract_stem_branch(partner_chart.get("pillars", {}).get("day"))

    signals.append(_branch_relation_signal(me_year_branch, partner_year_branch))

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

    signals.append(_daymaster_signal(me_day_stem, partner_day_stem))

    return signals


def to_raw_signals(signals: list[str], me: PersonInput, partner: PersonInput):
    raw = []

    for s in signals:
        mapped = RAW_SIGNAL_TABLE.get(s)
        if not mapped:
            raw.append({"code": f"UNKNOWN_{s}", "category": "reliability", "polarity": "neutral", "weight": 0, "note": "미등록 신호"})
            continue
        raw.append(mapped)

    missing_time = False
    if not me.birthTimeKnown:
        missing_time = True
        raw.append({"code": "RELIABILITY_TIME_UNKNOWN_ME", "category": "reliability", "polarity": "neutral", "weight": -3, "note": "내 출생시간 미상"})
    if not partner.birthTimeKnown:
        missing_time = True
        raw.append({"code": "RELIABILITY_TIME_UNKNOWN_PARTNER", "category": "reliability", "polarity": "neutral", "weight": -3, "note": "상대 출생시간 미상"})
    if missing_time:
        raw.append({"code": "RELIABILITY_PARTIAL_PILLARS", "category": "reliability", "polarity": "neutral", "weight": -4, "note": "일부 기둥 정보 제한"})

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

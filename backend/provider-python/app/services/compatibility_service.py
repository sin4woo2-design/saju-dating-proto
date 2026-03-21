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
    "USEFUL_MATCH_TO_ME": {"code": "ELEMENT_USEFUL_TO_ME", "category": "element-dynamics", "polarity": "positive", "weight": 2, "note": "상대 주도 오행이 내 활용 기운"},
    "USEFUL_MATCH_TO_PARTNER": {"code": "ELEMENT_USEFUL_TO_PARTNER", "category": "element-dynamics", "polarity": "positive", "weight": 2, "note": "내 주도 오행이 상대 활용 기운"},
    "USEFUL_MATCH_MUTUAL": {"code": "ELEMENT_USEFUL_MUTUAL", "category": "element-dynamics", "polarity": "positive", "weight": 4, "note": "서로의 주도 오행이 활용 기운에 맞음"},
    "CAUTION_CLASH_MUTUAL": {"code": "ELEMENT_CAUTION_MUTUAL", "category": "element-dynamics", "polarity": "negative", "weight": -4, "note": "서로의 주도 오행이 주의 기운에 걸림"},
    "STRENGTH_BALANCE_COMPLEMENT": {"code": "DAYMASTER_STRENGTH_COMPLEMENT", "category": "daymaster-dynamics", "polarity": "positive", "weight": 2, "note": "강약 구조가 상호 보완"},
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


def _derive_basis_signals(me_chart: dict, partner_chart: dict) -> list[str]:
    me_basis = me_chart.get("basis") or {}
    partner_basis = partner_chart.get("basis") or {}

    me_dominant = me_basis.get("dominantElement")
    partner_dominant = partner_basis.get("dominantElement")
    me_useful = set(me_basis.get("usefulElements") or [])
    partner_useful = set(partner_basis.get("usefulElements") or [])
    me_caution = set(me_basis.get("cautionElements") or [])
    partner_caution = set(partner_basis.get("cautionElements") or [])
    me_strength = me_basis.get("strengthLevel")
    partner_strength = partner_basis.get("strengthLevel")

    signals: list[str] = []

    if me_dominant and partner_dominant:
        if partner_dominant in me_useful and me_dominant in partner_useful:
            signals.append("USEFUL_MATCH_MUTUAL")
        else:
            if partner_dominant in me_useful:
                signals.append("USEFUL_MATCH_TO_ME")
            if me_dominant in partner_useful:
                signals.append("USEFUL_MATCH_TO_PARTNER")

        if partner_dominant in me_caution and me_dominant in partner_caution:
            signals.append("CAUTION_CLASH_MUTUAL")

    if {me_strength, partner_strength} == {"strong", "weak"}:
        signals.append("STRENGTH_BALANCE_COMPLEMENT")

    return signals


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
    signals.extend(_derive_basis_signals(me_chart, partner_chart))

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


def _sum_weights(raw_signals: list[dict], category: str) -> int:
    return sum(int(s.get("weight", 0)) for s in raw_signals if s.get("category") == category)


def _branch_relation_type(branch_a: str | None, branch_b: str | None) -> tuple[str, int]:
    if not branch_a or not branch_b:
        return "neutral", 0

    pair = frozenset((branch_a, branch_b))
    if pair in BRANCH_HAP_PAIRS:
        return "hap", 3
    if pair in BRANCH_CHUNG_PAIRS:
        return "chung", -3
    if pair in BRANCH_HYEONG_PAIRS:
        return "hyeong", -2
    if pair in BRANCH_PA_PAIRS:
        return "pa", -2
    if pair in BRANCH_HAE_PAIRS:
        return "hae", -1

    for tri in BRANCH_HYEONG_TRIPLES:
        if branch_a in tri and branch_b in tri:
            return "hyeong", -2

    return "neutral", 0


def _stem_relation_type(stem_a: str | None, stem_b: str | None) -> tuple[str, int]:
    if not stem_a or not stem_b:
        return "neutral", 0

    pair = frozenset((stem_a, stem_b))
    if pair in STEM_HAP_PAIRS:
        return "hap", 2
    if pair in STEM_CHUNG_PAIRS:
        return "chung", -2
    return "neutral", 0


def _build_branch_relations(me_chart: dict, partner_chart: dict) -> list[dict]:
    scopes = ["year", "month", "day", "hour"]
    rows: list[dict] = []
    for scope in scopes:
        _, b1 = _extract_stem_branch(me_chart.get("pillars", {}).get(scope))
        _, b2 = _extract_stem_branch(partner_chart.get("pillars", {}).get(scope))
        rel_type, weight = _branch_relation_type(b1, b2)
        rows.append({"scope": scope, "type": rel_type, "weight": weight, "code": f"BRANCH_{rel_type.upper()}_{scope.upper()}"})

    # cross scope: me day vs partner month
    _, cross_a = _extract_stem_branch(me_chart.get("pillars", {}).get("day"))
    _, cross_b = _extract_stem_branch(partner_chart.get("pillars", {}).get("month"))
    rel_type, weight = _branch_relation_type(cross_a, cross_b)
    rows.append({"scope": "cross", "type": rel_type, "weight": weight, "code": f"BRANCH_{rel_type.upper()}_CROSS"})
    return rows


def _build_stem_relations(me_chart: dict, partner_chart: dict) -> list[dict]:
    scopes = ["year", "month", "day", "hour"]
    rows: list[dict] = []
    for scope in scopes:
        s1, _ = _extract_stem_branch(me_chart.get("pillars", {}).get(scope))
        s2, _ = _extract_stem_branch(partner_chart.get("pillars", {}).get(scope))
        rel_type, weight = _stem_relation_type(s1, s2)
        rows.append({"scope": scope, "type": rel_type, "weight": weight, "code": f"STEM_{rel_type.upper()}_{scope.upper()}"})

    # cross scope: me month vs partner day
    cross_a, _ = _extract_stem_branch(me_chart.get("pillars", {}).get("month"))
    cross_b, _ = _extract_stem_branch(partner_chart.get("pillars", {}).get("day"))
    rel_type, weight = _stem_relation_type(cross_a, cross_b)
    rows.append({"scope": "cross", "type": rel_type, "weight": weight, "code": f"STEM_{rel_type.upper()}_CROSS"})
    return rows


def _build_element_dynamics(me_chart: dict, partner_chart: dict) -> list[dict]:
    me_top, me_second = _top_two_elements(me_chart.get("five", {}))
    partner_top, partner_second = _top_two_elements(partner_chart.get("five", {}))
    me_basis = me_chart.get("basis") or {}
    partner_basis = partner_chart.get("basis") or {}
    me_useful = set(me_basis.get("usefulElements") or [])
    partner_useful = set(partner_basis.get("usefulElements") or [])
    me_caution = set(me_basis.get("cautionElements") or [])
    partner_caution = set(partner_basis.get("cautionElements") or [])

    rows: list[dict] = []
    if (me_top, partner_top) in ELEMENT_GENERATES or (partner_top, me_top) in ELEMENT_GENERATES:
        rows.append({"type": "generates", "weight": 3, "code": "ELEMENT_GENERATES_TOP"})
    elif me_top == partner_top:
        rows.append({"type": "overweight", "weight": -2, "code": "ELEMENT_OVERWEIGHT_TOP"})
    else:
        rows.append({"type": "balanced", "weight": 1, "code": "ELEMENT_BALANCED_TOP"})

    if (me_second, partner_second) in ELEMENT_GENERATES or (partner_second, me_second) in ELEMENT_GENERATES:
        rows.append({"type": "generates", "weight": 2, "code": "ELEMENT_GENERATES_SECOND"})

    if partner_top in me_useful and me_top in partner_useful:
        rows.append({"type": "generates", "weight": 4, "code": "ELEMENT_USEFUL_MUTUAL"})
    else:
        if partner_top in me_useful:
            rows.append({"type": "generates", "weight": 2, "code": "ELEMENT_USEFUL_TO_ME"})
        if me_top in partner_useful:
            rows.append({"type": "generates", "weight": 2, "code": "ELEMENT_USEFUL_TO_PARTNER"})

    if partner_top in me_caution and me_top in partner_caution:
        rows.append({"type": "controls", "weight": -4, "code": "ELEMENT_CAUTION_MUTUAL"})

    return rows


def _build_daymaster_dynamics(me_chart: dict, partner_chart: dict) -> list[dict]:
    me_day_stem, _ = _extract_stem_branch(me_chart.get("pillars", {}).get("day"))
    partner_day_stem, _ = _extract_stem_branch(partner_chart.get("pillars", {}).get("day"))
    daymaster = _daymaster_signal(me_day_stem, partner_day_stem)
    me_strength = (me_chart.get("basis") or {}).get("strengthLevel")
    partner_strength = (partner_chart.get("basis") or {}).get("strengthLevel")
    mapping = {
        "DAYMASTER_SUPPORT": {"type": "support", "weight": 3, "code": "DAYMASTER_SUPPORT_MUTUAL"},
        "DAYMASTER_CLASH": {"type": "clash", "weight": -3, "code": "DAYMASTER_CLASH"},
        "BALANCED_RHYTHM": {"type": "neutral", "weight": 1, "code": "DAYMASTER_BALANCED"},
    }
    rows = [mapping.get(daymaster, mapping["BALANCED_RHYTHM"])]
    if {me_strength, partner_strength} == {"strong", "weak"}:
        rows.append({"type": "support", "weight": 2, "code": "DAYMASTER_STRENGTH_COMPLEMENT"})
    return rows


def _build_basis(me: PersonInput, partner: PersonInput, me_chart: dict, partner_chart: dict, raw_signals: list[dict], confidence: str):
    reliability_penalties = [
        {
            "code": s.get("code"),
            "weight": int(s.get("weight", 0)),
            "reason": s.get("note") or "reliability penalty",
        }
        for s in raw_signals
        if s.get("category") == "reliability"
    ]

    branch_relations = _build_branch_relations(me_chart, partner_chart)
    stem_relations = _build_stem_relations(me_chart, partner_chart)
    element_dynamics = _build_element_dynamics(me_chart, partner_chart)
    daymaster_dynamics = _build_daymaster_dynamics(me_chart, partner_chart)

    return {
        "schemaVersion": "compat-basis-v1",
        "participants": {
            "me": {
                "pillars": me_chart.get("pillars"),
                "dayMaster": (me_chart.get("pillars", {}).get("day") or "")[:1] or None,
                "dayMasterLabel": (me_chart.get("basis") or {}).get("dayMasterLabel"),
                "strengthLevel": (me_chart.get("basis") or {}).get("strengthLevel"),
                "usefulElements": (me_chart.get("basis") or {}).get("usefulElements"),
                "cautionElements": (me_chart.get("basis") or {}).get("cautionElements"),
                "fiveElements": me_chart.get("five"),
                "birthTimeKnown": me.birthTimeKnown,
            },
            "partner": {
                "pillars": partner_chart.get("pillars"),
                "dayMaster": (partner_chart.get("pillars", {}).get("day") or "")[:1] or None,
                "dayMasterLabel": (partner_chart.get("basis") or {}).get("dayMasterLabel"),
                "strengthLevel": (partner_chart.get("basis") or {}).get("strengthLevel"),
                "usefulElements": (partner_chart.get("basis") or {}).get("usefulElements"),
                "cautionElements": (partner_chart.get("basis") or {}).get("cautionElements"),
                "fiveElements": partner_chart.get("five"),
                "birthTimeKnown": partner.birthTimeKnown,
            },
        },
        "relations": {
            "branchRelations": branch_relations,
            "stemRelations": stem_relations,
            "elementDynamics": element_dynamics,
            "dayMasterDynamics": daymaster_dynamics,
        },
        "reliability": {
            "penalties": reliability_penalties,
            "confidence": confidence,
        },
    }


def _build_confidence_reasons(raw_signals: list[dict], confidence: str, basis: dict | None = None) -> list[str]:
    reasons: list[str] = []
    for s in raw_signals:
        code = s.get("code")
        if code == "RELIABILITY_TIME_UNKNOWN_ME":
            reasons.append("me-birth-time-unknown")
        elif code == "RELIABILITY_TIME_UNKNOWN_PARTNER":
            reasons.append("partner-birth-time-unknown")
        elif code == "RELIABILITY_PARTIAL_PILLARS":
            reasons.append("partial-pillars")

    if basis:
        branch = basis.get("relations", {}).get("branchRelations", [])
        stem = basis.get("relations", {}).get("stemRelations", [])
        if branch and all(r.get("type") == "neutral" for r in branch):
            reasons.append("branch-mostly-neutral")
        if stem and any(r.get("type") in {"chung", "clash"} for r in stem):
            reasons.append("stem-tension-detected")

    if not reasons and confidence == "high":
        reasons.append("full-time-known")
    return reasons


def get_compatibility(me: PersonInput, partner: PersonInput):
    me_chart = get_chart(me)
    partner_chart = get_chart(partner)

    signals = _derive_core_signals(me_chart, partner_chart)
    raw_signals = to_raw_signals(signals, me, partner)
    score = derive_score_from_raw_signals(raw_signals)

    confidence_level = derive_reliability(raw_signals)
    reliability = {
        "timeKnownMe": me.birthTimeKnown,
        "timeKnownPartner": partner.birthTimeKnown,
        "confidence": confidence_level,
    }

    warnings = list(set((me_chart.get("warnings") or []) + (partner_chart.get("warnings") or [])))
    if confidence_level != "high" and "PROVIDER_PARTIAL_DATA" not in warnings:
        warnings.append("PROVIDER_PARTIAL_DATA")

    basis = _build_basis(me, partner, me_chart, partner_chart, raw_signals, confidence_level)
    sub_scores = {
        "branch": sum(int(x.get("weight", 0)) for x in basis.get("relations", {}).get("branchRelations", [])),
        "stem": sum(int(x.get("weight", 0)) for x in basis.get("relations", {}).get("stemRelations", [])),
        "elements": sum(int(x.get("weight", 0)) for x in basis.get("relations", {}).get("elementDynamics", [])),
        "dayMaster": sum(int(x.get("weight", 0)) for x in basis.get("relations", {}).get("dayMasterDynamics", [])),
        "reliability": sum(int(x.get("weight", 0)) for x in basis.get("reliability", {}).get("penalties", [])),
    }

    chart_rule_version = me_chart.get("rule_version") if me_chart.get("rule_version") == partner_chart.get("rule_version") else None

    v2 = {
        "totalScore": score,
        "subScores": sub_scores,
        "basis": basis,
        "confidence": {
            "level": confidence_level,
            "reasons": _build_confidence_reasons(raw_signals, confidence_level, basis),
        },
        "provenance": {
            "ruleVersion": "compat-v2-basis",
            "calculationSource": "provider-compatibility-service",
            "basisSchemaVersion": "compat-basis-v1",
            "chartRuleVersion": chart_rule_version,
        },
    }

    latency_ms = int(me_chart.get("latency_ms", 40)) + int(partner_chart.get("latency_ms", 40))
    return score, signals, raw_signals, reliability, latency_ms, warnings, v2

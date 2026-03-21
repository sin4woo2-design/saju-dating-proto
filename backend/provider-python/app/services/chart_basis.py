from __future__ import annotations

from typing import Literal

ElementKey = Literal["wood", "fire", "earth", "metal", "water"]
SeasonKey = Literal["spring", "summer", "transition", "autumn", "winter"]
StrengthLevel = Literal["strong", "balanced", "weak"]
TenGodCode = Literal[
    "peer",
    "rival",
    "food",
    "hurting",
    "indirectWealth",
    "directWealth",
    "sevenKillings",
    "directOfficer",
    "indirectResource",
    "directResource",
]
PillarKey = Literal["year", "month", "day", "hour"]

STEM_META = {
    "甲": {"element": "wood", "yinYang": "yang", "label": "갑목"},
    "乙": {"element": "wood", "yinYang": "yin", "label": "을목"},
    "丙": {"element": "fire", "yinYang": "yang", "label": "병화"},
    "丁": {"element": "fire", "yinYang": "yin", "label": "정화"},
    "戊": {"element": "earth", "yinYang": "yang", "label": "무토"},
    "己": {"element": "earth", "yinYang": "yin", "label": "기토"},
    "庚": {"element": "metal", "yinYang": "yang", "label": "경금"},
    "辛": {"element": "metal", "yinYang": "yin", "label": "신금"},
    "壬": {"element": "water", "yinYang": "yang", "label": "임수"},
    "癸": {"element": "water", "yinYang": "yin", "label": "계수"},
}

BRANCH_META = {
    "寅": {"element": "wood", "season": "spring", "label": "인목"},
    "卯": {"element": "wood", "season": "spring", "label": "묘목"},
    "巳": {"element": "fire", "season": "summer", "label": "사화"},
    "午": {"element": "fire", "season": "summer", "label": "오화"},
    "辰": {"element": "earth", "season": "transition", "label": "진토"},
    "戌": {"element": "earth", "season": "transition", "label": "술토"},
    "丑": {"element": "earth", "season": "transition", "label": "축토"},
    "未": {"element": "earth", "season": "transition", "label": "미토"},
    "申": {"element": "metal", "season": "autumn", "label": "신금"},
    "酉": {"element": "metal", "season": "autumn", "label": "유금"},
    "亥": {"element": "water", "season": "winter", "label": "해수"},
    "子": {"element": "water", "season": "winter", "label": "자수"},
}

HIDDEN_STEMS = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "戊", "庚"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
}

GENERATES: dict[ElementKey, ElementKey] = {
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
    "metal": "water",
    "water": "wood",
}

CONTROLS: dict[ElementKey, ElementKey] = {
    "wood": "earth",
    "fire": "metal",
    "earth": "water",
    "metal": "wood",
    "water": "fire",
}

TEN_GOD_LABELS: dict[TenGodCode, str] = {
    "peer": "비견",
    "rival": "겁재",
    "food": "식신",
    "hurting": "상관",
    "indirectWealth": "편재",
    "directWealth": "정재",
    "sevenKillings": "칠살",
    "directOfficer": "정관",
    "indirectResource": "편인",
    "directResource": "정인",
}

ELEMENT_LABELS: dict[ElementKey, str] = {
    "wood": "목",
    "fire": "화",
    "earth": "토",
    "metal": "금",
    "water": "수",
}

SEASON_LABELS: dict[SeasonKey, str] = {
    "spring": "봄",
    "summer": "여름",
    "transition": "환절기",
    "autumn": "가을",
    "winter": "겨울",
}

PILLAR_BRANCH_WEIGHT: dict[PillarKey, int] = {
    "year": 4,
    "month": 12,
    "day": 8,
    "hour": 4,
}


def _pillar_stem(pillars: dict[str, str], pillar: PillarKey) -> str | None:
    raw = (pillars.get(pillar) or "").strip()
    return raw[0] if raw else None


def _pillar_branch(pillars: dict[str, str], pillar: PillarKey) -> str | None:
    raw = (pillars.get(pillar) or "").strip()
    return raw[1:] if len(raw) >= 2 else None


def _generated_by(element: ElementKey) -> ElementKey:
    for key, value in GENERATES.items():
        if value == element:
            return key
    return "water"


def _controlled_by(element: ElementKey) -> ElementKey:
    for key, value in CONTROLS.items():
        if value == element:
            return key
    return "earth"


def _strength_label(level: StrengthLevel) -> str:
    if level == "strong":
        return "신강한 편"
    if level == "weak":
        return "신약한 편"
    return "균형에 가까운 편"


def _get_ten_god_code(day_master: dict, other: dict) -> TenGodCode:
    same_polarity = day_master["yinYang"] == other["yinYang"]

    if day_master["element"] == other["element"]:
        return "peer" if same_polarity else "rival"

    if GENERATES[day_master["element"]] == other["element"]:
        return "food" if same_polarity else "hurting"

    if CONTROLS[day_master["element"]] == other["element"]:
        return "indirectWealth" if same_polarity else "directWealth"

    if _controlled_by(day_master["element"]) == other["element"]:
        return "sevenKillings" if same_polarity else "directOfficer"

    return "indirectResource" if same_polarity else "directResource"


def _build_ten_god_summary(day_master: dict | None, pillar: PillarKey, stem: str | None) -> dict:
    if not day_master or not stem or stem not in STEM_META:
        return {
            "pillar": pillar,
            "stem": stem,
            "summary": f"{pillar} 천간 정보가 아직 충분하지 않아 십성 해석을 보강 중이에요.",
        }

    if pillar == "day":
        return {
            "pillar": pillar,
            "stem": stem,
            "summary": f"일간 {day_master['label']}이 명식의 기준축이에요.",
        }

    other = STEM_META[stem]
    code = _get_ten_god_code(day_master, other)
    pillar_label = "연간" if pillar == "year" else "월간" if pillar == "month" else "시간"
    relation_label = (
        "자기 확장과 경쟁 감각"
        if code in {"peer", "rival"}
        else "표현력과 출력"
        if code in {"food", "hurting"}
        else "현실 감각과 관계 운영"
        if code in {"indirectWealth", "directWealth"}
        else "책임감과 방향 감각"
        if code in {"sevenKillings", "directOfficer"}
        else "학습력과 회복력"
    )

    return {
        "pillar": pillar,
        "stem": stem,
        "code": code,
        "label": TEN_GOD_LABELS[code],
        "summary": f"{pillar_label} {stem}은 {TEN_GOD_LABELS[code]}로 읽히며, {relation_label}을 강조해요.",
    }


def derive_chart_basis(
    five_elements: dict[str, int],
    pillars: dict[str, str],
    breakdown: dict | None = None,
) -> dict:
    ranked = sorted(
        [(key, int(value)) for key, value in five_elements.items()],
        key=lambda item: item[1],
        reverse=True,
    )
    dominant_element: ElementKey = ranked[0][0] if ranked else "earth"
    weakest_element: ElementKey = ranked[-1][0] if ranked else "water"

    day_stem = _pillar_stem(pillars, "day")
    month_branch = _pillar_branch(pillars, "month")
    day_master = STEM_META.get(day_stem or "")
    month_branch_meta = BRANCH_META.get(month_branch or "")

    day_master_element: ElementKey = day_master["element"] if day_master else dominant_element
    resource_element = _generated_by(day_master_element)
    output_element = GENERATES[day_master_element]
    wealth_element = CONTROLS[day_master_element]
    officer_element = _controlled_by(day_master_element)
    support_elements = list(dict.fromkeys([day_master_element, resource_element]))

    root_support = 0
    pillar_details: dict[str, dict] = {}
    for pillar in ("year", "month", "day", "hour"):
        pillar_key = pillar  # typing helper
        raw = (pillars.get(pillar_key) or "").strip()
        stem = raw[0] if raw else None
        branch = raw[1:] if len(raw) >= 2 else None
        stem_meta = STEM_META.get(stem or "")
        branch_meta = BRANCH_META.get(branch or "")
        support_weight = 0
        if branch_meta and branch_meta["element"] in support_elements:
            support_weight = PILLAR_BRANCH_WEIGHT[pillar_key]  # type: ignore[index]
            root_support += support_weight

        stem_ten_god = _build_ten_god_summary(day_master, pillar_key, stem)
        pillar_details[pillar_key] = {
            "raw": raw or "-",
            "stem": stem,
            "branch": branch,
            "stemLabel": stem_meta["label"] if stem_meta else None,
            "branchLabel": branch_meta["label"] if branch_meta else None,
            "stemElement": stem_meta["element"] if stem_meta else None,
            "branchElement": branch_meta["element"] if branch_meta else None,
            "season": branch_meta["season"] if branch_meta else None,
            "hiddenStems": HIDDEN_STEMS.get(branch or "", []),
            "supportWeight": support_weight,
            "stemTenGodCode": stem_ten_god.get("code"),
            "stemTenGodLabel": stem_ten_god.get("label"),
        }

    seasonal_bonus = 0
    if month_branch_meta:
        month_element = month_branch_meta["element"]
        if month_element in support_elements:
            seasonal_bonus = 18
        elif month_element in {output_element, wealth_element}:
            seasonal_bonus = -6
        elif month_element == officer_element:
            seasonal_bonus = -10

    support_score = int(five_elements.get(day_master_element, 0)) + int(five_elements.get(resource_element, 0)) + seasonal_bonus + root_support
    regulating_score = (
        int(five_elements.get(output_element, 0))
        + int(five_elements.get(wealth_element, 0))
        + int(five_elements.get(officer_element, 0))
    )
    strength_score = support_score - regulating_score

    if strength_score >= 24:
        strength_level: StrengthLevel = "strong"
    elif strength_score <= -12:
        strength_level = "weak"
    else:
        strength_level = "balanced"

    useful_elements = (
        list(dict.fromkeys([output_element, wealth_element, officer_element]))
        if strength_level == "strong"
        else support_elements
        if strength_level == "weak"
        else list(dict.fromkeys([output_element, wealth_element]))
    )

    caution_elements = (
        support_elements
        if strength_level == "strong"
        else list(dict.fromkeys([officer_element, wealth_element]))
        if strength_level == "weak"
        else list(dict.fromkeys([resource_element, officer_element]))
    )

    ten_gods = [
        _build_ten_god_summary(day_master, "year", _pillar_stem(pillars, "year")),
        _build_ten_god_summary(day_master, "month", _pillar_stem(pillars, "month")),
        _build_ten_god_summary(day_master, "day", _pillar_stem(pillars, "day")),
        _build_ten_god_summary(day_master, "hour", _pillar_stem(pillars, "hour")),
    ]

    season: SeasonKey = month_branch_meta["season"] if month_branch_meta else "transition"
    subject = day_master["label"] if day_master else f"{ELEMENT_LABELS[day_master_element]} 기운 중심"
    strength_reason = (
        f"{month_branch_meta['label']}의 계절감과 {ELEMENT_LABELS[support_elements[0]]}·{ELEMENT_LABELS[support_elements[1]]} 기운 비중을 함께 보면 {_strength_label(strength_level)}으로 해석해요."
        if month_branch_meta
        else f"{ELEMENT_LABELS[support_elements[0]]}·{ELEMENT_LABELS[support_elements[1]]} 기운 비중을 중심으로 보면 {_strength_label(strength_level)} 쪽에 가까워요."
    )

    summary_lines = [
        (
            f"{subject} 일간은 관계를 읽을 때 {ELEMENT_LABELS[day_master_element]} 기운의 반응과 속도를 먼저 타는 편이에요."
            if day_master
            else f"지금은 {ELEMENT_LABELS[day_master_element]} 기운이 중심인 흐름으로 읽고 있어요."
        ),
        f"{_strength_label(strength_level)}이라 {ELEMENT_LABELS[useful_elements[0]]}·{ELEMENT_LABELS[useful_elements[-1]]} 기운을 살릴수록 흐름이 편안해져요.",
        f"{ELEMENT_LABELS[weakest_element]} 기운이 약해 생활 리듬에서 이 축을 보완하는 편이 좋아요.",
    ]

    notes = [
        "PROVIDER_BASIS_V2",
        "DAY_MASTER_PROVIDER" if day_master else "DAY_MASTER_FALLBACK",
        "MONTH_BRANCH_SEASON_APPLIED" if month_branch_meta else "MONTH_BRANCH_FALLBACK",
    ]
    if breakdown:
        notes.append("ELEMENT_BREAKDOWN_ATTACHED")

    return {
        "schemaVersion": "saju-basis-v2",
        "basisOrigin": "provider",
        "dayMasterStem": day_stem,
        "dayMasterLabel": day_master["label"] if day_master else f"{ELEMENT_LABELS[day_master_element]} 기운 중심",
        "dayMasterElement": day_master_element,
        "dayMasterYinYang": day_master["yinYang"] if day_master else None,
        "monthBranch": month_branch,
        "monthBranchLabel": month_branch_meta["label"] if month_branch_meta else None,
        "season": season,
        "dominantElement": dominant_element,
        "weakestElement": weakest_element,
        "strengthLevel": strength_level,
        "strengthScore": strength_score,
        "supportScore": support_score,
        "regulatingScore": regulating_score,
        "seasonalBonus": seasonal_bonus,
        "rootSupportScore": root_support,
        "strengthReason": strength_reason,
        "supportElements": support_elements,
        "usefulElements": useful_elements,
        "cautionElements": caution_elements,
        "tenGods": ten_gods,
        "summaryLines": summary_lines,
        "pillarDetails": pillar_details,
        "notes": notes,
    }

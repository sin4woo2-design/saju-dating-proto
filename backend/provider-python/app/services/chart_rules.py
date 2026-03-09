from __future__ import annotations

ELEMENT_BY_STEM = {
    "甲": "wood", "乙": "wood",
    "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth",
    "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water",
}

ELEMENT_BY_BRANCH = {
    "寅": "wood", "卯": "wood",
    "巳": "fire", "午": "fire",
    "辰": "earth", "戌": "earth", "丑": "earth", "未": "earth",
    "申": "metal", "酉": "metal",
    "亥": "water", "子": "water",
}

HIDDEN_STEMS = {
    "子": ["癸"], "丑": ["己", "癸", "辛"], "寅": ["甲", "丙", "戊"], "卯": ["乙"],
    "辰": ["戊", "乙", "癸"], "巳": ["丙", "戊", "庚"], "午": ["丁", "己"], "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"], "酉": ["辛"], "戌": ["戊", "辛", "丁"], "亥": ["壬", "甲"],
}

DEFAULT_RULE_VERSION = "v1-current"
V2_CANDIDATE_RULE_VERSION = "v2-month-branch-boost"
EXPERIMENT_RULE_VERSION = "exp-v2-hidden-blend"


def normalize_rule_version(value: str | None) -> str:
    allowed = {DEFAULT_RULE_VERSION, V2_CANDIDATE_RULE_VERSION, EXPERIMENT_RULE_VERSION}
    return value if value in allowed else DEFAULT_RULE_VERSION


def _norm(weights: dict[str, float]) -> dict[str, int]:
    total = sum(weights.values()) or 1.0
    scaled = {k: int(round((v / total) * 100)) for k, v in weights.items()}
    diff = 100 - sum(scaled.values())
    if diff:
        scaled[max(scaled, key=scaled.get)] += diff
    return scaled


def _hidden_ratio(length: int):
    if length == 1:
        return [1.0]
    if length == 2:
        return [0.7, 0.3]
    return [0.7, 0.2, 0.1]


def score_elements(
    stems: list[str],
    branches: list[str],
    rule_version: str = DEFAULT_RULE_VERSION,
    hidden_blend: float = 0.5,
) -> dict[str, int]:
    rule = normalize_rule_version(rule_version)
    blend = max(0.0, min(1.0, hidden_blend))

    w = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}

    for s in stems:
        if s in ELEMENT_BY_STEM:
            w[ELEMENT_BY_STEM[s]] += 1.6

    for idx, b in enumerate(branches):
        if b not in ELEMENT_BY_BRANCH:
            continue

        if rule in {V2_CANDIDATE_RULE_VERSION, EXPERIMENT_RULE_VERSION} and idx == 1:
            w[ELEMENT_BY_BRANCH[b]] += 2.0
        else:
            w[ELEMENT_BY_BRANCH[b]] += 1.0

        if rule == EXPERIMENT_RULE_VERSION:
            hidden = HIDDEN_STEMS.get(b, [])
            ratios = _hidden_ratio(len(hidden))
            for hs, ratio in zip(hidden, ratios):
                w[ELEMENT_BY_STEM[hs]] += blend * ratio

    return _norm(w)

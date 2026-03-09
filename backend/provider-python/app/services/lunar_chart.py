from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Lunar, Solar

from app.schemas import PersonInput

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


def _parse_datetime(person: PersonInput) -> datetime:
    dt = datetime.strptime(f"{person.birthDate} {person.birthTime or '12:00'}", "%Y-%m-%d %H:%M")
    try:
        return dt.replace(tzinfo=ZoneInfo(person.timezone or "Asia/Seoul"))
    except Exception:
        return dt.replace(tzinfo=ZoneInfo("Asia/Seoul"))


def _to_lunar(person: PersonInput) -> Lunar:
    dt = _parse_datetime(person)
    if person.calendarType == "lunar":
        lunar = Lunar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0)
        solar = lunar.getSolar()
        return Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), dt.hour, dt.minute, 0).getLunar()
    return Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0).getLunar()


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


def _score_elements(stems: list[str], branches: list[str], rule_version: str, hidden_blend: float) -> dict[str, int]:
    w = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}

    for s in stems:
        if s in ELEMENT_BY_STEM:
            w[ELEMENT_BY_STEM[s]] += 1.6

    for idx, b in enumerate(branches):
        if b not in ELEMENT_BY_BRANCH:
            continue

        # v2 candidate: month branch boost
        if rule_version == "v2-month-branch-boost" and idx == 1:
            w[ELEMENT_BY_BRANCH[b]] += 2.0
        else:
            w[ELEMENT_BY_BRANCH[b]] += 1.0

        # experimental hybrid: month boost + hidden stems blend
        if rule_version == "exp-v2-hidden-blend":
            hidden = HIDDEN_STEMS.get(b, [])
            ratios = _hidden_ratio(len(hidden))
            for hs, ratio in zip(hidden, ratios):
                w[ELEMENT_BY_STEM[hs]] += max(0.0, min(1.0, hidden_blend)) * ratio

    return _norm(w)


def calculate_chart_with_lunar(person: PersonInput, rule_version: str = "v1-current", hidden_blend: float = 0.5):
    lunar = _to_lunar(person)
    ec = lunar.getEightChar()

    year_gan, year_zhi = ec.getYearGan(), ec.getYearZhi()
    month_gan, month_zhi = ec.getMonthGan(), ec.getMonthZhi()
    day_gan, day_zhi = ec.getDayGan(), ec.getDayZhi()
    time_gan, time_zhi = ec.getTimeGan(), ec.getTimeZhi()

    pillars = {
        "year": f"{year_gan}{year_zhi}",
        "month": f"{month_gan}{month_zhi}",
        "day": f"{day_gan}{day_zhi}",
        "hour": f"{time_gan}{time_zhi}",
    }

    five_elements = _score_elements(
        [year_gan, month_gan, day_gan, time_gan],
        [year_zhi, month_zhi, day_zhi, time_zhi],
        rule_version,
        hidden_blend,
    )

    strong = max(five_elements, key=five_elements.get).upper()
    weak = min(five_elements, key=five_elements.get).upper()
    signals = [f"{strong}_STRONG", f"{weak}_WEAK", "LUNAR_PILLARS_APPLIED", f"RULE_{rule_version}"]

    warnings: list[str] = []
    if not person.birthTimeKnown:
        warnings.append("PROVIDER_PARTIAL_DATA")

    return five_elements, pillars, signals, warnings

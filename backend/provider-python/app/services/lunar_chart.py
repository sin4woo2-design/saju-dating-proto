from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Lunar, Solar

from app.schemas import PersonInput

ELEMENT_BY_STEM = {
    "甲": "wood",
    "乙": "wood",
    "丙": "fire",
    "丁": "fire",
    "戊": "earth",
    "己": "earth",
    "庚": "metal",
    "辛": "metal",
    "壬": "water",
    "癸": "water",
}

ELEMENT_BY_BRANCH = {
    "寅": "wood",
    "卯": "wood",
    "巳": "fire",
    "午": "fire",
    "辰": "earth",
    "戌": "earth",
    "丑": "earth",
    "未": "earth",
    "申": "metal",
    "酉": "metal",
    "亥": "water",
    "子": "water",
}


def _parse_datetime(person: PersonInput) -> datetime:
    date_part = person.birthDate
    time_part = person.birthTime or "12:00"
    dt = datetime.strptime(f"{date_part} {time_part}", "%Y-%m-%d %H:%M")
    tz_name = person.timezone or "Asia/Seoul"
    try:
        return dt.replace(tzinfo=ZoneInfo(tz_name))
    except Exception:
        return dt.replace(tzinfo=ZoneInfo("Asia/Seoul"))


def _to_lunar(person: PersonInput) -> Lunar:
    dt = _parse_datetime(person)

    if person.calendarType == "lunar":
        # lunar-python은 음력->양력 변환 시 윤달 여부 플래그를 받는다.
        # 현재 입력 스키마에 leap month 정보가 없어 False 고정(향후 확장 필요).
        lunar = Lunar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0)
        solar = lunar.getSolar()
        return Solar.fromYmdHms(
            solar.getYear(),
            solar.getMonth(),
            solar.getDay(),
            dt.hour,
            dt.minute,
            0,
        ).getLunar()

    return Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0).getLunar()


def _score_elements(stems: list[str], branches: list[str]) -> dict[str, int]:
    weights = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}

    for s in stems:
        if s in ELEMENT_BY_STEM:
            weights[ELEMENT_BY_STEM[s]] += 1.6

    for b in branches:
        if b in ELEMENT_BY_BRANCH:
            weights[ELEMENT_BY_BRANCH[b]] += 1.0

    total = sum(weights.values()) or 1.0
    scaled = {k: int(round((v / total) * 100)) for k, v in weights.items()}

    # 반올림 오차 보정
    diff = 100 - sum(scaled.values())
    if diff != 0:
        strongest = max(scaled, key=scaled.get)
        scaled[strongest] += diff

    return scaled


def calculate_chart_with_lunar(person: PersonInput):
    lunar = _to_lunar(person)
    ec = lunar.getEightChar()

    year_gan = ec.getYearGan()
    year_zhi = ec.getYearZhi()
    month_gan = ec.getMonthGan()
    month_zhi = ec.getMonthZhi()
    day_gan = ec.getDayGan()
    day_zhi = ec.getDayZhi()
    time_gan = ec.getTimeGan()
    time_zhi = ec.getTimeZhi()

    pillars = {
        "year": f"{year_gan}{year_zhi}",
        "month": f"{month_gan}{month_zhi}",
        "day": f"{day_gan}{day_zhi}",
        "hour": f"{time_gan}{time_zhi}",
    }

    five_elements = _score_elements(
        [year_gan, month_gan, day_gan, time_gan],
        [year_zhi, month_zhi, day_zhi, time_zhi],
    )

    strong = max(five_elements, key=five_elements.get).upper()
    weak = min(five_elements, key=five_elements.get).upper()
    signals = [f"{strong}_STRONG", f"{weak}_WEAK", "LUNAR_PILLARS_APPLIED"]

    warnings: list[str] = []
    if not person.birthTimeKnown:
        warnings.append("PROVIDER_PARTIAL_DATA")

    return five_elements, pillars, signals, warnings

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Lunar, Solar

from app.schemas import PersonInput
from app.services.chart_rules import score_elements, normalize_rule_version


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

    rule = normalize_rule_version(rule_version)
    five_elements = score_elements(
        [year_gan, month_gan, day_gan, time_gan],
        [year_zhi, month_zhi, day_zhi, time_zhi],
        rule,
        hidden_blend,
    )

    strong = max(five_elements, key=five_elements.get).upper()
    weak = min(five_elements, key=five_elements.get).upper()
    signals = [f"{strong}_STRONG", f"{weak}_WEAK", "LUNAR_PILLARS_APPLIED", f"RULE_{rule}"]

    warnings: list[str] = []
    if not person.birthTimeKnown:
        warnings.append("PROVIDER_PARTIAL_DATA")

    return five_elements, pillars, signals, warnings

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from lunar_python import Lunar, Solar

from app.schemas import PersonInput
from app.services.chart_basis import derive_chart_basis
from app.services.chart_rules import normalize_rule_version, score_elements_with_breakdown

TIME_BOUNDARY_HOUR = 23


def _safe_timezone(tz_name: str | None) -> tuple[ZoneInfo, bool]:
    normalized = (tz_name or "Asia/Seoul").strip() or "Asia/Seoul"
    try:
        return ZoneInfo(normalized), False
    except Exception:
        return ZoneInfo("Asia/Seoul"), True


def _safe_time(person: PersonInput) -> tuple[int, int, bool]:
    raw = (person.birthTime or "").strip()
    if not person.birthTimeKnown or not raw:
        return 12, 0, True

    try:
        hour_str, minute_str = raw.split(":", 1)
        hour = max(0, min(23, int(hour_str)))
        minute = max(0, min(59, int(minute_str)))
        adjusted = f"{hour:02d}:{minute:02d}" != raw
        return hour, minute, adjusted
    except Exception:
        return 12, 0, True


def _parse_datetime(person: PersonInput) -> tuple[datetime, list[str], bool]:
    tz, tz_fallback = _safe_timezone(person.timezone)
    hour, minute, time_fallback = _safe_time(person)

    dt = datetime.strptime(person.birthDate, "%Y-%m-%d")
    dt = dt.replace(hour=hour, minute=minute, second=0, microsecond=0, tzinfo=tz)

    flags: list[str] = []
    if tz_fallback:
        flags.append("TZ_FALLBACK_APPLIED")
    if time_fallback:
        flags.append("BIRTH_TIME_DEFAULTED")

    crossed_boundary = hour >= TIME_BOUNDARY_HOUR
    if crossed_boundary:
        flags.append("DAY_BOUNDARY_LATE_HOUR")

    return dt, flags, crossed_boundary


def _to_lunar(person: PersonInput):
    dt, flags, crossed_boundary = _parse_datetime(person)

    if person.calendarType == "lunar":
        lunar = Lunar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0)
        solar = lunar.getSolar()
        converted = Solar.fromYmdHms(
            solar.getYear(),
            solar.getMonth(),
            solar.getDay(),
            dt.hour,
            dt.minute,
            0,
        ).getLunar()
        return converted, flags, crossed_boundary

    converted = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, 0).getLunar()
    return converted, flags, crossed_boundary


def calculate_chart_with_lunar(
    person: PersonInput,
    rule_version: str = "v1-current",
    hidden_blend: float = 0.5,
    earth_dampening_enabled: bool = False,
    earth_dampening_strength: float = 0.5,
):
    lunar, boundary_flags, _ = _to_lunar(person)
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
    breakdown = score_elements_with_breakdown(
        [year_gan, month_gan, day_gan, time_gan],
        [year_zhi, month_zhi, day_zhi, time_zhi],
        rule,
        hidden_blend,
        earth_dampening_enabled,
        earth_dampening_strength,
    )
    five_elements = breakdown["finalNormalized"]
    basis = derive_chart_basis(five_elements, pillars, breakdown)

    strong = max(five_elements, key=five_elements.get).upper()
    weak = min(five_elements, key=five_elements.get).upper()
    signals = [f"{strong}_STRONG", f"{weak}_WEAK", "LUNAR_PILLARS_APPLIED", f"RULE_{rule}", *boundary_flags]

    warnings: list[str] = []
    if not person.birthTimeKnown or boundary_flags:
        warnings.append("PROVIDER_PARTIAL_DATA")

    return five_elements, pillars, signals, list(dict.fromkeys(warnings)), basis, breakdown

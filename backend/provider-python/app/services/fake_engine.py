from __future__ import annotations

import hashlib

from app.schemas import PersonInput

PROVIDER_VERSION = "fake-python-provider-v0"
ALLOWED_TIMEZONES = {"Asia/Seoul", "UTC"}

STEMS = list("甲乙丙丁戊己庚辛壬癸")
BRANCHES = list("子丑寅卯辰巳午未申酉戌亥")


def _seed(text: str) -> int:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return int(digest[:12], 16)


def _person_key(p: PersonInput) -> str:
    return f"{p.name or ''}|{p.birthDate}|{p.birthTime}|{p.birthTimeKnown}|{p.gender}|{p.calendarType}|{p.timezone}"


def validate_policy(p: PersonInput) -> tuple[bool, str | None, str | None]:
    if p.timezone not in ALLOWED_TIMEZONES:
        return False, "UNSUPPORTED_TIMEZONE", f"timezone '{p.timezone}' is not supported"
    if p.calendarType != "solar":
        return False, "UNSUPPORTED_CALENDAR_TYPE", "calendarType 'lunar' is not supported in fake provider v0"
    return True, None, None


def calculate_chart(p: PersonInput) -> tuple[dict[str, int], dict[str, str], list[str], int, list[str]]:
    s = _seed(_person_key(p))

    five = {
        "wood": 30 + (s % 61),
        "fire": 30 + ((s // 3) % 61),
        "earth": 30 + ((s // 5) % 61),
        "metal": 30 + ((s // 7) % 61),
        "water": 30 + ((s // 11) % 61),
    }

    pillars = {
        "year": f"{STEMS[s % 10]}{BRANCHES[s % 12]}",
        "month": f"{STEMS[(s // 13) % 10]}{BRANCHES[(s // 13) % 12]}",
        "day": f"{STEMS[(s // 17) % 10]}{BRANCHES[(s // 17) % 12]}",
        "hour": f"{STEMS[(s // 19) % 10]}{BRANCHES[(s // 19) % 12]}",
    }

    signals: list[str] = []
    strong = max(five, key=five.get)
    weak = min(five, key=five.get)
    signals.append(f"{strong.upper()}_STRONG")
    signals.append(f"{weak.upper()}_WEAK")

    warnings: list[str] = []
    if not p.birthTimeKnown:
        warnings.append("PROVIDER_PARTIAL_DATA")

    latency_ms = 30 + (s % 50)
    return five, pillars, signals, latency_ms, warnings


def calculate_compatibility(me: PersonInput, partner: PersonInput) -> tuple[int, list[str], int, list[str]]:
    s1 = _seed(_person_key(me))
    s2 = _seed(_person_key(partner))
    mix = _seed(f"{min(s1, s2)}:{max(s1, s2)}")

    score = 60 + (mix % 36)

    signals = [
        "HAP_YEAR_BRANCH" if (s1 + s2) % 2 == 0 else "CHUNG_YEAR_BRANCH",
        "CHUNG_DAY_STEM" if abs((s1 % 10) - (s2 % 10)) > 4 else "HAP_DAY_STEM",
    ]

    warnings: list[str] = []
    if (not me.birthTimeKnown) or (not partner.birthTimeKnown):
        warnings.append("PROVIDER_PARTIAL_DATA")

    latency_ms = 35 + (mix % 55)
    return score, signals, latency_ms, warnings

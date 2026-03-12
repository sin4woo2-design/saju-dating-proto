from __future__ import annotations

import unittest

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


class CompatibilityServiceTest(unittest.TestCase):
    def _person(self, *, known: bool, gender: str, birth_time: str = "08:30") -> PersonInput:
        return PersonInput(
            birthDate="1991-10-21" if gender == "male" else "1993-02-11",
            birthTime=birth_time,
            birthTimeKnown=known,
            gender=gender,
            calendarType="solar",
            timezone="Asia/Seoul",
        )

    def test_raw_signals_and_score_are_generated(self):
        me = self._person(known=True, gender="male")
        partner = self._person(known=False, gender="female", birth_time="12:00")

        score, signals, raw_signals, reliability, latency_ms, warnings = get_compatibility(me, partner)

        self.assertTrue(len(signals) >= 1)
        self.assertTrue(len(raw_signals) >= len(signals))
        self.assertTrue(40 <= score <= 96)
        self.assertIn("confidence", reliability)
        self.assertTrue(latency_ms > 0)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)

        raw_codes = {s.get("code") for s in raw_signals}
        self.assertIn("RELIABILITY_PARTIAL_PILLARS", raw_codes)
        self.assertTrue(
            any(code in raw_codes for code in {"ELEMENT_GENERATES_MUTUAL", "ELEMENT_CONTROLS_IMBALANCED", "DAYMASTER_SUPPORT_MUTUAL"})
        )
        self.assertTrue(
            any(code in raw_codes for code in {"BRANCH_HAP_YEAR", "BRANCH_CHUNG_YEAR", "BRANCH_HYEONG_YEAR", "BRANCH_PA_YEAR", "BRANCH_HAE_YEAR", "BRANCH_BALANCED"})
        )

    def test_reliability_confidence_high_when_both_times_known(self):
        me = self._person(known=True, gender="male")
        partner = self._person(known=True, gender="female", birth_time="12:00")

        _, _, raw_signals, reliability, _, warnings = get_compatibility(me, partner)

        self.assertEqual(reliability.get("confidence"), "high")
        self.assertFalse(any(s.get("category") == "reliability" for s in raw_signals))
        self.assertFalse("PROVIDER_PARTIAL_DATA" in warnings)

    def test_reliability_confidence_low_when_both_times_unknown(self):
        me = self._person(known=False, gender="male")
        partner = self._person(known=False, gender="female", birth_time="12:00")

        _, _, raw_signals, reliability, _, warnings = get_compatibility(me, partner)

        reliability_codes = {s.get("code") for s in raw_signals if s.get("category") == "reliability"}
        self.assertEqual(reliability.get("confidence"), "low")
        self.assertIn("RELIABILITY_TIME_UNKNOWN_ME", reliability_codes)
        self.assertIn("RELIABILITY_TIME_UNKNOWN_PARTNER", reliability_codes)
        self.assertIn("RELIABILITY_PARTIAL_PILLARS", reliability_codes)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)


if __name__ == "__main__":
    unittest.main()

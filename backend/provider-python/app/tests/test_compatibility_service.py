from __future__ import annotations

import unittest

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


class CompatibilityServiceTest(unittest.TestCase):
    def test_raw_signals_and_score_are_generated(self):
        me = PersonInput(
            birthDate="1991-10-21",
            birthTime="08:30",
            birthTimeKnown=True,
            gender="male",
            calendarType="solar",
            timezone="Asia/Seoul",
        )
        partner = PersonInput(
            birthDate="1993-02-11",
            birthTime="12:00",
            birthTimeKnown=False,
            gender="female",
            calendarType="solar",
            timezone="Asia/Seoul",
        )

        score, signals, raw_signals, reliability, latency_ms, warnings = get_compatibility(me, partner)

        self.assertTrue(len(signals) >= 1)
        self.assertTrue(len(raw_signals) >= len(signals))
        self.assertTrue(40 <= score <= 96)
        self.assertIn("confidence", reliability)
        self.assertTrue(latency_ms > 0)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)


if __name__ == "__main__":
    unittest.main()

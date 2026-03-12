from __future__ import annotations

import unittest

from app.schemas import PersonInput
from app.services.fake_engine import calculate_chart
from app.services.lunar_chart import calculate_chart_with_lunar


class ChartServiceSmokeTest(unittest.TestCase):
    def setUp(self):
        self.person = PersonInput(
            name="테스터",
            birthDate="1991-10-21",
            birthTime="08:30",
            birthTimeKnown=True,
            gender="male",
            calendarType="solar",
            timezone="Asia/Seoul",
        )

    def test_fake_chart_deterministic(self):
        a = calculate_chart(self.person)
        b = calculate_chart(self.person)
        self.assertEqual(a, b)

    def test_lunar_chart_shape(self):
        five, pillars, signals, warnings = calculate_chart_with_lunar(self.person)
        self.assertEqual(set(five.keys()), {"wood", "fire", "earth", "metal", "water"})
        self.assertEqual(set(pillars.keys()), {"year", "month", "day", "hour"})
        self.assertTrue(len(signals) >= 2)
        self.assertIsInstance(warnings, list)

    def test_lunar_chart_timezone_fallback_flag(self):
        p = self.person.model_copy(update={"timezone": "Mars/Phobos"})
        _, _, signals, warnings = calculate_chart_with_lunar(p)
        self.assertIn("TZ_FALLBACK_APPLIED", signals)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)

    def test_lunar_chart_time_boundary_flag(self):
        p = self.person.model_copy(update={"birthTime": "23:30", "birthTimeKnown": True})
        _, _, signals, warnings = calculate_chart_with_lunar(p)
        self.assertIn("DAY_BOUNDARY_LATE_HOUR", signals)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)

    def test_lunar_chart_time_unknown_default_flag(self):
        p = self.person.model_copy(update={"birthTime": "", "birthTimeKnown": False})
        _, _, signals, warnings = calculate_chart_with_lunar(p)
        self.assertIn("BIRTH_TIME_DEFAULTED", signals)
        self.assertIn("PROVIDER_PARTIAL_DATA", warnings)


if __name__ == "__main__":
    unittest.main()

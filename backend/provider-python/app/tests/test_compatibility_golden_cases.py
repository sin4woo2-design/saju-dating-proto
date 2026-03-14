from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


class CompatibilityGoldenCasesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixture_path = Path(__file__).with_name("compatibility_golden_cases.json")
        cls.cases = json.loads(fixture_path.read_text(encoding="utf-8"))

    def _person(self, payload: dict) -> PersonInput:
        return PersonInput(**payload)

    def test_golden_cases_contract_and_stability(self):
        self.assertGreaterEqual(len(self.cases), 12)

        for case in self.cases:
            with self.subTest(case=case["id"]):
                me = self._person(case["me"])
                partner = self._person(case["partner"])

                score1, signals1, raw1, reliability1, _, warnings1, v21 = get_compatibility(me, partner)
                score2, signals2, raw2, reliability2, _, warnings2, v22 = get_compatibility(me, partner)

                # deterministic stability
                self.assertEqual(score1, score2)
                self.assertEqual(signals1, signals2)
                self.assertEqual(raw1, raw2)
                self.assertEqual(reliability1, reliability2)
                self.assertEqual(v21, v22)

                # v1-v2 bridge consistency
                self.assertEqual(v21.get("totalScore"), score1)
                self.assertEqual(v21.get("provenance", {}).get("basisSchemaVersion"), "compat-basis-v1")
                self.assertEqual(v21.get("provenance", {}).get("ruleVersion"), "compat-v2-basis")
                self.assertIn("subScores", v21)
                self.assertIn("basis", v21)
                self.assertIn("confidence", v21)

                # score and drift guard
                self.assertTrue(40 <= score1 <= 96)
                self.assertLessEqual(abs((v21.get("totalScore") or score1) - score1), 8)

                # confidence / warning expectation
                expected_confidence = case["expected"]["confidence"]
                expected_partial = case["expected"]["partialWarning"]
                self.assertEqual(reliability1.get("confidence"), expected_confidence)
                self.assertEqual(v21.get("confidence", {}).get("level"), expected_confidence)
                self.assertEqual("PROVIDER_PARTIAL_DATA" in warnings1, expected_partial)


if __name__ == "__main__":
    unittest.main()

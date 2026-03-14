from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    fixture_path = root / "backend" / "provider-python" / "app" / "tests" / "compatibility_golden_cases.json"
    out_path = root / "docs" / "compatibility-distribution-report.md"

    cases = json.loads(fixture_path.read_text(encoding="utf-8"))

    confidence_counter: Counter[str] = Counter()
    warning_counter: Counter[str] = Counter()
    score_values: list[int] = []
    rows: list[str] = []

    for case in cases:
        me = PersonInput(**case["me"])
        partner = PersonInput(**case["partner"])
        score, _signals, _raw, reliability, _latency, warnings, v2 = get_compatibility(me, partner)

        conf = (v2.get("confidence", {}) or {}).get("level") or reliability.get("confidence") or "unknown"
        confidence_counter[conf] += 1
        for w in warnings:
            warning_counter[w] += 1
        score_values.append(score)

        rows.append(
            f"| {case['id']} | {score} | {conf} | {', '.join(warnings) if warnings else '-'} |"
        )

    total = len(cases)
    partial_rate = (warning_counter.get("PROVIDER_PARTIAL_DATA", 0) / total) * 100 if total else 0

    report = "\n".join(
        [
            "# Compatibility Warning/Confidence Distribution Report",
            "",
            "Golden case fixture 기반 분포 리포트입니다.",
            "",
            f"- Total cases: **{total}**",
            f"- Score range: **{min(score_values)} ~ {max(score_values)}**",
            f"- Avg score: **{sum(score_values)/len(score_values):.2f}**",
            f"- PROVIDER_PARTIAL_DATA rate: **{partial_rate:.1f}%**",
            "",
            "## Confidence distribution",
            "",
            *(f"- {k}: {v}" for k, v in sorted(confidence_counter.items())),
            "",
            "## Warning distribution",
            "",
            *(f"- {k}: {v}" for k, v in sorted(warning_counter.items())),
            "",
            "## Case results",
            "",
            "| case | score | confidence | warnings |",
            "|---|---:|---|---|",
            *rows,
            "",
        ]
    )

    out_path.write_text(report, encoding="utf-8")
    print(f"written: {out_path}")


if __name__ == "__main__":
    main()

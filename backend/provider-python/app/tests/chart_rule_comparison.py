from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.chart_rules import score_elements

BLENDS = [0.4, 0.5, 0.6]


def _split_pillars(row: dict):
    pillars = [row["year_pillar"], row["month_pillar"], row["day_pillar"], row["hour_pillar"]]
    stems = [p[0] for p in pillars if p]
    branches = [p[1] for p in pillars if len(p) > 1]
    return stems, branches


def run():
    root = Path(__file__).resolve().parents[4]
    src = root / "daily-work" / "saju-chart-validation-v1.json"
    out_csv = root / "daily-work" / "saju-chart-rule-comparison-v1.csv"
    out_json = root / "daily-work" / "saju-chart-rule-comparison-v1.json"

    data = json.loads(src.read_text(encoding="utf-8"))
    rows = data["rows"]

    out_rows = []
    dist = {
        "v1-current": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        "v2-month-branch-boost": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        **{f"exp-v2-hidden-blend@{b}": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0} for b in BLENDS},
    }

    for r in rows:
        stems, branches = _split_pillars(r)

        base_v1 = score_elements(stems, branches, "v1-current", 0.5)
        base_v2 = score_elements(stems, branches, "v2-month-branch-boost", 0.5)
        hidden = {b: score_elements(stems, branches, "exp-v2-hidden-blend", b) for b in BLENDS}

        sv1 = max(base_v1, key=base_v1.get)
        sv2 = max(base_v2, key=base_v2.get)
        dist["v1-current"][sv1] += 1
        dist["v2-month-branch-boost"][sv2] += 1

        row = {
            "sample_id": r["sample_id"],
            "year_pillar": r["year_pillar"],
            "month_pillar": r["month_pillar"],
            "day_pillar": r["day_pillar"],
            "hour_pillar": r["hour_pillar"],
            "v1_current_strong": sv1,
            "v2_month_branch_boost_strong": sv2,
            "v1_current": json.dumps(base_v1, ensure_ascii=False),
            "v2_month_branch_boost": json.dumps(base_v2, ensure_ascii=False),
        }

        for b in BLENDS:
            key = f"exp-v2-hidden-blend@{b}"
            sb = max(hidden[b], key=hidden[b].get)
            dist[key][sb] += 1
            row[f"hidden_blend_{b}_strong"] = sb
            row[f"hidden_blend_{b}"] = json.dumps(hidden[b], ensure_ascii=False)

        out_rows.append(row)

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)

    out = {"distribution": dist, "rows": out_rows, "blends": BLENDS}
    out_json.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"csv": str(out_csv), "json": str(out_json), "distribution": dist}, ensure_ascii=False))


if __name__ == "__main__":
    run()

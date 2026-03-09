from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.chart_rules import score_elements


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
        "exp-v2-hidden-blend@0.5": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
    }

    for r in rows:
        stems, branches = _split_pillars(r)
        a = score_elements(stems, branches, "v1-current", 0.5)
        b = score_elements(stems, branches, "v2-month-branch-boost", 0.5)
        c = score_elements(stems, branches, "exp-v2-hidden-blend", 0.5)

        sa, sb, sc = max(a, key=a.get), max(b, key=b.get), max(c, key=c.get)
        dist["v1-current"][sa] += 1
        dist["v2-month-branch-boost"][sb] += 1
        dist["exp-v2-hidden-blend@0.5"][sc] += 1

        out_rows.append({
            "sample_id": r["sample_id"],
            "year_pillar": r["year_pillar"],
            "month_pillar": r["month_pillar"],
            "day_pillar": r["day_pillar"],
            "hour_pillar": r["hour_pillar"],
            "v1_current_strong": sa,
            "v2_month_branch_boost_strong": sb,
            "exp_v2_hidden_blend_strong": sc,
            "v1_current": json.dumps(a, ensure_ascii=False),
            "v2_month_branch_boost": json.dumps(b, ensure_ascii=False),
            "exp_v2_hidden_blend": json.dumps(c, ensure_ascii=False),
        })

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)

    out = {"distribution": dist, "rows": out_rows}
    out_json.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"csv": str(out_csv), "json": str(out_json), "distribution": dist}, ensure_ascii=False))


if __name__ == "__main__":
    run()

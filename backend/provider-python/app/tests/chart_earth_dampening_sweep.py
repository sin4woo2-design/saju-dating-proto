from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.chart_rules import score_elements_with_breakdown

DAMP_VALUES = [0.3, 0.5, 0.7]


def _split_pillars(row: dict):
    pillars = [row["year_pillar"], row["month_pillar"], row["day_pillar"], row["hour_pillar"]]
    stems = [p[0] for p in pillars if p]
    branches = [p[1] for p in pillars if len(p) > 1]
    return stems, branches


def winner_from_breakdown(b):
    return b["winner"]


def run():
    root = Path(__file__).resolve().parents[4]
    src = root / "daily-work" / "saju-chart-validation-v1.json"
    out_csv = root / "daily-work" / "saju-chart-earth-dampening-sweep-v1.csv"
    out_json = root / "daily-work" / "saju-chart-earth-dampening-sweep-v1.json"
    out_md = root / "daily-work" / "saju-chart-earth-dampening-sweep-v1.md"

    rows = json.loads(src.read_text(encoding="utf-8"))["rows"]

    dist = {
        "v1-current": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        "v2-month-branch-boost": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        "exp-v2-hidden-blend@base": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        **{f"exp-v2-hidden-blend+damp@{d}": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0} for d in DAMP_VALUES},
    }

    overlap_change = {f"{d}": 0 for d in DAMP_VALUES}
    non_overlap_change = {f"{d}": 0 for d in DAMP_VALUES}

    out_rows = []

    for r in rows:
        stems, branches = _split_pillars(r)

        v1 = score_elements_with_breakdown(stems, branches, "v1-current", 0.5)
        v2 = score_elements_with_breakdown(stems, branches, "v2-month-branch-boost", 0.5)
        base = score_elements_with_breakdown(stems, branches, "exp-v2-hidden-blend", 0.5, False, 0.0)

        w_v1, w_v2, w_base = winner_from_breakdown(v1), winner_from_breakdown(v2), winner_from_breakdown(base)
        dist["v1-current"][w_v1] += 1
        dist["v2-month-branch-boost"][w_v2] += 1
        dist["exp-v2-hidden-blend@base"][w_base] += 1

        is_overlap = base["overlapMonthBonusHiddenEarth"]

        row = {
            "sample_id": r["sample_id"],
            "month_pillar": r["month_pillar"],
            "v1_winner": w_v1,
            "v2_winner": w_v2,
            "base_winner": w_base,
            "overlap_monthbonus_hidden_earth": is_overlap,
            "base_raw_earth": round(base["rawScore"]["earth"], 3),
            "base_raw_fire": round(base["rawScore"]["fire"], 3),
            "base_raw_metal": round(base["rawScore"]["metal"], 3),
        }

        for d in DAMP_VALUES:
            key = f"exp-v2-hidden-blend+damp@{d}"
            bd = score_elements_with_breakdown(stems, branches, "exp-v2-hidden-blend", 0.5, True, d)
            wd = winner_from_breakdown(bd)
            dist[key][wd] += 1
            row[f"damp_{d}_winner"] = wd
            row[f"damp_{d}_earth_damp_applied"] = round(bd["earthDampeningApplied"], 3)

            if wd != w_base:
                if is_overlap:
                    overlap_change[f"{d}"] += 1
                else:
                    non_overlap_change[f"{d}"] += 1

        out_rows.append(row)

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)

    summary = {
        "count": len(out_rows),
        "distribution": dist,
        "overlap_winner_change_vs_base": overlap_change,
        "non_overlap_winner_change_vs_base": non_overlap_change,
    }

    out_json.write_text(json.dumps({"summary": summary, "rows": out_rows}, ensure_ascii=False, indent=2), encoding="utf-8")

    v1 = dist["v1-current"]; v2 = dist["v2-month-branch-boost"]; base = dist["exp-v2-hidden-blend@base"]
    lines = [
        "# [Saju] earth dampening sweep v1 (N=40)",
        "",
        "## 비교한 dampening 값",
        "- 0.3 / 0.5 / 0.7",
        "",
        "## 규칙별 strong 분포",
        f"- v1-current: {v1}",
        f"- v2-month-branch-boost: {v2}",
        f"- exp-v2-hidden-blend@base: {base}",
    ]
    for d in DAMP_VALUES:
        lines.append(f"- exp-v2-hidden-blend+damp@{d}: {dist[f'exp-v2-hidden-blend+damp@{d}']}")

    lines.extend([
        "",
        "## overlap / non-overlap winner 변화 (기준: exp base)",
    ])
    for d in DAMP_VALUES:
        lines.append(f"- damp {d}: overlap {overlap_change[str(d)]}건, non-overlap {non_overlap_change[str(d)]}건")

    lines.extend([
        "",
        "## 추천",
        "- overlap에만 작동하면서 non-overlap 영향이 적은 강도를 우선 채택",
    ])

    out_md.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps({"csv": str(out_csv), "json": str(out_json), "md": str(out_md), "summary": summary}, ensure_ascii=False))


if __name__ == "__main__":
    run()

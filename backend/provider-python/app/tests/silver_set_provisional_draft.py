from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.chart_rules import score_elements_with_breakdown

REFERENCE_SOURCES = [
    {"name": "lunar-python (local)", "type": "computed", "confidence": "medium"},
    {"name": "Korean 만세력 app/manual", "type": "manual-crosscheck", "confidence": "pending"},
    {"name": "Chinese Almanac/BaZi calculator", "type": "manual-crosscheck", "confidence": "pending"},
]

SAMPLE_IDS = ["S01", "S02", "S03", "S04", "S07", "S09", "S10", "S14", "S16", "S20", "S27", "S40"]


def _split_pillars(row: dict):
    pillars = [row["year_pillar"], row["month_pillar"], row["day_pillar"], row["hour_pillar"]]
    stems = [p[0] for p in pillars if p]
    branches = [p[1] for p in pillars if len(p) > 1]
    return stems, branches


def status_from_agreement(*values: str):
    uniq = set(values)
    if len(uniq) == 1:
        return "provisional-ok"
    return "needs-review"


def run():
    root = Path(__file__).resolve().parents[4]
    src = root / "daily-work" / "saju-chart-validation-v1.json"
    out_csv = root / "daily-work" / "saju-silver-set-provisional-v1.csv"
    out_json = root / "daily-work" / "saju-silver-set-provisional-v1.json"
    out_md = root / "daily-work" / "saju-silver-set-provisional-v1.md"

    data = json.loads(src.read_text(encoding="utf-8"))
    rows = [r for r in data["rows"] if r["sample_id"] in SAMPLE_IDS]

    silver_rows = []

    for r in rows:
        stems, branches = _split_pillars(r)

        v1 = score_elements_with_breakdown(stems, branches, "v1-current", 0.5)
        v2 = score_elements_with_breakdown(stems, branches, "v2-month-branch-boost", 0.5)
        exp = score_elements_with_breakdown(stems, branches, "exp-v2-hidden-blend", 0.5)
        exp_damp = score_elements_with_breakdown(stems, branches, "exp-v2-hidden-blend", 0.5, True, 0.7)

        tendency_v1 = v1["winner"]
        tendency_v2 = v2["winner"]
        tendency_exp = exp["winner"]
        tendency_exp_damp = exp_damp["winner"]

        expected_pillars_status = "provisional-ok"
        expected_element_tendency_status = status_from_agreement(tendency_v1, tendency_v2, tendency_exp_damp)

        warning_needed = "PROVIDER_PARTIAL_DATA" if (not r["birth_time_known"]) else "NONE"
        expected_warning_status = "provisional-ok"

        if r["birth_time_known"] is False and expected_element_tendency_status == "needs-review":
            expected_element_tendency_status = "needs-review"

        if r["sample_id"] in {"S04", "S10", "S40"}:
            # 경계시간/자정 인접값은 외부 레퍼런스 대조 전 unknown 처리
            expected_pillars_status = "unknown"

        agreement_group = "match"
        if expected_element_tendency_status != "provisional-ok" or expected_pillars_status != "provisional-ok":
            agreement_group = "mismatch"

        silver_rows.append({
            "sample_id": r["sample_id"],
            "name": r["name"],
            "birth_date": r["birth_date"],
            "birth_time": r["birth_time"],
            "birth_time_known": r["birth_time_known"],
            "gender": r["gender"],
            "timezone": r["timezone"],
            "pillars": f"{r['year_pillar']}|{r['month_pillar']}|{r['day_pillar']}|{r['hour_pillar']}",
            "tendency_v1": tendency_v1,
            "tendency_v2": tendency_v2,
            "tendency_exp": tendency_exp,
            "tendency_exp_damp07": tendency_exp_damp,
            "warning_expected": warning_needed,
            "expected_pillars_status": expected_pillars_status,
            "expected_element_tendency_status": expected_element_tendency_status,
            "expected_warning_status": expected_warning_status,
            "reference_sources": "; ".join([s["name"] for s in REFERENCE_SOURCES]),
            "reference_check_status": "pending-manual",
            "agreement_group": agreement_group,
            "notes": "needs-review if tendency diverges across rule variants or boundary time",
        })

    counts = {
        "total": len(silver_rows),
        "pillars": {"provisional-ok": 0, "needs-review": 0, "unknown": 0},
        "element": {"provisional-ok": 0, "needs-review": 0, "unknown": 0},
        "warning": {"provisional-ok": 0, "needs-review": 0, "unknown": 0},
        "agreement_group": {"match": 0, "mismatch": 0},
    }

    for r in silver_rows:
        counts["pillars"][r["expected_pillars_status"]] += 1
        counts["element"][r["expected_element_tendency_status"]] += 1
        counts["warning"][r["expected_warning_status"]] += 1
        counts["agreement_group"][r["agreement_group"]] += 1

    review_candidates = [r for r in silver_rows if r["agreement_group"] == "mismatch"]
    review_candidates = review_candidates[:5]

    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(silver_rows[0].keys()))
        w.writeheader()
        w.writerows(silver_rows)

    out_json.write_text(
        json.dumps(
            {
                "reference_sources": REFERENCE_SOURCES,
                "counts": counts,
                "rows": silver_rows,
                "must_review_top5": review_candidates,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    md_lines = [
        "# [Saju] provisional silver set draft v1",
        "",
        "## 목적",
        "- golden set 없이 provisional 상태로 교차검증 대상을 좁히기",
        "- 불일치/경계 케이스를 needs-review로 분리",
        "",
        "## reference sources",
    ]
    md_lines.extend([f"- {s['name']} ({s['type']})" for s in REFERENCE_SOURCES])
    md_lines.extend([
        "",
        "## 집계",
        f"- total: {counts['total']}",
        f"- pillars: {counts['pillars']}",
        f"- element tendency: {counts['element']}",
        f"- warning: {counts['warning']}",
        f"- agreement group: {counts['agreement_group']}",
        "",
        "## must-review top5",
    ])
    for c in review_candidates:
        md_lines.append(
            f"- {c['sample_id']} ({c['name']}): pillars={c['expected_pillars_status']}, element={c['expected_element_tendency_status']}, tendency(v1/v2/exp+damp)={c['tendency_v1']}/{c['tendency_v2']}/{c['tendency_exp_damp07']}"
        )

    out_md.write_text("\n".join(md_lines), encoding="utf-8")

    print(json.dumps({
        "csv": str(out_csv),
        "json": str(out_json),
        "md": str(out_md),
        "counts": counts,
        "must_review_top5": review_candidates,
    }, ensure_ascii=False))


if __name__ == "__main__":
    run()

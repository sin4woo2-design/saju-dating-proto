from __future__ import annotations

import csv
import json
from pathlib import Path

from app.services.chart_rules import score_elements_with_breakdown


def _split_pillars(row: dict):
    pillars = [row["year_pillar"], row["month_pillar"], row["day_pillar"], row["hour_pillar"]]
    stems = [p[0] for p in pillars if p]
    branches = [p[1] for p in pillars if len(p) > 1]
    return stems, branches


def run():
    root = Path(__file__).resolve().parents[4]
    src = root / "daily-work" / "saju-chart-validation-v1.json"
    out_csv = root / "daily-work" / "saju-chart-earth-bias-diagnosis-v1.csv"
    out_json = root / "daily-work" / "saju-chart-earth-bias-diagnosis-v1.json"
    out_md = root / "daily-work" / "saju-chart-earth-bias-diagnosis-v1.md"

    data = json.loads(src.read_text(encoding="utf-8"))
    rows = data["rows"]

    diagnostics = []
    overlap_count = 0

    for r in rows:
      stems, branches = _split_pillars(r)
      v2 = score_elements_with_breakdown(stems, branches, "v2-month-branch-boost", 0.5)
      exp = score_elements_with_breakdown(stems, branches, "exp-v2-hidden-blend", 0.5)

      month_bonus_earth = v2["monthBranchBonusContribution"]["earth"]
      hidden_earth = exp["hiddenStemContribution"]["earth"]
      overlap = month_bonus_earth > 0 and hidden_earth > 0
      if overlap:
          overlap_count += 1

      diagnostics.append({
          "sample_id": r["sample_id"],
          "year_pillar": r["year_pillar"],
          "month_pillar": r["month_pillar"],
          "day_pillar": r["day_pillar"],
          "hour_pillar": r["hour_pillar"],
          "v2_winner": v2["winner"],
          "exp_winner": exp["winner"],
          "v2_stem_earth": round(v2["stemContribution"]["earth"], 3),
          "v2_branch_earth": round(v2["branchContribution"]["earth"], 3),
          "v2_month_bonus_earth": round(month_bonus_earth, 3),
          "exp_hidden_earth": round(hidden_earth, 3),
          "exp_raw_earth": round(exp["rawScore"]["earth"], 3),
          "exp_raw_fire": round(exp["rawScore"]["fire"], 3),
          "exp_raw_metal": round(exp["rawScore"]["metal"], 3),
          "overlap_monthbonus_hidden_earth": overlap,
      })

    earth_v2 = sum(1 for d in diagnostics if d["v2_winner"] == "earth")
    earth_exp = sum(1 for d in diagnostics if d["exp_winner"] == "earth")

    earth_rows = [d for d in diagnostics if d["exp_winner"] == "earth"]

    with out_csv.open("w", newline="", encoding="utf-8") as f:
      w = csv.DictWriter(f, fieldnames=list(diagnostics[0].keys()))
      w.writeheader()
      w.writerows(diagnostics)

    summary = {
      "count": len(diagnostics),
      "earth_winner_v2": earth_v2,
      "earth_winner_exp": earth_exp,
      "earth_increase": earth_exp - earth_v2,
      "overlap_monthbonus_hidden_earth_count": overlap_count,
      "overlap_ratio": overlap_count / len(diagnostics),
      "earth_exp_rows": earth_rows,
    }

    out_json.write_text(json.dumps({"summary": summary, "rows": diagnostics}, ensure_ascii=False, indent=2), encoding="utf-8")

    out_md.write_text(
      "\n".join([
        "# [Saju] earth bias diagnosis v1 (N=40)",
        "",
        "## 비교 기준",
        "- v2-month-branch-boost vs exp-v2-hidden-blend@0.5",
        "",
        "## 핵심 지표",
        f"- earth winner (v2): {earth_v2}",
        f"- earth winner (exp): {earth_exp}",
        f"- increase: +{earth_exp - earth_v2}",
        f"- month bonus + hidden earth overlap: {overlap_count}/{len(diagnostics)} ({(overlap_count/len(diagnostics))*100:.1f}%)",
        "",
        "## 판단",
        "- exp 규칙에서 month-branch earth 보너스와 hidden-stem earth 기여가 중첩되며 earth raw score가 과대 누적되는 패턴이 확인됨.",
        "",
        "## 다음 후보",
        "1) hidden stem cap: earth hidden contribution 상한(예: 0.35) 도입",
        "2) earth dampening: month bonus가 earth일 때 hidden earth 50% 감쇠",
      ]),
      encoding="utf-8",
    )

    print(json.dumps({"csv": str(out_csv), "json": str(out_json), "md": str(out_md), "summary": summary}, ensure_ascii=False))


if __name__ == "__main__":
    run()

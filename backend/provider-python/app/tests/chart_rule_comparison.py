from __future__ import annotations

import csv
import json
from pathlib import Path

ELEMENT_BY_STEM = {
    "甲": "wood", "乙": "wood",
    "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth",
    "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water",
}

ELEMENT_BY_BRANCH = {
    "寅": "wood", "卯": "wood",
    "巳": "fire", "午": "fire",
    "辰": "earth", "戌": "earth", "丑": "earth", "未": "earth",
    "申": "metal", "酉": "metal",
    "亥": "water", "子": "water",
}

HIDDEN_STEMS = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "戊", "庚"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
}


def _norm(weights: dict[str, float]) -> dict[str, int]:
    total = sum(weights.values()) or 1.0
    scaled = {k: int(round((v / total) * 100)) for k, v in weights.items()}
    diff = 100 - sum(scaled.values())
    if diff:
        strongest = max(scaled, key=scaled.get)
        scaled[strongest] += diff
    return scaled


def _split_pillars(row: dict):
    pillars = [row["year_pillar"], row["month_pillar"], row["day_pillar"], row["hour_pillar"]]
    stems = [p[0] for p in pillars if p]
    branches = [p[1] for p in pillars if len(p) > 1]
    return stems, branches


def rule_current(stems, branches):
    w = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}
    for s in stems:
        w[ELEMENT_BY_STEM[s]] += 1.6
    for b in branches:
        w[ELEMENT_BY_BRANCH[b]] += 1.0
    return _norm(w)


def rule_month_branch_boost(stems, branches):
    w = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}
    for s in stems:
        w[ELEMENT_BY_STEM[s]] += 1.6
    for idx, b in enumerate(branches):
        w[ELEMENT_BY_BRANCH[b]] += 2.0 if idx == 1 else 1.0
    return _norm(w)


def hidden_ratio(length: int):
    if length == 1:
        return [1.0]
    if length == 2:
        return [0.7, 0.3]
    return [0.7, 0.2, 0.1]


def rule_with_hidden_stems(stems, branches):
    w = {"wood": 0.0, "fire": 0.0, "earth": 0.0, "metal": 0.0, "water": 0.0}
    for s in stems:
        w[ELEMENT_BY_STEM[s]] += 1.6
    for b in branches:
        w[ELEMENT_BY_BRANCH[b]] += 1.0
        hidden = HIDDEN_STEMS[b]
        ratios = hidden_ratio(len(hidden))
        for hs, r in zip(hidden, ratios):
            w[ELEMENT_BY_STEM[hs]] += 0.8 * r
    return _norm(w)


def run():
    root = Path(__file__).resolve().parents[4]
    src = root / "daily-work" / "saju-chart-validation-v1.json"
    out_csv = root / "daily-work" / "saju-chart-rule-comparison-v1.csv"
    out_json = root / "daily-work" / "saju-chart-rule-comparison-v1.json"

    data = json.loads(src.read_text(encoding="utf-8"))
    rows = data["rows"]

    out_rows = []
    dist = {
        "current": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        "month_branch_boost": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
        "hidden_stems": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
    }

    for r in rows:
        stems, branches = _split_pillars(r)
        a = rule_current(stems, branches)
        b = rule_month_branch_boost(stems, branches)
        c = rule_with_hidden_stems(stems, branches)

        sa, sb, sc = max(a, key=a.get), max(b, key=b.get), max(c, key=c.get)
        dist["current"][sa] += 1
        dist["month_branch_boost"][sb] += 1
        dist["hidden_stems"][sc] += 1

        out_rows.append({
            "sample_id": r["sample_id"],
            "year_pillar": r["year_pillar"],
            "month_pillar": r["month_pillar"],
            "day_pillar": r["day_pillar"],
            "hour_pillar": r["hour_pillar"],
            "current_strong": sa,
            "month_boost_strong": sb,
            "hidden_stems_strong": sc,
            "current": json.dumps(a, ensure_ascii=False),
            "month_branch_boost": json.dumps(b, ensure_ascii=False),
            "hidden_stems": json.dumps(c, ensure_ascii=False),
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

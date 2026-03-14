from __future__ import annotations

import json
from pathlib import Path
from collections import Counter


def norm(s: str) -> str:
    return " ".join((s or "").split()).strip()


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    src = root / "docs" / "compatibility-user-scenario-report-2026-03-14.json"
    out = root / "docs" / "compatibility-copy-diversity-report-2026-03-14.md"

    data = json.loads(src.read_text(encoding="utf-8"))
    rows = data.get("rows", [])

    # Copy diversity proxy: confidence/warnings/subscore pattern uniqueness
    pattern_counter: Counter[str] = Counter()
    for r in rows:
        sub = r.get("subScores", {})
        key = f"c:{r.get('confidence')}|w:{','.join(sorted(r.get('warnings') or []))}|sig:{sub.get('branch',0)}/{sub.get('stem',0)}/{sub.get('elements',0)}/{sub.get('dayMaster',0)}/{sub.get('reliability',0)}"
        pattern_counter[key] += 1

    unique_patterns = len(pattern_counter)
    total = len(rows)
    diversity_ratio = (unique_patterns / total) if total else 0

    top_repeated = sorted(pattern_counter.items(), key=lambda x: x[1], reverse=True)[:5]

    lines = [
        "# Compatibility Copy Diversity Report",
        "",
        f"- total scenarios: **{total}**",
        f"- unique pattern count: **{unique_patterns}**",
        f"- diversity ratio: **{diversity_ratio:.2f}**",
        "",
        "## Most repeated patterns (proxy)",
        "",
    ]

    for p, cnt in top_repeated:
        lines.append(f"- ({cnt}) {p}")

    lines += [
        "",
        "해석:",
        "- diversity ratio가 낮으면 문구 분기(신호 기반 템플릿) 확장이 필요하다.",
        "- 본 리포트는 copy 결과 직접 비교 대신 근거 패턴 중복도를 프록시로 사용한다.",
    ]

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"written: {out}")


if __name__ == "__main__":
    main()

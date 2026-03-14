from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


SCENARIOS = [
    {"id": "real-01-balanced-known", "me": {"birthDate": "1991-10-21", "birthTime": "08:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1993-02-11", "birthTime": "09:20", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-02-partial-time", "me": {"birthDate": "1991-10-21", "birthTime": "08:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1993-02-11", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-03-both-unknown", "me": {"birthDate": "1988-07-05", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1995-12-19", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-04-midnight-edge", "me": {"birthDate": "1990-01-01", "birthTime": "23:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1990-01-02", "birthTime": "00:30", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-05-utc-case", "me": {"birthDate": "1987-03-21", "birthTime": "07:25", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"}, "partner": {"birthDate": "1996-09-14", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "UTC"}},
    {"id": "real-06-known-known-2", "me": {"birthDate": "1992-04-17", "birthTime": "06:20", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1994-08-27", "birthTime": "18:10", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-07-known-unknown-2", "me": {"birthDate": "1986-12-03", "birthTime": "19:15", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1998-05-22", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-08-known-known-utc", "me": {"birthDate": "1990-06-05", "birthTime": "10:40", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"}, "partner": {"birthDate": "1991-07-11", "birthTime": "21:10", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "UTC"}},
    {"id": "real-09-other-gender", "me": {"birthDate": "1993-03-13", "birthTime": "13:00", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1992-02-02", "birthTime": "22:30", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-10-midnight-edge-2", "me": {"birthDate": "1999-01-31", "birthTime": "23:40", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1999-02-01", "birthTime": "00:20", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-11-season-edge-1", "me": {"birthDate": "1994-02-03", "birthTime": "11:10", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1994-02-04", "birthTime": "11:10", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-12-season-edge-2", "me": {"birthDate": "1994-02-04", "birthTime": "11:10", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1994-02-05", "birthTime": "11:10", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-13-unknown-known-utc", "me": {"birthDate": "1985-09-15", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "UTC"}, "partner": {"birthDate": "1997-04-09", "birthTime": "04:40", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "UTC"}},
    {"id": "real-14-symmetric-known", "me": {"birthDate": "1999-09-09", "birthTime": "09:09", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1999-09-09", "birthTime": "09:09", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
    {"id": "real-15-symmetric-unknown", "me": {"birthDate": "1999-09-09", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"}, "partner": {"birthDate": "1999-09-09", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"}},
]


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    out_path = root / "docs" / "compatibility-user-scenario-report-2026-03-14.md"
    json_out = root / "docs" / "compatibility-user-scenario-report-2026-03-14.json"

    rows: list[str] = []
    confidence_counter: Counter[str] = Counter()
    warning_counter: Counter[str] = Counter()
    score_values: list[int] = []
    report_rows: list[dict] = []

    for sc in SCENARIOS:
        me = PersonInput(**sc["me"])
        partner = PersonInput(**sc["partner"])
        score, _signals, _raw, reliability, _latency, warnings, v2 = get_compatibility(me, partner)

        prov = v2.get("provenance", {})
        conf = v2.get("confidence", {}).get("level") or reliability.get("confidence") or "unknown"
        sub = v2.get("subScores", {})

        confidence_counter[conf] += 1
        for w in warnings:
            warning_counter[w] += 1
        score_values.append(score)

        report_rows.append({
            "scenario": sc["id"],
            "score": score,
            "confidence": conf,
            "subScores": sub,
            "warnings": warnings,
            "ruleVersion": prov.get("ruleVersion"),
        })

        rows.append(
            "| {id} | {score} | {conf} | b:{b}/s:{s}/e:{e}/d:{d}/r:{r} | {warnings} | {rule} |".format(
                id=sc["id"],
                score=score,
                conf=conf,
                b=sub.get("branch", 0),
                s=sub.get("stem", 0),
                e=sub.get("elements", 0),
                d=sub.get("dayMaster", 0),
                r=sub.get("reliability", 0),
                warnings=", ".join(warnings) if warnings else "-",
                rule=prov.get("ruleVersion", "-"),
            )
        )

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    body = "\n".join([
        "# Compatibility User Scenario Report",
        "",
        f"generated: {now}",
        "",
        "실사용 관점에서 대표 입력 케이스를 빠르게 검증한 결과입니다.",
        "",
        f"- scenarios: **{len(SCENARIOS)}**",
        f"- score range: **{min(score_values)} ~ {max(score_values)}**",
        f"- avg score: **{sum(score_values)/len(score_values):.2f}**",
        f"- confidence: high {confidence_counter.get('high', 0)} / medium {confidence_counter.get('medium', 0)} / low {confidence_counter.get('low', 0)}",
        "",
        "| scenario | score | confidence | subScores | warnings | ruleVersion |",
        "|---|---:|---|---|---|---|",
        *rows,
        "",
        "해석 기준:",
        "- score는 참고 지표이며 confidence/warnings를 함께 본다.",
        "- reliability(subScores.r)가 큰 음수면 시간 미상 영향이 큼.",
    ])

    out_path.write_text(body, encoding="utf-8")
    json_out.write_text(json.dumps({"generatedAt": now, "rows": report_rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"written: {out_path}")
    print(f"written: {json_out}")


if __name__ == "__main__":
    main()

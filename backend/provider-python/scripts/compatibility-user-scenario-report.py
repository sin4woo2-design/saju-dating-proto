from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.schemas import PersonInput
from app.services.compatibility_service import get_compatibility


SCENARIOS = [
    {
        "id": "real-01-balanced-known",
        "me": {"birthDate": "1991-10-21", "birthTime": "08:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
        "partner": {"birthDate": "1993-02-11", "birthTime": "09:20", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    },
    {
        "id": "real-02-partial-time",
        "me": {"birthDate": "1991-10-21", "birthTime": "08:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
        "partner": {"birthDate": "1993-02-11", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    },
    {
        "id": "real-03-both-unknown",
        "me": {"birthDate": "1988-07-05", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
        "partner": {"birthDate": "1995-12-19", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    },
    {
        "id": "real-04-midnight-edge",
        "me": {"birthDate": "1990-01-01", "birthTime": "23:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
        "partner": {"birthDate": "1990-01-02", "birthTime": "00:30", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    },
    {
        "id": "real-05-utc-case",
        "me": {"birthDate": "1987-03-21", "birthTime": "07:25", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"},
        "partner": {"birthDate": "1996-09-14", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    },
]


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    out_path = root / "docs" / "compatibility-user-scenario-report-2026-03-14.md"

    rows: list[str] = []
    for sc in SCENARIOS:
        me = PersonInput(**sc["me"])
        partner = PersonInput(**sc["partner"])
        score, _signals, _raw, reliability, _latency, warnings, v2 = get_compatibility(me, partner)

        prov = v2.get("provenance", {})
        conf = v2.get("confidence", {}).get("level") or reliability.get("confidence")
        sub = v2.get("subScores", {})

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
        "| scenario | score | confidence | subScores | warnings | ruleVersion |",
        "|---|---:|---|---|---|---|",
        *rows,
        "",
        "해석 기준:",
        "- score는 참고 지표이며 confidence/warnings를 함께 본다.",
        "- reliability(subScores.r)가 큰 음수면 시간 미상 영향이 큼.",
    ])

    out_path.write_text(body, encoding="utf-8")
    print(f"written: {out_path}")


if __name__ == "__main__":
    main()

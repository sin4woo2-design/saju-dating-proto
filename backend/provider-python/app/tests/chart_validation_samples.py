from __future__ import annotations

import csv
import json
from pathlib import Path

from app.schemas import PersonInput
from app.services.lunar_chart import calculate_chart_with_lunar

SAMPLES = [
    {"sample_id": "S01", "name": "Ari", "birthDate": "1991-10-21", "birthTime": "08:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S02", "name": "Bora", "birthDate": "1993-02-11", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S03", "name": "Cyan", "birthDate": "1988-07-03", "birthTime": "23:40", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S04", "name": "Dami", "birthDate": "2000-01-01", "birthTime": "00:20", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S05", "name": "Eun", "birthDate": "1985-12-31", "birthTime": "11:10", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S06", "name": "Fio", "birthDate": "1979-05-18", "birthTime": "15:55", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S07", "name": "Gyu", "birthDate": "1999-09-09", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S08", "name": "Hana", "birthDate": "1995-04-27", "birthTime": "06:05", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
]


def run() -> tuple[list[dict], dict]:
    rows = []
    summary = {
        "count": 0,
        "partial_count": 0,
        "strong_element_distribution": {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0},
    }

    for s in SAMPLES:
        person = PersonInput(**{k: v for k, v in s.items() if k != "sample_id"})
        five, pillars, signals, warnings = calculate_chart_with_lunar(person)
        strong = max(five, key=five.get)
        summary["strong_element_distribution"][strong] += 1
        if "PROVIDER_PARTIAL_DATA" in warnings:
            summary["partial_count"] += 1

        row = {
            "sample_id": s["sample_id"],
            "name": s["name"],
            "birth_date": s["birthDate"],
            "birth_time": s["birthTime"],
            "birth_time_known": s["birthTimeKnown"],
            "gender": s["gender"],
            "calendar_type": s["calendarType"],
            "timezone": s["timezone"],
            "year_pillar": pillars.get("year", ""),
            "month_pillar": pillars.get("month", ""),
            "day_pillar": pillars.get("day", ""),
            "hour_pillar": pillars.get("hour", ""),
            "wood": five.get("wood", 0),
            "fire": five.get("fire", 0),
            "earth": five.get("earth", 0),
            "metal": five.get("metal", 0),
            "water": five.get("water", 0),
            "signals": ", ".join(signals),
            "warnings": ", ".join(warnings),
            "notes": "", 
            "review_status": "pending",
        }
        rows.append(row)

    summary["count"] = len(rows)
    return rows, summary


def main():
    root = Path(__file__).resolve().parents[3]
    out_dir = root / "daily-work"
    out_dir.mkdir(parents=True, exist_ok=True)

    rows, summary = run()

    json_path = out_dir / "saju-chart-validation-v1.json"
    csv_path = out_dir / "saju-chart-validation-v1.csv"

    with json_path.open("w", encoding="utf-8") as f:
        json.dump({"rows": rows, "summary": summary}, f, ensure_ascii=False, indent=2)

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(json.dumps({"json": str(json_path), "csv": str(csv_path), "summary": summary}, ensure_ascii=False))


if __name__ == "__main__":
    main()

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
    {"sample_id": "S09", "name": "Ian", "birthDate": "1968-03-20", "birthTime": "23:59", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S10", "name": "Jin", "birthDate": "1972-06-21", "birthTime": "00:01", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S11", "name": "Kai", "birthDate": "1981-09-23", "birthTime": "12:00", "birthTimeKnown": False, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S12", "name": "Lia", "birthDate": "1990-12-22", "birthTime": "18:45", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S13", "name": "Min", "birthDate": "2003-03-01", "birthTime": "05:10", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S14", "name": "Nia", "birthDate": "1965-07-15", "birthTime": "14:20", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S15", "name": "Owen", "birthDate": "1975-10-30", "birthTime": "21:35", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S16", "name": "Pia", "birthDate": "1989-01-19", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S17", "name": "Qin", "birthDate": "1998-04-11", "birthTime": "07:07", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S18", "name": "Rin", "birthDate": "2005-08-08", "birthTime": "16:16", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S19", "name": "Seo", "birthDate": "1970-11-11", "birthTime": "22:22", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S20", "name": "Tae", "birthDate": "1983-02-02", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S21", "name": "Uma", "birthDate": "1996-05-05", "birthTime": "09:09", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S22", "name": "Vin", "birthDate": "2001-09-17", "birthTime": "19:50", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S23", "name": "Won", "birthDate": "1969-12-09", "birthTime": "03:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S24", "name": "Xia", "birthDate": "1978-03-28", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S25", "name": "Yun", "birthDate": "1986-06-09", "birthTime": "10:40", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S26", "name": "Zed", "birthDate": "1994-10-14", "birthTime": "20:05", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S27", "name": "Ahn", "birthDate": "2002-01-07", "birthTime": "01:01", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S28", "name": "Bea", "birthDate": "1967-04-14", "birthTime": "13:13", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S29", "name": "Cho", "birthDate": "1976-07-29", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S30", "name": "Dee", "birthDate": "1984-11-03", "birthTime": "17:17", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S31", "name": "Eli", "birthDate": "1992-02-24", "birthTime": "04:44", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S32", "name": "Fae", "birthDate": "2004-05-30", "birthTime": "12:00", "birthTimeKnown": False, "gender": "female", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S33", "name": "Geo", "birthDate": "1966-08-19", "birthTime": "11:11", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S34", "name": "Hee", "birthDate": "1974-12-25", "birthTime": "23:00", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S35", "name": "Ira", "birthDate": "1982-03-12", "birthTime": "02:02", "birthTimeKnown": True, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S36", "name": "Jun", "birthDate": "1997-06-18", "birthTime": "12:00", "birthTimeKnown": False, "gender": "male", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S37", "name": "Kyo", "birthDate": "2006-09-02", "birthTime": "07:45", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S38", "name": "Leo", "birthDate": "1971-01-27", "birthTime": "16:30", "birthTimeKnown": True, "gender": "male", "calendarType": "solar", "timezone": "UTC"},
    {"sample_id": "S39", "name": "Moa", "birthDate": "1987-04-04", "birthTime": "09:00", "birthTimeKnown": True, "gender": "female", "calendarType": "solar", "timezone": "Asia/Seoul"},
    {"sample_id": "S40", "name": "Neo", "birthDate": "1990-10-10", "birthTime": "12:00", "birthTimeKnown": False, "gender": "other", "calendarType": "solar", "timezone": "UTC"},
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
            "notes": "lunar-python measured",
            "review_status": "measured",
        }
        rows.append(row)

    summary["count"] = len(rows)
    return rows, summary


def main():
    root = Path(__file__).resolve().parents[4]
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

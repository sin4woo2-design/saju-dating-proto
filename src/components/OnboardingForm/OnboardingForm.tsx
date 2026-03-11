import { useMemo, useState } from "react";
import { genderLabels } from "../../constants/labels";
import type { Gender, UserProfileInput } from "../../types/saju";
import "./OnboardingForm.css";

interface Props {
  onSubmit: (value: UserProfileInput) => void;
}

const stepTitles = ["이름", "생년월일", "출생시간", "성별"];

const traditionalTimes = [
  { key: "ja", hanja: "子時", ko: "자시", range: "23:00~00:59", value: "00:00" },
  { key: "chuk", hanja: "丑時", ko: "축시", range: "01:00~02:59", value: "02:00" },
  { key: "in", hanja: "寅時", ko: "인시", range: "03:00~04:59", value: "04:00" },
  { key: "myo", hanja: "卯時", ko: "묘시", range: "05:00~06:59", value: "06:00" },
  { key: "jin", hanja: "辰時", ko: "진시", range: "07:00~08:59", value: "08:00" },
  { key: "sa", hanja: "巳時", ko: "사시", range: "09:00~10:59", value: "10:00" },
  { key: "o", hanja: "午時", ko: "오시", range: "11:00~12:59", value: "12:00" },
  { key: "mi", hanja: "未時", ko: "미시", range: "13:00~14:59", value: "14:00" },
  { key: "sin", hanja: "申時", ko: "신시", range: "15:00~16:59", value: "16:00" },
  { key: "yu", hanja: "酉時", ko: "유시", range: "17:00~18:59", value: "18:00" },
  { key: "sul", hanja: "戌時", ko: "술시", range: "19:00~20:59", value: "20:00" },
  { key: "hae", hanja: "亥時", ko: "해시", range: "21:00~22:59", value: "22:00" },
];

const DEFAULT_BIRTH_DATE = "2000-06-15";

function selectedTimeLabel(value: string) {
  const selected = traditionalTimes.find((t) => t.value === value);
  if (!selected) return value || "시간 미입력";
  return `${selected.hanja} · ${selected.ko} · ${selected.range}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toDateParts(value: string) {
  const [y, m, d] = (value || DEFAULT_BIRTH_DATE).split("-").map((v) => Number(v));
  return {
    year: Number.isFinite(y) ? y : 2000,
    month: Number.isFinite(m) ? m : 6,
    day: Number.isFinite(d) ? d : 15,
  };
}

function toBirthDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function OnboardingForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfileInput>({
    name: "",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "",
    gender: "other",
  });

  const birth = toDateParts(form.birthDate);
  const years = useMemo(() => Array.from({ length: 56 }, (_, i) => 1970 + i).reverse(), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayMax = daysInMonth(birth.year, birth.month);
  const days = useMemo(() => Array.from({ length: dayMax }, (_, i) => i + 1), [dayMax]);

  const canNext = useMemo(() => {
    if (step === 0) return form.name.trim().length > 1;
    if (step === 1) return !!form.birthDate;
    if (step === 2) return !!form.birthTime;
    return true;
  }, [form, step]);

  const goNext = () => {
    if (!canNext) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const updateBirthDate = (next: Partial<{ year: number; month: number; day: number }>) => {
    const year = next.year ?? birth.year;
    const month = next.month ?? birth.month;
    const maxDay = daysInMonth(year, month);
    const day = Math.min(next.day ?? birth.day, maxDay);
    setForm((prev) => ({ ...prev, birthDate: toBirthDate(year, month, day) }));
  };

  return (
    <section className="onboarding">
      <div className="stepWrap">
        <p className="step">{step + 1} / 4 · {stepTitles[step]}</p>
        <div className="progressTrack"><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
      </div>

      {step === 0 && (
        <>
          <input
            placeholder="예: 용우"
            value={form.name}
            maxLength={20}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && goNext()}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <p className="hint">프로필에 표시될 이름이에요.</p>
        </>
      )}

      {step === 1 && (
        <>
          <div className="dateWheelWrap" aria-label="생년월일 선택">
            <div className="dateWheelCol">
              <p>연도</p>
              <div className="dateWheelList">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={birth.year === year ? "active" : ""}
                    onClick={() => updateBirthDate({ year })}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="dateWheelCol">
              <p>월</p>
              <div className="dateWheelList">
                {months.map((month) => (
                  <button
                    key={month}
                    type="button"
                    className={birth.month === month ? "active" : ""}
                    onClick={() => updateBirthDate({ month })}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            <div className="dateWheelCol">
              <p>일</p>
              <div className="dateWheelList">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={birth.day === day ? "active" : ""}
                    onClick={() => updateBirthDate({ day })}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="hint">스크롤하거나 눌러서 선택하세요. 기본값은 2000-06-15예요.</p>
        </>
      )}

      {step === 2 && (
        <>
          <p className="hint">태어난 시간대에 가장 가까운 시각을 골라주세요. 정확한 분까지 몰라도 괜찮아요.</p>
          <button
            type="button"
            className="timeUnknownBtn"
            onClick={() => setForm((prev) => ({ ...prev, birthTime: "12:00" }))}
          >
            <strong>정확한 시간을 모르겠어요</strong>
            <small>기본값으로 午時(11:00~12:59) 중심 시각을 사용해 분석해요.</small>
          </button>
          <div className="timeSelectGrid">
            {traditionalTimes.map((slot) => (
              <button
                key={slot.key}
                type="button"
                className={`timeSlotBtn ${form.birthTime === slot.value ? "active" : ""}`}
                onClick={() => setForm((prev) => ({ ...prev, birthTime: slot.value }))}
              >
                <strong>{slot.hanja}</strong>
                <span>{slot.ko}</span>
                <small>{slot.range}</small>
                {form.birthTime === slot.value ? <i className="timeCheck">✓</i> : null}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="genderGrid">
          {(["male", "female", "other"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              className={form.gender === g ? "active" : ""}
              onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
            >
              {genderLabels[g]}
            </button>
          ))}
        </div>
      )}

      <div className="previewBox">
        <p>입력 미리보기</p>
        <small>
          {form.name || "이름 미입력"} · {form.birthDate || "생년월일 미입력"} · {selectedTimeLabel(form.birthTime)} · {genderLabels[form.gender]}
        </small>
      </div>

      <div className="actions">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          이전
        </button>
        {step < 3 ? (
          <button type="button" disabled={!canNext} onClick={goNext}>
            다음
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => onSubmit(form)}>완료</button>
        )}
      </div>
    </section>
  );
}

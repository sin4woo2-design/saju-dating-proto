import { useMemo, useState } from "react";
import { genderLabels } from "../../constants/labels";
import type { Gender, UserProfileInput } from "../../types/saju";
import "./OnboardingForm.css";

interface Props {
  onSubmit: (value: UserProfileInput) => void;
}

const stepTitles = ["이름", "생년월일", "출생시간", "성별"];

export default function OnboardingForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfileInput>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "other",
  });

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
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
          />
          <p className="hint">양력 기준으로 입력해 주세요.</p>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="time"
            value={form.birthTime}
            onChange={(e) => setForm((prev) => ({ ...prev, birthTime: e.target.value }))}
          />
          <p className="hint">출생 시간을 모르면 12:00으로 입력해도 됩니다.</p>
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

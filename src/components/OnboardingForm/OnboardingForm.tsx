import { useMemo, useState } from "react";
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
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return !!form.birthDate;
    if (step === 2) return !!form.birthTime;
    return true;
  }, [form, step]);

  return (
    <section className="onboarding">
      <p className="step">{step + 1} / 4 · {stepTitles[step]}</p>

      {step === 0 && (
        <input
          placeholder="이름을 입력해줘"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      )}

      {step === 1 && (
        <input
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
        />
      )}

      {step === 2 && (
        <input
          type="time"
          value={form.birthTime}
          onChange={(e) => setForm((prev) => ({ ...prev, birthTime: e.target.value }))}
        />
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
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="actions">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          이전
        </button>
        {step < 3 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            다음
          </button>
        ) : (
          <button type="button" onClick={() => onSubmit(form)}>완료</button>
        )}
      </div>
    </section>
  );
}

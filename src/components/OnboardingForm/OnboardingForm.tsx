import { useState } from 'react';
import type { Gender, UserProfileInput } from '../../types/saju';
import './OnboardingForm.css';

type Props = {
  onComplete: (value: UserProfileInput) => void;
};

const steps = ['이름', '생년월일', '출생시간', '성별'];

export default function OnboardingForm({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfileInput>({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: 'other',
    interests: ['사주', 'MBTI'],
  });

  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  const disabled =
    (step === 0 && !form.name) ||
    (step === 1 && !form.birthDate) ||
    (step === 2 && !form.birthTime);

  return (
    <section className="onboarding-card">
      <p className="progress">
        {step + 1}/{steps.length} · {steps[step]}
      </p>

      {step === 0 && (
        <input
          placeholder="이름 입력"
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
        <div className="gender-wrap">
          {(['male', 'female', 'other'] as Gender[]).map((gender) => (
            <button
              type="button"
              key={gender}
              className={form.gender === gender ? 'chip active' : 'chip'}
              onClick={() => setForm((prev) => ({ ...prev, gender }))}
            >
              {gender}
            </button>
          ))}
        </div>
      )}

      <div className="actions">
        <button type="button" onClick={prev} disabled={step === 0}>
          이전
        </button>

        {step < steps.length - 1 ? (
          <button type="button" onClick={next} disabled={disabled}>
            다음
          </button>
        ) : (
          <button type="button" onClick={() => onComplete(form)}>
            시작하기
          </button>
        )}
      </div>
    </section>
  );
}

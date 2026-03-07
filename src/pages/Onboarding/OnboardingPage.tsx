import OnboardingForm from "../../components/OnboardingForm/OnboardingForm";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  onComplete: (value: UserProfileInput) => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  return (
    <div className="pageWrap">
      <h2>Destiny Onboarding</h2>
      <p className="subtitle">운명의 매칭을 위해 기본 정보를 입력해줘.</p>
      <OnboardingForm onSubmit={onComplete} />
    </div>
  );
}

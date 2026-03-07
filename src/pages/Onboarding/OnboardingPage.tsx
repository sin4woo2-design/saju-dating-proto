import OnboardingForm from "../../components/OnboardingForm/OnboardingForm";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  onComplete: (value: UserProfileInput) => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  return (
    <div className="pageWrap">
      <h2>사주 매칭 시작하기</h2>
      <p className="subtitle">2분만 투자하면, 나와 잘 맞는 인연 스타일을 바로 확인할 수 있어요.</p>
      <OnboardingForm onSubmit={onComplete} />
    </div>
  );
}

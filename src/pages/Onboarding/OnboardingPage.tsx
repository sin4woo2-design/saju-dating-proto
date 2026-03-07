import OnboardingForm from '../../components/OnboardingForm/OnboardingForm';
import type { UserProfileInput } from '../../types/saju';

type Props = {
  onComplete: (value: UserProfileInput) => void;
};

export default function OnboardingPage({ onComplete }: Props) {
  return (
    <div className="page-grid">
      <h2>운명 프로필 설정</h2>
      <p className="sub">기본 정보로 사주 기반 궁합을 시작해요.</p>
      <OnboardingForm onComplete={onComplete} />
    </div>
  );
}

import PageLayout from "../../components/layout/PageLayout";
import OnboardingForm from "../../components/OnboardingForm/OnboardingForm";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  onComplete: (value: UserProfileInput) => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  return (
    <PageLayout
      title="사주 매칭 시작하기"
      subtitle="2분만 입력하면, 나와 잘 맞는 인연 스타일을 바로 확인할 수 있어요."
    >
      <OnboardingForm onSubmit={onComplete} />
    </PageLayout>
  );
}

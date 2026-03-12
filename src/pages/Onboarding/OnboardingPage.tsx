import { useNavigate } from "react-router-dom";
import OnboardingForm from "../../components/OnboardingForm/OnboardingForm";
import type { UserProfileInput } from "../../types/saju";
import "./OnboardingPage.css";

interface Props {
  onComplete: (value: UserProfileInput) => void;
}

export default function OnboardingPage({ onComplete }: Props) {
  const navigate = useNavigate();

  const handleComplete = (value: UserProfileInput) => {
    onComplete(value);
    navigate("/", { replace: true });
  };

  return (
    <div className="obPage">
      <div className="obHeader anim-fade-in">
        <span className="obIcon">✦</span>
        <h2>사주 라운지 시작하기</h2>
        <p>2분만 입력하면, 나와 잘 맞는 인연 스타일을 바로 확인할 수 있어요.</p>
      </div>
      <OnboardingForm onSubmit={handleComplete} />
    </div>
  );
}

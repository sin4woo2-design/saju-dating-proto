import { useNavigate } from "react-router-dom";
import OnboardingForm from "../../components/OnboardingForm/OnboardingForm";
import type { UserProfileInput } from "../../types/saju";
import "./OnboardingPage.css";

interface Props {
  onComplete: (value: UserProfileInput) => void;
  onRequestLogin: () => void;
}

export default function OnboardingPage({ onComplete, onRequestLogin }: Props) {
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
      <div className="obLoginTeaser anim-fade-in anim-delay-1">
        <div>
          <strong>먼저 체험하고, 마음에 들면 로그인으로 저장해도 돼요.</strong>
          <p>구글 로그인으로 프로필을 저장하고 이어서 보는 흐름까지 바로 붙일 수 있어요.</p>
        </div>
        <button type="button" className="obLoginBtn" onClick={onRequestLogin}>
          로그인 보기
        </button>
      </div>
      <OnboardingForm onSubmit={handleComplete} />
    </div>
  );
}

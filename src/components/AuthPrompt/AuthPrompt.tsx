import type { AuthProvider } from "../../lib/auth";
import "./AuthPrompt.css";

interface Props {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSignIn: (provider: AuthProvider) => void;
}

const providers: Array<{ key: AuthProvider; label: string; caption: string }> = [
  { key: "google", label: "구글로 계속하기", caption: "여러 기기에서 기록을 이어보기 편해요" },
];

export default function AuthPrompt({ isOpen, title = "로그인하고 기록 저장하기", subtitle = "로그인하면 결과 저장, 다른 기기에서 이어보기, 추후 주변 추천 기능까지 연결할 수 있어요.", onClose, onSignIn }: Props) {
  if (!isOpen) return null;

  return (
    <div className="authPromptOverlay" role="dialog" aria-modal="true" aria-labelledby="authPromptTitle">
      <div className="authPromptCard anim-scale-in">
        <button type="button" className="authPromptClose" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <span className="authPromptBadge">Member</span>
        <h3 id="authPromptTitle">{title}</h3>
        <p>{subtitle}</p>
        <div className="authPromptActions">
          {providers.map((provider) => (
            <button key={provider.key} type="button" className={`authProviderBtn ${provider.key}`} onClick={() => onSignIn(provider.key)}>
              <strong>{provider.label}</strong>
              <small>{provider.caption}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import HomePage from "./pages/Home/HomePage";
import MySajuPage from "./pages/MySaju/MySajuPage";
import CompatibilityPage from "./pages/Compatibility/CompatibilityPage";
import FortunePage from "./pages/Fortune/FortunePage";
import PersonaPage from "./pages/Persona/PersonaPage";
import InyeonPage from "./pages/Inyeon/InyeonPage";
import AuthPrompt from "./components/AuthPrompt/AuthPrompt";
import { usePersistedProfile } from "./hooks/usePersistedProfile";
import { useAuth } from "./hooks/useAuth";
import type { AuthProvider } from "./lib/auth";

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function AppBody() {
  const { profile: me, setProfile: setMe } = usePersistedProfile();
  const { isReady, user, authError, clearAuthError, signIn, signOut } = useAuth();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptSubtitle, setAuthPromptSubtitle] = useState<string | undefined>(undefined);

  const gate = useMemo(() => {
    if (!me) return <Navigate to="/onboarding" replace />;
    return null;
  }, [me]);

  const openAuthPrompt = (subtitle?: string) => {
    setAuthPromptSubtitle(subtitle);
    setIsAuthPromptOpen(true);
  };

  const handleSignIn = (provider: AuthProvider) => {
    const result = signIn(provider);
    if (!result.ok && result.reason === "MISSING_CONFIG") {
      setAuthPromptSubtitle("Supabase URL 또는 anon key가 아직 설정되지 않았어요. `.env.local`에 값을 넣어 주세요.");
      return;
    }
    if (!result.ok) {
      setAuthPromptSubtitle("현재 환경에서는 로그인 연결을 시작할 수 없어요. 브라우저에서 다시 시도해 주세요.");
      return;
    }
    setIsAuthPromptOpen(false);
  };

  return (
    <>
      <div className="appShell">
        <header className="topBar">
          <div className="topBarTitleWrap">
            <h1><span className="brandMark">✦</span> 사주 라운지</h1>
            {user ? <p className="authWelcome">{user.name}님으로 연결됨</p> : <p className="authWelcome muted">로그인하면 결과를 저장할 수 있어요</p>}
          </div>
          <div className="topBarActions">
            {me ? (
              <button
                type="button"
                className="resetBtn"
                onClick={() => {
                  if (!confirm("입력 정보를 초기화하고 다시 온보딩할까요?")) return;
                  setMe(null);
                }}
              >
                입력 다시하기
              </button>
            ) : null}
            {isReady ? (
              user ? (
                <button type="button" className="authChipBtn" onClick={signOut}>
                  로그아웃
                </button>
              ) : (
                <button type="button" className="authChipBtn primary" onClick={() => openAuthPrompt()}>
                  로그인
                </button>
              )
            ) : null}
          </div>
        </header>

        {authError ? (
          <div className="authNotice warning" role="status">
            <div>
              <strong>로그인 안내</strong>
              <p>{authError}</p>
            </div>
            <button type="button" onClick={clearAuthError}>닫기</button>
          </div>
        ) : null}

        <main>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={setMe} onRequestLogin={() => openAuthPrompt("로그인하면 입력한 프로필과 결과를 안전하게 저장하고 다른 기기에서도 이어볼 수 있어요.")} />} />
            <Route path="/" element={me ? <HomePage me={me} isLoggedIn={!!user} onRequestLogin={() => openAuthPrompt("로그인하면 오늘의 결과와 궁합 기록을 저장해 두고 나중에 다시 확인할 수 있어요.")} /> : gate} />
            <Route path="/mysaju" element={me ? <MySajuPage me={me} /> : gate} />
            <Route path="/fortune" element={me ? <FortunePage me={me} /> : gate} />
            <Route path="/persona" element={me ? <PersonaPage /> : gate} />
            <Route path="/inyeon" element={me ? <InyeonPage /> : gate} />
            <Route path="/compatibility" element={me ? <CompatibilityPage me={me} /> : gate} />
            <Route path="*" element={<Navigate to={me ? "/" : "/onboarding"} replace />} />
          </Routes>
        </main>

        <nav className="bottomNav bottomNavFive">
          <NavLink to="/" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M3 10.5 12 4l9 6.5" /><path d="M6 9.8V20h12V9.8" /></svg>
            </span>
            <span>홈</span>
          </NavLink>
          <NavLink to="/mysaju" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon" aria-hidden>
              <svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2.5" /><path d="M8 9h8M8 12h8M8 15h5" /></svg>
            </span>
            <span>내 사주</span>
          </NavLink>
          <NavLink to="/fortune" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon" aria-hidden>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.2" /><path d="M12 7.2v9.6M7.2 12h9.6" /></svg>
            </span>
            <span>운세</span>
          </NavLink>
          <NavLink to="/persona" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon" aria-hidden>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.2" /><path d="M5.5 19c1.8-2.8 4-4.2 6.5-4.2S16.7 16.2 18.5 19" /></svg>
            </span>
            <span>페르소나</span>
          </NavLink>
          <NavLink to="/inyeon" className={({ isActive }) => `tabLink ${isActive ? "active" : ""}`}>
            <span className="tabIcon" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M12 19.2s-6.7-3.9-6.7-8.3a3.7 3.7 0 0 1 6.7-2.1 3.7 3.7 0 0 1 6.7 2.1c0 4.4-6.7 8.3-6.7 8.3Z" /></svg>
            </span>
            <span>인연</span>
          </NavLink>
        </nav>
      </div>

      <AuthPrompt
        isOpen={isAuthPromptOpen}
        subtitle={authPromptSubtitle}
        onClose={() => setIsAuthPromptOpen(false)}
        onSignIn={handleSignIn}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <AppBody />
    </BrowserRouter>
  );
}

import { useMemo } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import HomePage from "./pages/Home/HomePage";
import MySajuPage from "./pages/MySaju/MySajuPage";
import CompatibilityPage from "./pages/Compatibility/CompatibilityPage";
import FortunePage from "./pages/Fortune/FortunePage";
import PersonaPage from "./pages/Persona/PersonaPage";
import InyeonPage from "./pages/Inyeon/InyeonPage";
import { usePersistedProfile } from "./hooks/usePersistedProfile";

export default function App() {
  const { profile: me, setProfile: setMe } = usePersistedProfile();

  const gate = useMemo(() => {
    if (!me) return <Navigate to="/onboarding" replace />;
    return null;
  }, [me]);

  return (
    <BrowserRouter>
      <div className="appShell">
        <header className="topBar">
          <h1>사주 라운지</h1>
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
        </header>

        <main>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage onComplete={setMe} />} />
            <Route path="/" element={me ? <HomePage me={me} /> : gate} />
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
    </BrowserRouter>
  );
}
